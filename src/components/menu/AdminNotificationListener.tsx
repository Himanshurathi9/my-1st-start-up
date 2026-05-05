'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Bell, Volume2, VolumeX } from 'lucide-react'
import toast from 'react-hot-toast'

interface AdminNotificationListenerProps {
  restaurantId: string
}

// ─── Sound URLs ───────────────────────────────────────────────
const WAITER_SOUND_URL = 'https://assets.mixkit.co/sfx/preview/mixkit-hotel-bell-ding-556.mp3'
const BILL_SOUND_URL = 'https://assets.mixkit.co/sfx/preview/mixkit-alert-quick-chime-766.mp3'

// ─── Preloaded Audio elements (singleton) ─────────────────────
let waiterAudio: HTMLAudioElement | null = null
let billAudio: HTMLAudioElement | null = null
let audioPreloaded = false

function preloadAudioFiles() {
  if (audioPreloaded) return
  audioPreloaded = true

  try {
    waiterAudio = new Audio(WAITER_SOUND_URL)
    waiterAudio.preload = 'auto'
    billAudio = new Audio(BILL_SOUND_URL)
    billAudio.preload = 'auto'
    console.log('[AdminListener] Audio files preloaded')
  } catch (err) {
    console.error('[AdminListener] Failed to preload audio:', err)
  }
}

// Preload on first user interaction (browser autoplay policy)
if (typeof document !== 'undefined') {
  const doPreload = () => {
    preloadAudioFiles()
    document.removeEventListener('click', doPreload)
    document.removeEventListener('touchstart', doPreload)
  }
  document.addEventListener('click', doPreload, { once: false, passive: true })
  document.addEventListener('touchstart', doPreload, { once: false, passive: true })
}

// ─── Sound playback ───────────────────────────────────────────
function playNotificationSound(type: 'waiter' | 'bill') {
  preloadAudioFiles() // Ensure loaded

  const audio = type === 'waiter' ? waiterAudio : billAudio
  if (!audio) {
    console.warn(`[AdminListener] Audio not available for ${type}`)
    return
  }

  // Clone to allow overlapping sounds (if two notifications arrive fast)
  const clone = audio.cloneNode(true) as HTMLAudioElement
  clone.volume = 0.7
  clone.play().catch((err) => {
    console.warn(`[AdminListener] Audio play failed for ${type}:`, err?.message)
  })

  console.log(`[AdminListener] ${type} sound played`)
}

// ─── localStorage helpers ─────────────────────────────────────
const SOUND_PREF_KEY = 'menumate_sound_enabled'

function loadSoundPref(): boolean {
  try {
    const v = localStorage.getItem(SOUND_PREF_KEY)
    if (v === 'true') return true
    if (v === 'false') return false
  } catch { /* ignore */ }
  return false // Default: sounds off
}

function saveSoundPref(enabled: boolean) {
  try {
    localStorage.setItem(SOUND_PREF_KEY, String(enabled))
  } catch { /* ignore */ }
}

// ─── Processed notifications set (deduplication) ──────────────
const processedIds = new Set<string>()
const MAX_PROCESSED = 200 // Prevent memory leak

function isDuplicate(id: string): boolean {
  if (processedIds.has(id)) return true
  processedIds.add(id)
  // Evict oldest entries when set gets too large
  if (processedIds.size > MAX_PROCESSED) {
    const iter = processedIds.values()
    for (let i = 0; i < MAX_PROCESSED / 2; i++) {
      processedIds.delete(iter.next().value as string)
    }
  }
  return false
}

