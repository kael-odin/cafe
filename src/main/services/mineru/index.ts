/**
 * MinerU Service
 *
 * Main service for managing MinerU document parsing capabilities.
 */

import { MinerUProcessManager } from './process-manager'
import { MinerUConfig, MinerUStatus, ParseDocumentOptions, ParseResult, AsyncTaskStatus } from './types'

export { MinerUProcessManager } from './process-manager'
export * from './types'

/**
 * MinerU Service Manager
 *
 * Singleton service for managing MinerU integration
 */
class MinerUServiceManager {
  private static instance: MinerUServiceManager | null = null
  private processManager: MinerUProcessManager | null = null
  private config: MinerUConfig | null = null

  private constructor() {}

  /**
   * Get singleton instance
   */
  static getInstance(): MinerUServiceManager {
    if (!MinerUServiceManager.instance) {
      MinerUServiceManager.instance = new MinerUServiceManager()
    }
    return MinerUServiceManager.instance
  }

  /**
   * Initialize the service with configuration
   */
  async initialize(config: MinerUConfig): Promise<void> {
    if (this.processManager) {
      await this.destroy()
    }

    const normalizedConfig: MinerUConfig = {
      remoteUrl: config.remoteUrl || 'https://mineru.net',
      ...config,
    }

    this.config = normalizedConfig
    this.processManager = new MinerUProcessManager(normalizedConfig)

    if (normalizedConfig.autoStart && normalizedConfig.mode === 'local') {
      await this.processManager.start()
    }
  }

  /**
   * Get the service URL
   */
  getServiceUrl(): string {
    if (!this.config) {
      throw new Error('MinerU service not initialized')
    }

    if (this.config.mode === 'remote' && this.config.remoteUrl) {
      return this.config.remoteUrl
    }

    return `http://localhost:${this.config.port || 18000}`
  }

  /**
   * Get current status
   */
  getStatus(): MinerUStatus | null {
    if (!this.processManager) {
      return null
    }
    return this.processManager.getStatus()
  }

  /**
   * Check if service is healthy
   */
  async isHealthy(): Promise<boolean> {
    if (!this.processManager) {
      return false
    }
    return this.processManager.checkHealth()
  }

  /**
   * Start the service
   */
  async start(): Promise<void> {
    if (!this.processManager) {
      throw new Error('MinerU service not initialized')
    }
    await this.processManager.start()
  }

  /**
   * Stop the service
   */
  async stop(): Promise<void> {
    if (!this.processManager) {
      return
    }
    await this.processManager.stop()
  }

  /**
   * Restart the service
   */
  async restart(): Promise<void> {
    if (!this.processManager) {
      throw new Error('MinerU service not initialized')
    }
    await this.processManager.restart()
  }

