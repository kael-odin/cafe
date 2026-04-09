/**
 * MinerU Service Types
 *
 * Type definitions for the MinerU service manager.
 */

export interface MinerUConfig {
  /** Whether to use local or remote MinerU service */
  mode: 'local' | 'remote'

  /** Port for local MinerU service (default: 18000) */
  port?: number

  /** Remote API URL (for remote mode) */
  remoteUrl?: string

  /** Backend to use for parsing */
  backend?: 'pipeline' | 'vlm-auto-engine' | 'vlm-http-client' | 'hybrid-auto-engine' | 'hybrid-http-client'

  /** Default language for parsing */
  defaultLang?: string

  /** Auto-start the service when needed */
  autoStart?: boolean

  /** Health check interval in milliseconds */
  healthCheckInterval?: number
}

export interface MinerUStatus {
  /** Whether the service is running */
  isRunning: boolean

  /** Service mode */
  mode: 'local' | 'remote'

  /** Service URL */
  url: string

  /** Process ID (for local mode) */
  pid?: number

  /** Last health check result */
  lastHealthCheck?: {
    timestamp: number
    healthy: boolean
    responseTime?: number
  }

  /** Error message if service failed */
  error?: string
}

export interface ParseDocumentOptions {
  /** Path to the document file */
  filePath: string

  /** Language code */
  lang?: string

  /** Parsing backend */
  backend?: string

  /** Parse method */
  parseMethod?: 'auto' | 'txt' | 'ocr'

  /** Enable formula parsing */
  formulaEnable?: boolean

  /** Enable table parsing */
  tableEnable?: boolean

  /** Return images as base64 */
  returnImages?: boolean

  /** Start page ID (0-indexed) */
  startPage?: number

  /** End page ID (-1 for all) */
  endPage?: number
}

export interface ParseResult {
  /** File name */
  fileName: string

  /** Markdown content */
  markdown?: string

  /** Middle JSON (intermediate parsing data) */
  middleJson?: Record<string, unknown>

  /** Model output */
  modelOutput?: Record<string, unknown>

  /** Content list */
  contentList?: Array<Record<string, unknown>>

  /** Images (filename -> base64) */
  images?: Record<string, string>

  /** Error message if parsing failed */
  error?: string
}

export interface AsyncTaskStatus {
  /** Task ID */
  taskId: string

  /** Task status */
  status: 'pending' | 'processing' | 'completed' | 'failed'

  /** Created timestamp */
  createdAt?: string

  /** Started timestamp */
  startedAt?: string

  /** Completed timestamp */
  completedAt?: string

  /** Error message */
  error?: string

  /** Number of tasks queued ahead */
  queuedAhead?: number

  /** Status URL */
  statusUrl?: string

  /** Result URL */
  resultUrl?: string
}

export type MinerUEvent = 'started' | 'stopped' | 'error' | 'health-check'

export interface MinerUEventListener {
  (event: MinerUEvent, data?: unknown): void
}
