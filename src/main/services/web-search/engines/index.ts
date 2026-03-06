/**
 * Web Search MCP - Engine Registry
 *
 * Central registry for all search engines.
 * Provides engine lookup, auto-selection, and fallback ordering.
 */

import type { SearchEngine } from './base'
import { bingEngine } from './bing'
import { baiduEngine } from './baidu'

// ============================================
// Types
// ============================================

export type EngineName = 'bing' | 'baidu'

// ============================================
// Engine Registry
// ============================================

/**
 * All available search engines
 */
const engines: Record<EngineName, SearchEngine> = {
  bing: bingEngine,
  baidu: baiduEngine,
}

/**
 * Default fallback order when auto-selecting
 * Bing first (better international coverage), Baidu second
 */
const DEFAULT_FALLBACK_ORDER: EngineName[] = ['bing', 'baidu']

// ============================================
// Public API
// ============================================

/**
 * Get a search engine by name
 *
 * @param name - Engine name
 * @returns Search engine instance
 * @throws Error if engine not found
 */
export function getEngine(name: EngineName): SearchEngine {
  const engine = engines[name]
  if (!engine) {
    throw new Error(`Unknown search engine: ${name}`)
  }
  return engine
}

/**
 * Get all available engines
 *
 * @returns Array of all engine instances
 */
export function getAllEngines(): SearchEngine[] {
  return Object.values(engines)
}

/**
 * Get all engine names
 *
 * @returns Array of engine names
 */
export function getEngineNames(): EngineName[] {
  return Object.keys(engines) as EngineName[]
}

/**
 * Select the best engine for a query
 *
 * Uses priority scoring from each engine to determine
 * the best match. Higher score = better match.
 *
 * @param query - Search query
 * @returns Best matching engine
 */
export function selectBestEngine(query: string): SearchEngine {
  let bestEngine: SearchEngine = bingEngine
  let bestScore = -1

  for (const engine of Object.values(engines)) {
    const score = engine.getPriorityScore(query)
    if (score > bestScore) {
      bestScore = score
      bestEngine = engine
    }
  }

  return bestEngine
}

/**
 * Get engines in fallback order for a query
 *
 * Returns engines sorted by priority score (highest first).
 * Used when the primary engine fails and we need to try alternatives.
 *
 * @param query - Search query
 * @returns Engines sorted by priority
 */
export function getEnginesInFallbackOrder(query: string): SearchEngine[] {
  const enginesWithScores = Object.values(engines).map(engine => ({
    engine,
    score: engine.getPriorityScore(query),
  }))

  // Sort by score descending
  enginesWithScores.sort((a, b) => b.score - a.score)

  return enginesWithScores.map(e => e.engine)
}

/**
 * Resolve engine selection
 *
 * @param engineOption - User's engine preference ('auto', 'bing', 'baidu')
 * @param query - Search query (used for auto-selection)
 * @returns Array of engines to try in order
 */
export function resolveEngines(
  engineOption: 'auto' | EngineName | undefined,
  query: string
): SearchEngine[] {
  if (!engineOption || engineOption === 'auto') {
    // Auto mode: return all engines sorted by priority
    return getEnginesInFallbackOrder(query)
  }

  // Specific engine requested: return just that one
  // (no fallback - if user explicitly chose an engine, respect that)
  return [getEngine(engineOption)]
}

// ============================================
// Re-exports
// ============================================

export { SearchEngine } from './base'
export { bingEngine } from './bing'
export { baiduEngine } from './baidu'
