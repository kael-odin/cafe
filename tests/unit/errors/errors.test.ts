import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  CafeError,
  ValidationError,
  NetworkError,
  DatabaseError,
  AgentError,
  BrowserError,
  FilesystemError,
  PermissionError,
  ConfigurationError,
  RuntimeError,
  NotFoundError,
  TimeoutError,
  isCafeError,
  toCafeError,
  getErrorMessage,
  getErrorCode,
  handleError,
  trySync,
  tryAsync,
  Result
} from '../../../src/main/errors'

describe('CafeError', () => {
  it('should create error with all properties', () => {
    const error = new CafeError({
      code: 'TEST_ERROR',
      message: 'Test error message',
      category: 'runtime',
      severity: 'high',
      recoverable: false,
      context: { foo: 'bar' }
    })

    expect(error.name).toBe('CafeError')
    expect(error.code).toBe('TEST_ERROR')
    expect(error.message).toBe('Test error message')
    expect(error.category).toBe('runtime')
    expect(error.severity).toBe('high')
    expect(error.recoverable).toBe(false)
    expect(error.context).toEqual({ foo: 'bar' })
    expect(error.timestamp).toBeGreaterThan(0)
  })

  it('should use default values for optional properties', () => {
    const error = new CafeError({
      code: 'TEST',
      message: 'Test'
    })

    expect(error.category).toBe('unknown')
    expect(error.severity).toBe('medium')
    expect(error.recoverable).toBe(true)
    expect(error.context).toBeUndefined()
  })

  it('should store cause error', () => {
    const cause = new Error('Original error')
    const error = new CafeError({
      code: 'WRAPPED',
      message: 'Wrapped error',
      cause
    })

    expect(error.cause).toBe(cause)
  })

  it('should serialize to JSON', () => {
    const error = new CafeError({
      code: 'JSON_TEST',
      message: 'JSON test',
      category: 'agent',
      severity: 'critical'
    })

    const json = error.toJSON()
    expect(json.code).toBe('JSON_TEST')
    expect(json.message).toBe('JSON test')
    expect(json.category).toBe('agent')
    expect(json.severity).toBe('critical')
    expect(json.timestamp).toBeGreaterThan(0)
  })
})

describe('Error Subclasses', () => {
  it('ValidationError should have correct defaults', () => {
    const error = new ValidationError('Invalid input', { field: 'email' })
    expect(error.name).toBe('ValidationError')
    expect(error.code).toBe('VALIDATION_ERROR')
    expect(error.category).toBe('validation')
    expect(error.severity).toBe('low')
    expect(error.recoverable).toBe(true)
  })

  it('NetworkError should have correct defaults', () => {
    const error = new NetworkError('Connection failed')
    expect(error.name).toBe('NetworkError')
    expect(error.code).toBe('NETWORK_ERROR')
    expect(error.category).toBe('network')
    expect(error.severity).toBe('medium')
    expect(error.recoverable).toBe(true)
  })

  it('NetworkError should accept custom options', () => {
    const cause = new Error('Timeout')
    const error = new NetworkError('Connection timeout', {
      code: 'CONNECTION_TIMEOUT',
      severity: 'high',
      cause,
      context: { url: 'https://example.com' }
    })
    expect(error.code).toBe('CONNECTION_TIMEOUT')
    expect(error.severity).toBe('high')
    expect(error.cause).toBe(cause)
  })

  it('DatabaseError should have correct defaults', () => {
    const error = new DatabaseError('Query failed')
    expect(error.name).toBe('DatabaseError')
    expect(error.code).toBe('DATABASE_ERROR')
    expect(error.category).toBe('database')
    expect(error.severity).toBe('high')
    expect(error.recoverable).toBe(false)
  })

  it('AgentError should have correct defaults', () => {
    const error = new AgentError('Agent failed')
    expect(error.name).toBe('AgentError')
    expect(error.code).toBe('AGENT_ERROR')
    expect(error.category).toBe('agent')
    expect(error.severity).toBe('medium')
    expect(error.recoverable).toBe(true)
  })

  it('BrowserError should have correct defaults', () => {
    const error = new BrowserError('Page load failed')
    expect(error.name).toBe('BrowserError')
    expect(error.code).toBe('BROWSER_ERROR')
    expect(error.category).toBe('browser')
    expect(error.severity).toBe('medium')
  })

  it('FilesystemError should have correct defaults', () => {
    const error = new FilesystemError('File not found')
    expect(error.name).toBe('FilesystemError')
    expect(error.code).toBe('FILESYSTEM_ERROR')
    expect(error.category).toBe('filesystem')
  })

  it('PermissionError should have correct defaults', () => {
    const error = new PermissionError('Access denied', { resource: '/admin' })
    expect(error.name).toBe('PermissionError')
    expect(error.code).toBe('PERMISSION_DENIED')
    expect(error.category).toBe('permission')
    expect(error.severity).toBe('high')
    expect(error.recoverable).toBe(false)
  })

  it('ConfigurationError should have correct defaults', () => {
    const error = new ConfigurationError('Missing API key')
    expect(error.name).toBe('ConfigurationError')
    expect(error.code).toBe('CONFIGURATION_ERROR')
    expect(error.category).toBe('configuration')
    expect(error.severity).toBe('high')
    expect(error.recoverable).toBe(true)
  })

  it('RuntimeError should have correct defaults', () => {
    const error = new RuntimeError('Execution failed')
    expect(error.name).toBe('RuntimeError')
    expect(error.code).toBe('RUNTIME_ERROR')
    expect(error.category).toBe('runtime')
  })

  it('NotFoundError should format message correctly', () => {
    const error = new NotFoundError('User', { id: '123' })
    expect(error.name).toBe('NotFoundError')
    expect(error.message).toBe('User not found')
    expect(error.code).toBe('NOT_FOUND')
    expect(error.recoverable).toBe(false)
  })

  it('TimeoutError should format message correctly', () => {
    const error = new TimeoutError('fetchData', 5000)
    expect(error.name).toBe('TimeoutError')
    expect(error.message).toBe('Operation "fetchData" timed out after 5000ms')
    expect(error.code).toBe('TIMEOUT')
    expect(error.context).toEqual({ operation: 'fetchData', timeoutMs: 5000 })
  })
})

