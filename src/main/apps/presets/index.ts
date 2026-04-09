/**
 * Pre-installed Apps
 *
 * This module defines apps that are automatically installed when Cafe-AI starts.
 * These apps come bundled with Cafe-AI and are available out-of-the-box.
 */

import type { AppSpec } from '../spec'
import type { AppManagerService } from '../manager'

/**
 * Pre-installed app definition.
 * Can be either a spec object or a path to a YAML file.
 */
interface PreinstalledApp {
  /** Unique identifier for this app */
  id: string

  /** App spec (inline) or path to YAML file */
  spec: AppSpec | string

  /** Default user configuration */
  defaultConfig?: Record<string, unknown>

  /** Whether to install globally (true) or per-space (false) */
  global?: boolean

  /** Minimum Cafe-AI version required */
  minVersion?: string
}

/**
 * List of pre-installed apps.
 *
 * These apps are automatically installed on first run or when the app starts.
 * They are always available to users without manual installation.
 */
export const PREINSTALLED_APPS: PreinstalledApp[] = [
  {
    id: 'mineru',
    spec: {
      spec_version: '1',
      type: 'mcp',
      name: 'MinerU',
      version: '1.0.0',
      author: 'Cafe-AI Team',
      description: 'PDF/DOCX/Image document parsing with Markdown output. Parse complex documents including formulas (LaTeX) and tables (HTML).',
      icon: 'document-text',
      mcp_server: {
        transport: 'stdio',
        // Command will be resolved at runtime based on environment
        command: 'mineru-mcp',
        args: [],
        env: {
          MINERU_API_URL: 'http://localhost:18000'
        }
      },
      config_schema: [
        {
          key: 'mode',
          label: 'Service Mode',
          type: 'select',
          description: 'Choose between local or remote MinerU service',
          required: true,
          default: 'local',
          options: [
            { label: 'Local (Run on this computer)', value: 'local' },
            { label: 'Remote (Use remote API)', value: 'remote' }
          ]
        },
        {
          key: 'remote_url',
          label: 'Remote API URL',
          type: 'url',
          description: 'MinerU remote API endpoint (only for remote mode)',
          required: false,
          placeholder: 'https://api.mineru.net'
        },
        {
          key: 'port',
          label: 'Local Service Port',
          type: 'number',
          description: 'Port for local MinerU service (default: 18000)',
          required: false,
          default: 18000,
          placeholder: '18000'
        },
        {
          key: 'backend',
          label: 'Parsing Backend',
          type: 'select',
          description: 'Backend for document parsing',
          required: true,
          default: 'hybrid-auto-engine',
          options: [
            { label: 'Hybrid Auto Engine (Recommended)', value: 'hybrid-auto-engine' },
            { label: 'Pipeline (General Purpose)', value: 'pipeline' },
            { label: 'VLM Auto Engine (Chinese/English)', value: 'vlm-auto-engine' }
          ]
        },
        {
          key: 'default_lang',
          label: 'Default Language',
          type: 'select',
          description: 'Default language for document parsing',
          required: true,
          default: 'ch',
          options: [
            { label: 'Chinese/English', value: 'ch' },
            { label: 'English', value: 'en' },
            { label: 'Korean', value: 'korean' },
            { label: 'Japanese', value: 'japan' }
          ]
        },
        {
          key: 'formula_enable',
          label: 'Enable Formula Parsing',
          type: 'boolean',
          description: 'Parse mathematical formulas to LaTeX format',
          required: false,
          default: true
        },
        {
          key: 'table_enable',
          label: 'Enable Table Parsing',
          type: 'boolean',
          description: 'Parse tables to HTML format',
          required: false,
          default: true
        },
        {
          key: 'auto_start',
          label: 'Auto-start Service',
          type: 'boolean',
          description: 'Automatically start local MinerU service when needed',
          required: false,
          default: true
        }
      ],
      store: {
        category: 'document-processing',
        tags: ['pdf', 'document-parsing', 'ocr', 'markdown', 'formula', 'table'],
        featured: true,
        homepage: 'https://github.com/opendatalab/MinerU',
        repository: 'https://github.com/opendatalab/MinerU',
        license: 'MIT'
      },
      i18n: {
        'zh-CN': {
          name: 'MinerU 文档解析',
          description: 'PDF/DOCX/图片文档解析，输出 Markdown 格式。支持公式（LaTeX）和表格（HTML）识别。',
          config_schema: {
            mode: {
              label: '服务模式',
              description: '选择本地或远程 MinerU 服务',
              options: {
                local: '本地（在本机运行）',
                remote: '远程（使用远程 API）'
              }
            },
            remote_url: {
              label: '远程 API 地址',
              description: 'MinerU 远程 API 端点（仅远程模式）'
            },
            port: {
              label: '本地服务端口',
              description: '本地 MinerU 服务端口（默认：18000）'
            },
            backend: {
              label: '解析后端',
              description: '文档解析后端',
              options: {
                'hybrid-auto-engine': '混合自动引擎（推荐）',
                'pipeline': '管道模式（通用）',
                'vlm-auto-engine': 'VLM 自动引擎（中英文）'
              }
            },
            default_lang: {
              label: '默认语言',
              description: '文档解析的默认语言',
              options: {
                'ch': '中文/英文',
                'en': '英文',
                'korean': '韩文',
                'japan': '日文'
              }
            },
            formula_enable: {
              label: '启用公式解析',
              description: '将数学公式解析为 LaTeX 格式'
            },
            table_enable: {
              label: '启用表格解析',
              description: '将表格解析为 HTML 格式'
            },
            auto_start: {
              label: '自动启动服务',
              description: '需要时自动启动本地 MinerU 服务'
            }
          }
        }
      }
    },
    defaultConfig: {
      mode: 'local',
      port: 18000,
      backend: 'hybrid-auto-engine',
      default_lang: 'ch',
      formula_enable: true,
      table_enable: true,
      auto_start: true
    },
    global: true
  }
]

/**
 * Install pre-installed apps.
 *
 * This function is called during app initialization to ensure
 * all bundled apps are available to users.
 *
 * @param appManager - App Manager service instance
 */
export async function installPreinstalledApps(appManager: AppManagerService): Promise<void> {
  console.log('[PreinstalledApps] Installing pre-installed apps...')

  for (const app of PREINSTALLED_APPS) {
    try {
      // Check if already installed
      const existing = appManager.getBySpecAndSpace(app.id, null)
      if (existing) {
        console.log(`[PreinstalledApps] ${app.id} already installed, skipping`)
        continue
      }

      // Install the app
      const spec = typeof app.spec === 'string' ? await loadSpecFromYaml(app.spec) : app.spec
      const appId = await appManager.install(null, spec, app.defaultConfig)

      console.log(`[PreinstalledApps] Installed ${app.id} (${appId})`)
    } catch (error) {
      console.error(`[PreinstalledApps] Failed to install ${app.id}:`, error)
    }
  }

  console.log('[PreinstalledApps] Pre-installed apps installation complete')
}

/**
 * Load app spec from YAML file.
 *
 * @param yamlPath - Path to YAML file
 * @returns Parsed AppSpec
 */
async function loadSpecFromYaml(yamlPath: string): Promise<AppSpec> {
  const { parse: parseYaml } = await import('yaml')
  const { readFileSync } = await import('fs')

  const content = readFileSync(yamlPath, 'utf-8')
  return parseYaml(content) as AppSpec
}
