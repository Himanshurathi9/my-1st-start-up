'use client'

import { useState, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'
import {
  QrCode,
  Plus,
  Printer,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  AlertTriangle,
  Loader2,
  Info,
  Award,
  Users,
  Crown,
  LogOut,
  Settings as SettingsIcon,
  Trash2,
  Store,
  Phone,
  Globe,
  ExternalLink,
  Palette,
  Check,
  Sparkles,
  Gift,
  UtensilsCrossed,
  Clock,
  Bell,
  Mail,
  Volume2,
  Copy,
  Download,
  ShieldAlert,
  RotateCcw,
  Pencil,
  Save,
  X,
} from 'lucide-react'
import { signOut } from 'next-auth/react'
import type { Restaurant, RestaurantTable, StampSettings, Customer } from '@/types'
import { handleImgError } from '@/lib/utils'
import SoundToggle from '@/components/ui/SoundToggle'

// ────────────────────────────
// Types
// ────────────────────────────

interface TablesData {
  restaurant: Restaurant
  tables: RestaurantTable[]
  masterQrUrl: string | null
}

interface StampSettingsData {
  settings: StampSettings | null
  customerCount: number
  customers: Customer[]
}


// ────────────────────────────
// Constants for new sections
// ────────────────────────────

const CUISINE_OPTIONS = ['Indian', 'Chinese', 'Italian', 'Mexican', 'Continental', 'Multi-Cuisine', 'Other']

const MENU_DISPLAY_THEMES = [
  { id: 'dark', label: 'Dark' },
  { id: 'light', label: 'Light' },
  { id: 'warm', label: 'Warm' },
]

const LANGUAGE_OPTIONS = ['English', 'Hindi', 'Gujarati']

const CURRENCY_OPTIONS = [
  { value: 'INR', label: '₹ INR' },
  { value: 'USD', label: '$ USD' },
]

const QR_SIZES = [
  { id: 'small', label: 'Small', px: 80 },
  { id: 'medium', label: 'Medium', px: 120 },
  { id: 'large', label: 'Large', px: 180 },
]

const DEFAULT_NOTIFICATION_PREFS = {
  newOrder: true,
  dailySummary: false,
  soundAlerts: true,
}

const DEFAULT_DISPLAY_PREFS = {
  menuTheme: 'dark',
  language: 'English',
  currency: 'INR',
}

function loadFromStorage<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback
  try {
    const stored = localStorage.getItem(key)
    return stored ? JSON.parse(stored) : fallback
  } catch {
    return fallback
  }
}


// ────────────────────────────
// Skeleton Loader
// ────────────────────────────

function SkeletonSettings() {
  return (
    <div className="px-5 pt-8 pb-4">
      <div className="space-y-3">
        <div className="dash-skeleton h-8 w-28 rounded-xl" />
        <div className="dash-skeleton h-4 w-48 rounded-lg mb-6" />
        <div className="dash-skeleton h-5 w-40 rounded-lg mb-4" />
        <div className="grid grid-cols-2 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="dash-skeleton rounded-2xl p-4 aspect-square" />
          ))}
        </div>
      </div>
    </div>
  )
}

// ────────────────────────────
// Section Label Component
// ────────────────────────────

function SectionLabel({ children, badge }: { children: React.ReactNode; badge?: string }) {
  return (
    <div className="dash-section-label flex items-center gap-2 mb-2 pl-1">
      <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--dash-text-3)', padding: '16px 4px 8px 4px' }}>
        {children}
      </p>
      {badge && (
        <span className="dash-badge text-[10px] font-bold px-2 py-0.5 rounded-full">{badge}</span>
      )}
    </div>
  )
}

// ────────────────────────────
// Section Card Component
// ────────────────────────────

function SectionCard({ children, className = '', style }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  return (
    <div className={`dash-card overflow-hidden ${className}`} style={style}>
      {children}
    </div>
  )
}

// ────────────────────────────
// Row Component
// ────────────────────────────

function SettingsRow({
  icon: Icon,
  iconBg,
  iconColor,
  label,
  labelColor,
  children,
  onClick,
  noBorder,
}: {
  icon: React.ElementType
  iconBg: string
  iconColor: string
  label: string
  labelColor?: string
  children?: React.ReactNode
  onClick?: () => void
  noBorder?: boolean
}) {
  const Wrapper = onClick ? 'button' : 'div'
  return (
    <Wrapper
      {...(onClick ? { onClick } : {})}
      className={`flex items-center w-full text-left ${onClick ? 'dash-settings-row' : ''}`}
      style={{
        padding: '14px 16px',
        minHeight: '52px',
        borderBottom: noBorder ? 'none' : '1px solid var(--dash-border)',
        cursor: onClick ? 'pointer' : undefined,
        background: 'none',
        border: 'none',
        color: 'inherit',
      }}
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div
          className="flex items-center justify-center flex-shrink-0"
          style={{ width: '28px', height: '28px', borderRadius: '8px', background: iconBg }}
        >
          <Icon className="w-[14px] h-[14px] flex-shrink-0" style={{ color: iconColor }} />
        </div>
        <span
          className="truncate"
          style={{
            fontSize: '15px',
            color: labelColor || 'var(--dash-text)',
            fontWeight: 500,
          }}
        >
          {label}
        </span>
      </div>
      {children && <div className="flex-shrink-0 ml-2">{children}</div>}
    </Wrapper>
  )
}

// ────────────────────────────
// Dropdown Select Component
// ────────────────────────────