describe('Utility Functions', () => {
  describe('isCafeError', () => {
    it('should return true for CafeError instances', () => {
      expect(isCafeError(new CafeError({ code: 'TEST', message: 'Test' }))).toBe(true)
      expect(isCafeError(new ValidationError('Test'))).toBe(true)
      expect(isCafeError(new NetworkError('Test'))).toBe(true)
    })

    it('should return false for non-CafeError errors', () => {
      expect(isCafeError(new Error('Test'))).toBe(false)
      expect(isCafeError('string error')).toBe(false)
      expect(isCafeError(null)).toBe(false)
      expect(isCafeError(undefined)).toBe(false)
    })
  })

  describe('toCafeError', () => {
    it('should return same error if already CafeError', () => {
      const original = new NetworkError('Test')
      const converted = toCafeError(original)
      expect(converted).toBe(original)
    })

    it('should wrap Error instances', () => {
      const original = new Error('Original message')
      const converted = toCafeError(original, 'TestContext')
      
      expect(isCafeError(converted)).toBe(true)
      expect(converted.message).toBe('Original message')
      expect(converted.code).toBe('UNKNOWN_ERROR')
      expect(converted.cause).toBe(original)
      expect(converted.context).toEqual({ context: 'TestContext' })
    })

    it('should wrap non-Error values', () => {
      const converted = toCafeError('string error')
      expect(converted.message).toBe('string error')
      expect(converted.code).toBe('UNKNOWN_ERROR')
      expect(converted.context).toEqual({ originalError: 'string error' })
    })
  })

  describe('getErrorMessage', () => {
    it('should extract message from CafeError', () => {
      expect(getErrorMessage(new ValidationError('Invalid input'))).toBe('Invalid input')
    })

    it('should extract message from Error', () => {
      expect(getErrorMessage(new Error('Test message'))).toBe('Test message')
    })

    it('should convert non-Error to string', () => {
      expect(getErrorMessage('string error')).toBe('string error')
      expect(getErrorMessage(123)).toBe('123')
    })
  })

  describe('getErrorCode', () => {
    it('should extract code from CafeError', () => {
      expect(getErrorCode(new NetworkError('Test', { code: 'CUSTOM_CODE' }))).toBe('CUSTOM_CODE')
    })

    it('should return UNKNOWN for non-CafeError', () => {
      expect(getErrorCode(new Error('Test'))).toBe('UNKNOWN')
      expect(getErrorCode('string')).toBe('UNKNOWN')
    })
  })
})

describe('Error Handler', () => {
  let mockLogger: {
    error: ReturnType<typeof vi.fn>
    warn: ReturnType<typeof vi.fn>
    info: ReturnType<typeof vi.fn>
  }

  beforeEach(() => {
    mockLogger = {
      error: vi.fn(),
      warn: vi.fn(),
      info: vi.fn()
    }
  })

  it('should log critical errors with error level', () => {
    const error = new CafeError({
      code: 'CRITICAL',
      message: 'Critical failure',
      severity: 'critical'
    })

    handleError(error, { logger: mockLogger, context: 'TestModule' })

    expect(mockLogger.error).toHaveBeenCalledWith(
      '[TestModule] CRITICAL: Critical failure',
      expect.objectContaining({ code: 'CRITICAL' })
    )
  })

  it('should log high severity errors with error level', () => {
    const error = new DatabaseError('Connection failed')

    handleError(error, { logger: mockLogger })

    expect(mockLogger.error).toHaveBeenCalled()
  })

  it('should log medium severity errors with warn level', () => {
    const error = new NetworkError('Timeout')

    handleError(error, { logger: mockLogger })

    expect(mockLogger.warn).toHaveBeenCalled()
  })

  it('should log low severity errors with info level', () => {
    const error = new ValidationError('Invalid field')

    handleError(error, { logger: mockLogger })

    expect(mockLogger.info).toHaveBeenCalled()
  })

  it('should call onCritical callback for critical errors', () => {
    const onCritical = vi.fn()
    const error = new CafeError({
      code: 'CRITICAL',
      message: 'Critical',
      severity: 'critical'
    })

    handleError(error, { logger: mockLogger, onCritical })

    expect(onCritical).toHaveBeenCalledWith(error)
  })

  it('should call onRecoverable callback for recoverable errors', () => {
    const onRecoverable = vi.fn()
    const error = new NetworkError('Recoverable error')

    handleError(error, { logger: mockLogger, onRecoverable })

    expect(onRecoverable).toHaveBeenCalledWith(error)
  })

  it('should convert non-CafeError before handling', () => {
    const error = new Error('Plain error')

    const result = handleError(error, { logger: mockLogger, context: 'Test' })

    expect(isCafeError(result)).toBe(true)
    expect(result.code).toBe('UNKNOWN_ERROR')
  })
})

