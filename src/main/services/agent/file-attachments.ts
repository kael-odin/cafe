import type { FileAttachment } from './types'
import { getMinerUService } from '../mineru'
import { ensureMinerUServiceReady } from './helpers'
import { updateMessage } from '../conversation.service'
import { emitAgentEvent } from './events'
import { writeFile, mkdir, unlink, rm } from 'fs/promises'
import { join } from 'path'
import { tmpdir } from 'os'

const TEXT_LIKE_FILE_TYPES = new Set([
  'text/plain',
  'text/markdown',
  'application/json',
  'text/csv'
])

const MINERU_FILE_TYPES = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword'
])

const MAX_INLINE_FILE_CHARS = 12000

function decodeBase64Utf8(data: string): string {
  return Buffer.from(data, 'base64').toString('utf8')
}

function truncateText(text: string): string {
  return text.length > MAX_INLINE_FILE_CHARS
    ? `${text.slice(0, MAX_INLINE_FILE_CHARS)}\n... [truncated]`
    : text
}

function extractTextLikeFile(file: FileAttachment): FileAttachment {
  try {
    const decoded = truncateText(decodeBase64Utf8(file.data))
    return {
      ...file,
      extractedText: decoded,
      parseStatus: 'parsed'
    }
  } catch (error) {
    return {
      ...file,
      parseStatus: 'failed',
      parseError: error instanceof Error ? error.message : String(error)
    }
  }
}

function buildBinaryFallback(file: FileAttachment): FileAttachment {
  return {
    ...file,
    parseStatus: MINERU_FILE_TYPES.has(file.mediaType) ? 'pending' : 'fallback',
    extractedText: `[Binary attachment] ${file.name || 'unnamed'} (${file.mediaType})`
  }
}

export async function prepareFileAttachments(
  _spaceId: string,
  _conversationId: string,
  files?: FileAttachment[]
): Promise<FileAttachment[] | undefined> {
  if (!files || files.length === 0) return undefined

  return files.map(file => {
    if (TEXT_LIKE_FILE_TYPES.has(file.mediaType)) {
      return extractTextLikeFile(file)
    }
    return buildBinaryFallback(file)
  })
}

export async function enhancePdfAttachmentsInBackground(
  spaceId: string,
  conversationId: string,
  messageId: string,
  files: FileAttachment[] | undefined
): Promise<void> {
  if (!files || files.length === 0) return

  const targets = files.filter(file => MINERU_FILE_TYPES.has(file.mediaType) && file.path)
  if (targets.length === 0) return

  try {
    await ensureMinerUServiceReady(spaceId)
    const mineru = getMinerUService()

    const enhanced = await Promise.all(targets.map(async file => {
      try {
        const result = await mineru.parseDocument({ filePath: file.path!, fileName: file.name })
        if (result.markdown?.trim()) {
          return {
            id: file.id,
            extractedText: truncateText(result.markdown),
            parseStatus: 'parsed' as const,
            parseError: undefined
          }
        }
        return {
          id: file.id,
          extractedText: file.extractedText,
          parseStatus: 'failed' as const,
          parseError: result.error || 'MinerU 返回空结果'
        }
      } catch (error) {
        return {
          id: file.id,
          extractedText: file.extractedText,
          parseStatus: 'failed' as const,
          parseError: error instanceof Error ? error.message : String(error)
        }
      }
    }))

    const mergedFiles = files.map(file => {
      const next = enhanced.find(item => item.id === file.id)
      return next ? { ...file, ...next } : file
    })

    updateMessage(spaceId, conversationId, messageId, { files: mergedFiles })
    emitAgentEvent('artifact:changed' as any, spaceId, conversationId, { type: 'change', files: mergedFiles } as any)
  } catch (error) {
    const mergedFiles = files.map(file =>
      MINERU_FILE_TYPES.has(file.mediaType)
        ? { ...file, parseStatus: 'failed' as const, parseError: error instanceof Error ? error.message : String(error) }
        : file
    )
    updateMessage(spaceId, conversationId, messageId, { files: mergedFiles })
  }
}

// ============================================
// Synchronous Pre-parsing (called before sending to AI)
// ============================================

/**
 * Write base64 file data to temporary files, populating file.path
 * so that MinerU can parse them from disk.
 *
 * The renderer process only provides base64 data (no file paths),
 * so we must materialize the files on disk before parsing.
 */
