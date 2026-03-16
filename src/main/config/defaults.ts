export interface RuntimeConfig {
  maxAutoContinues: number
  maxTurns: number
  maxConcurrentRuns: number
  maxConcurrentAIBrowserRuns: number
}

export interface HealthConfig {
  maxSelfFailures: number
  pollingIntervalMs: number
  startupCheckEnabled: boolean
}

export interface SchedulerConfig {
  maxTimerDelayMs: number
  timerRecalculateIntervalMs: number
  maxRetryCount: number
  retryDelaysMs: number[]
}

export interface DatabaseConfig {
  walModeEnabled: boolean
  busyTimeoutMs: number
  cacheSizeMB: number
}

export interface AppConfig {
  runtime: RuntimeConfig
  health: HealthConfig
  scheduler: SchedulerConfig
  database: DatabaseConfig
}

export const DEFAULT_RUNTIME_CONFIG: RuntimeConfig = {
  maxAutoContinues: 3,
  maxTurns: 100,
  maxConcurrentRuns: 2,
  maxConcurrentAIBrowserRuns: 1
}

export const DEFAULT_HEALTH_CONFIG: HealthConfig = {
  maxSelfFailures: 5,
  pollingIntervalMs: 30000,
  startupCheckEnabled: false
}

export const DEFAULT_SCHEDULER_CONFIG: SchedulerConfig = {
  maxTimerDelayMs: 60000,
  timerRecalculateIntervalMs: 15000,
  maxRetryCount: 5,
  retryDelaysMs: [15000, 60000, 300000, 900000, 3600000]
}

export const DEFAULT_DATABASE_CONFIG: DatabaseConfig = {
  walModeEnabled: true,
  busyTimeoutMs: 5000,
  cacheSizeMB: 64
}

export const DEFAULT_APP_CONFIG: AppConfig = {
  runtime: DEFAULT_RUNTIME_CONFIG,
  health: DEFAULT_HEALTH_CONFIG,
  scheduler: DEFAULT_SCHEDULER_CONFIG,
  database: DEFAULT_DATABASE_CONFIG
}

let currentConfig: AppConfig = { ...DEFAULT_APP_CONFIG }

export function getConfig(): AppConfig {
  return currentConfig
}

export function getRuntimeConfig(): RuntimeConfig {
  return currentConfig.runtime
}

export function getHealthConfig(): HealthConfig {
  return currentConfig.health
}

export function getSchedulerConfig(): SchedulerConfig {
  return currentConfig.scheduler
}

export function getDatabaseConfig(): DatabaseConfig {
  return currentConfig.database
}

export function updateConfig(partial: Partial<AppConfig>): void {
  currentConfig = {
    ...currentConfig,
    ...partial,
    runtime: { ...currentConfig.runtime, ...partial.runtime },
    health: { ...currentConfig.health, ...partial.health },
    scheduler: { ...currentConfig.scheduler, ...partial.scheduler },
    database: { ...currentConfig.database, ...partial.database }
  }
}

export function resetConfig(): void {
  currentConfig = { ...DEFAULT_APP_CONFIG }
}

export function loadConfigFromFile(path: string): AppConfig | null {
  try {
    const fs = require('fs')
    if (fs.existsSync(path)) {
      const content = fs.readFileSync(path, 'utf-8')
      const parsed = JSON.parse(content)
      updateConfig(parsed)
      return currentConfig
    }
    return null
  } catch {
    return null
  }
}
