/**
 * Agent Module - Message Utilities
 *
 * Utilities for building and parsing messages including:
 * - Multi-modal message construction (text + images)
 * - Canvas context formatting
 * - SDK message parsing into Thought objects
 */

import type { Thought, ImageAttachment, FileAttachment, CanvasContext } from './types'
import type { SDKMessage, SDKAssistantMessage, SDKResultMessage, UsageInfo, ResultUsageInfo } from './sdk-types'

const TEXT_LIKE_FILE_TYPES = new Set([
  'text/plain',
  'text/markdown',
  'application/json',
  'text/csv'
])

const MAX_INLINE_FILE_CHARS = 12000

function decodeBase64Utf8(data: string): string {
  return Buffer.from(data, 'base64').toString('utf8')
}

function buildInlineFileSection(files?: FileAttachment[]): string {
  if (!files || files.length === 0) return ''

  const sections = files.map((file, index) => {
    const headerParts = [
      `[Attachment ${index + 1}]`,
      `name=${file.name || 'unnamed'}`,
      `type=${file.mediaType}`,
      `size=${file.size ?? 0}B`
    ]

    if (file.path) {
      headerParts.push(`uploaded_path=${file.path}`)
    }

    const header = headerParts.join(' ')

    if (file.extractedText) {
      return `${header}\ncontent:\n${file.extractedText}`
    }

    if (TEXT_LIKE_FILE_TYPES.has(file.mediaType)) {
      try {
        const decoded = decodeBase64Utf8(file.data)
        const text = decoded.length > MAX_INLINE_FILE_CHARS
          ? `${decoded.slice(0, MAX_INLINE_FILE_CHARS)}\n... [truncated]`
          : decoded
        return `${header}\ncontent:\n${text}`
      } catch {
        return `${header}\ncontent: [decode failed]`
      }
    }

    if (file.parseStatus === 'failed') {
      return `${header}\ncontent: [Document parsing failed before the model received this message. Do not ask the user for a file path; the upload is already attached in Cafe. Error: ${file.parseError || 'unknown'}. File name: ${file.name || 'unnamed'}]`
    }
    if (file.parseStatus === 'pending') {
      return `${header}\ncontent: [Document parsing is still pending. Do not ask the user for a file path; the upload is already attached in Cafe. If you need to call a tool, use uploaded_path from this attachment. File name: ${file.name || 'unnamed'}]`
    }
    if (file.parseStatus === 'fallback') {
      return `${header}\ncontent: [Binary document could not be pre-parsed because the MinerU document parsing service is unavailable. Do not ask the user for a file path; the upload is already attached in Cafe. If you need to call a tool, use uploaded_path from this attachment. File name: ${file.name || 'unnamed'} (${file.mediaType}). Tell the user that document parsing is currently unavailable and ask them to retry or check MinerU settings.]`
    }

    return `${header}\ncontent: [Binary document: ${file.name || 'unnamed'} (${file.mediaType})]`
  })

  return `\n\n<attached_files>\nThe user uploaded the following files. Use their contents directly when answering. If a tool needs a path, prefer uploaded_path from each attachment rather than guessing a desktop location.\n\n${sections.join('\n\n')}\n</attached_files>`
}

export function formatCanvasContext(canvasContext?: CanvasContext): string {
  if (!canvasContext?.isOpen || canvasContext.tabCount === 0) {
    return ''
  }

  const activeTab = canvasContext.activeTab
  const MAX_TABS_LINES = 30
  const MAX_CONTEXT_CHARS = 6000

  const allLines = canvasContext.tabs.map(t =>
    `${t.isActive ? '▶ ' : '  '}${t.title} (${t.type})${t.path ? ` - ${t.path}` : ''}${t.url ? ` - ${t.url}` : ''}`
  )
  const visibleLines = allLines.slice(0, MAX_TABS_LINES)
  let tabsSummary = visibleLines.join('\n')

  if (allLines.length > MAX_TABS_LINES) {
    tabsSummary += `\n... (${allLines.length - MAX_TABS_LINES} more tabs)`
  }

  if (tabsSummary.length > MAX_CONTEXT_CHARS) {
    tabsSummary = tabsSummary.slice(0, MAX_CONTEXT_CHARS) + '\n... (canvas context truncated)'
  }

  return `<Cafe_canvas>
Content canvas currently open in Cafe:
- Total ${canvasContext.tabCount} tabs
- Active: ${activeTab ? `${activeTab.title} (${activeTab.type})` : 'None'}
${activeTab?.url ? `- URL: ${activeTab.url}` : ''}${activeTab?.path ? `- File path: ${activeTab.path}` : ''}

All tabs:
${tabsSummary}
</Cafe_canvas>

`
}

