/**
 * Protocol Service - Custom protocol registration for secure local resource access
 *
 * Provides Cafe-file:// protocol to bypass cross-origin restrictions when loading
 * local files from localhost (dev mode) or app:// (production mode).
 *
 * Usage:
 * - Images: <img src="Cafe-file:///path/to/image.png">
 * - PDF: BrowserView.loadURL("Cafe-file:///path/to/doc.pdf")
 * - Other media: Same pattern for video, audio, etc.
 *
 * Security: Only file:// URLs are allowed, no remote URLs pass through.
 */

import { protocol } from 'electron'
import { readFileSync, existsSync, statSync } from 'fs'
import { extname } from 'path'

/**
 * Get MIME type from file extension
 */
function getMimeType(filePath: string): string {
  const ext = extname(filePath).toLowerCase().replace('.', '')
  const mimeTypes: Record<string, string> = {
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    gif: 'image/gif',
    webp: 'image/webp',
    svg: 'image/svg+xml',
    ico: 'image/x-icon',
    bmp: 'image/bmp',
    pdf: 'application/pdf',
  }
  return mimeTypes[ext] || 'application/octet-stream'
}

/**
 * Register custom protocols for secure local resource access
 * Must be called after app.whenReady()
 */
export function registerProtocols(): void {
  const handler = (request: Request) => {
    let filePath = ''
    try {
      // Use URL parsing to robustly handle:
      // - cafe-file:///C:/path (preferred)
      // - Cafe-file:///C:/path (legacy casing)
      // - cafe-file://C:/path (legacy / malformed but seen in the wild)
      // - Encoded characters/spaces
      const u = new URL(request.url)
      const hostname = u.hostname || ''
      const pathname = decodeURIComponent(u.pathname || '')

      if (process.platform === 'win32') {
        // Case 1: Cafe-file:///C:/Users/... → pathname="/C:/Users/..."
        if (pathname.startsWith('/') && /^[a-zA-Z]:\//.test(pathname.slice(1))) {
          filePath = pathname.slice(1)
        // Case 2: Cafe-file://C:/Users/... → hostname="c", pathname="/Users/..."
        } else if (hostname && /^[a-zA-Z]$/.test(hostname) && pathname.startsWith('/')) {
          filePath = `${hostname.toUpperCase()}:${pathname}`
        } else {
          filePath = pathname.startsWith('/') ? pathname.slice(1) : pathname
        }
      } else {
        filePath = pathname
      }
    } catch {
      // Fallback: legacy behavior
      filePath = decodeURIComponent(request.url.replace(/^cafe-file:\/\//i, ''))
      if (process.platform === 'win32' && filePath.startsWith('/') && /^[a-zA-Z]:\//.test(filePath.slice(1))) {
        filePath = filePath.slice(1)
      }
    }
    
    if (!existsSync(filePath)) {
      console.warn('[Protocol] File not found:', filePath, 'url=', request.url)
      return new Response('Not Found', { status: 404 })
    }
    
    try {
      const stats = statSync(filePath)
      if (stats.isDirectory()) {
        return new Response('Not Found', { status: 404 })
      }
      
      const buffer = readFileSync(filePath)
      const mimeType = getMimeType(filePath)
      
      return new Response(buffer, {
        status: 200,
        headers: {
          'Content-Type': mimeType,
          'Content-Length': stats.size.toString(),
        },
      })
    } catch (error) {
      console.error('[Protocol] Failed to read file:', filePath, error)
      return new Response('Internal Server Error', { status: 500 })
    }
  }

  // Always register lowercase scheme (Chromium normalizes schemes to lowercase).
  protocol.handle('cafe-file', handler as any)
  // Backwards compatibility for any existing URLs using legacy casing.
  protocol.handle('Cafe-file', handler as any)

  console.log('[Protocol] Registered cafe-file:// protocol')
}
