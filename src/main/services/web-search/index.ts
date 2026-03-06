/**
 * Web Search MCP - Module Entry Point
 *
 * Programmatic web search service that replaces Claude's built-in WebSearch.
 * Works in all regions and with all models.
 *
 * Features:
 * - Bing and Baidu search engines
 * - Auto-selection based on query language
 * - Zero AI token consumption
 * - ~1-3 second response time
 *
 * Usage:
 * ```typescript
 * import { createWebSearchMcpServer } from '../web-search'
 *
 * // In session setup:
 * mcpServers['web-search'] = createWebSearchMcpServer()
 * ```
 */

// ============================================
// MCP Server
// ============================================

export { createWebSearchMcpServer, getWebSearchToolName } from './mcp-server'

// ============================================
// Search Context
// ============================================

export {
  WebSearchContext,
  getSearchContext,
  disposeSearchContext,
} from './search-context'

// ============================================
// Types
// ============================================

export type {
  SearchResult,
  SearchResponse,
  SearchOptions,
  EngineSelectors,
  EngineConfig,
} from './types'

// ============================================
// Engines (for advanced usage)
// ============================================

export {
  getEngine,
  getAllEngines,
  getEngineNames,
  selectBestEngine,
  type EngineName,
} from './engines'