  /**
   * Parse a document
   */
  async parseDocument(options: ParseDocumentOptions): Promise<ParseResult> {
    const url = this.getServiceUrl()

    try {
      const formData = new FormData()
      
      // Read file content
      const fs = await import('fs/promises')
      const fileBuffer = await fs.readFile(options.filePath)
      // Use provided fileName (original name) or derive from filePath
      const fileName = options.fileName || options.filePath.split(/[/\\]/).pop() || 'document'
      
      formData.append('files', new Blob([fileBuffer]), fileName)
      formData.append('lang_list', options.lang || this.config?.defaultLang || 'ch')
      formData.append('backend', options.backend || this.config?.backend || 'hybrid-auto-engine')
      formData.append('parse_method', options.parseMethod || 'auto')
      formData.append('formula_enable', String(options.formulaEnable ?? true))
      formData.append('table_enable', String(options.tableEnable ?? true))
      formData.append('return_md', 'true')
      formData.append('return_images', String(options.returnImages ?? false))
      formData.append('start_page_id', String(options.startPage ?? 0))
      formData.append('end_page_id', String(options.endPage ?? -1))

      const response = await fetch(`${url}/file_parse`, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      const fileStem = fileName.replace(/\.[^.]+$/, '')
      const result = data.results?.[fileStem] || {}

      return {
        fileName,
        markdown: result.md,
        middleJson: result.middle_json,
        modelOutput: result.model_output,
        contentList: result.content_list,
        images: result.images,
      }
    } catch (error) {
      return {
        fileName: options.fileName || options.filePath.split(/[/\\]/).pop() || 'document',
        error: error instanceof Error ? error.message : String(error),
      }
    }
  }

  /**
   * Parse multiple documents
   */
  async parseDocuments(filePaths: string[], options?: Partial<ParseDocumentOptions>): Promise<ParseResult[]> {
    const url = this.getServiceUrl()

    try {
      const formData = new FormData()
      const fs = await import('fs/promises')
      const fileStems: string[] = []

      for (const filePath of filePaths) {
        const fileBuffer = await fs.readFile(filePath)
        const fileName = filePath.split(/[/\\]/).pop() || 'document'
        formData.append('files', new Blob([fileBuffer]), fileName)
        fileStems.push(fileName.replace(/\.[^.]+$/, ''))
      }

      formData.append('lang_list', options?.lang || this.config?.defaultLang || 'ch')
      formData.append('backend', options?.backend || this.config?.backend || 'hybrid-auto-engine')
      formData.append('parse_method', options?.parseMethod || 'auto')
      formData.append('formula_enable', String(options?.formulaEnable ?? true))
      formData.append('table_enable', String(options?.tableEnable ?? true))
      formData.append('return_md', 'true')
      formData.append('return_images', String(options?.returnImages ?? false))

      const response = await fetch(`${url}/file_parse`, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      const results: ParseResult[] = []

      for (let i = 0; i < filePaths.length; i++) {
        const stem = fileStems[i]
        const result = data.results?.[stem] || {}
        results.push({
          fileName: filePaths[i].split(/[/\\]/).pop() || 'document',
          markdown: result.md,
          middleJson: result.middle_json,
          modelOutput: result.model_output,
          contentList: result.content_list,
          images: result.images,
        })
      }

      return results
    } catch (error) {
      return filePaths.map((fp) => ({
        fileName: fp.split(/[/\\]/).pop() || 'document',
        error: error instanceof Error ? error.message : String(error),
      }))
    }
  }

  /**
   * Submit async parsing task
   */
  async submitAsyncTask(filePaths: string[], options?: Partial<ParseDocumentOptions>): Promise<AsyncTaskStatus> {
    const url = this.getServiceUrl()

    const formData = new FormData()
    const fs = await import('fs/promises')

    for (const filePath of filePaths) {
      const fileBuffer = await fs.readFile(filePath)
      const fileName = filePath.split(/[/\\]/).pop() || 'document'
      formData.append('files', new Blob([fileBuffer]), fileName)
    }

    formData.append('lang_list', options?.lang || this.config?.defaultLang || 'ch')
    formData.append('backend', options?.backend || this.config?.backend || 'hybrid-auto-engine')
    formData.append('parse_method', options?.parseMethod || 'auto')
    formData.append('formula_enable', String(options?.formulaEnable ?? true))
    formData.append('table_enable', String(options?.tableEnable ?? true))
    formData.append('return_md', 'true')

    const response = await fetch(`${url}/tasks`, {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    return response.json()
  }

  /**
   * Get async task status
   */
  async getTaskStatus(taskId: string): Promise<AsyncTaskStatus> {
    const url = this.getServiceUrl()
    const response = await fetch(`${url}/tasks/${taskId}`)

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    return response.json()
  }

  /**
   * Get async task result
   */
  async getTaskResult(taskId: string): Promise<Record<string, unknown>> {
    const url = this.getServiceUrl()
    const response = await fetch(`${url}/tasks/${taskId}/result`)

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    return response.json()
  }

  /**
   * Cleanup resources
   */
  async destroy(): Promise<void> {
    if (this.processManager) {
      await this.processManager.destroy()
      this.processManager = null
    }
    this.config = null
  }
}

// Export singleton instance getter
export const getMinerUService = () => MinerUServiceManager.getInstance()