export function buildMessageContent(
  text: string,
  images?: ImageAttachment[],
  files?: FileAttachment[]
): string | Array<{ type: string; [key: string]: unknown }> {
  const textWithFiles = text + buildInlineFileSection(files)

  if (!images || images.length === 0) {
    return textWithFiles
  }

  const contentBlocks: Array<{ type: string; [key: string]: unknown }> = []

  if (textWithFiles.trim()) {
    contentBlocks.push({
      type: 'text',
      text: textWithFiles
    })
  }

  for (const image of images) {
    contentBlocks.push({
      type: 'image',
      source: {
        type: 'base64',
        media_type: image.mediaType,
        data: image.data
      }
    })
  }

  return contentBlocks
}

function generateThoughtId(): string {
  return `thought-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

export function parseSDKMessage(message: SDKMessage, displayModel?: string): Thought | null {
  const timestamp = new Date().toISOString()

  if (message.type === 'system') {
    if (message.subtype === 'init') {
      const modelName = displayModel || message.model || 'claude'
      return {
        id: generateThoughtId(),
        type: 'system',
        content: `Connected | Model: ${modelName}`,
        timestamp
      }
    }
    return null
  }

  if (message.type === 'assistant') {
    if (message.error) {
      console.log(`[parseSDKMessage] SDK assistant error: ${message.error}, skipping (handled by result message)`)
      return null
    }

    const content = message.message?.content
    if (Array.isArray(content)) {
      for (const block of content) {
        if (block.type === 'thinking') continue
        if (block.type === 'tool_use') continue
        if (block.type === 'text' && block.text) {
          return {
            id: generateThoughtId(),
            type: 'text',
            content: block.text,
            timestamp
          }
        }
      }
    }
    return null
  }

  if (message.type === 'user') {
    const content = message.message?.content

    if (typeof content === 'string') {
      const match = content.match(/<local-command-stdout>([\s\S]*?)<\/local-command-stdout>/)
      if (match) {
        return {
          id: generateThoughtId(),
          type: 'text',
          content: match[1].trim(),
          timestamp
        }
      }
    }

    if (Array.isArray(content)) {
      for (const block of content) {
        if (block.type === 'tool_result') {
          const isError = block.is_error || false
          const resultContent = typeof block.content === 'string'
            ? block.content
            : JSON.stringify(block.content)

          return {
            id: block.tool_use_id || generateThoughtId(),
            type: 'tool_result',
            content: isError ? `Tool execution failed` : `Tool execution succeeded`,
            timestamp,
            toolOutput: resultContent,
            isError
          }
        }
      }
    }
    return null
  }

  if (message.type === 'result') {
    const resultContent = message.message?.result || message.result || ''
    const isError = message.is_error || false

    if (isError) {
      console.log(`[parseSDKMessage] SDK result error: subtype=${message.subtype}, result=${resultContent.substring(0, 200)}`)
    }

    return {
      id: generateThoughtId(),
      type: isError ? 'error' : 'result',
      content: resultContent,
      timestamp,
      isError,
      errorCode: isError ? message.subtype : undefined,
      duration: message.duration_ms
    }
  }

  return null
}

export function extractSingleUsage(assistantMsg: SDKAssistantMessage): UsageInfo | null {
  const msgUsage = assistantMsg.message?.usage
  if (!msgUsage) return null

  return {
    inputTokens: msgUsage.input_tokens || 0,
    outputTokens: msgUsage.output_tokens || 0,
    cacheReadTokens: msgUsage.cache_read_input_tokens || 0,
    cacheCreationTokens: msgUsage.cache_creation_input_tokens || 0
  }
}

export function extractResultUsage(resultMsg: SDKResultMessage, lastSingleUsage: UsageInfo | null): ResultUsageInfo | null {
  const modelUsage = resultMsg.modelUsage as Record<string, { contextWindow?: number }> | undefined
  const totalCostUsd = resultMsg.total_cost_usd as number | undefined

  let contextWindow = 200000
  if (modelUsage) {
    const firstModel = Object.values(modelUsage)[0]
    if (firstModel?.contextWindow) {
      contextWindow = firstModel.contextWindow
    }
  }

  if (lastSingleUsage) {
    const resultUsage = resultMsg.usage as { output_tokens?: number, input_tokens?: number } | undefined
    return {
      ...lastSingleUsage,
      inputTokens: resultUsage?.input_tokens || lastSingleUsage.inputTokens,
      outputTokens: resultUsage?.output_tokens || lastSingleUsage.outputTokens,
      totalCostUsd: totalCostUsd || 0,
      contextWindow
    }
  }

  const usage = resultMsg.usage as {
    input_tokens?: number
    output_tokens?: number
    cache_read_input_tokens?: number
    cache_creation_input_tokens?: number
  } | undefined

  if (usage) {
    return {
      inputTokens: usage.input_tokens || 0,
      outputTokens: usage.output_tokens || 0,
      cacheReadTokens: usage.cache_read_input_tokens || 0,
      cacheCreationTokens: usage.cache_creation_input_tokens || 0,
      totalCostUsd: totalCostUsd || 0,
      contextWindow
    }
  }

  return null
}
