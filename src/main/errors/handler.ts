import { CafeError, isCafeError, toCafeError, ErrorSeverity } from './index'

export type LogFunction = (message: string, ...args: unknown[]) => void

export interface ErrorHandlerOptions {
  context?: string
  logger?: {
    error: LogFunction
    warn: LogFunction
    info: LogFunction
  }
  onCritical?: (error: CafeError) => void
  onRecoverable?: (error: CafeError) => void
}

let defaultLogger = {
  error: console.error,
  warn: console.warn,
  info: console.info
}

let globalOnCritical: ((error: CafeError) => void) | undefined

export function setErrorLogger(logger: typeof defaultLogger): void {
  defaultLogger = logger
}

export function setGlobalCriticalHandler(handler: (error: CafeError) => void): void {
  globalOnCritical = handler
}

export function handleError(
  error: unknown,
  options: ErrorHandlerOptions = {}
): CafeError {
  const cafeError = toCafeError(error, options.context)
  const logger = options.logger ?? defaultLogger

  const prefix = options.context ? `[${options.context}]` : '[Cafe]'

  switch (cafeError.severity) {
    case 'critical':
      logger.error(`${prefix} CRITICAL: ${cafeError.message}`, {
        code: cafeError.code,
        category: cafeError.category,
        context: cafeError.context
      })
      options.onCritical?.(cafeError)
      globalOnCritical?.(cafeError)
      break

    case 'high':
      logger.error(`${prefix} ${cafeError.message}`, {
        code: cafeError.code,
        category: cafeError.category
      })
      break

    case 'medium':
      logger.warn(`${prefix} ${cafeError.message}`, {
        code: cafeError.code
      })
      break

    case 'low':
      logger.info(`${prefix} ${cafeError.message}`)
      break
  }

  if (cafeError.recoverable) {
    options.onRecoverable?.(cafeError)
  }

  return cafeError
}

export function trySync<T>(
  fn: () => T,
  options: ErrorHandlerOptions = {}
): T | undefined {
  try {
    return fn()
  } catch (error) {
    handleError(error, options)
    return undefined
  }
}

export async function tryAsync<T>(
  fn: () => Promise<T>,
  options: ErrorHandlerOptions = {}
): Promise<T | undefined> {
  try {
    return await fn()
  } catch (error) {
    handleError(error, options)
    return undefined
  }
}

export function wrapSync<T extends (...args: unknown[]) => unknown>(
  fn: T,
  options: ErrorHandlerOptions = {}
): T | undefined {
  return ((...args: Parameters<T>) => {
    try {
      return fn(...args)
    } catch (error) {
      handleError(error, options)
      return undefined
    }
  }) as T
}

export function wrapAsync<T extends (...args: unknown[]) => Promise<unknown>>(
  fn: T,
  options: ErrorHandlerOptions = {}
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await fn(...args)
    } catch (error) {
      handleError(error, options)
      return undefined
    }
  }) as T
}

export function assertNever(value: never): never {
  throw new CafeError({
    code: 'ASSERT_NEVER',
    message: `Unexpected value: ${JSON.stringify(value)}`,
    category: 'runtime',
    severity: 'high',
    recoverable: false
  })
}

export function assertCondition(
  condition: boolean,
  message: string,
  options?: Partial<Pick<ErrorHandlerOptions, 'context'>>
): asserts condition {
  if (!condition) {
    throw new CafeError({
      code: 'ASSERTION_FAILED',
      message,
      category: 'runtime',
      severity: 'high',
      recoverable: false,
      context: options?.context ? { context: options.context } : undefined
    })
  }
}

export class Result<T, E = CafeError> {
  private constructor(
    private readonly value?: T,
    private readonly error?: E
  ) {}

  static ok<T, E = CafeError>(value: T): Result<T, E> {
    return new Result<T, E>(value, undefined)
  }

  static err<T = never, E = CafeError>(error: E): Result<T, E> {
    return new Result<T, E>(undefined, error)
  }

  static try<T>(fn: () => T): Result<T, CafeError> {
    try {
      return Result.ok(fn())
    } catch (e) {
      return Result.err(toCafeError(e))
    }
  }

  static async tryAsync<T>(fn: () => Promise<T>): Promise<Result<T, CafeError>> {
    try {
      return Result.ok(await fn())
    } catch (e) {
      return Result.err(toCafeError(e))
    }
  }

  isOk(): boolean {
    return this.error === undefined
  }

  isErr(): boolean {
    return this.error !== undefined
  }

  unwrap(): T {
    if (this.error) {
      throw this.error
    }
    return this.value as T
  }

  unwrapOr(defaultValue: T): T {
    if (this.error) {
      return defaultValue
    }
    return this.value as T
  }

  unwrapOrElse(fn: (error: E) => T): T {
    if (this.error) {
      return fn(this.error)
    }
    return this.value as T
  }

  map<U>(fn: (value: T) => U): Result<U, E> {
    if (this.error) {
      return Result.err<U, E>(this.error)
    }
    return Result.ok<U, E>(fn(this.value as T))
  }

  mapErr<F>(fn: (error: E) => F): Result<T, F> {
    if (this.error) {
      return Result.err<T, F>(fn(this.error))
    }
    return Result.ok<T, F>(this.value as T)
  }

  andThen<U>(fn: (value: T) => Result<U, E>): Result<U, E> {
    if (this.error) {
      return Result.err<U, E>(this.error)
    }
    return fn(this.value as T)
  }

  getError(): E | undefined {
    return this.error
  }
}
