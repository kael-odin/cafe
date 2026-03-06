/**
 * Web Search MCP - Abstract Search Engine Base Class
 *
 * Provides the common interface and utilities for all search engines.
 * Each concrete engine (Bing, Baidu) extends this class and provides
 * engine-specific configuration.
 */

import type { EngineSelectors, SearchResult, SearchOptions, RawExtractionResult } from '../types'
import { buildExtractionScript, buildSearchUrl } from '../config/selectors'

// ============================================
// Abstract Base Class
// ============================================

/**
 * Abstract base class for search engines
 *
 * Subclasses must provide:
 * - name: Engine identifier
 * - displayName: Human-readable name
 * - searchUrlTemplate: URL template with {{QUERY}} placeholder
 * - selectors: Primary DOM selectors
 * - waitForSelector: Selector to wait for before extraction
 *
 * Subclasses may override:
 * - fallbackSelectors: Backup selectors
 * - extraWaitMs: Additional wait time
 * - postProcess: Custom result processing
 * - detectLanguage: Language detection for query
 */
export abstract class SearchEngine {
  /** Engine identifier (e.g., 'bing', 'baidu') */
  abstract readonly name: string

  /** Human-readable display name */
  abstract readonly displayName: string

  /** URL template with {{QUERY}} placeholder */
  abstract readonly searchUrlTemplate: string

  /** Primary DOM selectors for result extraction */
  abstract readonly selectors: EngineSelectors

  /** Selector to wait for before extracting results */
  abstract readonly waitForSelector: string

  /** Fallback selectors (optional) */
  readonly fallbackSelectors?: EngineSelectors

  /** Additional wait time after selector appears (ms) */
  readonly extraWaitMs: number = 300

  // ============================================
  // URL Building
  // ============================================

  /**
   * Build the search URL for a given query
   *
   * @param query - Search query
   * @param options - Search options
   * @returns Complete search URL
   */
  buildSearchUrl(query: string, options: SearchOptions = {}): string {
    return buildSearchUrl(this.searchUrlTemplate, query)
  }

  // ============================================
  // Extraction Scripts
  // ============================================

  /**
   * Build the primary extraction script
   *
   * @param maxResults - Maximum results to extract
   * @returns JavaScript code to execute in page
   */
  buildExtractionScript(maxResults: number): string {
    return buildExtractionScript(this.selectors, maxResults)
  }

  /**
   * Build the fallback extraction script
   *
   * @param maxResults - Maximum results to extract
   * @returns JavaScript code or null if no fallback
   */
  buildFallbackExtractionScript(maxResults: number): string | null {
    if (!this.fallbackSelectors) return null
    return buildExtractionScript(this.fallbackSelectors, maxResults)
  }

  // ============================================
  // Result Processing
  // ============================================

  /**
   * Post-process extracted results
   *
   * Default implementation:
   * - Filters out invalid results (no title/URL)
   * - Filters out javascript: and data: URLs
   * - Deduplicates by URL
   * - Adds position numbers
   *
   * Subclasses can override for engine-specific processing
   *
   * @param rawResults - Raw extraction results
   * @returns Processed search results
   */
  postProcess(rawResults: RawExtractionResult[]): SearchResult[] {
    const seen = new Set<string>()
    const results: SearchResult[] = []

    for (const raw of rawResults) {
      // Skip invalid results
      if (!raw.title || !raw.url) continue

      // Skip non-http URLs
      if (!raw.url.startsWith('http://') && !raw.url.startsWith('https://')) continue

      // Skip duplicates
      const normalizedUrl = this.normalizeUrl(raw.url)
      if (seen.has(normalizedUrl)) continue
      seen.add(normalizedUrl)

      results.push({
        title: this.cleanText(raw.title),
        url: raw.url,
        snippet: this.cleanText(raw.snippet || ''),
        position: results.length + 1,
      })
    }

    return results
  }

  // ============================================
  // Utility Methods
  // ============================================

  /**
   * Normalize URL for deduplication
   *
   * @param url - URL to normalize
   * @returns Normalized URL
   */
  protected normalizeUrl(url: string): string {
    try {
      const parsed = new URL(url)
      // Remove trailing slash, lowercase host
      return `${parsed.protocol}//${parsed.host.toLowerCase()}${parsed.pathname.replace(/\/$/, '')}${parsed.search}`
    } catch {
      return url.toLowerCase()
    }
  }

  /**
   * Clean extracted text
   *
   * @param text - Text to clean
   * @returns Cleaned text
   */
  protected cleanText(text: string): string {
    return text
      // Normalize whitespace
      .replace(/\s+/g, ' ')
      // Remove common artifacts
      .replace(/^[\s\-–—·•]+|[\s\-–—·•]+$/g, '')
      .trim()
  }

  /**
   * Detect if query is primarily Chinese
   *
   * @param query - Search query
   * @returns true if query contains Chinese characters
   */
  detectChinese(query: string): boolean {
    // Match CJK Unified Ideographs
    const chineseRegex = /[\u4e00-\u9fff\u3400-\u4dbf]/
    return chineseRegex.test(query)
  }

  /**
   * Get engine priority score for a query
   *
   * Higher score = better match for this engine
   * Used by auto-selection logic
   *
   * @param query - Search query
   * @returns Priority score (0-100)
   */
  getPriorityScore(query: string): number {
    // Default: neutral priority
    return 50
  }
}
