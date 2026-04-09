/**
 * Cafe - React Entry Point
 */

// ========================================
// LOGGING INITIALIZATION (must be first)
// ========================================
// Initialize electron-log only in Electron environment.
// In remote browser mode, native console is used since there's no IPC transport.
// Uses the same detection pattern as src/renderer/api/transport.ts:isElectron()
// Non-blocking: don't use top-level await to avoid blocking module graph in Vite dev mode
if (typeof window !== 'undefined' && 'cafe' in window) {
  import('electron-log/renderer.js').then(({ default: log }) => {
    Object.assign(console, log.functions)
  })
}

import ReactDOM from 'react-dom/client'
import App from './App'
import { ErrorBoundary } from './components/ErrorBoundary'

// i18n configuration - must be imported before App
import './i18n'

// CSS imports - order matters for cascade
import './assets/styles/globals.css'       // Theme, base styles, shared animations
import './assets/styles/syntax-theme.css'  // Code syntax highlighting (highlight.js)
import './assets/styles/canvas-tabs.css'   // VS Code style tab bar
import './assets/styles/browser-task-card.css' // AI Browser sci-fi effects

// Mark React as mounted - disables global error fallback (React handles errors now)
// This flag is checked by the global error handler in index.html
;(window as unknown as { __Cafe_APP_MOUNTED__: boolean }).__Cafe_APP_MOUNTED__ = true

// Global debug helpers for drag-drop and @ mention testing
;(window as any).__CAFE_DEBUG__ = {
  testDragDrop: () => {
    console.log('=== Testing Drag & Drop ===')
    
    // Add global drag event listeners
    const logEvent = (name: string) => (e: DragEvent) => {
      console.log(`[DEBUG] ${name}:`, {
        types: e.dataTransfer?.types,
        dropEffect: e.dataTransfer?.dropEffect,
        data: e.dataTransfer?.getData('text/cafe-artifact-relative-path') || e.dataTransfer?.getData('text/plain'),
        target: (e.target as HTMLElement)?.tagName,
        targetClass: (e.target as HTMLElement)?.className
      })
    }
    
    document.addEventListener('dragstart', logEvent('dragstart'), true)
    document.addEventListener('dragover', logEvent('dragover'), true)
    document.addEventListener('drop', logEvent('drop'), true)
    
    console.log('✅ Drag event listeners added. Try dragging a file from the artifact tree.')
    console.log('Expected: [DEBUG] dragover with dropEffect="copy"')
    console.log('Expected: [DEBUG] drop with data from artifact')
  },
  
  testMention: () => {
    console.log('=== Testing @ Mention ===')
    const textarea = document.querySelector('textarea')
    if (!textarea) {
      console.error('❌ Textarea not found')
      console.log('Current view state:', (window as any).__APP_VIEW__)
      console.log('DOM structure:', document.body.innerHTML.substring(0, 500))
      return
    }
    
    console.log('✅ Textarea found:', textarea)
    console.log('Type "@" in the textarea and check console for [InputArea] logs')
    
    // Monitor input events
    textarea.addEventListener('input', (e) => {
      console.log('[DEBUG] input event:', (e.target as HTMLTextAreaElement).value)
    })
  },
  
  testFileUpload: () => {
    console.log('=== Testing File Upload ===')
    const fileInputs = document.querySelectorAll('input[type="file"]')
    console.log('All file inputs:', fileInputs.length)
    
    fileInputs.forEach((input, index) => {
      const accept = (input as HTMLInputElement).accept
      console.log(`File input ${index}:`, {
        accept: accept || 'no accept',
        multiple: (input as HTMLInputElement).multiple,
        className: input.className
      })
    })
    
    // Find document input (should have accept for PDF, DOCX, etc.)
    const docInput = Array.from(fileInputs).find(input => {
      const accept = (input as HTMLInputElement).accept
      return accept && (accept.includes('.pdf') || accept.includes('.docx') || accept.includes('application/'))
    })
    
    if (!docInput) {
      console.error('❌ Document file input not found')
      console.log('Trying to find by clicking "Add document" button...')
      return
    }
    
    console.log('✅ Document file input found:', docInput)
    console.log('Click "Add document" button and select a file')
    
    // Monitor file input change
    docInput.addEventListener('change', (e) => {
      const files = (e.target as HTMLInputElement).files
      console.log('[DEBUG] Files selected:', files?.length, files ? Array.from(files).map(f => f.name) : [])
    })
  },
  
  checkStores: () => {
    console.log('=== Checking Stores ===')
    try {
      const chatStore = (window as any).__ZUSTAND_STORE__
      console.log('ChatStore:', chatStore ? '✅ Found' : '❌ Not found')
      
      const spaceStore = (window as any).__SPACE_STORE__
      console.log('SpaceStore:', spaceStore ? '✅ Found' : '❌ Not found')
    } catch (e) {
      console.error('Error checking stores:', e)
    }
  },
  
  checkViewState: () => {
    console.log('=== Checking View State ===')
    const appStore = (window as any).__APP_STORE__
    if (appStore) {
      const view = appStore.getState?.()?.view
      console.log('Current view:', view)
      ;(window as any).__APP_VIEW__ = view
    } else {
      console.log('❌ AppStore not found')
    }
    
    // Check if SpacePage is rendered
    const spacePage = document.querySelector('[class*="space"]')
    console.log('SpacePage element:', spacePage ? '✅ Found' : '❌ Not found')
    
    // Check if ChatView is rendered
    const chatView = document.querySelector('[class*="chat"]')
    console.log('ChatView element:', chatView ? '✅ Found' : '❌ Not found')
    
    // Check if InputArea is rendered
    const inputArea = document.querySelector('[class*="input-area"]')
    console.log('InputArea element:', inputArea ? '✅ Found' : '❌ Not found')
    
    // Check all textareas
    const textareas = document.querySelectorAll('textarea')
    console.log('Textareas found:', textareas.length)
    
    // Check all file inputs
    const fileInputs = document.querySelectorAll('input[type="file"]')
    console.log('File inputs found:', fileInputs.length)
  }
}

console.log('✅ Cafe debug helpers loaded. Run __CAFE_DEBUG__.checkViewState() first!')
// __Cafe_EGG__
;(() => { const c = [72,101,108,108,111,44,32,73,39,109,32,72,97,108,111,46,32,67,111,110,103,114,97,116,115,44,32,121,111,117,39,118,101,32,102,111,117,110,100,32,116,104,101,32,101,97,115,116,101,114,32,101,103,103,33]; console.log('%c' + String.fromCharCode(...c), 'color:#666;font-style:italic'); })()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
)
