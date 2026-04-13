#!/usr/bin/env node

/**
 * Post-install script
 *
 * Runs after `npm install` to set up the development environment:
 * 1. patch-package  — apply SDK patches
 * 2. SDK cli dedup  — copy agent-sdk/cli.js → claude-code/cli.js (save ~13MB)
 *    Note: On Windows, we copy instead of symlink due to permission issues
 * 3. electron-builder install-app-deps
 * 4. electron-rebuild for better-sqlite3
 */

import { execSync } from 'child_process'
import { unlinkSync, symlinkSync, lstatSync, copyFileSync, existsSync } from 'fs'
import { platform } from 'os'

const run = (cmd) => execSync(cmd, { stdio: 'inherit' })

// 1. Apply patches to @anthropic-ai/claude-agent-sdk
run('npx patch-package')

// 2. Deduplicate CLI binary: agent-sdk ships its own cli.js (~13MB) identical
//    to claude-code/cli.js. Replace with a symlink/copy to save disk & ensure we
//    always run the claude-code version (which is the canonical CLI package).
const sdkCli = 'node_modules/@anthropic-ai/claude-agent-sdk/cli.js'
const target = '../claude-code/cli.js' // relative from agent-sdk dir
try {
  const stat = lstatSync(sdkCli)
  if (stat.isSymbolicLink() || stat.isFile()) unlinkSync(sdkCli)
} catch { /* file doesn't exist yet, that's fine */ }

// On Windows, use copy instead of symlink due to permission issues
if (platform() === 'win32') {
  const claudeCodeCli = 'node_modules/@anthropic-ai/claude-code/cli.js'
  if (existsSync(claudeCodeCli)) {
    copyFileSync(claudeCodeCli, sdkCli)
    console.log(`  ✔ ${sdkCli} ← copied from claude-code/cli.js`)
  }
} else {
  symlinkSync(target, sdkCli)
  console.log(`  ✔ ${sdkCli} → ${target}`)
}

// 3. Rebuild native modules for Electron
run('npx electron-builder install-app-deps')
run('npx electron-rebuild -f -w better-sqlite3')
