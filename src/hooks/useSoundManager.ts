'use client'

/**
 * useSoundManager — React hook for MenuMate ASMR sound system
 *
 * Usage:
 *   const sound = useSoundManager('customer') // or 'dashboard'
 *   sound.playAddToCart()
 *   sound.enabled  // reactive boolean
 *   sound.toggle() // flip on/off + persist
 */

import { useState, useEffect, useCallback } from 'react'
import {
  touchUnlock,
  setCustomerSound,
  setDashSound,
  getCustomerSoundEnabled,
  getDashSoundEnabled,
  playMenuOpen,
  playCategorySwitch,
  playAddToCart,
  playRemoveFromCart,
  playCartOpen,
  playOrderPlaced,
  playPreparingStart,
  playOrderServed,
  playStampEarned,
  playHalfwayMilestone,
  playRewardUnlocked,
  playNewOrder,
  acknowledgeNewOrder,
  playRestaurantOpen,
  playRestaurantClose,
  playCardSlide,
  playPhotoUploaded,
  playOutOfStock,
  playRestoreAvailable,
} from '@/lib/soundManager'

type SoundContext = 'customer' | 'dashboard'

export function useSoundManager(context: SoundContext = 'customer') {
  const [enabled, setEnabled] = useState(true)
  const [unlocked, setUnlocked] = useState(false)

  // Sync enabled state from localStorage on mount
  useEffect(() => {
    const isOn = context === 'customer' ? getCustomerSoundEnabled() : getDashSoundEnabled()
    setEnabled(isOn)
  }, [context])

  // Toggle on/off
  const toggle = useCallback(() => {
    setEnabled((prev) => {
      const next = !prev
      if (context === 'customer') setCustomerSound(next)
      else setDashSound(next)
      return next
    })
  }, [context])

  // Unlock AudioContext — call from any user gesture handler
  const unlock = useCallback(() => {
    touchUnlock()
    setUnlocked(true)
  }, [])

  return {
    enabled,
    unlocked,
    toggle,
    unlock,

    // ─── Customer sounds ───────────────────────────────────────────
    playMenuOpen,
    playCategorySwitch,
    playAddToCart,
    playRemoveFromCart,
    playCartOpen,
    playOrderPlaced,
    playPreparingStart,
    playOrderServed,
    playStampEarned,
    playHalfwayMilestone,
    playRewardUnlocked,

    // ─── Dashboard sounds ──────────────────────────────────────────
    playNewOrder,
    acknowledgeNewOrder,
    playRestaurantOpen,
    playRestaurantClose,
    playCardSlide,
    playPhotoUploaded,
    playOutOfStock,
    playRestoreAvailable,
  }
}
