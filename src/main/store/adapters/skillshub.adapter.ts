/**
 * SkillsHub Adapter (Proxy Mode)
 *
 * SkillsHub (https://skillhub.tencent.com) 是腾讯提供的技能市场。
 * 
 * API 端点:
 * - 列表: GET https://api.skillhub.tencent.com/api/skills
 * - 参数: page, pageSize, sortBy, order
 * - 搜索: 通过 keyword 参数实现
 * 
 * 响应格式:
 * {
 *   code: 0,
 *   data: {
 *     list: [...],
 *     total: number,
 *     page: number,
 *     pageSize: number
 *   },
 *   message: 'success'
 * }
 */

import type { RegistrySource, RegistryEntry, StoreQueryParams } from '../../../shared/store/store-types'
import type { AppSpec, SkillSpec } from '../../apps/spec/schema'
import type { RegistryAdapter, AdapterQueryResult } from './types'

// SkillsHub API 响应类型
interface SkillsHubSkill {
  name: string
  slug: string
  description: string
  description_zh?: string
  ownerName: string
  version: string
  tags?: string[] | null
  category: string
  homepage?: string
  downloads: number
  installs?: number
  score: number
  stars?: number
  source?: string
  created_at: number
  updated_at: number
}

interface SkillsHubResponse {
  code: number
  data: {
    list?: SkillsHubSkill[]
    skills?: SkillsHubSkill[]
    items?: SkillsHubSkill[]
    total: number
    page?: number
    pageSize?: number
  }
  message: string
}

export class SkillsHubAdapter implements RegistryAdapter {
  readonly strategy = 'proxy' as const
  private readonly API_BASE = 'https://api.skillhub.tencent.com/api'

  async query(source: RegistrySource, params: StoreQueryParams): Promise<AdapterQueryResult> {
    const { search, page = 1, pageSize = 30 } = params

    // 构建 URL
    const url = new URL(`${this.API_BASE}/skills`)
    url.searchParams.set('page', String(page))
    url.searchParams.set('pageSize', String(pageSize))
    url.searchParams.set('sortBy', 'score')
    url.searchParams.set('order', 'desc')

    // 如果有搜索关键词，添加到 URL
    if (search) {
      url.searchParams.set('keyword', search)
    }

    console.log(`[SkillsHub] Fetching: ${url.toString()}`)

    try {
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`SkillsHub API error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json() as SkillsHubResponse

      if (data.code !== 0) {
        throw new Error(`SkillsHub API error: ${data.message}`)
      }

      // 检查实际的列表字段名（可能是 list、skills 或 items）
      const skillList = data.data.list || data.data.skills || data.data.items || []
      
      // 转换为 RegistryEntry 格式
      const items: RegistryEntry[] = skillList.map(skill => this.skillToEntry(skill))

      console.log(`[SkillsHub] Fetched ${items.length} skills, total: ${data.data.total}`)

      return {
        items,
        total: data.data.total,
        hasMore: page * pageSize < data.data.total,
      }
    } catch (error) {
      console.error('[SkillsHub] Query failed:', error)
      throw error
    }
  }

  async fetchSpec(source: RegistrySource, entry: RegistryEntry): Promise<AppSpec> {
    // SkillsHub 的技能详情可能需要额外的 API 调用
    // 目前使用基本信息构建 spec
    const spec: SkillSpec = {
      spec_version: '1',
      name: entry.name,
      type: 'skill',
      version: entry.version,
      author: entry.author,
      description: entry.description,
      system_prompt: `# ${entry.name}\n\n${entry.description}\n\n## Installation\n\n\`\`\`bash\nskillhub install ${entry.slug}\n\`\`\``,
      skill_content: `# ${entry.name}\n\n${entry.description}\n\n## Installation\n\n\`\`\`bash\nskillhub install ${entry.slug}\n\`\`\``,
      store: {
        slug: entry.slug,
        registry_id: source.id,
        tags: entry.tags || [],
      },
    }
    return spec
  }

  /**
   * 将 SkillsHub 技能转换为 RegistryEntry 格式
   */
  private skillToEntry(skill: SkillsHubSkill): RegistryEntry {
    // 优先使用中文描述，如果不存在则使用英文描述
    const description = skill.description_zh || skill.description || ''
    
    return {
      slug: skill.slug,
      name: skill.name,
      version: skill.version || '1.0.0',
      author: skill.ownerName || 'Unknown',
      description,
      type: 'skill',
      format: 'bundle',
      path: '', // SkillsHub 使用 slug 而非路径
      category: skill.category || 'other',
      tags: skill.tags || [],
      icon: skill.homepage,
      created_at: new Date(skill.created_at).toISOString(),
      updated_at: new Date(skill.updated_at).toISOString(),
      meta: {
        downloads: skill.downloads,
        installs: skill.installs,
        score: skill.score,
        stars: skill.stars,
        source: skill.source,
        description_zh: skill.description_zh,
        description_en: skill.description,
      },
    }
  }
}
