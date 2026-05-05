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
  DownloadCloud,
  Palette,
  Check,
  Sparkles,
  Gift,
} from 'lucide-react'
import { signOut } from 'next-auth/react'
import type { Restaurant, RestaurantTable, StampSettings, Customer, ThemeName } from '@/types'
import { handleImgError } from '@/lib/utils'

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

interface ThemeOption {
  id: string
  name: string
  preview: {
    bg: string
    cardBg: string
    textColor: string
    accent: string
    subtitleColor: string
  }
}

const THEMES: ThemeOption[] = [
  {
    id: 'dark',
    name: 'Dark Luxury',
    preview: { bg: '#09090B', cardBg: '#131316', textColor: '#FAFAFA', accent: '#F59E0B', subtitleColor: '#A1A1AA' },
  },
  {
    id: 'emerald',
    name: 'Emerald Green',
    preview: { bg: '#060D09', cardBg: '#0D1A14', textColor: '#F0FDF4', accent: '#10B981', subtitleColor: '#86EFAC' },
  },
  {
    id: 'sunset',
    name: 'Sunset Orange',
    preview: { bg: '#0C0806', cardBg: '#181310', textColor: '#FFF7ED', accent: '#F97316', subtitleColor: '#FDBA74' },
  },
  {
    id: 'royal',
    name: 'Royal Purple',
    preview: { bg: '#08060F', cardBg: '#120F1E', textColor: '#FAF5FF', accent: '#A855F7', subtitleColor: '#C4B5FD' },
  },
]

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

function SectionCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`dash-card overflow-hidden ${className}`}>
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
      className="flex items-center w-full text-left"
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
// Theme Preview Card
// ────────────────────────────