export async function ensureFilePaths(files?: FileAttachment[]): Promise<FileAttachment[] | undefined> {
  if (!files || files.length === 0) return undefined

  const tempDir = join(tmpdir(), 'cafe-ai-files')
  await mkdir(tempDir, { recursive: true })

  return Promise.all(files.map(async file => {
    if (file.path) return file

    const extMap: Record<string, string> = {
      'application/pdf': '.pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
      'application/msword': '.doc',
      'text/plain': '.txt',
      'text/markdown': '.md',
      'application/json': '.json',
      'text/csv': '.csv',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
      'application/vnd.ms-excel': '.xls',
    }
    const ext = extMap[file.mediaType] || '.bin'
    // Use file.id + extension for temp file name (pure ASCII) to avoid encoding issues
    // with Chinese/non-ASCII characters on Windows. The original filename is preserved
    // in file.name for display purposes and is included in the AI message content.
    const tempPath = join(tempDir, `${file.id}${ext}`)
    const buffer = Buffer.from(file.data, 'base64')
    await writeFile(tempPath, buffer)

    return { ...file, path: tempPath }
  }))
}

/**
 * Synchronously parse binary files (PDF/DOCX) using MinerU before sending to AI.
 *
 * Unlike enhancePdfAttachmentsInBackground (which is async and updates messages later),
 * this function blocks until parsing completes so the AI receives document content
 * in the very first message — critical for non-Claude models that cannot self-read files.
 *
 * Gracefully degrades: if MinerU is unavailable, files are marked as 'fallback'
 * and the AI receives a descriptive placeholder instead of raw binary.
 */
export async function parseBinaryFilesSync(
  spaceId: string,
  files?: FileAttachment[]
): Promise<FileAttachment[] | undefined> {
  if (!files || files.length === 0) return undefined

  const targets = files.filter(file =>
    MINERU_FILE_TYPES.has(file.mediaType) && file.parseStatus === 'pending' && file.path
  )
  if (targets.length === 0) return files

  try {
    await ensureMinerUServiceReady(spaceId)
    const mineru = getMinerUService()

    const parsed = await Promise.all(targets.map(async file => {
      try {
        const result = await mineru.parseDocument({ filePath: file.path!, fileName: file.name })
        if (result.markdown?.trim()) {
          return {
            ...file,
            extractedText: truncateText(result.markdown),
            parseStatus: 'parsed' as const,
            parseError: undefined
          }
        }
        return {
          ...file,
          parseStatus: 'failed' as const,
          parseError: result.error || 'MinerU returned empty result'
        }
      } catch (error) {
        return {
          ...file,
          parseStatus: 'failed' as const,
          parseError: error instanceof Error ? error.message : String(error)
        }
      }
    }))

    return files.map(file => {
      const updated = parsed.find(p => p.id === file.id)
      return updated || file
    })
  } catch (error) {
    // MinerU unavailable — mark as fallback (non-blocking)
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.warn(`[MinerU] Service unavailable, files will use fallback mode: ${errorMessage}`)

    // Emit event so renderer can show MinerU status warning
    try {
      const { emitAgentEvent } = await import('./events')
      emitAgentEvent('mineru:unavailable' as any, spaceId, '', {
        type: 'mineru-unavailable',
        error: errorMessage,
        fileCount: files.filter(f => MINERU_FILE_TYPES.has(f.mediaType) && f.parseStatus === 'pending').length
      } as any)
    } catch {
      // Don't let event emission failure block the message flow
    }

    return files.map(file =>
      MINERU_FILE_TYPES.has(file.mediaType) && file.parseStatus === 'pending'
        ? {
            ...file,
            parseStatus: 'fallback' as const,
            parseError: errorMessage
          }
        : file
    )
  }
}

/**
 * Clean up temporary files created by ensureFilePaths.
 * Called after the AI message has been sent.
 */
export async function cleanupTempFiles(files?: FileAttachment[]): Promise<void> {
  if (!files || files.length === 0) return

  const systemTmpDir = tmpdir()
  for (const file of files) {
    if (file.path && file.path.startsWith(systemTmpDir)) {
      await unlink(file.path).catch(() => {})
    }
  }

  // Try to clean up the temp directory if empty
  const tempDir = join(systemTmpDir, 'cafe-ai-files')
  await rm(tempDir, { recursive: true, force: true }).catch(() => {})
}