describe('trySync', () => {
  it('should return result on success', () => {
    const result = trySync(() => 42)
    expect(result).toBe(42)
  })

  it('should return undefined on error', () => {
    const result = trySync(() => {
      throw new Error('Test error')
    })
    expect(result).toBeUndefined()
  })

  it('should handle error with context', () => {
    const mockLogger = { error: vi.fn(), warn: vi.fn(), info: vi.fn() }
    
    trySync(() => {
      throw new Error('Test')
    }, { logger: mockLogger, context: 'TestModule' })

    expect(mockLogger.warn).toHaveBeenCalled()
  })
})

describe('tryAsync', () => {
  it('should return result on success', async () => {
    const result = await tryAsync(() => Promise.resolve(42))
    expect(result).toBe(42)
  })

  it('should return undefined on error', async () => {
    const result = await tryAsync(() => Promise.reject(new Error('Test')))
    expect(result).toBeUndefined()
  })
})

describe('Result', () => {
  describe('ok', () => {
    it('should create successful result', () => {
      const result = Result.ok(42)
      expect(result.isOk()).toBe(true)
      expect(result.isErr()).toBe(false)
      expect(result.unwrap()).toBe(42)
    })
  })

  describe('err', () => {
    it('should create error result', () => {
      const error = new Error('Test error')
      const result = Result.err(error)
      expect(result.isOk()).toBe(false)
      expect(result.isErr()).toBe(true)
      expect(result.getError()).toBe(error)
    })
  })

  describe('try', () => {
    it('should return ok on success', () => {
      const result = Result.try(() => 42)
      expect(result.isOk()).toBe(true)
      expect(result.unwrap()).toBe(42)
    })

    it('should return err on throw', () => {
      const result = Result.try(() => {
        throw new Error('Test')
      })
      expect(result.isErr()).toBe(true)
      expect(isCafeError(result.getError())).toBe(true)
    })
  })

  describe('tryAsync', async () => {
    it('should return ok on success', async () => {
      const result = await Result.tryAsync(() => Promise.resolve(42))
      expect(result.isOk()).toBe(true)
      expect(result.unwrap()).toBe(42)
    })

    it('should return err on rejection', async () => {
      const result = await Result.tryAsync(() => Promise.reject(new Error('Test')))
      expect(result.isErr()).toBe(true)
    })
  })

  describe('unwrap', () => {
    it('should return value for ok', () => {
      expect(Result.ok(42).unwrap()).toBe(42)
    })

    it('should throw error for err', () => {
      expect(() => Result.err(new Error('Test')).unwrap()).toThrow('Test')
    })
  })

  describe('unwrapOr', () => {
    it('should return value for ok', () => {
      expect(Result.ok(42).unwrapOr(0)).toBe(42)
    })

    it('should return default for err', () => {
      expect(Result.err(new Error('Test')).unwrapOr(0)).toBe(0)
    })
  })

  describe('unwrapOrElse', () => {
    it('should return value for ok', () => {
      expect(Result.ok(42).unwrapOrElse(() => 0)).toBe(42)
    })

    it('should call function for err', () => {
      const result = Result.err<string, number>(42).unwrapOrElse(e => e * 2)
      expect(result).toBe(84)
    })
  })

  describe('map', () => {
    it('should transform ok value', () => {
      const result = Result.ok(21).map(x => x * 2)
      expect(result.unwrap()).toBe(42)
    })

    it('should preserve error', () => {
      const error = new Error('Test')
      const result = Result.err<number, Error>(error).map(x => x * 2)
      expect(result.getError()).toBe(error)
    })
  })

  describe('mapErr', () => {
    it('should transform error', () => {
      const result = Result.err<number, string>('error').mapErr(s => new Error(s))
      expect(result.getError()?.message).toBe('error')
    })

    it('should preserve ok value', () => {
      const result = Result.ok(42).mapErr(e => e)
      expect(result.unwrap()).toBe(42)
    })
  })

  describe('andThen', () => {
    it('should chain ok results', () => {
      const result = Result.ok(21).andThen(x => Result.ok(x * 2))
      expect(result.unwrap()).toBe(42)
    })

    it('should propagate error', () => {
      const error = new Error('Test')
      const result = Result.err<number, Error>(error).andThen(x => Result.ok(x * 2))
      expect(result.getError()).toBe(error)
    })
  })
})
