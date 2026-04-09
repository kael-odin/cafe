/**
 * Authentication Middleware - Validates remote access tokens
 */

import { Request, Response, NextFunction } from 'express'
import { timingSafeEqual } from 'crypto'

// Store active tokens (in memory, reset on restart)
let accessToken: string | null = null

/**
 * Generate a new access token
 */
export function generateAccessToken(): string {
  // Generate a simple 6-digit PIN for easy mobile entry
  const pin = Math.floor(100000 + Math.random() * 900000).toString()
  accessToken = pin
  // Don't log the actual token for security - it's displayed in the UI
  console.log('[Auth] New access token generated')
  return pin
}

/**
 * Set a custom access token (user-defined password)
 * @param token The custom password to set (4-32 characters)
 * @returns true if set successfully, false if validation failed
 */
export function setCustomAccessToken(token: string): boolean {
  // Validate: 4-32 alphanumeric characters
  if (!token || token.length < 4 || token.length > 32) {
    console.log('[Auth] Custom token rejected: length must be 4-32 characters')
    return false
  }

  // Allow alphanumeric characters only for simplicity
  if (!/^[a-zA-Z0-9]+$/.test(token)) {
    console.log('[Auth] Custom token rejected: only alphanumeric characters allowed')
    return false
  }

  accessToken = token
  console.log('[Auth] Custom access token set')
  return true
}

/**
 * Get current access token
 */
export function getAccessToken(): string | null {
  return accessToken
}

/**
 * Clear access token (disable remote access)
 */
export function clearAccessToken(): void {
  accessToken = null
  console.log('[Auth] Access token cleared')
}

/**
 * Validate a token
 */
export function validateToken(token: string): boolean {
  if (!accessToken) return false
  try {
    const a = Buffer.from(token, 'utf8')
    const b = Buffer.from(accessToken, 'utf8')
    if (a.length !== b.length) return false
    return timingSafeEqual(a, b)
  } catch {
    return false
  }
}

/**
 * Express authentication middleware
 * Note: This middleware is applied to /api routes only
 */
export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const publicPaths = ['/api/remote/login', '/api/remote/status']
  const staticExtensions = ['.js', '.css', '.svg', '.png', '.jpg', '.ico', '.woff', '.woff2', '.map']
  const isPublicApi = publicPaths.includes(req.path)
  const isStaticAsset = req.path.startsWith('/assets') || staticExtensions.some(ext => req.path.endsWith(ext))
  const isRoot = req.path === '/' || req.path === '/index.html' || req.path === '/favicon.ico'
  const isViteDev = req.path.startsWith('/@vite') || req.path.startsWith('/@fs') || req.path.startsWith('/node_modules')

  if (isPublicApi || isStaticAsset || isRoot || isViteDev) {
    return next()
  }

  // Check authorization header or query token (for downloads)
  const authHeader = req.headers.authorization
  const queryToken = req.query.token as string | undefined
  console.log(`[Auth] ${req.method} ${req.path} - authHeader: ${authHeader ? 'present' : 'missing'}, queryToken: ${queryToken ? 'present' : 'missing'}`)

  // Try header first, then query parameter (for file downloads)
  let token: string | null = null
  if (authHeader) {
    // Support "Bearer <token>" format
    token = authHeader.startsWith('Bearer ')
      ? authHeader.substring(7)
      : authHeader
  } else if (queryToken) {
    token = queryToken
  }

  if (!token) {
    res.status(401).json({ success: false, error: 'No authorization token' })
    return
  }

  const isValid = validateToken(token)
  // Don't log the expected token for security
  console.log(`[Auth] Token validation: ${isValid ? 'valid' : 'invalid'}`)

  if (!isValid) {
    res.status(401).json({ success: false, error: 'Invalid token' })
    return
  }

  next()
}

/**
 * WebSocket authentication (called from upgrade handler)
 */
export function authenticateWebSocket(token: string): boolean {
  return validateToken(token)
}
