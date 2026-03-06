/**
 * Web Search MCP - Centralized Selector Configuration
 *
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║  MAINTAINABILITY CORE - All DOM selectors are centralized here              ║
 * ║                                                                              ║
 * ║  When a search engine updates their DOM structure:                          ║
 * ║  1. Open the search engine in a browser                                     ║
 * ║  2. Execute a search query                                                  ║
 * ║  3. Use DevTools (F12) to inspect the new DOM structure                     ║
 * ║  4. Update the corresponding selectors below                                ║
 * ║  5. Run `npm run test:web-search` to verify                                 ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

import type { EngineSelectors } from '../types'

// ============================================
// Bing Selectors
// ============================================

/**
 * Bing Search - Primary Selectors
 *
 * Last verified: 2024-12
 * Test URL: https://www.bing.com/search?q=test
 *
 * DOM Structure:
 * #b_results
 *   └── .b_algo (each result)
 *         ├── h2 > a (title + link)
 *         └── .b_caption > p (snippet)
 */
export const BING_SELECTORS: EngineSelectors = {
  // Main results container
  resultContainer: '#b_results',

  // Individual result item (excludes ads .b_ad, news .b_ans, etc.)
  resultItem: '.b_algo',

  // Title is in h2 > a
  title: 'h2 a',

  // Link is the same element as title
  link: 'h2 a',

  // Snippet can be in various places depending on result type
  snippet: '.b_caption p, p.b_lineclamp2, p.b_lineclamp3, p.b_lineclamp4, .b_caption .b_paractl',

  // Exclude these elements from results
  excludeSelectors: [
    '.b_ad',           // Ads
    '.b_ans',          // Answer boxes
    '.b_pag',          // Pagination
    '.b_footer',       // Footer
    '.b_scopebar',     // Scope bar
    '.sb_add',         // Additional suggestions
  ],
}

/**
 * Bing Search - Fallback Selectors
 *
 * Used when primary selectors fail (e.g., after a Bing update)
 * These are more generic and may capture some noise
 */
export const BING_FALLBACK_SELECTORS: EngineSelectors = {
  resultContainer: '#b_content',
  resultItem: 'li.b_algo, .b_algo',
  title: 'h2 a, a h2, h2',
  link: 'h2 a, a[href^="http"]',
  snippet: 'p, .b_caption',
  excludeSelectors: ['.b_ad', '.b_ans'],
}

// ============================================
// Baidu Selectors
// ============================================

/**
 * Baidu Search - Primary Selectors
 *
 * Last verified: 2026-03
 * Test URL: https://www.baidu.com/s?wd=test
 *
 * DOM Structure (2026):
 * #content_left
 *   └── .result.c-container (organic results, excludes .result-op)
 *         ├── h3 > a (title + link, href is baidu redirect URL)
 *         └── div.cos-row > div.cos-col > ... (snippet text, deep nesting)
 *
 * IMPORTANT: Baidu uses dynamic class names with hash suffixes
 * (e.g., source_4H1NW, bottom-gap_5HhcN) that change between deployments.
 * Do NOT rely on these for selectors. Use stable class names only.
 *
 * Snippet extraction uses exclusion approach (see BaiduEngine.buildExtractionScript):
 * clone result → remove h3/source → remaining text = snippet.
 * This is more robust than targeting specific snippet selectors.
 */
export const BAIDU_SELECTORS: EngineSelectors = {
  // Main results container
  resultContainer: '#content_left',

  // Individual result item
  // .result.c-container = organic results (excludes .result-op like videos, "大家还在搜")
  resultItem: '.result.c-container',

  // Title is in h3 > a (Baidu uses h3, not h2)
  title: 'h3 a',

  // Link - Baidu uses redirect URLs (baidu.com/link?url=...)
  link: 'h3 a',

  // Snippet - NOT used directly by BaiduEngine (uses exclusion approach instead)
  // Kept here as documentation of known selectors for reference
  snippet: '.c-abstract, .cos-col, [class*="content-right"]',

  // Exclude these elements
  excludeSelectors: [
    '#content_right',   // Right sidebar
    '.result-op',       // Special result boxes (videos, related searches, etc.)
    '.c-recommend',     // Recommendations
    '.hint_common_restop', // Top hints
    '[data-tuiguang]',  // Ads (tuiguang = promotion)
    '.ec_tuiguang_link', // Ad links
  ],
}

