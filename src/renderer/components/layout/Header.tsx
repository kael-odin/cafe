/**
 * Header Component - Cross-platform title bar
 *
 * Handles platform-specific padding for window controls:
 * - macOS Electron: traffic lights on the left (pl-20)
 * - Windows/Linux Electron: titleBarOverlay buttons on the right (pr-36)
 * - Browser/Mobile: no extra padding needed (pl-4)
 *
 * Height: 40px (compact, modern style)
 * Traffic light vertical center formula: y = height/2 - 7 = 13
 */

import { ReactNode } from 'react'
import { isElectron } from '../../api/transport'
import { useIsMobile } from '../../hooks/useIsMobile'

interface HeaderProps {
  /** Left side content (after platform padding) */
  left?: ReactNode
  /** Right side content (before platform padding) */
  right?: ReactNode
  /** Additional className for header */
  className?: string
}

const getPlatform = () => {
  if (typeof window !== 'undefined' && window.platform) {
    return window.platform
  }
  return {
    platform: 'darwin' as const,
    isMac: true,
    isWindows: false,
    isLinux: false
  }
}

export function Header({ left, right, className = '' }: HeaderProps) {
  const platform = getPlatform()
  const isInElectron = isElectron()
  const isMobile = useIsMobile()

  const platformPadding = isInElectron
    ? platform.isMac
      ? 'pl-20 pr-4'
      : 'pl-4 pr-36'
    : 'pl-4 pr-4'

  const mobileSafeStyle = !isInElectron
    ? {
        paddingTop: 'max(env(safe-area-inset-top, 0px), 12px)',
        paddingLeft: 'max(env(safe-area-inset-left), 1rem)',
        paddingRight: 'max(env(safe-area-inset-right), 1rem)',
        minHeight: isMobile ? 'calc(3rem + env(safe-area-inset-top, 0px))' : '3rem',
      }
    : undefined

  return (
    <header
      className={`
        relative z-40 flex items-center justify-between
        border-b border-border/70 drag-region glass-header
        ${platformPadding}
        ${className}
      `.trim().replace(/\s+/g, ' ')}
      style={mobileSafeStyle}
    >
      <div className="relative z-10 flex items-center gap-2 sm:gap-3 min-w-0">
        <div className="no-drag flex items-center gap-2 sm:gap-3">
          {left}
        </div>
      </div>

      <div className="flex-1 min-w-[100px]" />

      <div className="relative z-10 flex items-center gap-1 sm:gap-2 flex-shrink-0">
        <div className="no-drag flex items-center gap-1 sm:gap-2">
          {right}
        </div>
      </div>
    </header>
  )
}

export function usePlatform() {
  return getPlatform()
}
