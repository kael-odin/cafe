/**
 * MinerU Process Manager
 *
 * Manages the lifecycle of the MinerU FastAPI service process.
 */

import { ChildProcess, spawn } from 'child_process'
import { app } from 'electron'
import path from 'path'
import { EventEmitter } from 'events'
import { MinerUConfig, MinerUStatus, MinerUEventListener, MinerUEvent } from './types'

const DEFAULT_PORT = 18000
const DEFAULT_HEALTH_CHECK_INTERVAL = 30000 // 30 seconds
const STARTUP_TIMEOUT = 60000 // 60 seconds

export class MinerUProcessManager extends EventEmitter {
  private config: MinerUConfig
  private process: ChildProcess | null = null
  private status: MinerUStatus
  private healthCheckTimer: NodeJS.Timeout | null = null
  private startupTimer: NodeJS.Timeout | null = null

  constructor(config: MinerUConfig) {
    super()
    this.config = {
      port: DEFAULT_PORT,
      autoStart: true,
      healthCheckInterval: DEFAULT_HEALTH_CHECK_INTERVAL,
      ...config,
    }

    this.status = {
      isRunning: false,
      mode: config.mode,
      url: this.getServiceUrl(),
    }
  }

  /**
   * Get the service URL based on mode
   */
  private getServiceUrl(): string {
    if (this.config.mode === 'remote' && this.config.remoteUrl) {
      return this.config.remoteUrl
    }
    return `http://localhost:${this.config.port || DEFAULT_PORT}`
  }

  /**
   * Get the path to the mineru-api executable
   */
  private getMinerUExecutable(): string {
    // In development, use system-installed mineru-api
    // In production, use bundled Python environment
    const isDev = !app.isPackaged

    if (isDev) {
      // Development: assume mineru-api is in PATH
      return 'mineru-api'
    }

    // Production: use bundled Python environment
    const resourcesPath = process.resourcesPath
    const pythonPath = path.join(resourcesPath, 'python')
    const scriptsPath = path.join(pythonPath, 'Scripts')

    return path.join(scriptsPath, 'mineru-api.exe')
  }

  /**
   * Start the MinerU service
   */
  async start(): Promise<void> {
    if (this.config.mode === 'remote') {
      // Remote mode: no process to start
      this.status.isRunning = true
      this.status.url = this.config.remoteUrl || ''
      this.emit('started', { mode: 'remote', url: this.status.url })
      return
    }

    if (this.process) {
      console.log('[MinerU] Process already running')
      return
    }

    return new Promise((resolve, reject) => {
      try {
        const executable = this.getMinerUExecutable()
        const port = this.config.port || DEFAULT_PORT

        console.log(`[MinerU] Starting service on port ${port}...`)

        // Spawn the mineru-api process
        this.process = spawn(executable, ['--port', String(port)], {
          stdio: ['ignore', 'pipe', 'pipe'],
          shell: true,
        })

        // Handle process events
        this.process.on('error', (error) => {
          console.error('[MinerU] Process error:', error)
          this.status.error = error.message
          this.emit('error', error)
          reject(error)
        })

        this.process.on('exit', (code, signal) => {
          console.log(`[MinerU] Process exited with code ${code}, signal ${signal}`)
          this.process = null
          this.status.isRunning = false
          this.status.pid = undefined
          this.emit('stopped', { code, signal })
        })

        // Capture stdout/stderr for debugging
        this.process.stdout?.on('data', (data) => {
          console.log(`[MinerU stdout] ${data.toString().trim()}`)
        })

        this.process.stderr?.on('data', (data) => {
          console.error(`[MinerU stderr] ${data.toString().trim()}`)
        })

        // Set startup timeout
        this.startupTimer = setTimeout(() => {
          console.error('[MinerU] Startup timeout')
          this.stop()
          reject(new Error('MinerU service startup timeout'))
        }, STARTUP_TIMEOUT)

        // Wait for service to be ready
        this.waitForServiceReady()
          .then(() => {
            if (this.startupTimer) {
              clearTimeout(this.startupTimer)
              this.startupTimer = null
            }
            this.status.isRunning = true
            this.status.pid = this.process?.pid
            this.emit('started', { mode: 'local', url: this.status.url })
            this.startHealthCheck()
            resolve()
          })
          .catch((error) => {
            if (this.startupTimer) {
              clearTimeout(this.startupTimer)
              this.startupTimer = null
            }
            reject(error)
          })
      } catch (error) {
        reject(error)
      }
    })
  }

  /**
   * Wait for the service to be ready
   */
  private async waitForServiceReady(maxAttempts = 30): Promise<void> {
    for (let i = 0; i < maxAttempts; i++) {
      try {
        const response = await fetch(`${this.status.url}/health`, {
          method: 'GET',
        })
        if (response.ok) {
          console.log('[MinerU] Service is ready')
          return
        }
      } catch {
        // Service not ready yet
      }
      await new Promise((resolve) => setTimeout(resolve, 2000))
    }
    throw new Error('MinerU service failed to become ready')
  }

  /**
   * Stop the MinerU service
   */
  async stop(): Promise<void> {
    if (this.config.mode === 'remote') {
      this.status.isRunning = false
      this.emit('stopped', {})
      return
    }

    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer)
      this.healthCheckTimer = null
    }

    if (this.startupTimer) {
      clearTimeout(this.startupTimer)
      this.startupTimer = null
    }

    if (this.process) {
      return new Promise((resolve) => {
        const timeout = setTimeout(() => {
          console.log('[MinerU] Force killing process...')
          this.process?.kill('SIGKILL')
        }, 5000)

        this.process!.on('exit', () => {
          clearTimeout(timeout)
          this.process = null
          this.status.isRunning = false
          this.status.pid = undefined
          resolve()
        })

        console.log('[MinerU] Stopping service...')
        this.process!.kill('SIGTERM')
      })
    }
  }

  /**
   * Start health check timer
   */
  private startHealthCheck(): void {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer)
    }

    const interval = this.config.healthCheckInterval || DEFAULT_HEALTH_CHECK_INTERVAL

    this.healthCheckTimer = setInterval(async () => {
      await this.checkHealth()
    }, interval)
  }

  /**
   * Check service health
   */
  async checkHealth(): Promise<boolean> {
    try {
      const startTime = Date.now()
      const response = await fetch(`${this.status.url}/health`, {
        method: 'GET',
      })
      const responseTime = Date.now() - startTime

      const healthy = response.ok
      this.status.lastHealthCheck = {
        timestamp: Date.now(),
        healthy,
        responseTime,
      }

      this.emit('health-check', this.status.lastHealthCheck)

      if (!healthy && this.config.autoStart) {
        console.log('[MinerU] Health check failed, attempting restart...')
        await this.restart()
      }

      return healthy
    } catch (error) {
      this.status.lastHealthCheck = {
        timestamp: Date.now(),
        healthy: false,
      }
      this.emit('health-check', this.status.lastHealthCheck)
      return false
    }
  }

  /**
   * Restart the service
   */
  async restart(): Promise<void> {
    await this.stop()
    await this.start()
  }

  /**
   * Get current status
   */
  getStatus(): MinerUStatus {
    return { ...this.status }
  }

  /**
   * Add event listener
   */
  on(event: MinerUEvent, listener: MinerUEventListener): this {
    return super.on(event, listener)
  }

  /**
   * Remove event listener
   */
  off(event: MinerUEvent, listener: MinerUEventListener): this {
    return super.off(event, listener)
  }

  /**
   * Cleanup resources
   */
  async destroy(): Promise<void> {
    await this.stop()
    this.removeAllListeners()
  }
}
