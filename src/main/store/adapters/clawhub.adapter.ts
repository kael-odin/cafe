/**
 * ClawHub Adapter (Proxy Mode)
 *
 * Fetches from https://clawhub.ai (OpenClaw official skills registry)
 * API: GET /api/v1/search?q=...&limit=50
 *      GET /api/v1/skills?limit=...&sort=newest
 *      GET /api/v1/skills/<slug>
 *      GET /api/v1/download/<slug>
 *
 * Features:
 * - 48,000+ skills from OpenClaw community
 * - Official OpenClaw skills marketplace
 * - Vector-based semantic search
 * - SKILL.md format compatible
 * - Versioned like npm, rollback-ready
 *
 * Proxy strategy: queries are forwarded on demand.
 */

import { fetchWithTimeout } from './cafe.adapter'
import { sanitizeSlug } from './mcp-registry.adapter'
import type { RegistrySource, RegistryEntry, StoreQueryParams } from '../../../shared/store/store-types'
import type { AppSpec, SkillSpec } from '../../apps/spec/schema'
import type { RegistryAdapter, AdapterQueryResult } from './types'

// ── External API types ─────────────────────────────────────────────────────

interface ClawHubSkill {
  id: string
  slug: string
  name: string
  summary?: string
  description?: string
  author?: string
  owner?: string
  tags?: string[]
  stars?: number
  downloads?: number
  installs?: number
  installsAllTime?: number
  version?: string
  latestVersion?: string
  updatedAt?: string
  verified?: boolean
}

interface ClawHubSearchResponse {
  results: ClawHubSkill[]
  total: number
  query: string
}

interface ClawHubSkillsResponse {
  skills: ClawHubSkill[]
  total: number
  limit: number
  offset: number
}

interface ClawHubSkillDetail {
  slug: string
  name: string
  summary?: string
  description?: string
  author?: string
  version: string
  files: Array<{
    path: string
    size: number
  }>
}

// ── Adapter ────────────────────────────────────────────────────────────────

export class ClawHubAdapter implements RegistryAdapter {
  readonly strategy = 'proxy' as const

  async query(source: RegistrySource, params: StoreQueryParams): Promise<AdapterQueryResult> {
    const baseUrl = source.url.replace(/\/+$/, '')
    const limit = params.pageSize || 50
    const t0 = performance.now()

    let url: string
    if (params.search && params.search.trim()) {
      // Use search API for queries
      url = `${baseUrl}/api/v1/search?q=${encodeURIComponent(params.search)}&limit=${limit}`
    } else {
      // Use skills list API for browsing
      url = `${baseUrl}/api/v1/skills?limit=${limit}&sort=downloads`
    }

    const response = await fetchWithTimeout(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Cafe-Store/1.0',
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()
    
    // Handle both search and list response formats
    const skills = data.results || data.skills || []
    const items = mapClawHubSkills(skills)

    const dt = performance.now() - t0
    console.log(`[ClawHubAdapter] query: ${items.length} results (${dt.toFixed(0)}ms)`)

    return {
      items,
      total: data.total || items.length,
      hasMore: items.length >= limit,
    }
  }

  async fetchSpec(source: RegistrySource, entry: RegistryEntry): Promise<AppSpec> {
    const baseUrl = source.url.replace(/\/+$/, '')
    const slug = entry.slug

    // Get skill metadata
    const metaUrl = `${baseUrl}/api/v1/skills/${slug}`
    const metaResponse = await fetchWithTimeout(metaUrl, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Cafe-Store/1.0',
      },
    })

    if (!metaResponse.ok) {
      throw new Error(`Failed to fetch skill metadata: HTTP ${metaResponse.status}`)
    }

    const skillData = await metaResponse.json() as ClawHubSkillDetail

    // Download the skill content
    const downloadUrl = `${baseUrl}/api/v1/download/${slug}`
    const downloadResponse = await fetchWithTimeout(downloadUrl, {
      headers: {
        'Accept': 'application/zip',
        'User-Agent': 'Cafe-Store/1.0',
      },
    })

    if (!downloadResponse.ok) {
      // Fallback: try to get SKILL.md directly
      const skillMdUrl = `${baseUrl}/api/v1/skills/${slug}/files/SKILL.md`
      const mdResponse = await fetchWithTimeout(skillMdUrl, {
        headers: {
          'Accept': 'text/markdown',
          'User-Agent': 'Cafe-Store/1.0',
        },
      })

      if (mdResponse.ok) {
        const skillContent = await mdResponse.text()
        return buildSpec(entry, skillContent, source.id)
      }

      throw new Error(`Failed to fetch skill content: HTTP ${downloadResponse.status}`)
    }

    // For now, return a spec with installation instructions
    const skillContent = `# ${skillData.name}\n\n${skillData.summary || skillData.description || ''}\n\n## Installation\n\n\`\`\`bash\nnpx clawhub@latest install ${slug}\n\`\`\`\n\n## Files\n\n${skillData.files?.map(f => `- ${f.path}`).join('\n') || 'No files listed'}`

    return buildSpec(entry, skillContent, source.id)
  }
}

function buildSpec(entry: RegistryEntry, content: string, registryId: string): AppSpec {
  const spec: SkillSpec = {
    spec_version: '1',
    name: entry.name,
    type: 'skill',
    version: entry.version,
    author: entry.author,
    description: entry.description,
    system_prompt: content,
    skill_content: content,
    store: {
      slug: entry.slug,
      registry_id: registryId,
      tags: entry.tags || [],
    },
  }
  return spec
}

// ── Helpers ────────────────────────────────────────────────────────────────

function mapClawHubSkills(skills: ClawHubSkill[]): RegistryEntry[] {
  const apps: RegistryEntry[] = []
  const seenSlugs = new Set<string>()

  for (const skill of skills) {
    if (!skill.name && !skill.slug) continue

    const slug = sanitizeSlug(skill.slug || skill.name || 'unknown')
    if (!slug || seenSlugs.has(slug)) continue
    seenSlugs.add(slug)

    const author = skill.author || skill.owner || 'community'

    apps.push({
      slug,
      name: skill.name || skill.slug,
      version: skill.version || skill.latestVersion || '1.0.0',
      author,
      description: skill.summary || skill.description || skill.name || 'No description',
      type: 'skill',
      format: 'bundle',
      path: slug,
      category: 'other',
      tags: skill.tags || [],
      meta: {
        stars: skill.stars,
        downloads: skill.downloads || skill.installs || skill.installsAllTime,
        verified: skill.verified,
      },
    })
  }

  return apps
}