function DropdownSelect({
  value,
  onChange,
  options,
  label,
}: {
  value: string
  onChange: (val: string) => void
  options: readonly string[] | { value: string; label: string }[]
  label: string
}) {
  const optionLabels = typeof options[0] === 'string'
    ? (options as string[]).map(o => ({ value: o, label: o }))
    : (options as { value: string; label: string }[])

  return (
    <div className="relative">
      {label && (
        <label className="block text-[11px] font-semibold mb-1.5" style={{ color: 'var(--dash-text-3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {label}
        </label>
      )}
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="dash-input w-full rounded-xl appearance-none cursor-pointer pr-10 text-sm"
          style={{ paddingLeft: '14px', paddingRight: '40px', paddingTop: '10px', paddingBottom: '10px', fontSize: '14px' }}
        >
          {optionLabels.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: 'var(--dash-text-3)' }} />
      </div>
    </div>
  )
}

// ────────────────────────────
// Dark Toggle Component
// ────────────────────────────

function DashToggle({ active, onToggle }: { active: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className="min-h-[44px] min-w-[44px] flex items-center justify-center"
    >
      <div
        className="dash-toggle-track relative transition-all duration-200"
        style={{
          width: '56px',
          height: '30px',
          borderRadius: '15px',
          background: active ? 'var(--dash-accent)' : 'var(--dash-surface-3)',
          boxShadow: active ? '0 0 12px rgba(34, 197, 94, 0.3)' : 'none',
        }}
      >
        <div
          className="dash-toggle-thumb absolute top-[2px] transition-transform duration-200"
          style={{
            left: '2px',
            width: '26px',
            height: '26px',
            borderRadius: '50%',
            background: '#fff',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
            transform: active ? 'translateX(26px)' : 'translateX(0)',
          }}
        />
      </div>
    </button>
  )
}

// ────────────────────────────
// Page
// ────────────────────────────

export default function SettingsPage() {
  const [data, setData] = useState<TablesData | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [tableCount, setTableCount] = useState('')
  const [showRegenConfirm, setShowRegenConfirm] = useState(false)
  const [expandedCard, setExpandedCard] = useState<string | null>(null)

  // Stamp settings state
  const [stampData, setStampData] = useState<StampSettingsData | null>(null)
  const [stampLoading, setStampLoading] = useState(true)
  const [stampSaving, setStampSaving] = useState(false)
  const [showCustomers, setShowCustomers] = useState(false)
  const [showRewards, setShowRewards] = useState(false)
  const [rewardsData, setRewardsData] = useState<{
    rewards: Array<{
      id: string
      reward_code: string
      is_used: boolean
      expires_at: string
      created_at: string
      customers?: { name: string | null; phone_number: string } | null
    }>
    activeCount: number
    redeemedCount: number
    rewardItemName: string
  } | null>(null)
  const [redeemingId, setRedeemingId] = useState<string | null>(null)
  const [rewardName, setRewardName] = useState('')
  const [stampsRequired, setStampsRequired] = useState(9)
  const [isActive, setIsActive] = useState(false)

  // Theme state removed
  const [whatsappNumber, setWhatsappNumber] = useState('')
  const [whatsappSaving, setWhatsappSaving] = useState(false)

  // ─── Profile section state ───
  const [editProfileName, setEditProfileName] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editCuisineType, setEditCuisineType] = useState('')
  const [profileEditing, setProfileEditing] = useState(false)
  const [profileSaving, setProfileSaving] = useState(false)

  // ─── Notification preferences state ───
  const [notifPrefs, setNotifPrefs] = useState(DEFAULT_NOTIFICATION_PREFS)

  // ─── Display settings state ───
  const [menuDisplayTheme, setMenuDisplayTheme] = useState('dark')
  const [language, setLanguage] = useState('English')
  const [currency, setCurrency] = useState('INR')

  // ─── QR size state ───
  const [qrSize, setQrSize] = useState('medium')

  const hasTables = data && data.tables.length > 0
  const maxTables = data?.restaurant.plan === 'BASIC' ? 10 : 30
  const currentCount = data?.tables.length || 0
  const isPro = data?.restaurant.plan === 'PRO'

  const fetchTables = useCallback(async () => {
    try {
      const res = await fetch('/api/tables')
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to load')
      }
      const json = await res.json()
      setData(json)
      if (json.tables.length > 0) {
        setTableCount(String(json.tables.length))
      }
    } catch {
      toast.error('Failed to load table settings')
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchStampSettings = useCallback(async () => {
    try {
      const res = await fetch('/api/stamp-settings')
      if (!res.ok) return
      const json = await res.json()
      setStampData(json)
      if (json.settings) {
        setRewardName(json.settings.reward_item_name || '')
        setStampsRequired(json.settings.stamps_required || 9)
        setIsActive(json.settings.is_active ?? true)
      }
    } catch {
      // Silently fail — loyalty section may not be available for BASIC
    } finally {
      setStampLoading(false)
    }
  }, [])

  // Fetch rewards data
  const fetchRewards = useCallback(async () => {
    try {
      const res = await fetch('/api/rewards')
      if (!res.ok) return
      const json = await res.json()
      setRewardsData(json)
    } catch {
      // Silently fail
    }
  }, [])

  // Handle reward redemption
  const handleRedeemReward = useCallback(async (rewardId: string) => {
    setRedeemingId(rewardId)
    try {
      const res = await fetch('/api/rewards', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reward_id: rewardId, action: 'redeem' }),
      })
      if (!res.ok) {
        const err = await res.json()
        toast.error(err.error || 'Failed to redeem reward')
        return
      }
      toast.success('Reward redeemed! Customer can start a new stamp collection. ✅')
      // Refresh rewards list
      await fetchRewards()
      // Also refresh stamp data (customer counts may change)
      await fetchStampSettings()
    } catch {
      toast.error('Something went wrong')
    } finally {
      setRedeemingId(null)
    }
  }, [fetchRewards, fetchStampSettings])

  // Load rewards when rewards section is opened
  useEffect(() => {
    if (showRewards && !rewardsData) {
      fetchRewards()
    }
  }, [showRewards, rewardsData, fetchRewards])

  useEffect(() => {
    fetchTables()
    fetchStampSettings()
  }, [fetchTables, fetchStampSettings])

  useEffect(() => {
    // Sync local state from loaded data
    if (data?.restaurant?.whatsapp_number) {
      setWhatsappNumber(data.restaurant.whatsapp_number)
    } else if (data?.restaurant) {
      // Explicitly clear if field is empty in DB
      setWhatsappNumber('')
    }
    // theme sync removed
    // Sync profile fields from data
    if (data?.restaurant?.name) {
      setEditProfileName(data.restaurant.name)
    }
    if (data?.restaurant?.description) {
      setEditDescription(data.restaurant.description)
    }
    if (data?.restaurant?.cuisine_type) {
      setEditCuisineType(data.restaurant.cuisine_type)
    }
  }, [data])

  // ─── Load localStorage preferences on mount ───
  useEffect(() => {
    const storedNotif = loadFromStorage('menumate-notif-prefs', DEFAULT_NOTIFICATION_PREFS)
    setNotifPrefs(storedNotif)

    const storedDisplay = loadFromStorage('menumate-display-prefs', DEFAULT_DISPLAY_PREFS)
    setMenuDisplayTheme(storedDisplay.menuTheme)
    setLanguage(storedDisplay.language)
    setCurrency(storedDisplay.currency)

    const storedQrSize = loadFromStorage('menumate-qr-size', 'medium')
    setQrSize(storedQrSize)
  }, [])

  // ─── Save notification prefs to localStorage ───
  const updateNotifPref = useCallback((key: 'newOrder' | 'dailySummary' | 'soundAlerts', val: boolean) => {
    const updated = { ...notifPrefs, [key]: val }
    setNotifPrefs(updated)
    localStorage.setItem('menumate-notif-prefs', JSON.stringify(updated))
    toast.success('Notification preference saved')
  }, [notifPrefs])

  // ─── Save display prefs to localStorage ───
  const saveDisplayPrefs = useCallback((key: string, val: string) => {
    let updated: typeof DEFAULT_DISPLAY_PREFS = DEFAULT_DISPLAY_PREFS
    updated = { ...DEFAULT_DISPLAY_PREFS, menuTheme: menuDisplayTheme, language, currency }
    updated = { ...updated, [key]: val }
    setMenuDisplayTheme(updated.menuTheme)
    setLanguage(updated.language)
    setCurrency(updated.currency)
    localStorage.setItem('menumate-display-prefs', JSON.stringify(updated))
    toast.success('Display preference saved')
  }, [menuDisplayTheme, language, currency])

  // ─── Save QR size to localStorage ───
  const updateQrSize = useCallback((size: string) => {
    setQrSize(size)
    localStorage.setItem('menumate-qr-size', JSON.stringify(size))
  }, [])

  // ─── Profile save handler ───
  const handleSaveProfile = useCallback(async () => {
    setProfileSaving(true)
    try {
      const res = await fetch('/api/restaurant', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editProfileName.trim(),
          description: editDescription.trim(),
          cuisine_type: editCuisineType,
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to save profile')
      }
      toast.success('Restaurant profile updated!')
      setProfileEditing(false)
      fetchTables() // re-fetch to keep data in sync
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save profile'
      toast.error(msg)
    } finally {
      setProfileSaving(false)
    }
  }, [editProfileName, editDescription, editCuisineType, fetchTables])

  // ─── Copy QR link ───
  const handleCopyQrLink = useCallback(() => {
    const slug = data?.restaurant?.slug
    if (slug) {
      const link = `${window.location.origin}/menu/${slug}`
      navigator.clipboard.writeText(link).then(() => {
        toast.success('QR link copied to clipboard!')
      }).catch(() => {
        toast.error('Failed to copy link')
      })
    }
  }, [data])

  // ─── Download QR as PNG ───
  const handleDownloadQr = useCallback((url: string, filename: string) => {
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.target = '_blank'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }, [])

  // ─── Reset settings ───
  const handleResetSettings = useCallback(() => {
    localStorage.removeItem('menumate-notif-prefs')
    localStorage.removeItem('menumate-display-prefs')
    localStorage.removeItem('menumate-qr-size')
    setNotifPrefs(DEFAULT_NOTIFICATION_PREFS)
    setMenuDisplayTheme(DEFAULT_DISPLAY_PREFS.menuTheme)
    setLanguage(DEFAULT_DISPLAY_PREFS.language)
    setCurrency(DEFAULT_DISPLAY_PREFS.currency)
    setQrSize('medium')
    toast.success('All settings reset to defaults')
  }, [])

  // ─── WhatsApp handler ───
  const handleSaveWhatsapp = useCallback(async () => {
    const clean = whatsappNumber.replace(/[\+\s\-()]/g, '').trim()
    if (clean.length > 0 && clean.length < 10) {
      toast.error('Phone number must be at least 10 digits')
      return
    }
    setWhatsappSaving(true)
    try {
      const res = await fetch('/api/restaurant', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ whatsapp_number: clean }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to save')
      }
      const result = await res.json()

      // Immediately update local state from the PATCH response
      if (result.restaurant?.whatsapp_number !== undefined) {
        setWhatsappNumber(result.restaurant.whatsapp_number)
      }

      toast.success('WhatsApp number updated!')
      fetchTables() // also re-fetch to keep data in sync
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save'
      toast.error(msg)
    } finally {
      setWhatsappSaving(false)
    }
  }, [whatsappNumber, fetchTables])

  // ─── Stamp settings handlers ───
  const handleSaveStampSettings = useCallback(async () => {
    if (!rewardName.trim()) {
      toast.error('Please enter a reward item name')
      return
    }

    setStampSaving(true)
    try {
      const res = await fetch('/api/stamp-settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          is_active: isActive,
          reward_item_name: rewardName.trim(),
          stamps_required: stampsRequired,
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to save')
      }

      toast.success('Loyalty settings saved!')
      fetchStampSettings()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save'
      toast.error(msg)
    } finally {
      setStampSaving(false)
    }
  }, [rewardName, stampsRequired, isActive, fetchStampSettings])

  // ─── Generate QR Codes ───
  const handleGenerate = async () => {
    const count = parseInt(tableCount, 10)
    if (!count || count < 1 || count > maxTables) {
      toast.error(`Enter a number between 1 and ${maxTables}`)
      return
    }

    setGenerating(true)
    try {
      const res = await fetch('/api/tables', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ count }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Generation failed')
      }

      const json = await res.json()
      if (!data) return
      setData({
        restaurant: data.restaurant,
        tables: json.tables,
        masterQrUrl: json.masterQrUrl,
      })
      setShowRegenConfirm(false)
      toast.success(`${count} QR codes generated successfully!`)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to generate QR codes'
      toast.error(msg)
    } finally {
      setGenerating(false)
    }
  }

  // ─── Regenerate ───
  const handleRegenerate = async () => {
    if (!showRegenConfirm) {
      setShowRegenConfirm(true)
      return
    }
    await handleGenerate()
  }

  // ─── Delete All ───
  const handleDeleteAll = async () => {
    try {
      const res = await fetch('/api/tables', { method: 'DELETE' })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Delete failed')
      }
      setData({ ...data, tables: [], masterQrUrl: null })
      setTableCount('')
      setShowRegenConfirm(false)
      toast.success('All tables removed')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete tables'
      toast.error(msg)
    }
  }

  // ─── Print ───
  const handlePrint = () => {
    window.open('/api/tables/print', '_blank')
  }

  // ─── Toggle expand card ───
  const toggleExpand = (id: string) => {
    setExpandedCard((prev) => (prev === id ? null : id))
  }

  // ─── View Public Menu ───
  const handleViewPublicMenu = () => {
    window.open(`/menu/${data?.restaurant?.slug}`, '_blank')
  }

  // ────────────────────────────
  // Skeleton
  // ────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen" style={{ background: 'var(--dash-bg)' }}>
        <SkeletonSettings />
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-[100px]" style={{ background: 'var(--dash-bg)' }}>
      {/* ─── Header ─── */}
      <header className="sticky top-0 z-40 dash-glass">
        <div className="px-4 sm:px-5" style={{ paddingTop: '20px', paddingBottom: '16px' }}>
          <h1
            style={{
              fontSize: '28px',
              fontWeight: 800,
              color: 'var(--dash-text)',
              fontFamily: 'var(--font-display)',
              lineHeight: '1.2',
              letterSpacing: '-0.02em',
            }}
          >
            Settings
          </h1>
        </div>
      </header>

      <div className="px-3 sm:px-4 pb-[100px]">
        {/* ═══ SECTION 0 — RESTAURANT PROFILE ═══ */}
        <section className="mt-5 animate-dash-section-enter" style={{ animationDelay: '0ms' }}>
          <SectionLabel>
            <span className="flex items-center gap-2">
              Restaurant Profile
              <UtensilsCrossed className="w-3 h-3" style={{ color: 'var(--dash-accent)' }} />
            </span>
          </SectionLabel>

          <SectionCard>
            {/* Restaurant Name */}
            <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--dash-border)' }}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div
                    className="flex items-center justify-center flex-shrink-0"
                    style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(59,130,246,0.15)' }}
                  >
                    <Store className="w-[14px] h-[14px] flex-shrink-0" style={{ color: 'var(--dash-info)' }} />
                  </div>
                  <label className="text-[11px] font-semibold" style={{ color: 'var(--dash-text-3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Restaurant Name
                  </label>
                </div>
                <button
                  onClick={() => profileEditing ? setProfileEditing(false) : setProfileEditing(true)}
                  className="min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg animate-btn-press"
                  style={{ background: profileEditing ? 'var(--dash-surface-3)' : 'transparent', color: 'var(--dash-text-3)' }}
                >
                  {profileEditing ? <X className="w-4 h-4" /> : <Pencil className="w-4 h-4" />}
                </button>
              </div>
              {profileEditing ? (
                <input
                  type="text"
                  value={editProfileName}
                  onChange={(e) => setEditProfileName(e.target.value)}
                  placeholder="Your restaurant name"
                  className="dash-input rounded-xl text-sm w-full"
                  style={{ paddingLeft: '14px', paddingRight: '14px', paddingTop: '10px', paddingBottom: '10px', fontSize: '15px', fontWeight: 600 }}
                />
              ) : (
                <p className="text-[15px] font-semibold" style={{ color: 'var(--dash-text)', paddingLeft: '36px' }}>
                  {editProfileName || data?.restaurant?.name || 'Not set'}
                </p>
              )}
            </div>

            {/* Description / Tagline */}
            <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--dash-border)' }}>
              <div className="flex items-center gap-2 mb-2">
                <div
                  className="flex items-center justify-center flex-shrink-0"
                  style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(168,85,247,0.15)' }}
                >
                  <Sparkles className="w-[14px] h-[14px] flex-shrink-0" style={{ color: 'var(--dash-special)' }} />
                </div>
                <label className="text-[11px] font-semibold" style={{ color: 'var(--dash-text-3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Description / Tagline
                </label>
              </div>
              {profileEditing ? (
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="e.g. Authentic Italian cuisine with a modern twist"
                  rows={2}
                  className="dash-input rounded-xl text-sm w-full resize-none"
                  style={{ paddingLeft: '14px', paddingRight: '14px', paddingTop: '10px', paddingBottom: '10px', fontSize: '14px' }}
                />
              ) : (
                <p className="text-[13px] leading-relaxed" style={{ color: 'var(--dash-text-2)', paddingLeft: '36px' }}>
                  {editDescription || data?.restaurant?.description || 'No description added yet'}
                </p>
              )}
            </div>

            {/* Cuisine Type */}
            <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--dash-border)' }}>
              <div className="flex items-center gap-2 mb-2">
                <div
                  className="flex items-center justify-center flex-shrink-0"
                  style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(34,197,94,0.15)' }}
                >
                  <UtensilsCrossed className="w-[14px] h-[14px] flex-shrink-0" style={{ color: 'var(--dash-accent)' }} />
                </div>
                <label className="text-[11px] font-semibold" style={{ color: 'var(--dash-text-3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Cuisine Type
                </label>
              </div>
              {profileEditing ? (
                <DropdownSelect
                  value={editCuisineType}
                  onChange={setEditCuisineType}
                  options={CUISINE_OPTIONS}
                  label=""
                />
              ) : (
                <div className="flex items-center gap-2" style={{ paddingLeft: '36px' }}>
                  <span className="dash-badge text-[12px] font-semibold px-2.5 py-1 rounded-full" style={{
                    background: 'rgba(34,197,94,0.12)',
                    color: 'var(--dash-accent)',
                  }}>
                    {editCuisineType || data?.restaurant?.cuisine_type || 'Not set'}
                  </span>
                </div>
              )}
            </div>

            {/* Opening Hours Display */}
            <div style={{ padding: '14px 16px', borderBottom: profileEditing ? '1px solid var(--dash-border)' : 'none' }}>
              <div className="flex items-center gap-2 mb-2">
                <div
                  className="flex items-center justify-center flex-shrink-0"
                  style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(245,158,11,0.15)' }}
                >
                  <Clock className="w-[14px] h-[14px] flex-shrink-0" style={{ color: 'var(--dash-warning)' }} />
                </div>
                <label className="text-[11px] font-semibold" style={{ color: 'var(--dash-text-3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Opening Hours
                </label>
              </div>
              <div style={{ paddingLeft: '36px' }}>
                <p className="text-[13px] font-medium" style={{ color: 'var(--dash-text-2)' }}>
                  {data?.restaurant?.opening_hours || '9:00 AM – 11:00 PM'}
                </p>
                <p className="text-[11px] mt-0.5" style={{ color: 'var(--dash-text-3)' }}>
                  Configured via restaurant admin
                </p>
              </div>
            </div>

            {/* Save Profile Button */}
            {profileEditing && (
              <div style={{ padding: '14px 16px' }}>
                <button
                  onClick={handleSaveProfile}
                  disabled={profileSaving}
                  className="dash-btn-primary w-full min-h-[44px] animate-btn-press rounded-xl font-bold text-[14px] flex items-center justify-center gap-2"
                >
                  {profileSaving ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
                  ) : (
                    <><Save className="w-4 h-4" /> Save Profile</>
                  )}
                </button>
              </div>
            )}
          </SectionCard>
        </section>

        {/* ═══ SECTION 1 — RESTAURANT INFO ═══ */}
        <section className="mt-5 animate-dash-section-enter" style={{ animationDelay: '0ms' }}>
          <SectionLabel>Restaurant Info</SectionLabel>

          <SectionCard>
            <SettingsRow
              icon={Store}
              iconBg="rgba(59,130,246,0.15)"
              iconColor="var(--dash-info)"
              label="Restaurant Name"
            >
              <div className="flex items-center gap-1.5">
                <span style={{ fontSize: '14px', color: 'var(--dash-text-3)', maxWidth: '120px' }} className="truncate">
                  {data?.restaurant?.name}
                </span>
                <ChevronRight className="w-4 h-4" style={{ color: 'var(--dash-text-3)' }} />
              </div>
            </SettingsRow>

            <SettingsRow
              icon={Phone}
              iconBg="rgba(34,197,94,0.15)"
              iconColor="var(--dash-accent)"
              label="WhatsApp Number"
              noBorder
            />
            <div style={{ padding: '0 16px 14px', borderBottom: '1px solid var(--dash-border)' }}>
              <div className="flex items-center gap-2">
                <input
                  type="tel"
                  inputMode="tel"
                  value={whatsappNumber}
                  onChange={(e) => setWhatsappNumber(e.target.value)}
                  placeholder="e.g. +1234567890"
                  className="dash-input rounded-xl text-sm flex-1"
                  style={{ paddingLeft: '16px', paddingRight: '16px', paddingTop: '10px', paddingBottom: '10px', fontSize: '14px' }}
                />
                <button
                  onClick={handleSaveWhatsapp}
                  disabled={whatsappSaving}
                  className="dash-btn-primary min-h-[44px] animate-btn-press rounded-xl px-4 text-sm font-bold whitespace-nowrap"
                >
                  {whatsappSaving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    'Save'
                  )}
                </button>
              </div>
            </div>

            <SettingsRow
              icon={Globe}
              iconBg="rgba(239,68,68,0.15)"
              iconColor="var(--dash-error)"
              label="View Public Menu"
              onClick={handleViewPublicMenu}
              noBorder
            >
              <ExternalLink className="w-[18px] h-[18px]" style={{ color: 'var(--dash-info)' }} />
            </SettingsRow>
          </SectionCard>
        </section>

        {/* ═══ SECTION 2b — NOTIFICATION PREFERENCES ═══ */}
        <section className="mt-6 animate-dash-section-enter" style={{ animationDelay: '90ms' }}>
          <SectionLabel>
            <span className="flex items-center gap-2">
              Notifications
              <Bell className="w-3 h-3" style={{ color: 'var(--dash-accent)' }} />
            </span>
          </SectionLabel>

          <SectionCard>
            {/* New Order Notifications */}
            <div className="flex items-center justify-between" style={{ padding: '14px 16px', minHeight: '52px', borderBottom: '1px solid var(--dash-border)' }}>
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="flex items-center justify-center flex-shrink-0"
                  style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(34,197,94,0.15)' }}
                >
                  <Bell className="w-[14px] h-[14px] flex-shrink-0" style={{ color: 'var(--dash-accent)' }} />
                </div>
                <div className="min-w-0">
                  <p className="font-medium truncate" style={{ color: 'var(--dash-text)', fontSize: '15px' }}>
                    New Order Notifications
                  </p>
                  <p className="text-[11px] mt-0.5" style={{ color: 'var(--dash-text-3)' }}>
                    Get notified when a new order arrives
                  </p>
                </div>
              </div>
              <DashToggle active={notifPrefs.newOrder} onToggle={() => updateNotifPref('newOrder', !notifPrefs.newOrder)} />
            </div>

            {/* Daily Summary Email */}
            <div className="flex items-center justify-between" style={{ padding: '14px 16px', minHeight: '52px', borderBottom: '1px solid var(--dash-border)' }}>
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="flex items-center justify-center flex-shrink-0"
                  style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(59,130,246,0.15)' }}
                >
                  <Mail className="w-[14px] h-[14px] flex-shrink-0" style={{ color: 'var(--dash-info)' }} />
                </div>
                <div className="min-w-0">
                  <p className="font-medium truncate" style={{ color: 'var(--dash-text)', fontSize: '15px' }}>
                    Daily Summary Email
                  </p>
                  <p className="text-[11px] mt-0.5" style={{ color: 'var(--dash-text-3)' }}>
                    Receive a daily report of all orders
                  </p>
                </div>
              </div>
              <DashToggle active={notifPrefs.dailySummary} onToggle={() => updateNotifPref('dailySummary', !notifPrefs.dailySummary)} />
            </div>

            {/* Sound Alerts — wired to soundManager */}
            <div className="flex items-center justify-between" style={{ padding: '14px 16px', minHeight: '52px' }}>
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="flex items-center justify-center flex-shrink-0"
                  style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(245,158,11,0.15)' }}
                >
                  <Volume2 className="w-[14px] h-[14px] flex-shrink-0" style={{ color: 'var(--dash-warning)' }} />
                </div>
                <div className="min-w-0">
                  <p className="font-medium truncate" style={{ color: 'var(--dash-text)', fontSize: '15px' }}>
                    ASMR Sound Effects
                  </p>
                  <p className="text-[11px] mt-0.5" style={{ color: 'var(--dash-text-3)' }}>
                    Premium audio feedback for all actions
                  </p>
                </div>
              </div>
              <SoundToggle context="dashboard" variant="settings" />
            </div>
          </SectionCard>
        </section>

        {/* ═══ SECTION 2c — DISPLAY PREFERENCES ═══ */}
        <section className="mt-6 animate-dash-section-enter" style={{ animationDelay: '110ms' }}>
          <SectionLabel>
            <span className="flex items-center gap-2">
              Display Settings
              <Palette className="w-3 h-3" style={{ color: 'var(--dash-accent)' }} />
            </span>
          </SectionLabel>

          <SectionCard className="p-4">
            <div className="space-y-4">
              {/* Default Menu Theme */}
              <div>
                <DropdownSelect
                  value={menuDisplayTheme}
                  onChange={(val) => saveDisplayPrefs('menuTheme', val)}
                  options={MENU_DISPLAY_THEMES.map(t => ({ value: t.id, label: t.label }))}
                  label="Default Menu Theme"
                />
              </div>

              {/* Language Preference */}
              <div>
                <DropdownSelect
                  value={language}
                  onChange={(val) => saveDisplayPrefs('language', val)}
                  options={LANGUAGE_OPTIONS}
                  label="Language"
                />
              </div>

              {/* Currency Format */}
              <div>
                <DropdownSelect
                  value={currency}
                  onChange={(val) => saveDisplayPrefs('currency', val)}
                  options={CURRENCY_OPTIONS}
                  label="Currency Format"
                />
              </div>
            </div>
          </SectionCard>
        </section>

        {/* ═══ SECTION 3 — LOYALTY PROGRAM ═══ */}
        <section className="mt-6 animate-dash-section-enter" style={{ animationDelay: '120ms' }}>
          <SectionLabel>Loyalty Program</SectionLabel>

          <SectionCard>
            {isPro && !stampLoading && (
              <>
                {/* PRO Toggle Row */}
                <div className="flex items-center justify-between" style={{ padding: '14px 16px', minHeight: '52px', borderBottom: '1px solid var(--dash-border)' }}>
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="flex items-center justify-center flex-shrink-0"
                      style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(245, 158, 11, 0.15)' }}
                    >
                      <Crown className="w-[14px] h-[14px] flex-shrink-0" style={{ color: 'var(--dash-warning)' }} />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium truncate" style={{ color: 'var(--dash-text)', fontSize: '15px' }}>
                        Program Active
                      </p>
                      <p className="text-[11px] mt-0.5" style={{ color: 'var(--dash-text-3)' }}>
                        {isActive ? 'Customers can collect stamps' : 'Program is paused'}
                      </p>
                    </div>
                  </div>
                  <DashToggle active={isActive} onToggle={() => setIsActive(!isActive)} />
                </div>

                {/* Reward Name Row */}
                <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--dash-border)' }}>
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className="flex items-center justify-center flex-shrink-0"
                      style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(239,68,68,0.15)' }}
                    >
                      <Award className="w-[14px] h-[14px] flex-shrink-0" style={{ color: 'var(--dash-error)' }} />
                    </div>
                    <p className="font-medium" style={{ color: 'var(--dash-text)', fontSize: '15px' }}>
                      Reward Item
                    </p>
                  </div>
                  <input
                    type="text"
                    value={rewardName}
                    onChange={(e) => setRewardName(e.target.value)}
                    placeholder="e.g. Free Cappuccino"
                    className="dash-input rounded-xl text-sm w-full"
                    style={{ paddingLeft: '16px', paddingRight: '16px', paddingTop: '10px', paddingBottom: '10px', fontSize: '14px' }}
                  />
                </div>

                {/* Stamps Required Row */}
                <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--dash-border)' }}>
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className="flex items-center justify-center flex-shrink-0"
                      style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(59,130,246,0.15)' }}
                    >
                      <SettingsIcon className="w-[14px] h-[14px] flex-shrink-0" style={{ color: 'var(--dash-info)' }} />
                    </div>
                    <p className="font-medium" style={{ color: 'var(--dash-text)', fontSize: '15px' }}>
                      Stamps Required
                    </p>
                  </div>
                  <div className="" style={{ background: 'var(--dash-surface-2)', borderRadius: '14px', padding: '4px', display: 'flex', gap: '4px' }}>
                    {[6, 9, 12].map((n) => (
                      <button
                        key={n}
                        onClick={() => setStampsRequired(n)}
                        className="dash-btn flex-1 text-sm font-semibold min-h-[44px] py-2.5 animate-btn-press"
                        style={stampsRequired === n
                          ? { background: 'var(--dash-gradient)', color: '#fff', border: 'none', fontWeight: 700, padding: '12px', borderRadius: '10px', transition: 'all 150ms', cursor: 'pointer', fontSize: '15px', boxShadow: '0 4px 12px rgba(34,197,94,0.25)' }
                          : { background: 'transparent', border: 'none', color: 'var(--dash-text-3)', padding: '12px', borderRadius: '10px', transition: 'all 150ms', cursor: 'pointer', fontSize: '15px', fontWeight: 600 }
                        }
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Save Button Row */}
                <div style={{ padding: '14px 16px', borderBottom: stampData && stampData.customerCount > 0 ? '1px solid var(--dash-border)' : 'none' }}>
                  <button
                    onClick={handleSaveStampSettings}
                    disabled={stampSaving}
                    className="dash-btn-primary w-full min-h-[44px] animate-btn-press rounded-xl font-bold text-[16px]"
                    style={{ borderRadius: '12px' }}
                  >
                    {stampSaving ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Saving...
                      </span>
                    ) : (
                      'Save Settings'
                    )}
                  </button>
                </div>

                {/* Customers Row */}
                {stampData && stampData.customerCount > 0 && (
                  <div>
                    <button
                      onClick={() => setShowCustomers(!showCustomers)}
                      className="flex items-center justify-between w-full"
                      style={{ padding: '14px 16px', minHeight: '52px' }}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="flex items-center justify-center flex-shrink-0"
                          style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(59,130,246,0.15)' }}
                        >
                          <Users className="w-[14px] h-[14px] flex-shrink-0" style={{ color: 'var(--dash-info)' }} />
                        </div>
                        <p className="font-medium" style={{ color: 'var(--dash-text)', fontSize: '15px' }}>
                          {stampData.customerCount} Member{stampData.customerCount > 1 ? 's' : ''}
                        </p>
                      </div>
                      {showCustomers ? (
                        <ChevronUp className="w-4 h-4" style={{ color: 'var(--dash-text-3)' }} />
                      ) : (
                        <ChevronDown className="w-4 h-4" style={{ color: 'var(--dash-text-3)' }} />
                      )}
                    </button>

                    {showCustomers && (
                      <div
                        className="mx-4 mb-4 rounded-xl overflow-hidden max-h-64 overflow-y-auto premium-scroll animate-fade-in"
                        style={{ background: 'var(--dash-surface-2)' }}
                      >
                        {stampData.customers.map((customer) => (
                          <div
                            key={customer.id}
                            className="flex items-center justify-between px-4 py-3"
                            style={{ borderBottom: '1px solid var(--dash-border)' }}
                          >
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium truncate" style={{ color: 'var(--dash-text)' }}>
                                {customer.name || 'Unknown'}
                              </p>
                              <p className="text-[11px] mt-0.5" style={{ color: 'var(--dash-text-3)' }}>
                                {customer.phone_number}
                              </p>
                            </div>
                            <span className="text-xs flex-shrink-0 ml-3" style={{ color: 'var(--dash-text-2)' }}>
                              {customer.total_orders} visit{customer.total_orders !== 1 ? 's' : ''}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Rewards Management Row */}
                {stampData && stampData.settings && stampData.settings.is_active && (
                  <div>
                    <button
                      onClick={() => setShowRewards(!showRewards)}
                      className="flex items-center justify-between w-full"
                      style={{ padding: '14px 16px', minHeight: '52px' }}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="flex items-center justify-center flex-shrink-0"
                          style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(34,197,94,0.15)' }}
                        >
                          <Gift className="w-[14px] h-[14px] flex-shrink-0" style={{ color: '#22c55e' }} />
                        </div>
                        <p className="font-medium" style={{ color: 'var(--dash-text)', fontSize: '15px' }}>
                          Rewards
                        </p>
                        {rewardsData && rewardsData.activeCount > 0 && (
                          <span
                            className="flex items-center justify-center flex-shrink-0"
                            style={{
                              minWidth: 20, height: 20, borderRadius: '50%',
                              background: '#ef4444', color: '#fff',
                              fontSize: 10, fontWeight: 800, padding: '0 5px',
                            }}
                          >
                            {rewardsData.activeCount}
                          </span>
                        )}
                      </div>
                      {showRewards ? (
                        <ChevronUp className="w-4 h-4" style={{ color: 'var(--dash-text-3)' }} />
                      ) : (
                        <ChevronDown className="w-4 h-4" style={{ color: 'var(--dash-text-3)' }} />
                      )}
                    </button>

                    {showRewards && (
                      <div
                        className="mx-4 mb-4 rounded-xl overflow-hidden animate-fade-in"
                        style={{ background: 'var(--dash-surface-2)' }}
                      >
                        {!rewardsData ? (
                          <div className="flex items-center justify-center gap-2 py-6" style={{ color: 'var(--dash-text-3)', fontSize: 13 }}>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Loading rewards...
                          </div>
                        ) : rewardsData.rewards.length === 0 ? (
                          <div className="text-center py-6 px-4">
                            <p className="text-sm" style={{ color: 'var(--dash-text-3)' }}>
                              No rewards yet. Customers earn rewards by collecting stamps.
                            </p>
                          </div>
                        ) : (
                          <div className="max-h-80 overflow-y-auto premium-scroll">
                            {rewardsData.rewards.map((reward) => {
                              const isExpired = new Date(reward.expires_at) < new Date()
                              const customerName = reward.customers?.name || 'Unknown'
                              const customerPhone = reward.customers?.phone_number || '—'

                              return (
                                <div
                                  key={reward.id}
                                  className="px-4 py-3"
                                  style={{ borderBottom: '1px solid var(--dash-border)' }}
                                >
                                  <div className="flex items-start justify-between">
                                    <div className="min-w-0 flex-1">
                                      <div className="flex items-center gap-2 mb-1">
                                        <span
                                          className="font-mono text-xs font-bold px-2 py-0.5 rounded flex-shrink-0"
                                          style={{
                                            background: reward.is_used ? 'rgba(34,197,94,0.1)' : isExpired ? 'rgba(107,114,128,0.1)' : 'rgba(239,68,68,0.1)',
                                            color: reward.is_used ? '#22c55e' : isExpired ? '#6B7280' : '#ef4444',
                                          }}
                                        >
                                          {reward.reward_code}
                                        </span>
                                        <span
                                          className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase flex-shrink-0"
                                          style={{
                                            background: reward.is_used ? 'rgba(34,197,94,0.1)' : isExpired ? 'rgba(107,114,128,0.1)' : 'rgba(239,68,68,0.1)',
                                            color: reward.is_used ? '#22c55e' : isExpired ? '#6B7280' : '#ef4444',
                                          }}
                                        >
                                          {reward.is_used ? 'Redeemed' : isExpired ? 'Expired' : 'Active'}
                                        </span>
                                      </div>
                                      <p className="text-sm font-medium" style={{ color: 'var(--dash-text)' }}>
                                        {customerName}
                                      </p>
                                      <p className="text-[11px] mt-0.5" style={{ color: 'var(--dash-text-3)' }}>
                                        📞 {customerPhone}
                                      </p>
                                    </div>
                                    {!reward.is_used && !isExpired && (
                                      <button
                                        onClick={() => handleRedeemReward(reward.id)}
                                        disabled={redeemingId === reward.id}
                                        className="flex items-center justify-center flex-shrink-0 animate-btn-press"
                                        style={{
                                          height: 32,
                                          borderRadius: 8,
                                          padding: '0 12px',
                                          fontSize: 11,
                                          fontWeight: 700,
                                          background: redeemingId === reward.id ? 'rgba(107,114,128,0.2)' : 'linear-gradient(135deg, #22c55e, #16a34a)',
                                          color: '#fff',
                                          border: 'none',
                                          cursor: redeemingId === reward.id ? 'not-allowed' : 'pointer',
                                          marginLeft: 8,
                                          minWidth: 44,
                                        }}
                                      >
                                        {redeemingId === reward.id ? (
                                          <Loader2 className="w-3 h-3 animate-spin" />
                                        ) : (
                                          <Check className="w-3 h-3" />
                                        )}
                                      </button>
                                    )}
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}

            {/* BASIC plan loyalty upgrade row */}
            {!isPro && (
              <SettingsRow
                icon={Award}
                iconBg="rgba(168,85,247,0.15)"
                iconColor="var(--dash-special)"
                label="Loyalty Stamps"
                noBorder
              >
                <span className="dash-badge-pro text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0">
                  PRO
                </span>
              </SettingsRow>
            )}

            {/* PRO loading row */}
            {isPro && stampLoading && (
              <div className="flex items-center justify-between" style={{ padding: '14px 16px', minHeight: '52px' }}>
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="flex items-center justify-center flex-shrink-0"
                    style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(168,85,247,0.15)' }}
                  >
                    <Crown className="w-[14px] h-[14px] flex-shrink-0" style={{ color: 'var(--dash-special)' }} />
                  </div>
                  <p className="font-medium" style={{ color: 'var(--dash-text-3)', fontSize: '15px' }}>
                    Loading...
                  </p>
                </div>
                <Loader2 className="w-4 h-4 animate-spin" style={{ color: 'var(--dash-text-3)' }} />
              </div>
            )}
          </SectionCard>

          {/* BASIC Upgrade Prompt Card */}
          {!isPro && (
            <div
              className="mt-3 rounded-2xl p-4 animate-dash-section-enter"
              style={{ background: 'var(--dash-surface-2)', border: '1px solid rgba(245, 158, 11, 0.15)' }}
            >
              <div className="flex items-start gap-3">
                <div
                  className="flex items-center justify-center flex-shrink-0"
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    background: 'rgba(245, 158, 11, 0.12)',
                  }}
                >
                  <Award className="w-[18px] h-[18px]" style={{ color: 'var(--dash-warning)' }} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold mb-0.5" style={{ color: 'var(--dash-text)' }}>Loyalty Stamp Cards</p>
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--dash-text-3)' }}>
                    Keep customers coming back with a stamp card system.{' '}
                    <span className="font-semibold" style={{ color: 'var(--dash-error)' }}>Upgrade to PRO</span> to unlock loyalty stamps, customer database, and more.
                  </p>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* ═══ SECTION 4 — QR CODES ═══ */}
        <section className="mt-6 animate-dash-section-enter" style={{ animationDelay: '180ms' }}>
          <SectionLabel>QR Codes</SectionLabel>

          {/* QR Size Selector + Copy Link Bar */}
          {hasTables && (
            <div className="flex items-center justify-between mb-3 px-1">
              <div className="flex items-center gap-1">
                {QR_SIZES.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => updateQrSize(s.id)}
                    className="animate-btn-press"
                    style={{
                      padding: '6px 12px',
                      borderRadius: '8px',
                      fontSize: '11px',
                      fontWeight: 600,
                      border: 'none',
                      cursor: 'pointer',
                      background: qrSize === s.id ? 'var(--dash-gradient)' : 'var(--dash-surface-2)',
                      color: qrSize === s.id ? '#fff' : 'var(--dash-text-3)',
                      boxShadow: qrSize === s.id ? '0 2px 8px rgba(34,197,94,0.25)' : 'none',
                      transition: 'all 150ms',
                      minWidth: '44px',
                      minHeight: '36px',
                    }}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
              <button
                onClick={handleCopyQrLink}
                className="flex items-center gap-1.5 animate-btn-press"
                style={{
                  padding: '6px 12px',
                  borderRadius: '8px',
                  fontSize: '11px',
                  fontWeight: 600,
                  background: 'var(--dash-surface-2)',
                  color: 'var(--dash-text-2)',
                  border: '1px solid var(--dash-border)',
                  cursor: 'pointer',
                  transition: 'all 150ms',
                  minHeight: '36px',
                }}
              >
                <Copy className="w-3 h-3" />
                Copy Link
              </button>
            </div>
          )}

          <SectionCard>
            {/* Tables Configured Row */}
            <SettingsRow
              icon={QrCode}
              iconBg="rgba(34,197,94,0.15)"
              iconColor="var(--dash-accent)"
              label="Tables Configured"
            >
              <div className="flex items-center gap-1.5">
                <span className="dash-badge text-[12px] font-bold px-2.5 py-1 rounded-full" style={{
                  background: hasTables ? 'rgba(34,197,94,0.15)' : 'var(--dash-surface-2)',
                  color: hasTables ? 'var(--dash-accent)' : 'var(--dash-text-3)',
                }}>
                  {currentCount}
                </span>
                <ChevronRight className="w-4 h-4" style={{ color: 'var(--dash-text-3)' }} />
              </div>
            </SettingsRow>

            {!hasTables ? (
              /* Generate QR Codes Input Area */
              <div style={{ padding: '14px 16px' }}>
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="flex items-center justify-center flex-shrink-0"
                    style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(59,130,246,0.15)' }}
                  >
                    <Plus className="w-[14px] h-[14px] flex-shrink-0" style={{ color: 'var(--dash-info)' }} />
                  </div>
                  <p className="font-medium" style={{ color: 'var(--dash-text)', fontSize: '15px' }}>
                    Generate QR Codes
                  </p>
                </div>
                <div className="max-w-[200px] mb-3">
                  <input
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={maxTables}
                    value={tableCount}
                    onChange={(e) => setTableCount(e.target.value)}
                    placeholder={String(Math.min(10, maxTables))}
                    className="dash-input rounded-xl text-center text-lg font-semibold w-full [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    style={{ fontFamily: 'var(--font-mono)' }}
                  />
                </div>
                <button
                  onClick={handleGenerate}
                  disabled={generating || !tableCount}
                  className="dash-btn-primary min-h-[44px] animate-btn-press"
                  style={{ borderRadius: '12px' }}
                >
                  {generating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      Generate QR Codes
                    </>
                  )}
                </button>
                <p className="text-[11px] mt-2" style={{ color: 'var(--dash-text-3)' }}>
                  Up to {maxTables} tables on {data?.restaurant.plan} plan
                </p>
              </div>
            ) : (
              <>
                {/* Print Row */}
                <SettingsRow
                  icon={Printer}
                  iconBg="rgba(59,130,246,0.15)"
                  iconColor="var(--dash-info)"
                  label="Print QR Codes"
                  onClick={handlePrint}
                >
                  <ChevronRight className="w-4 h-4" style={{ color: 'var(--dash-text-3)' }} />
                </SettingsRow>

                {/* Regenerate Row */}
                <SettingsRow
                  icon={RefreshCw}
                  iconBg="rgba(245,158,11,0.15)"
                  iconColor="var(--dash-warning)"
                  label="Regenerate Codes"
                  onClick={handleRegenerate}
                >
                  <ChevronRight className="w-4 h-4" style={{ color: 'var(--dash-text-3)' }} />
                </SettingsRow>

                {/* Remove All Row */}
                <SettingsRow
                  icon={Trash2}
                  iconBg="rgba(239,68,68,0.15)"
                  iconColor="var(--dash-error)"
                  label="Remove All Tables"
                  labelColor="var(--dash-error)"
                  onClick={handleDeleteAll}
                  noBorder
                >
                  <ChevronRight className="w-4 h-4" style={{ color: 'var(--dash-error)' }} />
                </SettingsRow>
              </>
            )}
          </SectionCard>
        </section>

        {/* ─── Generating Overlay ─── */}
        {generating && (
          <div
            className="mt-4 rounded-2xl p-4 text-center animate-fade-in"
            style={{ background: 'var(--dash-surface-2)', border: '1px solid rgba(245, 158, 11, 0.15)' }}
          >
            <div className="flex items-center justify-center gap-3 mb-2">
              <div className="relative">
                <Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--dash-accent)' }} />
              </div>
              <span className="text-sm font-semibold" style={{ color: 'var(--dash-text)' }}>
                Generating QR Codes...
              </span>
            </div>
            <p className="text-xs" style={{ color: 'var(--dash-warning)' }}>
              This may take a moment. Creating {tableCount} table QR codes and
              uploading images.
            </p>
          </div>
        )}

        {/* ─── Regenerate Confirmation ─── */}
        {showRegenConfirm && hasTables && (
          <div
            className="mt-4 rounded-2xl p-4 animate-fade-in"
            style={{ background: 'var(--dash-surface-2)', border: '1px solid rgba(239, 68, 68, 0.15)' }}
          >
            <div className="flex items-start gap-3 mb-3">
              <div
                className="flex items-center justify-center flex-shrink-0"
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: 'rgba(239, 68, 68, 0.12)',
                }}
              >
                <AlertTriangle className="w-4 h-4" style={{ color: 'var(--dash-error)' }} />
              </div>
              <div>
                <p className="text-sm font-semibold" style={{ color: 'var(--dash-text)' }}>
                  Are you sure?
                </p>
                <p className="text-xs mt-0.5 leading-relaxed" style={{ color: 'var(--dash-text-3)' }}>
                  This will delete all existing QR codes and generate new ones. You must reprint and replace all QR codes at your tables.
                </p>
              </div>
            </div>

            {/* New count input */}
            <div className="flex items-center gap-2 mb-3">
              <label className="text-xs font-medium whitespace-nowrap" style={{ color: 'var(--dash-text-3)' }}>
                New count:
              </label>
              <input
                type="number"
                inputMode="numeric"
                min={1}
                max={maxTables}
                value={tableCount}
                onChange={(e) => setTableCount(e.target.value)}
                className="dash-input rounded-xl flex-1 max-w-[100px] text-center text-base font-semibold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                style={{ fontFamily: 'var(--font-mono)' }}
              />
              <span className="text-xs" style={{ color: 'var(--dash-text-3)' }}>
                / {maxTables} max
              </span>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setShowRegenConfirm(false)}
                className="dash-btn dash-btn-ghost flex-1 min-h-[44px] animate-btn-press rounded-xl"
                style={{ background: 'var(--dash-surface-3)', color: 'var(--dash-text)' }}
              >
                Cancel
              </button>
              <button
                onClick={handleGenerate}
                disabled={generating}
                className="dash-btn dash-btn-danger flex-1 min-h-[44px] animate-btn-press rounded-xl"
              >
                {generating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                Regenerate
              </button>
            </div>
          </div>
        )}

        {/* ─── Tables Grid ─── */}
        {hasTables && !generating && (
          <div className="mt-6">
            {/* ── Master QR Card ── */}
            {data.masterQrUrl && (
              <div
                className="mb-4 p-6 flex flex-col items-center animate-dash-section-enter"
                style={{
                  background: 'var(--dash-surface)',
                  borderRadius: '20px',
                  boxShadow: '0 0 20px rgba(34,197,94,0.08), var(--dash-shadow-card)',
                  border: '1.5px solid rgba(34,197,94,0.2)',
                }}
              >
                <div className="flex items-center gap-1.5 mb-3">
                  <Sparkles className="w-3.5 h-3.5" style={{ color: 'var(--dash-accent)' }} />
                  <span
                    style={{ fontSize: '11px', fontWeight: 700, color: 'var(--dash-accent)', textTransform: 'uppercase', letterSpacing: '0.1em' }}
                  >
                    Master QR Code
                  </span>
                </div>
                <img
                  src={data.masterQrUrl}
                  alt="Walk-in QR Code"
                  className="rounded-xl"
                  style={{ width: QR_SIZES.find(s => s.id === qrSize)?.px || 120, height: QR_SIZES.find(s => s.id === qrSize)?.px || 120, padding: '8px', background: '#fff', boxShadow: '0 2px 12px rgba(0,0,0,0.3)' }}
                  onError={handleImgError}
                />
                {/* Download Master QR Button */}
                <button
                  onClick={() => handleDownloadQr(data.masterQrUrl!, 'master-qr.png')}
                  className="mt-2 flex items-center gap-1.5 no-underline animate-btn-press"
                  style={{
                    background: 'var(--dash-surface-2)',
                    borderRadius: '100px',
                    padding: '8px 16px',
                    fontSize: '13px',
                    fontWeight: 600,
                    color: 'var(--dash-text-2)',
                    border: '1px solid var(--dash-border)',
                    cursor: 'pointer',
                    minHeight: '44px',
                  }}
                >
                  <Download className="w-3.5 h-3.5" />
                  Download as PNG
                </button>
                <p className="text-[15px] font-bold mt-3" style={{ color: 'var(--dash-text)' }}>
                  Walk-in / Takeaway
                </p>
                <p className="text-[12px] mt-0.5" style={{ color: 'var(--dash-text-3)' }}>
                  Customers without table number scan this
                </p>
              </div>
            )}

            {/* ── Table Cards Grid ── */}
            <div className="grid grid-cols-2" style={{ gap: '10px' }}>
              {data.tables.map((table) => {
                const isExpanded = expandedCard === table.id
                return (
                  <div
                    key={table.id}
                    className="p-4 flex flex-col items-center transition-all duration-200"
                    style={{
                      background: 'var(--dash-surface)',
                      borderRadius: '16px',
                      boxShadow: 'var(--dash-shadow-card)',
                      border: '1px solid var(--dash-border)',
                    }}
                  >
                    <div
                      className="flex flex-col items-center cursor-pointer w-full"
                      onClick={() => toggleExpand(table.id)}
                    >
                      {table.qr_code_url ? (
                        <img
                          src={table.qr_code_url}
                          alt={`Table ${table.table_number} QR`}
                          className="rounded-xl transition-all duration-200"
                          style={{
                            background: 'var(--dash-surface-2)',
                            width: isExpanded ? '100%' : (QR_SIZES.find(s => s.id === qrSize)?.px || 100),
                            height: isExpanded ? 'auto' : (QR_SIZES.find(s => s.id === qrSize)?.px || 100),
                            objectFit: 'contain',
                            borderRadius: '8px',
                          }}
                          onError={handleImgError}
                        />
                      ) : (
                        <div
                          className="flex items-center justify-center"
                          style={{ width: '100px', height: '100px', borderRadius: '8px', background: 'var(--dash-surface-2)' }}
                        >
                          <QrCode className="w-8 h-8" style={{ color: 'var(--dash-text-3)' }} />
                        </div>
                      )}
                      <p className="text-[14px] font-bold mt-2" style={{ fontSize: '14px', fontWeight: 700, marginTop: '10px', color: 'var(--dash-text)' }}>
                        Table {table.table_number}
                      </p>
                      <span className="text-[10px] mt-0.5" style={{ color: 'var(--dash-text-3)' }}>
                        {isExpanded ? 'Tap to collapse ↑' : 'Tap to expand ↓'}
                      </span>
                    </div>

                    {/* Download button — always visible */}
                    {table.qr_code_url && (
                      <button
                        onClick={() => handleDownloadQr(table.qr_code_url!, `table-${table.table_number}-qr.png`)}
                        className="mt-2 flex items-center gap-1.5 no-underline animate-btn-press"
                        style={{
                          background: 'var(--dash-surface-2)',
                          borderRadius: '100px',
                          padding: '6px 12px',
                          fontSize: '12px',
                          fontWeight: 600,
                          color: 'var(--dash-text-2)',
                          border: '1px solid var(--dash-border)',
                          cursor: 'pointer',
                          minHeight: '36px',
                        }}
                      >
                        <Download className="w-3 h-3" />
                        Download
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ═══ SECTION 5 — DANGER ZONE ═══ */}
        <section className="mt-8 animate-dash-section-enter" style={{ animationDelay: '240ms' }}>
          <SectionLabel>
            <span className="flex items-center gap-2" style={{ color: 'var(--dash-error)' }}>
              Danger Zone
              <ShieldAlert className="w-3 h-3" style={{ color: 'var(--dash-error)' }} />
            </span>
          </SectionLabel>

          <SectionCard style={{ borderColor: 'rgba(239,68,68,0.2)' }}>
            {/* Delete Account Row */}
            <div className="flex items-center justify-between" style={{ padding: '14px 16px', minHeight: '52px', borderBottom: '1px solid rgba(239,68,68,0.1)' }}>
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="flex items-center justify-center flex-shrink-0"
                  style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(239,68,68,0.15)' }}
                >
                  <Trash2 className="w-[14px] h-[14px] flex-shrink-0" style={{ color: 'var(--dash-error)' }} />
                </div>
                <div className="min-w-0">
                  <p className="font-medium truncate" style={{ color: 'var(--dash-text)', fontSize: '15px' }}>
                    Delete Account
                  </p>
                  <p className="text-[11px] mt-0.5" style={{ color: 'var(--dash-text-3)' }}>
                    Permanently delete your restaurant account
                  </p>
                </div>
              </div>
              <button
                disabled
                title="Contact support to delete"
                className="min-h-[44px] px-4 rounded-xl font-bold text-[13px] animate-btn-press"
                style={{
                  background: 'rgba(239,68,68,0.1)',
                  color: 'rgba(239,68,68,0.5)',
                  border: '1px solid rgba(239,68,68,0.15)',
                  cursor: 'not-allowed',
                  opacity: 0.6,
                }}
              >
                Delete
              </button>
            </div>

            {/* Reset Settings Row */}
            <div className="flex items-center justify-between" style={{ padding: '14px 16px', minHeight: '52px' }}>
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="flex items-center justify-center flex-shrink-0"
                  style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(245,158,11,0.15)' }}
                >
                  <RotateCcw className="w-[14px] h-[14px] flex-shrink-0" style={{ color: 'var(--dash-warning)' }} />
                </div>
                <div className="min-w-0">
                  <p className="font-medium truncate" style={{ color: 'var(--dash-text)', fontSize: '15px' }}>
                    Reset Settings
                  </p>
                  <p className="text-[11px] mt-0.5" style={{ color: 'var(--dash-text-3)' }}>
                    Clear all saved preferences to defaults
                  </p>
                </div>
              </div>
              <button
                onClick={handleResetSettings}
                className="min-h-[44px] px-4 rounded-xl font-bold text-[13px] animate-btn-press flex items-center gap-1.5"
                style={{
                  background: 'rgba(245,158,11,0.1)',
                  color: 'var(--dash-warning)',
                  border: '1px solid rgba(245,158,11,0.2)',
                  cursor: 'pointer',
                }}
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset
              </button>
            </div>
          </SectionCard>
        </section>

        {/* ═══ SECTION 6 — ACCOUNT ═══ */}
        <section className="mt-6 animate-dash-section-enter" style={{ animationDelay: '260ms' }}>
          <SectionLabel>Account</SectionLabel>

          <SectionCard>
            <button
              onClick={() => signOut({ redirect: true, callbackUrl: '/login' })}
              className="flex items-center w-full"
              style={{ padding: '14px 16px', minHeight: '52px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', color: 'inherit' }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="flex items-center justify-center flex-shrink-0"
                  style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(239,59,48,0.12)' }}
                >
                  <LogOut className="w-[14px] h-[14px] flex-shrink-0" style={{ color: 'var(--dash-error)' }} />
                </div>
                <span style={{ fontSize: '15px', color: 'var(--dash-error)', fontWeight: 500 }}>Sign Out</span>
              </div>
            </button>
          </SectionCard>
        </section>

        {/* ─── Info Box ─── */}
        <div
          className="mt-6 rounded-2xl animate-dash-section-enter"
          style={{
            background: 'var(--dash-surface)',
            padding: '14px 16px',
            border: '1px solid var(--dash-border)',
          }}
        >
          <div className="flex items-start gap-3">
            <Info className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: 'var(--dash-text-3)' }} />
            <div>
              <p className="text-xs font-semibold mb-1" style={{ color: 'var(--dash-text)' }}>
                How QR codes work
              </p>
              <p className="text-[11px] leading-relaxed" style={{ color: 'var(--dash-text-3)' }}>
                Each table gets a unique QR code. When customers scan it, they
                see your menu with the correct table number pre-selected. When
                they place an order, the table number is saved automatically.
                The <strong style={{ color: 'var(--dash-text-2)' }}>Master QR</strong> is for walk-in customers and
                takeaway orders.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
