/**
 * Backend Configuration Utilities
 *
 * Backend configs are XOR-obfuscated with machine hostname before base64.
 * Prevents casual observation of API keys; rely on 127.0.0.1 binding for real security.
 */

import { hostname } from 'os'
import type { BackendConfig } from '../types'

const XOR_KEY = hostname() || 'cafe-ai-default-key'

function xorTransform(data: Buffer, key: string): Buffer {
  const result = Buffer.alloc(data.length)
  for (let i = 0; i < data.length; i++) {
    result[i] = data[i] ^ key.charCodeAt(i % key.length)
  }
  return result
}

export function encodeBackendConfig(config: BackendConfig): string {
  const json = Buffer.from(JSON.stringify(config), 'utf-8')
  const xored = xorTransform(json, XOR_KEY)
  return xored.toString('base64')
}

export function decodeBackendConfig(encoded: string): BackendConfig | null {
  try {
    const xored = Buffer.from(encoded, 'base64')
    const json = xorTransform(xored, XOR_KEY)
    const parsed = JSON.parse(json.toString('utf-8')) as BackendConfig
    if (parsed?.url && parsed?.key) {
      return parsed
    }
  } catch {
  }
  return null
}

/**
 * Validate backend configuration
 */
export function isValidBackendConfig(config: unknown): config is BackendConfig {
  if (!config || typeof config !== 'object') return false
  const cfg = config as Record<string, unknown>
  return typeof cfg.url === 'string' && typeof cfg.key === 'string'
}
