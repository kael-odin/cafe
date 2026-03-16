export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical'

export type ErrorCategory = 
  | 'validation'
  | 'network'
  | 'database'
  | 'agent'
  | 'browser'
  | 'filesystem'
  | 'permission'
  | 'configuration'
  | 'runtime'
  | 'unknown'

export interface CafeErrorOptions {
  code: string
  message: string
  category?: ErrorCategory
  severity?: ErrorSeverity
  recoverable?: boolean
  cause?: Error
  context?: Record<string, unknown>
}

export class CafeError extends Error {
  public readonly code: string
  public readonly category: ErrorCategory
  public readonly severity: ErrorSeverity
  public readonly recoverable: boolean
  public readonly context?: Record<string, unknown>
  public readonly timestamp: number

  constructor(options: CafeErrorOptions) {
    super(options.message, { cause: options.cause })
    this.name = 'CafeError'
    this.code = options.code
    this.category = options.category ?? 'unknown'
    this.severity = options.severity ?? 'medium'
    this.recoverable = options.recoverable ?? true
    this.context = options.context
    this.timestamp = Date.now()

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, CafeError)
    }
  }

  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      category: this.category,
      severity: this.severity,
      recoverable: this.recoverable,
      context: this.context,
      timestamp: this.timestamp,
      stack: this.stack
    }
  }
}

export class ValidationError extends CafeError {
  constructor(message: string, context?: Record<string, unknown>) {
    super({
      code: 'VALIDATION_ERROR',
      message,
      category: 'validation',
      severity: 'low',
      recoverable: true,
      context
    })
    this.name = 'ValidationError'
  }
}

export class NetworkError extends CafeError {
  constructor(message: string, options?: Partial<CafeErrorOptions>) {
    super({
      code: options?.code ?? 'NETWORK_ERROR',
      message,
      category: 'network',
      severity: options?.severity ?? 'medium',
      recoverable: options?.recoverable ?? true,
      cause: options?.cause,
      context: options?.context
    })
    this.name = 'NetworkError'
  }
}

export class DatabaseError extends CafeError {
  constructor(message: string, options?: Partial<CafeErrorOptions>) {
    super({
      code: options?.code ?? 'DATABASE_ERROR',
      message,
      category: 'database',
      severity: options?.severity ?? 'high',
      recoverable: options?.recoverable ?? false,
      cause: options?.cause,
      context: options?.context
    })
    this.name = 'DatabaseError'
  }
}

export class AgentError extends CafeError {
  constructor(message: string, options?: Partial<CafeErrorOptions>) {
    super({
      code: options?.code ?? 'AGENT_ERROR',
      message,
      category: 'agent',
      severity: options?.severity ?? 'medium',
      recoverable: options?.recoverable ?? true,
      cause: options?.cause,
      context: options?.context
    })
    this.name = 'AgentError'
  }
}

export class BrowserError extends CafeError {
  constructor(message: string, options?: Partial<CafeErrorOptions>) {
    super({
      code: options?.code ?? 'BROWSER_ERROR',
      message,
      category: 'browser',
      severity: options?.severity ?? 'medium',
      recoverable: options?.recoverable ?? true,
      cause: options?.cause,
      context: options?.context
    })
    this.name = 'BrowserError'
  }
}

export class FilesystemError extends CafeError {
  constructor(message: string, options?: Partial<CafeErrorOptions>) {
    super({
      code: options?.code ?? 'FILESYSTEM_ERROR',
      message,
      category: 'filesystem',
      severity: options?.severity ?? 'medium',
      recoverable: options?.recoverable ?? true,
      cause: options?.cause,
      context: options?.context
    })
    this.name = 'FilesystemError'
  }
}

export class PermissionError extends CafeError {
  constructor(message: string, context?: Record<string, unknown>) {
    super({
      code: 'PERMISSION_DENIED',
      message,
      category: 'permission',
      severity: 'high',
      recoverable: false,
      context
    })
    this.name = 'PermissionError'
  }
}

export class ConfigurationError extends CafeError {
  constructor(message: string, context?: Record<string, unknown>) {
    super({
      code: 'CONFIGURATION_ERROR',
      message,
      category: 'configuration',
      severity: 'high',
      recoverable: true,
      context
    })
    this.name = 'ConfigurationError'
  }
}

export class RuntimeError extends CafeError {
  constructor(message: string, options?: Partial<CafeErrorOptions>) {
    super({
      code: options?.code ?? 'RUNTIME_ERROR',
      message,
      category: 'runtime',
      severity: options?.severity ?? 'medium',
      recoverable: options?.recoverable ?? true,
      cause: options?.cause,
      context: options?.context
    })
    this.name = 'RuntimeError'
  }
}

export class NotFoundError extends CafeError {
  constructor(resource: string, context?: Record<string, unknown>) {
    super({
      code: 'NOT_FOUND',
      message: `${resource} not found`,
      category: 'validation',
      severity: 'low',
      recoverable: false,
      context
    })
    this.name = 'NotFoundError'
  }
}

export class TimeoutError extends CafeError {
  constructor(operation: string, timeoutMs: number, context?: Record<string, unknown>) {
    super({
      code: 'TIMEOUT',
      message: `Operation "${operation}" timed out after ${timeoutMs}ms`,
      category: 'runtime',
      severity: 'medium',
      recoverable: true,
      context: { operation, timeoutMs, ...context }
    })
    this.name = 'TimeoutError'
  }
}

export function isCafeError(error: unknown): error is CafeError {
  return error instanceof CafeError
}

export function toCafeError(error: unknown, context?: string): CafeError {
  if (isCafeError(error)) {
    return error
  }

  if (error instanceof Error) {
    return new CafeError({
      code: 'UNKNOWN_ERROR',
      message: error.message,
      category: 'unknown',
      severity: 'medium',
      recoverable: true,
      cause: error,
      context: context ? { context } : undefined
    })
  }

  return new CafeError({
    code: 'UNKNOWN_ERROR',
    message: String(error),
    category: 'unknown',
    severity: 'medium',
    recoverable: true,
    context: context ? { context, originalError: error } : { originalError: error }
  })
}

export function getErrorMessage(error: unknown): string {
  if (isCafeError(error)) {
    return error.message
  }
  if (error instanceof Error) {
    return error.message
  }
  return String(error)
}

export function getErrorCode(error: unknown): string {
  if (isCafeError(error)) {
    return error.code
  }
  return 'UNKNOWN'
}

export {
  handleError,
  trySync,
  tryAsync,
  wrapSync,
  wrapAsync,
  assertNever,
  assertCondition,
  Result,
  setErrorLogger,
  setGlobalCriticalHandler,
  type ErrorHandlerOptions,
  type LogFunction
} from './handler'
