/**
 * Electron-specific type declarations
 */

import type { CafeAPI } from '../../preload/index'

declare global {
  interface Window {
    Cafe: CafeAPI
  }
}

export {}