// ─── Notification toast ───────────────────────────────────────
function NotificationToast({ type, tableNumber, restaurantName }: { type: string; tableNumber: number | null; restaurantName: string }) {
  const isWaiter = type === 'waiter'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{
        width: 36, height: 36, borderRadius: 10,
        background: isWaiter ? 'rgba(59,130,246,0.15)' : 'rgba(34,197,94,0.15)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Bell size={18} style={{ color: isWaiter ? '#3B82F6' : '#22C55E' }} />
      </div>
      <div>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--dash-text)' }}>
          {isWaiter ? '🛎️ Call Waiter' : '🧾 Ask for Bill'}
        </div>
        <div style={{ fontSize: 11, color: 'var(--dash-text-3)' }}>
          Table {tableNumber || 'N/A'} · {restaurantName}
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
export default function AdminNotificationListener({ restaurantId }: AdminNotificationListenerProps) {
  const [soundsEnabled, setSoundsEnabled] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [lastPollTime, setLastPollTime] = useState(new Date().toISOString())
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const wsRef = useRef<unknown>(null)

  // Load sound preference on mount
  useEffect(() => {
    const savedPref = loadSoundPref()
    setSoundsEnabled(savedPref)
    console.log('[AdminListener] Sound pref loaded:', savedPref, 'restaurantId:', restaurantId)
  }, [restaurantId])

  const handleNotification = useCallback((data: { id?: string; type: string; table_number: number | null; restaurant_name: string }) => {
    // Deduplication: skip if we've already processed this notification
    if (data.id && isDuplicate(data.id)) {
      console.log('[AdminListener] Duplicate notification skipped:', data.id)
      return
    }

    console.log('[AdminListener] Notification received:', data.type, 'table:', data.table_number, 'id:', data.id || '(none)')

    // Play sound if enabled
    if (soundsEnabled) {
      playNotificationSound(data.type as 'waiter' | 'bill')
    }

    // Show toast (once)
    toast.custom(
      <NotificationToast
        type={data.type}
        tableNumber={data.table_number}
        restaurantName={data.restaurant_name}
      />,
      { duration: 5000, position: 'top-right' },
    )
  }, [soundsEnabled])

  // Toggle sounds
  const toggleSounds = useCallback(() => {
    const newValue = !soundsEnabled
    setSoundsEnabled(newValue)
    saveSoundPref(newValue)
    console.log('[AdminListener] Sound toggled:', newValue)
    if (newValue) {
      // Enable audio and play test sound
      preloadAudioFiles()
      // Play waiter sound as confirmation
      setTimeout(() => playNotificationSound('waiter'), 100)
      toast.success('🔔 Notification sounds enabled!')
    } else {
      toast.success('🔇 Notification sounds muted')
    }
  }, [soundsEnabled])

  // WebSocket connection
  useEffect(() => {
    let mounted = true

    const connectWS = async () => {
      try {
        const { io } = await import('socket.io-client')
        const socket = io('/?XTransformPort=3004', {
          transports: ['websocket', 'polling'],
          timeout: 5000,
          reconnection: true,
          reconnectionAttempts: 5,
          reconnectionDelay: 3000,
        })

        wsRef.current = socket

        socket.on('connect', () => {
          if (!mounted) return
          console.log('[AdminListener] WebSocket connected')
          socket.emit('admin-register', restaurantId)
          setIsConnected(true)
        })

        socket.on('customer-notification', (data: { id?: string; type: string; table_number: number | null; restaurant_name: string }) => {
          if (mounted) handleNotification(data)
        })

        socket.on('disconnect', () => {
          if (!mounted) return
          console.log('[AdminListener] WebSocket disconnected')
          setIsConnected(false)
        })

        socket.on('connect_error', () => {
          if (!mounted) return
          console.log('[AdminListener] WebSocket failed, using polling fallback')
          setIsConnected(false)
        })
      } catch {
        setIsConnected(false)
      }
    }

    connectWS()

    return () => {
      mounted = false
      if (wsRef.current && typeof (wsRef.current as { disconnect: () => void }).disconnect === 'function') {
        (wsRef.current as { disconnect: () => void }).disconnect()
      }
    }
  }, [restaurantId, handleNotification])

  // Polling fallback (every 5 seconds)
  useEffect(() => {
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/notifications?restaurant_id=${restaurantId}&since=${encodeURIComponent(lastPollTime)}`)
        if (!res.ok) return
        const data = await res.json()
        if (data.notifications && data.notifications.length > 0) {
          data.notifications.forEach((n: { id: string; type: string; table_number: number | null; restaurant_name: string }) => {
            handleNotification(n)
          })
          setLastPollTime(new Date().toISOString())
        }
      } catch {
        // Poll failed silently
      }
    }, 5000)

    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [restaurantId, lastPollTime, handleNotification])

  // Persistent floating toggle button
  return (
    <div
      className="fixed bottom-4 right-4 z-50 animate-fade-in"
      style={{ bottom: 'calc(16px + env(safe-area-inset-bottom, 0px))' }}
    >
      <button
        onClick={toggleSounds}
        className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all"
        style={{
          background: soundsEnabled ? 'var(--dash-accent)' : 'var(--dash-surface)',
          border: soundsEnabled ? '1px solid var(--dash-accent)' : '1px solid var(--dash-border)',
          color: soundsEnabled ? '#fff' : 'var(--dash-text-2)',
          boxShadow: soundsEnabled ? '0 0 16px rgba(34,197,94,0.3)' : 'var(--dash-shadow-card)',
          cursor: 'pointer',
        }}
        title={soundsEnabled ? 'Mute notifications' : 'Enable notification sounds'}
      >
        {soundsEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
        {soundsEnabled ? 'Sounds On' : 'Sounds Off'}
        {!isConnected && (
          <span
            style={{
              width: 6, height: 6, borderRadius: '50%',
              background: 'var(--dash-warning)',
              marginLeft: 2,
            }}
            title="Using polling fallback"
          />
        )}
      </button>
    </div>
  )
}
