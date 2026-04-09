/**
 * MinerU Integration Test
 *
 * This script tests the complete MinerU integration in Cafe-AI.
 * Run with: npx ts-node tests/integration/test-mineru-integration.ts
 */

import { execSync } from 'child_process'
import { existsSync, readFileSync, writeFileSync } from 'fs'
import { join } from 'path'

const PROJECT_ROOT = join(__dirname, '..', '..')
const MINERU_MCP_DIR = join(PROJECT_ROOT, 'cafe-local', 'mineru-mcp')
const DIST_DIR = join(PROJECT_ROOT, 'cafe-local', 'dist')
const PRESETS_DIR = join(PROJECT_ROOT, 'src', 'main', 'apps', 'presets')

interface TestResult {
  name: string
  passed: boolean
  message: string
}

const results: TestResult[] = []

function test(name: string, fn: () => boolean): void {
  try {
    const passed = fn()
    results.push({ name, passed, message: passed ? '✓' : '✗' })
    console.log(`${passed ? '✓' : '✗'} ${name}`)
  } catch (error) {
    results.push({ name, passed: false, message: String(error) })
    console.log(`✗ ${name}: ${error}`)
  }
}

console.log('='.repeat(60))
console.log('MinerU Integration Test')
console.log('='.repeat(60))
console.log()

// Test 1: Check MinerU MCP Server files exist
test('MinerU MCP Server directory exists', () => {
  return existsSync(MINERU_MCP_DIR)
})

test('MinerU MCP Server pyproject.toml exists', () => {
  return existsSync(join(MINERU_MCP_DIR, 'pyproject.toml'))
})

test('MinerU MCP Server source files exist', () => {
  const files = ['server.py', 'tools.py', 'client.py']
  return files.every(f => existsSync(join(MINERU_MCP_DIR, 'src', 'mineru_mcp', f)))
})

test('MinerU MCP Server README exists', () => {
  return existsSync(join(MINERU_MCP_DIR, 'README.md'))
})

// Test 2: Check Service Manager files exist
test('MinerU Service Manager directory exists', () => {
  return existsSync(join(PROJECT_ROOT, 'src', 'main', 'services', 'mineru'))
})

test('MinerU Service Manager files exist', () => {
  const files = ['index.ts', 'types.ts', 'process-manager.ts']
  return files.every(f => existsSync(join(PROJECT_ROOT, 'src', 'main', 'services', 'mineru', f)))
})

// Test 3: Check App Preset
test('App preset directory exists', () => {
  return existsSync(PRESETS_DIR)
})

test('MinerU app preset exists', () => {
  return existsSync(join(PROJECT_ROOT, 'src', 'main', 'apps', 'spec', 'presets', 'mineru.yaml'))
})

test('Preinstalled apps module exists', () => {
  return existsSync(join(PRESETS_DIR, 'index.ts'))
})

test('MCP resolver module exists', () => {
  return existsSync(join(PRESETS_DIR, 'resolve-mcp.ts'))
})

// Test 4: Check build scripts
test('Build script exists', () => {
  return existsSync(join(PROJECT_ROOT, 'scripts', 'build-mineru-mcp.cjs'))
})

test('Python wheel build script exists', () => {
  return existsSync(join(MINERU_MCP_DIR, 'build-wheel.py'))
})

// Test 5: Check documentation
test('Integration documentation exists', () => {
  return existsSync(join(PROJECT_ROOT, 'docs', 'integration-plans', 'PHASE1_MINERU_INTEGRATION.md'))
})

test('User guide exists', () => {
  return existsSync(join(PROJECT_ROOT, 'docs', 'integration-plans', 'MINERU_USER_GUIDE.md'))
})

// Test 6: Check i18n files
test('Chinese translation file exists', () => {
  return existsSync(join(PROJECT_ROOT, 'src', 'renderer', 'i18n', 'locales', 'zh-CN-mineru.json'))
})

test('English translation file exists', () => {
  return existsSync(join(PROJECT_ROOT, 'src', 'renderer', 'i18n', 'locales', 'en-mineru.json'))
})

// Test 7: Validate Python package structure
test('Python package has __init__.py', () => {
  return existsSync(join(MINERU_MCP_DIR, 'src', 'mineru_mcp', '__init__.py'))
})

test('Python test files exist', () => {
  return existsSync(join(MINERU_MCP_DIR, 'tests', 'test_client.py')) &&
         existsSync(join(MINERU_MCP_DIR, 'tests', 'test_tools.py'))
})

// Test 8: Check package.json build script updated
test('package.json has MinerU build step', () => {
  const packageJson = JSON.parse(readFileSync(join(PROJECT_ROOT, 'package.json'), 'utf-8'))
  return packageJson.scripts.build.includes('build-mineru-mcp')
})

// Test 9: Check MCP tools are defined
test('MCP tools are properly defined', () => {
  const toolsPath = join(MINERU_MCP_DIR, 'src', 'mineru_mcp', 'tools.py')
  const content = readFileSync(toolsPath, 'utf-8')
  const requiredTools = [
    'parse_document',
    'parse_documents_batch',
    'submit_async_task',
    'get_task_status',
    'get_task_result',
    'health_check'
  ]
  return requiredTools.every(tool => content.includes(tool))
})

// Test 10: Check preinstalled apps list
test('MinerU is in preinstalled apps list', () => {
  const presetPath = join(PRESETS_DIR, 'index.ts')
  const content = readFileSync(presetPath, 'utf-8')
  return content.includes('id: \'mineru\'') && content.includes('name: \'MinerU\'')
})

console.log()
console.log('='.repeat(60))
console.log('Test Summary')
console.log('='.repeat(60))

const passed = results.filter(r => r.passed).length
const total = results.length

console.log()
console.log(`Passed: ${passed}/${total}`)
console.log(`Failed: ${total - passed}/${total}`)

if (passed === total) {
  console.log()
  console.log('✅ All tests passed! MinerU integration is complete.')
  process.exit(0)
} else {
  console.log()
  console.log('❌ Some tests failed. Please check the errors above.')
  process.exit(1)
}