function ThemePreviewCard({
  theme,
  isSelected,
  onClick,
}: {
  theme: ThemeOption
  isSelected: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="flex-shrink-0 w-[140px] rounded-2xl overflow-hidden transition-all duration-200"
      style={{
        border: isSelected ? '2px solid var(--dash-accent)' : '2px solid var(--dash-border)',
        boxShadow: isSelected ? '0 0 20px rgba(34, 197, 94, 0.25)' : 'none',
        background: 'var(--dash-surface)',
        cursor: 'pointer',
        padding: '0',
      }}
    >
      {/* Mini preview area */}
      <div
        className="relative h-[80px] w-full flex flex-col items-center justify-center gap-1 overflow-hidden"
        style={{ background: theme.preview.bg }}
      >
        {/* Mock header bar */}
        <div
          className="w-[60%] h-[6px] rounded-full"
          style={{ background: theme.preview.textColor, opacity: 0.7 }}
        />
        {/* Mock cards */}
        <div className="flex gap-1.5 mt-1.5">
          <div
            className="w-[28px] h-[28px] rounded-lg"
            style={{ background: theme.preview.cardBg }}
          />
          <div
            className="w-[28px] h-[28px] rounded-lg"
            style={{ background: theme.preview.cardBg }}
          />
          <div
            className="w-[28px] h-[28px] rounded-lg"
            style={{ background: theme.preview.cardBg }}
          />
        </div>
        {/* Selected checkmark */}
        {isSelected && (
          <div
            className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center"
            style={{ background: 'var(--dash-accent)' }}
          >
            <Check className="w-3 h-3" style={{ color: '#fff' }} />
          </div>
        )}
      </div>
      {/* Theme name */}
      <div className="py-2 px-3 flex items-center justify-center" style={{ background: 'var(--dash-surface-2)' }}>
        <span className="text-[11px] font-semibold truncate" style={{ color: 'var(--dash-text-2)' }}>
          {theme.name}
        </span>
      </div>
    </button>
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

  // Theme state
  const [selectedTheme, setSelectedTheme] = useState<string>('dark')
  const [themeSaving, setThemeSaving] = useState(false)
  const [whatsappNumber, setWhatsappNumber] = useState('')
  const [whatsappSaving, setWhatsappSaving] = useState(false)

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
    console.log('[Settings] data loaded, whatsapp:', data?.restaurant?.whatsapp_number, 'theme:', data?.restaurant?.theme, 'restaurantId:', data?.restaurant?.id)
    if (data?.restaurant?.whatsapp_number) {
      setWhatsappNumber(data.restaurant.whatsapp_number)
    } else if (data?.restaurant) {
      // Explicitly clear if field is empty in DB
      setWhatsappNumber('')
    }
    if (data?.restaurant?.theme) {
      setSelectedTheme(data.restaurant.theme)
    }
  }, [data])

  // ─── WhatsApp handler ───
  const handleSaveWhatsapp = useCallback(async () => {
    const clean = whatsappNumber.replace(/[\+\s\-()]/g, '').trim()
    if (clean.length > 0 && clean.length < 10) {
      toast.error('Phone number must be at least 10 digits')
      return
    }
    setWhatsappSaving(true)
    console.log('[Settings] Saving WhatsApp number:', clean)
    try {
      const res = await fetch('/api/restaurant', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ whatsapp_number: clean }),
      })
      if (!res.ok) {
        const err = await res.json()
        console.error('[Settings] WhatsApp save failed:', err)
        throw new Error(err.error || 'Failed to save')
      }
      const result = await res.json()
      console.log('[Settings] WhatsApp save response:', result)

      // Immediately update local state from the PATCH response
      if (result.restaurant?.whatsapp_number !== undefined) {
        setWhatsappNumber(result.restaurant.whatsapp_number)
        console.log('[Settings] WhatsApp number confirmed saved:', result.restaurant.whatsapp_number)
      }

      toast.success('WhatsApp number updated!')
      fetchTables() // also re-fetch to keep data in sync
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save'
      console.error('[Settings] WhatsApp error:', msg)
      toast.error(msg)
    } finally {
      setWhatsappSaving(false)
    }
  }, [whatsappNumber, fetchTables])

  // ─── Theme handler ───
  const handleThemeSelect = useCallback(async (themeId: string) => {
    setSelectedTheme(themeId)
    setThemeSaving(true)
    try {
      const res = await fetch('/api/restaurant', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ theme: themeId }),
      })
      if (res.ok) {
        toast.success('Theme updated!')
      }
      // If it fails, keep the local state — API may not support theme yet
    } catch {
      // Local state is already set, that's fine
    } finally {
      setThemeSaving(false)
    }
  }, [])

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
      setData({
        restaurant: data!.restaurant,
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
      setData({ ...data!, tables: [], masterQrUrl: null })
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

        {/* ═══ SECTION 2 — MENU THEME ═══ */}
        <section className="mt-6 animate-dash-section-enter" style={{ animationDelay: '60ms' }}>
          <SectionLabel>
            <span className="flex items-center gap-2">
              Menu Theme
              <Palette className="w-3 h-3" style={{ color: 'var(--dash-accent)' }} />
            </span>
            <span className="dash-badge-pro text-[9px] font-bold px-2 py-0.5 rounded-full ml-1">CUSTOMIZE</span>
          </SectionLabel>

          <SectionCard className="p-4">
            {/* Scrollable theme row */}
            <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2" style={{ touchAction: 'pan-x' }}>
              {THEMES.map((theme) => (
                <ThemePreviewCard
                  key={theme.id}
                  theme={theme}
                  isSelected={selectedTheme === theme.id}
                  onClick={() => handleThemeSelect(theme.id)}
                />
              ))}
            </div>

            {/* Selected theme name with indicator */}
            <div className="flex items-center justify-center gap-2 mt-3 pt-3" style={{ borderTop: '1px solid var(--dash-border)' }}>
              {themeSaving ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" style={{ color: 'var(--dash-accent)' }} />
              ) : (
                <Check className="w-3.5 h-3.5" style={{ color: 'var(--dash-accent)' }} />
              )}
              <span className="text-xs font-semibold" style={{ color: 'var(--dash-text-2)' }}>
                {THEMES.find(t => t.id === selectedTheme)?.name || 'Dark Luxury'} theme active
              </span>
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
                  style={{ width: '120px', height: '120px', padding: '8px', background: '#fff', boxShadow: '0 2px 12px rgba(0,0,0,0.3)' }}
                  onError={handleImgError}
                />
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
                            width: isExpanded ? '100%' : '100px',
                            height: isExpanded ? 'auto' : '100px',
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

                    {/* Download button when expanded */}
                    {isExpanded && table.qr_code_url && (
                      <a
                        href={table.qr_code_url}
                        download={`table-${table.table_number}-qr.png`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-3 flex items-center gap-1.5 no-underline"
                        style={{
                          background: 'var(--dash-surface-2)',
                          borderRadius: '100px',
                          padding: '8px 16px',
                          fontSize: '13px',
                          fontWeight: 600,
                          color: 'var(--dash-text-2)',
                          border: '1px solid var(--dash-border)',
                        }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <DownloadCloud className="w-3.5 h-3.5" />
                        Save QR
                      </a>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ═══ SECTION 5 — ACCOUNT ═══ */}
        <section className="mt-6 animate-dash-section-enter" style={{ animationDelay: '240ms' }}>
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
