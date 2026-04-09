/**
 * MCP Command Resolver
 *
 * Resolves the correct command path for MCP servers based on the environment.
 * In development, commands are expected to be in PATH.
 * In production, commands are in cafe-local/dist/ or bundled Python environment.
 */

import { join } from 'path'
import { app } from 'electron'
import { existsSync } from 'fs'

/**
 * Resolve the command path for an MCP server.
 *
 * @param command - Base command name (e.g., 'mineru-mcp')
 * @returns Resolved command path or the original command if not found
 */
export function resolveMcpCommand(command: string): string {
  // In development, use the command as-is (should be in PATH)
  if (!app.isPackaged) {
    return command
  }

  // In production, check cafe-local/dist first
  const resourcesPath = process.resourcesPath
  const cafeLocalDist = join(resourcesPath, 'cafe-local', 'dist')

  // Check for platform-specific launcher
  const platform = process.platform
  const launcherName = platform === 'win32' ? `${command}.bat` : command
  const launcherPath = join(cafeLocalDist, launcherName)

  if (existsSync(launcherPath)) {
    return launcherPath
  }

  // Fallback to the original command
  return command
}

/**
 * Resolve environment variables for MCP server.
 *
 * @param baseEnv - Base environment variables from spec
 * @returns Resolved environment variables
 */
export function resolveMcpEnv(baseEnv: Record<string, string> = {}): Record<string, string> {
  const resolved = { ...baseEnv }

  // Add PATH to bundled Python if in production
  if (app.isPackaged) {
    const resourcesPath = process.resourcesPath
    const pythonPath = join(resourcesPath, 'python')

    // Prepend Python to PATH
    if (process.platform === 'win32') {
      const scriptsPath = join(pythonPath, 'Scripts')
      resolved.PATH = `${scriptsPath};${process.env.PATH || ''}`
    } else {
      const binPath = join(pythonPath, 'bin')
      resolved.PATH = `${binPath}:${process.env.PATH || ''}`
    }

    // Set PYTHONPATH
    resolved.PYTHONPATH = pythonPath
  }

  return resolved
}
