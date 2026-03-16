export interface SDKSystemMessage {
  type: 'system'
  subtype?: 'init'
  model?: string
}

export interface SDKContentBlock {
  type: 'text' | 'thinking' | 'tool_use' | 'tool_result'
  text?: string
  thinking?: string
  name?: string
  input?: Record<string, unknown>
  tool_use_id?: string
  content?: string | Record<string, unknown>
  is_error?: boolean
}

export interface SDKAssistantMessage {
  type: 'assistant'
  message?: {
    content?: SDKContentBlock[]
    usage?: {
      input_tokens?: number
      output_tokens?: number
      cache_read_input_tokens?: number
      cache_creation_input_tokens?: number
    }
  }
  error?: string
}

export interface SDKUserMessage {
  type: 'user'
  message?: {
    content?: string | SDKContentBlock[]
  }
  isReplay?: boolean
}

export interface SDKResultMessage {
  type: 'result'
  message?: {
    result?: string
  }
  result?: string
  is_error?: boolean
  subtype?: string
  duration_ms?: number
  usage?: {
    input_tokens?: number
    output_tokens?: number
    cache_read_input_tokens?: number
    cache_creation_input_tokens?: number
  }
  modelUsage?: Record<string, { contextWindow?: number }>
  total_cost_usd?: number
}

export type SDKMessage = SDKSystemMessage | SDKAssistantMessage | SDKUserMessage | SDKResultMessage

export interface UsageInfo {
  inputTokens: number
  outputTokens: number
  cacheReadTokens: number
  cacheCreationTokens: number
}

export interface ResultUsageInfo extends UsageInfo {
  totalCostUsd: number
  contextWindow: number
}
