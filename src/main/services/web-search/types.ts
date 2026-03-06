/**
 * Web Search MCP - Type Definitions
 *
 * Core types for the programmatic web search service.
 * This module provides type-safe interfaces for search operations.
 */

// ============================================
// Search Result Types
// ============================================

/**
 * A single search result item
 */
export interface SearchResult {
  /** Result title */
  title: string
  /** Result URL */
  url: string
  /** Result snippet/description */
  snippet: string
  /** Position in search results (1-indexed) */
  position: number
}

/**
 * Complete search response
 */
export interface SearchResponse {
  /** Original search query */
  query: string
  /** Search engine used */
  engine: string
  /** Search results */
  results: SearchResult[]
  /** Total search time in milliseconds */
  searchTime: number
  /** Whether results were served from cache */
  cached?: boolean
  /** Error message if search partially failed */
  warning?: string
}

// ============================================
// Search Options
// ============================================

/**
 * Options for search execution
 */
export interface SearchOptions {
  /** Maximum number of results to return (default: 8, max: 20) */
  maxResults?: number
  /** Preferred search engine (default: 'auto') */
  engine?: 'bing' | 'baidu' | 'auto'
  /** Search language hint (default: auto-detect from query) */
  language?: string
  /** Search timeout in milliseconds (default: 15000) */
  timeout?: number
}

// ============================================
// Engine Configuration
// ============================================

/**
 * DOM selectors for a search engine
 *
 * These selectors are used to extract search results from the page.
 * When a search engine updates their DOM structure, only these
 * selectors need to be updated.
 */
export interface EngineSelectors {
  /** Container element for all search results */
  resultContainer: string
  /** Individual search result item */
  resultItem: string
  /** Title element (relative to resultItem) */
  title: string
  /** Link element (relative to resultItem) */
  link: string
  /** Snippet/description element (relative to resultItem) */
  snippet: string
  /** Elements to exclude (ads, related searches, etc.) */
  excludeSelectors?: string[]
}

/**
 * Complete engine configuration
 */
export interface EngineConfig {
  /** Engine identifier */
  name: string
  /** Human-readable display name */
  displayName: string
  /** Base search URL template */
  searchUrlTemplate: string
  /** Primary selectors */
  selectors: EngineSelectors
  /** Fallback selectors (used when primary fails) */
  fallbackSelectors?: EngineSelectors
  /** Selector to wait for before extracting results */
  waitForSelector: string
  /** Additional wait time after selector appears (ms) */
  extraWaitMs?: number
}

// ============================================
// Internal Types
// ============================================

/**
 * Raw extraction result from page JavaScript
 */
export interface RawExtractionResult {
  title: string
  url: string
  snippet: string
}

/**
 * Search execution context state
 */
export interface SearchContextState {
  /** Whether the context is initialized */
  initialized: boolean
  /** Current active view ID */
  activeViewId: string | null
  /** Timestamp of last search */
  lastSearchTime: number
}
