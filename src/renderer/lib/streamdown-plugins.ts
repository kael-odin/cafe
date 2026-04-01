/**
 * Streamdown plugin configuration (lazy-loaded)
 *
 * Uses static import for @streamdown/code to ensure it's bundled properly.
 * The plugin initializes on first use and caches the result.
 */

import { useState, useEffect } from 'react'
import type { CodeHighlighterPlugin } from 'streamdown'
// Static import to ensure proper bundling
import { createCodePlugin } from '@streamdown/code'

let cachedPlugin: CodeHighlighterPlugin | null = null
let loadPromise: Promise<CodeHighlighterPlugin> | null = null

function loadCodePlugin(): Promise<CodeHighlighterPlugin> {
  if (!loadPromise) {
    loadPromise = new Promise((resolve) => {
      // Dark theme first: inline `color` uses the first theme's values,
      // which must be readable on dark backgrounds (our default).
      // The second theme goes into --shiki-dark CSS var for light mode.
      const plugin = createCodePlugin({
        themes: ['github-dark', 'github-light'],
      })
      cachedPlugin = plugin
      resolve(plugin)
    })
  }
  return loadPromise
}

/**
 * Hook that returns the Shiki code highlighter plugin.
 * Returns undefined until the plugin is loaded, then the cached instance.
 */
export function useCodePlugin(): CodeHighlighterPlugin | undefined {
  const [plugin, setPlugin] = useState<CodeHighlighterPlugin | undefined>(cachedPlugin ?? undefined)

  useEffect(() => {
    if (cachedPlugin) {
      setPlugin(cachedPlugin)
      return
    }
    loadCodePlugin().then(setPlugin)
  }, [])

  return plugin
}
