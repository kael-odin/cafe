// ============================================================================
// build-mineru-mcp.cjs - Build MinerU MCP Server during packaging
//
// This script:
// 1. Builds the Python wheel for mineru-mcp
// 2. Copies it to cafe-local/dist for packaging
// 3. Creates a platform-specific launcher script
// ============================================================================

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const MINERU_MCP_DIR = path.join(PROJECT_ROOT, 'cafe-local', 'mineru-mcp');
const DIST_DIR = path.join(PROJECT_ROOT, 'cafe-local', 'dist');

console.log('='.repeat(60));
console.log('Building MinerU MCP Server');
console.log('='.repeat(60));

// Ensure dist directory exists
if (!fs.existsSync(DIST_DIR)) {
  fs.mkdirSync(DIST_DIR, { recursive: true });
}

// Build Python wheel
console.log('\nBuilding Python wheel...');
try {
  execSync('python build-wheel.py', {
    cwd: MINERU_MCP_DIR,
    stdio: 'inherit'
  });
} catch (error) {
  console.error('Failed to build MinerU MCP Server');
  console.error('Make sure Python 3.10+ and pip are installed');
  console.error('Run: pip install build wheel');
  process.exit(1);
}

// Create launcher scripts for different platforms
const launchers = {
  'mineru-mcp.bat': `@echo off
REM MinerU MCP Server Launcher for Windows
REM This script starts the MinerU MCP server

SET MINERU_API_URL=http://localhost:18000
python -m mineru_mcp.server %*
`,
  'mineru-mcp': `#!/bin/bash
# MinerU MCP Server Launcher for Unix-like systems
# This script starts the MinerU MCP server

export MINERU_API_URL=http://localhost:18000
python3 -m mineru_mcp.server "$@"
`
};

// Write launcher scripts
for (const [filename, content] of Object.entries(launchers)) {
  const launcherPath = path.join(DIST_DIR, filename);
  fs.writeFileSync(launcherPath, content);
  
  // Make Unix scripts executable
  if (filename !== 'mineru-mcp.bat') {
    fs.chmodSync(launcherPath, '755');
  }
  
  console.log(`Created launcher: ${launcherPath}`);
}

console.log('\n' + '='.repeat(60));
console.log('MinerU MCP Server build complete');
console.log('='.repeat(60));
