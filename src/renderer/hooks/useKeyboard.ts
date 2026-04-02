/**
 * useKeyboard - Hook for handling keyboard events on Capacitor mobile
 *
 * Listens for keyboard show/hide events and adjusts the app layout accordingly.
 * This ensures the input area stays visible when the keyboard is open.
 */

import { useEffect, useState, useCallback } from 'react'
import { isCapacitor } from '../api/transport'

interface KeyboardInfo {
  keyboardHeight: number
}

export function useKeyboard() {
  const [keyboardHeight, setKeyboardHeight] = useState(0)
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false)

  useEffect(() => {
    if (!isCapacitor()) return

    let keyboard: any = null

    const initKeyboard = async () => {
      try {
        const { Keyboard } = await import('@capacitor/keyboard')
        keyboard = Keyboard

        keyboard.addListener('keyboardWillShow', (info: KeyboardInfo) => {
          console.log('[useKeyboard] Keyboard will show, height:', info.keyboardHeight)
          setKeyboardHeight(info.keyboardHeight)
          setIsKeyboardVisible(true)
        })

        keyboard.addListener('keyboardWillHide', () => {
          console.log('[useKeyboard] Keyboard will hide')
          setKeyboardHeight(0)
          setIsKeyboardVisible(false)
        })

        keyboard.addListener('keyboardDidShow', (info: KeyboardInfo) => {
          console.log('[useKeyboard] Keyboard did show, height:', info.keyboardHeight)
          setKeyboardHeight(info.keyboardHeight)
          setIsKeyboardVisible(true)
        })

        keyboard.addListener('keyboardDidHide', () => {
          console.log('[useKeyboard] Keyboard did hide')
          setKeyboardHeight(0)
          setIsKeyboardVisible(false)
        })
      } catch (error) {
        console.warn('[useKeyboard] Failed to initialize keyboard listener:', error)
      }
    }

    initKeyboard()

    return () => {
      if (keyboard) {
        keyboard.removeAllListeners().catch(() => {})
      }
    }
  }, [])

  const scrollToInput = useCallback((element: HTMLElement | null) => {
    if (!element || !isKeyboardVisible) return

    setTimeout(() => {
      element.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }, 100)
  }, [isKeyboardVisible])

  return {
    keyboardHeight,
    isKeyboardVisible,
    scrollToInput,
  }
}
