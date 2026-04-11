/**
 * MinerU Integration Test
 *
 * This script tests the complete MinerU integration in Cafe-AI.
 * Run with: node tests/integration/test-mineru-integration.ts
 */

import { existsSync, readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const PROJECT_ROOT = join(__dirname, '..', '..')
const MINERU_MCP_DIR = join(PROJECT_ROOT, 'cafe-local', 'mineru-mcp')
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

test('MinerU Service Manager directory exists', () => {
  return existsSync(join(PROJECT_ROOT, 'src', 'main', 'services', 'mineru'))
})

test('MinerU Service Manager files exist', () => {
  const files = ['index.ts', 'types.ts', 'process-manager.ts']
  return files.every(f => existsSync(join(PROJECT_ROOT, 'src', 'main', 'services', 'mineru', f)))
})

test('MinerU app preset exists', () => {
  return existsSync(join(PROJECT_ROOT, 'src', 'main', 'apps', 'spec', 'presets', 'mineru.yaml'))
})

test('Preinstalled apps module exists', () => {
  return existsSync(join(PRESETS_DIR, 'index.ts'))
})

test('Build script exists', () => {
  return existsSync(join(PROJECT_ROOT, 'scripts', 'build-mineru-mcp.cjs'))
})

test('User guide exists', () => {
  return existsSync(join(PROJECT_ROOT, 'docs', 'integration-plans', 'MINERU_USER_GUIDE.md'))
})

test('Chinese translation file exists', () => {
  return existsSync(join(PROJECT_ROOT, 'src', 'renderer', 'i18n', 'locales', 'zh-CN-mineru.json'))
})

test('English translation file exists', () => {
  return existsSync(join(PROJECT_ROOT, 'src', 'renderer', 'i18n', 'locales', 'en-mineru.json'))
})

test('package.json has MinerU build step', () => {
  const packageJson = JSON.parse(readFileSync(join(PROJECT_ROOT, 'package.json'), 'utf-8'))
  return packageJson.scripts.build.includes('build-mineru-mcp')
})

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

test('MinerU defaults to remote mode', () => {
  const presetPath = join(PRESETS_DIR, 'index.ts')
  const content = readFileSync(presetPath, 'utf-8')
  return content.includes("id: 'mineru'")
    && content.includes("name: 'MinerU'")
    && content.includes("mode: 'remote'")
    && content.includes("remote_url: DEFAULT_REMOTE_MINERU_URL")
})

test('Legacy 11-project master plan is removed', () => {
  return !existsSync(join(PROJECT_ROOT, 'docs', 'integration-plans', 'MASTER_PLAN.md'))
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
  console.log('✅ All tests passed! MinerU integration is aligned with the remote-first plan.')
  process.exit(0)
} else {
  console.log()
  console.log('❌ Some tests failed. Please check the errors above.')
  process.exit(1)
}
