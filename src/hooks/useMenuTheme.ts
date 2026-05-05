'use client'

import { useCallback, useSyncExternalStore } from 'react'

export type MenuThemeName = 'dark' | 'light' | 'green' | 'gold'

const STORAGE_KEY = 'menumate_menu_theme'

export const MENU_THEMES: { id: MenuThemeName; label: string; icon: string }[] = [
  { id: 'dark', label: 'Dark Premium', icon: '🌙' },
  { id: 'light', label: 'Light Minimal', icon: '☀️' },
  { id: 'green', label: 'Green Fresh', icon: '🌿' },
  { id: 'gold', label: 'Luxury Gold', icon: '✨' },
]

function readStored(): MenuThemeName {
  if (typeof window === 'undefined') return 'dark'
  try {
    const v = localStorage.getItem(STORAGE_KEY)
    if (v && MENU_THEMES.some((t) => t.id === v)) return v as MenuThemeName
  } catch { /* ignore */ }
  return 'dark'
}

function applyToDOM(theme: MenuThemeName) {
  if (typeof document === 'undefined') return
  document.documentElement.setAttribute('data-menu-theme', theme)
}

// External store for theme so multiple hooks stay in sync
let currentTheme: MenuThemeName = 'dark'
const listeners = new Set<() => void>()

function emitChange() {
  for (const fn of listeners) fn()
}

function subscribe(fn: () => void) {
  listeners.add(fn)
  return () => { listeners.delete(fn) }
}

function getSnapshot(): MenuThemeName {
  return currentTheme
}

function getServerSnapshot(): MenuThemeName {
  return 'dark'
}

// Initialize on mount
if (typeof window !== 'undefined') {
  currentTheme = readStored()
  applyToDOM(currentTheme)
}

export function useMenuTheme() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  const setTheme = useCallback((t: MenuThemeName) => {
    currentTheme = t
    applyToDOM(t)
    try { localStorage.setItem(STORAGE_KEY, t) } catch { /* ignore */ }
    emitChange()
  }, [])

  const cycleTheme = useCallback(() => {
    const ids = MENU_THEMES.map((t) => t.id)
    const idx = ids.indexOf(currentTheme)
    const next = ids[(idx + 1) % ids.length]
    setTheme(next)
  }, [setTheme])

  const current = MENU_THEMES.find((t) => t.id === theme) ?? MENU_THEMES[0]

  return { theme, setTheme, cycleTheme, current, allThemes: MENU_THEMES }
}
