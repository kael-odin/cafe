/**
 * useSwipeBack - Hook for swipe-to-go-back gesture on mobile
 *
 * Detects right-to-left swipe gesture from the left edge of the screen
 * and triggers a callback when the swipe threshold is exceeded.
 *
 * Usage:
 *   const { bind } = useSwipeBack(() => goBack())
 *   <div {...bind()} className="...">
 */

import { useCallback, useRef } from 'react'
import { useIsMobile } from './useIsMobile'

interface SwipeBackOptions {
  threshold?: number
  edgeWidth?: number
}

interface BindHandlers {
  onTouchStart: (e: React.TouchEvent) => void
  onTouchMove: (e: React.TouchEvent) => void
  onTouchEnd: () => void
}

export function useSwipeBack(
  onBack: () => void,
  options: SwipeBackOptions = {}
): { bind: () => BindHandlers } {
  const { threshold = 100, edgeWidth = 30 } = options
  const isMobile = useIsMobile()
  const startX = useRef(0)
  const currentX = useRef(0)
  const isSwiping = useRef(false)

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!isMobile) return
    const touch = e.touches[0]
    if (touch.clientX <= edgeWidth) {
      startX.current = touch.clientX
      currentX.current = touch.clientX
      isSwiping.current = true
    }
  }, [isMobile, edgeWidth])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isSwiping.current || !isMobile) return
    const touch = e.touches[0]
    currentX.current = touch.clientX
  }, [isMobile])

  const handleTouchEnd = useCallback(() => {
    if (!isSwiping.current || !isMobile) return
    const diff = currentX.current - startX.current
    if (diff >= threshold) {
      onBack()
    }
    isSwiping.current = false
    startX.current = 0
    currentX.current = 0
  }, [isMobile, threshold, onBack])

  const bind = useCallback((): BindHandlers => ({
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd,
  }), [handleTouchStart, handleTouchMove, handleTouchEnd])

  return { bind }
}