/**
 * Baidu Search - Fallback Selectors
 *
 * More generic selectors for when primary fails.
 * Also uses exclusion-based snippet extraction.
 */
export const BAIDU_FALLBACK_SELECTORS: EngineSelectors = {
  resultContainer: '#content_left, #wrapper_wrapper',
  resultItem: '.c-container',
  title: 'h3 a, a[target="_blank"]',
  link: 'h3 a, a[target="_blank"]',
  snippet: '.c-abstract, .cos-col, [class*="abstract"], p',
  excludeSelectors: ['[data-tuiguang]', '.ec_tuiguang_link', '.result-op'],
}

// ============================================
// Engine Configurations
// ============================================

/**
 * Complete Bing configuration
 */
export const BING_CONFIG = {
  name: 'bing' as const,
  displayName: 'Bing',
  // Use international Bing with English interface
  searchUrlTemplate: 'https://www.bing.com/search?q={{QUERY}}&setlang=en',
  selectors: BING_SELECTORS,
  fallbackSelectors: BING_FALLBACK_SELECTORS,
  // Wait for at least one result to appear
  waitForSelector: '#b_results .b_algo, #b_results li.b_algo',
  // Extra wait for dynamic content
  extraWaitMs: 300,
}

/**
 * Complete Baidu configuration
 */
export const BAIDU_CONFIG = {
  name: 'baidu' as const,
  displayName: 'Baidu',
  // Baidu search URL
  searchUrlTemplate: 'https://www.baidu.com/s?wd={{QUERY}}',
  selectors: BAIDU_SELECTORS,
  fallbackSelectors: BAIDU_FALLBACK_SELECTORS,
  // Wait for results container
  waitForSelector: '#content_left .result, #content_left .c-container',
  // Baidu is slower, need more wait time
  extraWaitMs: 300,
}

// ============================================
// Selector Utilities
// ============================================

/**
 * Build the JavaScript extraction script for a given selector set
 *
 * This function generates a self-executing JavaScript function that:
 * 1. Finds all result items matching the selector
 * 2. Extracts title, URL, and snippet from each
 * 3. Filters out excluded elements
 * 4. Returns a clean array of results
 *
 * @param selectors - The selector configuration to use
 * @param maxResults - Maximum number of results to extract
 * @returns JavaScript code string to execute in the page
 */
export function buildExtractionScript(selectors: EngineSelectors, maxResults: number): string {
  const excludeSelectorsStr = selectors.excludeSelectors
    ? selectors.excludeSelectors.map(s => `'${s}'`).join(',')
    : ''

  return `
    (function() {
      const results = [];
      const excludeSelectors = [${excludeSelectorsStr}];
      const maxResults = ${maxResults};

      // Find all result items
      const items = document.querySelectorAll('${selectors.resultItem}');

      for (let i = 0; i < items.length && results.length < maxResults; i++) {
        const item = items[i];

        // Skip excluded elements
        let shouldExclude = false;
        for (const excludeSel of excludeSelectors) {
          if (item.matches(excludeSel) || item.closest(excludeSel)) {
            shouldExclude = true;
            break;
          }
        }
        if (shouldExclude) continue;

        // Extract title
        const titleEl = item.querySelector('${selectors.title}');
        const title = titleEl ? titleEl.textContent.trim() : '';

        // Extract URL
        const linkEl = item.querySelector('${selectors.link}');
        let url = '';
        if (linkEl) {
          url = linkEl.href || linkEl.getAttribute('href') || '';
        }

        // Extract snippet
        const snippetEl = item.querySelector('${selectors.snippet}');
        const snippet = snippetEl ? snippetEl.textContent.trim() : '';

        // Only add if we have at least title and URL
        if (title && url) {
          results.push({
            title: title.substring(0, 500),  // Limit title length
            url: url,
            snippet: snippet.substring(0, 1000)  // Limit snippet length
          });
        }
      }

      return results;
    })()
  `
}

/**
 * Build search URL from template
 *
 * @param template - URL template with {{QUERY}} placeholder
 * @param query - Search query to insert
 * @returns Complete search URL
 */
export function buildSearchUrl(template: string, query: string): string {
  return template.replace('{{QUERY}}', encodeURIComponent(query))
}
