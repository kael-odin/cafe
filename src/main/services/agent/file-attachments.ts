import type { FileAttachment } from './types'
import { getMinerUService } from '../mineru'
import { ensureMinerUServiceReady } from './helpers'
import { updateMessage } from '../conversation.service'
import { emitAgentEvent } from './events'

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
        const result = await mineru.parseDocument({ filePath: file.path! })
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
