/**
 * Pre-installed Apps
 *
 * This module defines apps that are automatically installed when Cafe-AI starts.
 * These apps come bundled with Cafe-AI and are available out-of-the-box.
 */

import type { AppSpec } from '../spec'
import type { AppManagerService } from '../manager'

const DEFAULT_REMOTE_MINERU_URL = 'https://mineru.net'

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
      description: 'Convert PDF and DOCX attachments to Markdown so AI can read them reliably.',
      icon: 'document-text',
      mcp_server: {
        transport: 'stdio',
        command: 'mineru-mcp',
        args: [],
        env: {
          MINERU_API_URL: DEFAULT_REMOTE_MINERU_URL
        }
      },
      config_schema: [
        {
          key: 'mode',
          label: 'Service Mode',
          type: 'select',
          description: 'Use the hosted MinerU service by default, or switch to a self-hosted endpoint.',
          required: true,
          default: 'remote',
          options: [
            { label: 'Remote (Recommended)', value: 'remote' },
            { label: 'Local / Self-hosted', value: 'local' }
          ]
        },
        {
          key: 'remote_url',
          label: 'Remote API URL',
          type: 'url',
          description: 'Remote MinerU API endpoint used for PDF/DOCX parsing.',
          required: false,
          default: DEFAULT_REMOTE_MINERU_URL,
          placeholder: DEFAULT_REMOTE_MINERU_URL
        },
        {
          key: 'port',
          label: 'Local Service Port',
          type: 'number',
          description: 'Port for a self-hosted MinerU service when local mode is selected.',
          required: false,
          default: 18000,
          placeholder: '18000'
        },
        {
          key: 'backend',
          label: 'Parsing Backend',
          type: 'select',
          description: 'Backend for PDF/DOCX to Markdown conversion.',
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
          description: 'Default language hint for document parsing.',
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
          description: 'Convert mathematical formulas to LaTeX when available.',
          required: false,
          default: true
        },
        {
          key: 'table_enable',
          label: 'Enable Table Parsing',
          type: 'boolean',
          description: 'Convert tables to HTML when available.',
          required: false,
          default: true
        },
        {
          key: 'auto_start',
          label: 'Auto-start Local Service',
          type: 'boolean',
          description: 'Only used in local mode to start a self-hosted MinerU service automatically.',
          required: false,
          default: false
        }
      ],
      store: {
        category: 'document-processing',
        tags: ['pdf', 'docx', 'document-parsing', 'markdown'],
        featured: true,
        homepage: 'https://github.com/opendatalab/MinerU',
        repository: 'https://github.com/opendatalab/MinerU',
        license: 'MIT'
      },
      i18n: {
        'zh-CN': {
          name: 'MinerU 文档解析',
          description: '将 PDF 和 DOCX 附件转换为 Markdown，供 AI 稳定阅读。',
          config_schema: {
            mode: {
              label: '服务模式',
              description: '默认使用远程 MinerU 服务，也可以切换到自托管服务。',
              options: {
                remote: '远程（推荐）',
                local: '本地 / 自托管'
              }
            },
            remote_url: {
              label: '远程 API 地址',
              description: '用于 PDF/DOCX 解析的远程 MinerU API 地址。'
            },
            port: {
              label: '本地服务端口',
              description: '在本地 / 自托管模式下使用的 MinerU 服务端口。'
            },
            backend: {
              label: '解析后端',
              description: '用于 PDF/DOCX 转 Markdown 的解析后端。',
              options: {
                'hybrid-auto-engine': '混合自动引擎（推荐）',
                pipeline: '管道模式（通用）',
                'vlm-auto-engine': 'VLM 自动引擎（中英文）'
              }
            },
            default_lang: {
              label: '默认语言',
              description: '文档解析的默认语言提示。',
              options: {
                ch: '中文/英文',
                en: '英文',
                korean: '韩文',
                japan: '日文'
              }
            },
            formula_enable: {
              label: '启用公式解析',
              description: '可用时将数学公式转换为 LaTeX。'
            },
            table_enable: {
              label: '启用表格解析',
              description: '可用时将表格转换为 HTML。'
            },
            auto_start: {
              label: '自动启动本地服务',
              description: '仅在本地模式下自动启动自托管 MinerU 服务。'
            }
          }
        }
      }
    },
    defaultConfig: {
      mode: 'remote',
      remote_url: DEFAULT_REMOTE_MINERU_URL,
      port: 18000,
      backend: 'hybrid-auto-engine',
      default_lang: 'ch',
      formula_enable: true,
      table_enable: true,
      auto_start: false
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
      const specName = typeof app.spec === 'string' ? app.id : app.spec.name
      const existing = appManager.listApps({ spaceId: null })
        .find(installed => installed.specId === specName && installed.status !== 'uninstalled')
      if (existing) {
        console.log(`[PreinstalledApps] ${app.id} already installed, skipping`)
        continue
      }

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
  const { readFile } = await import('fs/promises')
  const { join } = await import('path')

  const filePath = join(process.cwd(), yamlPath)
  const content = await readFile(filePath, 'utf-8')
  return parseYaml(content) as AppSpec
}
