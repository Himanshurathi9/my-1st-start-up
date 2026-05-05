'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  Search,
  Plus,
  Store,
  Loader2,
  CalendarClock,
  Copy,
  Check,
  X,
  ExternalLink,
  Eye,
  EyeOff,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { cn, formatDate, daysUntilExpiry, isPlanExpired } from '@/lib/utils'

interface RestaurantInfo {
  id: string
  owner_id: string
  name: string
  slug: string
  logo_url: string | null
  whatsapp_number: string
  is_open: boolean
  plan: 'BASIC' | 'PRO'
  plan_start_date: string | null
  plan_expiry_date: string | null
  owner_email: string
  categories_count: number
  menu_items_count: number
  tables_count: number
  banners_count: number
  created_at: string
}

type FilterType = 'ALL' | 'BASIC' | 'PRO' | 'EXPIRED'

const darkStyles = {
  bg: '#0A0A0A',
  surface: '#111111',
  surfaceRaised: '#161616',
  border: 'rgba(255,255,255,0.08)',
  borderStrong: 'rgba(255,255,255,0.15)',
  textPrimary: '#FFFFFF',
  textSecondary: 'rgba(255,255,255,0.6)',
  textMuted: 'rgba(255,255,255,0.3)',
  accent: '#E63946',
  green: '#34C759',
  orange: '#FF9500',
  red: '#FF3B30',
} as const

function SkeletonRestaurants() {
  return (
    <div>
      {/* Header skeleton */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <div style={{ width: '160px', height: '28px', borderRadius: '8px', background: 'linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite' }} />
          <div style={{ width: '64px', height: '16px', borderRadius: '6px', marginTop: '6px', background: 'linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite' }} />
        </div>
        <div style={{ width: '180px', height: '40px', borderRadius: '100px', background: 'linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite' }} />
      </div>
      {/* Search skeleton */}
      <div style={{ width: '400px', maxWidth: '100%', height: '44px', borderRadius: '10px', marginBottom: '12px', background: 'linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite' }} />
      {/* Filter skeleton */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        {[120, 90, 80, 90].map((w, i) => (
          <div key={i} style={{ width: `${w}px`, height: '32px', borderRadius: '100px', background: 'linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite' }} />
        ))}
      </div>
      {/* Card skeletons */}
      {[...Array(4)].map((_, i) => (
        <div key={i} style={{ height: '88px', borderRadius: '14px', marginBottom: '8px', background: 'linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite' }} />
      ))}
      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>
    </div>
  )
}

function getStatusInfo(expiryDate: string | null) {
  if (!expiryDate) return { label: 'No Expiry', color: '#A8A89E', bg: 'rgba(168,168,158,0.1)', border: 'rgba(168,168,158,0.2)' }
  const expired = isPlanExpired(expiryDate)
  const days = daysUntilExpiry(expiryDate)
  if (expired) return { label: 'Expired', color: darkStyles.red, bg: 'rgba(255,59,48,0.1)', border: 'rgba(255,59,48,0.2)' }
  if (days <= 3) return { label: `${days}d left`, color: darkStyles.red, bg: 'rgba(255,59,48,0.1)', border: 'rgba(255,59,48,0.2)' }
  if (days <= 7) return { label: `${days}d left`, color: darkStyles.orange, bg: 'rgba(255,149,0,0.1)', border: 'rgba(255,149,0,0.2)' }
  return { label: 'Active', color: darkStyles.green, bg: 'rgba(52,199,89,0.1)', border: 'rgba(52,199,89,0.2)' }
}

export default function AdminRestaurantsPage() {
  const router = useRouter()
  const [restaurants, setRestaurants] = useState<RestaurantInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<FilterType>('ALL')

  // Create restaurant sheet
  const [showCreateSheet, setShowCreateSheet] = useState(false)
  const [createForm, setCreateForm] = useState({
    owner_email: '',
    owner_password: '',
    restaurant_name: '',
    whatsapp_number: '',
    plan: 'BASIC' as 'BASIC' | 'PRO',
    plan_expiry_date: '',
  })
  const [creating, setCreating] = useState(false)

  // Credentials display
  const [showCredentials, setShowCredentials] = useState(false)
  const [credentials, setCredentials] = useState<{ email: string; password: string } | null>(null)
  const [copied, setCopied] = useState(false)

  // Extend plan sheet
  const [showExtendSheet, setShowExtendSheet] = useState(false)
  const [extendTarget, setExtendTarget] = useState<RestaurantInfo | null>(null)
  const [newExpiryDate, setNewExpiryDate] = useState('')
  const [extending, setExtending] = useState(false)

  // Change plan sheet
  const [showChangePlanSheet, setShowChangePlanSheet] = useState(false)
  const [changePlanTarget, setChangePlanTarget] = useState<RestaurantInfo | null>(null)
  const [newPlan, setNewPlan] = useState<'BASIC' | 'PRO'>('PRO')
  const [changingPlan, setChangingPlan] = useState(false)

  // Password visibility toggle for create form
  const [showPassword, setShowPassword] = useState(false)

  const fetchRestaurants = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/restaurants')
      if (res.status === 401 || res.status === 403) {
        router.push('/login')
        return
      }
      if (!res.ok) {
        toast.error('Failed to load restaurants')
        return
      }
      const json = await res.json()
      setRestaurants(json.restaurants || [])
    } catch {
      toast.error('Something went wrong')
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => {
    fetchRestaurants()
  }, [fetchRestaurants])

  // Filtered restaurants
  const filtered = useMemo(() => {
    let list = [...restaurants]

    if (filter === 'EXPIRED') {
      list = list.filter((r) => isPlanExpired(r.plan_expiry_date))
    } else if (filter !== 'ALL') {
      list = list.filter((r) => r.plan === filter)
    }

    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          r.owner_email.toLowerCase().includes(q) ||
          r.slug.toLowerCase().includes(q)
      )
    }

    return list
  }, [restaurants, filter, search])

  const handleCreate = async () => {
    if (!createForm.owner_email || !createForm.owner_password || !createForm.restaurant_name || !createForm.whatsapp_number || !createForm.plan_expiry_date) {
      toast.error('Please fill all fields')
      return
    }
    if (createForm.owner_password.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }

    setCreating(true)
    try {
      const res = await fetch('/api/admin/restaurants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createForm),
      })
      if (!res.ok) {
        const json = await res.json()
        toast.error(json.message || 'Failed to create restaurant')
        return
      }
      const json = await res.json()
      toast.success('Restaurant created successfully!')
      setShowCreateSheet(false)
      setCredentials(json.login_credentials)
      setShowCredentials(true)
      setCreateForm({
        owner_email: '',
        owner_password: '',
        restaurant_name: '',
        whatsapp_number: '',
        plan: 'BASIC',
        plan_expiry_date: '',
      })
      fetchRestaurants()
    } catch {
      toast.error('Something went wrong')
    } finally {
      setCreating(false)
    }
  }

  const handleCopyCredentials = () => {
    if (!credentials) return
    const text = `MenuMate Login Credentials\n\nEmail: ${credentials.email}\nPassword: ${credentials.password}\nLogin URL: menumate.in/login`
    navigator.clipboard.writeText(text)
    setCopied(true)
    toast.success('Credentials copied!')
    setTimeout(() => setCopied(false), 2000)
  }

  const handleOpenExtend = (restaurant: RestaurantInfo) => {
    setExtendTarget(restaurant)
    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + 30)
    setNewExpiryDate(futureDate.toISOString().split('T')[0])
    setShowExtendSheet(true)
  }

  const handleExtend = async () => {
    if (!extendTarget || !newExpiryDate) return
    setExtending(true)
    try {
      const res = await fetch('/api/admin/restaurants', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurant_id: extendTarget.id,
          plan_expiry_date: newExpiryDate,
        }),
      })
      if (!res.ok) {
        const json = await res.json()
        toast.error(json.message || 'Failed to extend plan')
        return
      }
      toast.success(`${extendTarget.name} extended to ${formatDate(newExpiryDate)}`)
      setShowExtendSheet(false)
      setExtendTarget(null)
      fetchRestaurants()
    } catch {
      toast.error('Something went wrong')
    } finally {
      setExtending(false)
    }
  }

  const handleOpenChangePlan = (restaurant: RestaurantInfo) => {
    setChangePlanTarget(restaurant)
    setNewPlan(restaurant.plan === 'PRO' ? 'BASIC' : 'PRO')
    setShowChangePlanSheet(true)
  }

  const handleChangePlan = async () => {
    if (!changePlanTarget || newPlan === changePlanTarget.plan) return
    setChangingPlan(true)
    try {
      const res = await fetch('/api/admin/restaurants', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurant_id: changePlanTarget.id,
          plan: newPlan,
        }),
      })
      if (!res.ok) {
        const json = await res.json()
        toast.error(json.message || 'Failed to change plan')
        return
      }
      toast.success(`${changePlanTarget.name} changed to ${newPlan} plan`)
      setShowChangePlanSheet(false)
      setChangePlanTarget(null)
      fetchRestaurants()
    } catch {
      toast.error('Something went wrong')
    } finally {
      setChangingPlan(false)
    }
  }

  // Filter counts
  const filterCounts = useMemo(() => ({
    all: restaurants.length,
    basic: restaurants.filter((r) => r.plan === 'BASIC').length,
    pro: restaurants.filter((r) => r.plan === 'PRO').length,
    expired: restaurants.filter((r) => isPlanExpired(r.plan_expiry_date)).length,
  }), [restaurants])

  const filters: { key: FilterType; label: string; count: number }[] = [
    { key: 'ALL', label: 'All', count: filterCounts.all },
    { key: 'BASIC', label: 'BASIC', count: filterCounts.basic },
    { key: 'PRO', label: 'PRO', count: filterCounts.pro },
    { key: 'EXPIRED', label: 'Expired', count: filterCounts.expired },
  ]

  return (
    <div>
      {loading ? (
        <SkeletonRestaurants />
      ) : (
        <div>
          {/* ==================== PAGE HEADER ==================== */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '20px',
          }}>
            <div>
              <h1 style={{
                fontFamily: '-apple-system, system-ui, sans-serif',
                fontSize: '24px',
                fontWeight: 800,
                color: darkStyles.textPrimary,
                letterSpacing: '-0.02em',
                margin: 0,
                lineHeight: 1.2,
              }}>
                Restaurants
              </h1>
              <p style={{
                fontSize: '14px',
                color: 'rgba(255,255,255,0.4)',
                marginTop: '2px',
                margin: 0,
              }}>
                {restaurants.length} total
              </p>
            </div>
            <button
              onClick={() => setShowCreateSheet(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: darkStyles.accent,
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '100px',
                padding: '10px 20px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 150ms',
                fontFamily: '-apple-system, system-ui, sans-serif',
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = '0.9' }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = '1' }}
            >
              <Plus style={{ width: '16px', height: '16px' }} />
              <span className="hidden sm:inline">Create Restaurant</span>
            </button>
          </div>

          {/* ==================== SEARCH + FILTER BAR ==================== */}
          <div style={{ marginBottom: '16px' }}>
            {/* Search input */}
            <div style={{ position: 'relative', maxWidth: '400px' }}>
              <Search style={{
                position: 'absolute',
                left: '14px',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '16px',
                height: '16px',
                color: 'rgba(255,255,255,0.25)',
                pointerEvents: 'none',
              }} />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, email, or slug..."
                style={{
                  width: '100%',
                  background: darkStyles.surface,
                  border: `1px solid ${darkStyles.border}`,
                  borderRadius: '10px',
                  padding: '10px 16px 10px 40px',
                  color: darkStyles.textPrimary,
                  fontSize: '14px',
                  fontFamily: '-apple-system, system-ui, sans-serif',
                  outline: 'none',
                  transition: 'border-color 150ms',
                  boxSizing: 'border-box',
                  height: '44px',
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)' }}
                onBlur={(e) => { e.currentTarget.style.borderColor = darkStyles.border }}
              />
            </div>

            {/* Filter chips */}
            <div style={{
              display: 'flex',
              gap: '8px',
              marginTop: '12px',
              overflowX: 'auto',
              paddingBottom: '4px',
            }}>
              {filters.map((f) => (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 14px',
                    borderRadius: '100px',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 150ms',
                    border: `1px solid ${filter === f.key ? darkStyles.borderStrong : 'rgba(255,255,255,0.06)'}`,
                    background: filter === f.key ? 'rgba(255,255,255,0.1)' : 'transparent',
                    color: filter === f.key ? darkStyles.textPrimary : 'rgba(255,255,255,0.4)',
                    whiteSpace: 'nowrap',
                    fontFamily: '-apple-system, system-ui, sans-serif',
                  }}
                  onMouseEnter={(e) => {
                    if (filter !== f.key) (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.7)'
                  }}
                  onMouseLeave={(e) => {
                    if (filter !== f.key) (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.4)'
                  }}
                >
                  {f.label}
                  <span style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '1px 6px',
                    borderRadius: '6px',
                    background: filter === f.key ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.06)',
                  }}>
                    {f.count}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* ==================== RESTAURANTS LIST ==================== */}
          {filtered.length === 0 ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '80px 24px',
            }}>
              <Store style={{ width: '48px', height: '48px', color: 'rgba(255,255,255,0.15)', marginBottom: '16px' }} />
              <h3 style={{
                fontSize: '15px',
                fontWeight: 600,
                color: 'rgba(255,255,255,0.6)',
                marginBottom: '6px',
                fontFamily: '-apple-system, system-ui, sans-serif',
              }}>
                {search ? 'No results found' : 'No restaurants here'}
              </h3>
              <p style={{
                fontSize: '13px',
                color: 'rgba(255,255,255,0.3)',
                textAlign: 'center',
                maxWidth: '260px',
                fontFamily: '-apple-system, system-ui, sans-serif',
              }}>
                {search ? 'Try a different search term' : 'Create your first restaurant to get started'}
              </p>
            </div>
          ) : (
            <div>
              {filtered.map((restaurant) => {
                const statusInfo = getStatusInfo(restaurant.plan_expiry_date)

                return (
                  <div
                    key={restaurant.id}
                    style={{
                      background: darkStyles.surface,
                      border: `1px solid ${darkStyles.border}`,
                      borderRadius: '14px',
                      padding: '16px 20px',
                      marginBottom: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '16px',
                      cursor: 'pointer',
                      transition: 'all 150ms',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = darkStyles.surfaceRaised
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = darkStyles.surface
                      e.currentTarget.style.borderColor = darkStyles.border
                    }}
                  >
                    {/* LEFT — Avatar */}
                    <div style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '12px',
                      background: 'linear-gradient(135deg, #E63946, #C1121F)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      fontSize: '20px',
                      fontWeight: 800,
                      color: '#FFFFFF',
                      fontFamily: '-apple-system, system-ui, sans-serif',
                    }}>
                      {restaurant.name.charAt(0).toUpperCase()}
                    </div>

                    {/* MIDDLE — Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      {/* Row 1: Name + Plan Badge */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{
                          color: darkStyles.textPrimary,
                          fontWeight: 700,
                          fontSize: '15px',
                          fontFamily: '-apple-system, system-ui, sans-serif',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}>
                          {restaurant.name}
                        </span>
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: 700,
                          flexShrink: 0,
                          background: restaurant.plan === 'PRO' ? 'rgba(230,57,70,0.15)' : 'rgba(255,255,255,0.08)',
                          color: restaurant.plan === 'PRO' ? darkStyles.accent : 'rgba(255,255,255,0.6)',
                          fontFamily: '-apple-system, system-ui, sans-serif',
                        }}>
                          {restaurant.plan}
                        </span>
                      </div>
                      {/* Row 2: Email */}
                      <div style={{
                        fontSize: '12px',
                        color: 'rgba(255,255,255,0.4)',
                        marginTop: '4px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        fontFamily: '-apple-system, system-ui, sans-serif',
                      }}>
                        {restaurant.owner_email}
                      </div>
                      {/* Row 3: Expiry + Items + Tables */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        marginTop: '6px',
                        fontSize: '12px',
                        color: 'rgba(255,255,255,0.3)',
                        fontFamily: '-apple-system, system-ui, sans-serif',
                      }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <CalendarClock style={{ width: '12px', height: '12px' }} />
                          {restaurant.plan_expiry_date ? formatDate(restaurant.plan_expiry_date) : 'No expiry'}
                        </span>
                        <span style={{ color: 'rgba(255,255,255,0.15)' }}>·</span>
                        <span>{restaurant.menu_items_count} items</span>
                        <span style={{ color: 'rgba(255,255,255,0.15)' }}>·</span>
                        <span>{restaurant.tables_count} tables</span>
                      </div>
                      {/* Row 4: URL */}
                      <div style={{
                        fontSize: '11px',
                        color: 'rgba(230,57,70,0.6)',
                        marginTop: '4px',
                        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}>
                        menumate.in/{restaurant.slug}
                      </div>
                    </div>

                    {/* RIGHT — Actions */}
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-end',
                      gap: '8px',
                      flexShrink: 0,
                    }}>
                      {/* Status badge */}
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '3px 10px',
                        borderRadius: '100px',
                        fontSize: '11px',
                        fontWeight: 600,
                        background: statusInfo.bg,
                        border: `1px solid ${statusInfo.border}`,
                        color: statusInfo.color,
                        fontFamily: '-apple-system, system-ui, sans-serif',
                      }}>
                        <span style={{
                          width: '6px',
                          height: '6px',
                          borderRadius: '50%',
                          background: statusInfo.color,
                        }} />
                        {statusInfo.label}
                      </span>

                      {/* Action buttons row */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <a
                          href={`/menu/${restaurant.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '32px',
                            height: '32px',
                            color: 'rgba(255,255,255,0.3)',
                            transition: 'color 150ms',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            textDecoration: 'none',
                          }}
                          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = '#FFFFFF' }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.3)' }}
                          title="View menu"
                        >
                          <ExternalLink style={{ width: '16px', height: '16px' }} />
                        </a>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleOpenExtend(restaurant) }}
                          style={{
                            background: 'rgba(52,199,89,0.1)',
                            border: '1px solid rgba(52,199,89,0.2)',
                            color: darkStyles.green,
                            borderRadius: '8px',
                            padding: '6px 14px',
                            fontSize: '12px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'all 150ms',
                            fontFamily: '-apple-system, system-ui, sans-serif',
                          }}
                          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(52,199,89,0.18)' }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(52,199,89,0.1)' }}
                        >
                          Extend
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleOpenChangePlan(restaurant) }}
                          style={{
                            background: 'rgba(255,255,255,0.06)',
                            border: `1px solid ${darkStyles.border}`,
                            color: 'rgba(255,255,255,0.6)',
                            borderRadius: '8px',
                            padding: '6px 14px',
                            fontSize: '12px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'all 150ms',
                            fontFamily: '-apple-system, system-ui, sans-serif',
                          }}
                          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.1)' }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)' }}
                        >
                          Plan
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ==================== CREATE RESTAURANT BOTTOM SHEET ==================== */}
      {showCreateSheet && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          {/* Backdrop */}
          <div
            onClick={() => !creating && setShowCreateSheet(false)}
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(0,0,0,0.6)',
              backdropFilter: 'blur(4px)',
              WebkitBackdropFilter: 'blur(4px)',
            }}
          />
          {/* Sheet */}
          <div style={{
            position: 'relative',
            width: '100%',
            maxWidth: '480px',
            background: '#0F0F0F',
            borderTop: `1px solid ${darkStyles.border}`,
            borderRadius: '20px 20px 0 0',
            padding: '28px 24px 32px',
            maxHeight: '90vh',
            overflowY: 'auto',
          }}>
            {/* Drag handle */}
            <div style={{
              width: '36px',
              height: '4px',
              borderRadius: '2px',
              background: 'rgba(255,255,255,0.15)',
              margin: '0 auto 20px',
            }} />

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px' }}>
              <div>
                <h3 style={{
                  fontSize: '18px',
                  fontWeight: 700,
                  color: darkStyles.textPrimary,
                  margin: 0,
                  fontFamily: '-apple-system, system-ui, sans-serif',
                }}>
                  Create Restaurant
                </h3>
                <p style={{
                  fontSize: '13px',
                  color: 'rgba(255,255,255,0.4)',
                  margin: '4px 0 0 0',
                  fontFamily: '-apple-system, system-ui, sans-serif',
                }}>
                  We&apos;ll set everything up
                </p>
              </div>
              <button
                onClick={() => !creating && setShowCreateSheet(false)}
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: 'none',
                  borderRadius: '10px',
                  width: '36px',
                  height: '36px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: 'rgba(255,255,255,0.5)',
                  transition: 'all 150ms',
                  flexShrink: 0,
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = '#FFFFFF' }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.5)' }}
              >
                <X style={{ width: '18px', height: '18px' }} />
              </button>
            </div>

            {/* Form fields */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {/* Restaurant Name */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '11px',
                  fontWeight: 600,
                  color: 'rgba(255,255,255,0.5)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  marginBottom: '8px',
                  fontFamily: '-apple-system, system-ui, sans-serif',
                }}>
                  Restaurant Name
                </label>
                <input
                  type="text"
                  value={createForm.restaurant_name}
                  onChange={(e) => setCreateForm({ ...createForm, restaurant_name: e.target.value })}
                  placeholder="e.g. The Brew House"
                  disabled={creating}
                  style={createInputStyle()}
                />
              </div>

              {/* Owner Email */}
              <div>
                <label style={labelStyle()}>
                  Owner Email
                </label>
                <input
                  type="email"
                  value={createForm.owner_email}
                  onChange={(e) => setCreateForm({ ...createForm, owner_email: e.target.value })}
                  placeholder="owner@restaurant.com"
                  disabled={creating}
                  style={createInputStyle()}
                />
              </div>

              {/* Temporary Password */}
              <div>
                <label style={labelStyle()}>
                  Temporary Password{' '}
                  <span style={{ textTransform: 'none', fontWeight: 400, letterSpacing: 'normal', fontSize: '11px' }}>
                    (they must change it)
                  </span>
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={createForm.owner_password}
                    onChange={(e) => setCreateForm({ ...createForm, owner_password: e.target.value })}
                    placeholder="Min 6 characters"
                    disabled={creating}
                    style={createInputStyle()}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '14px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'rgba(255,255,255,0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      padding: '4px',
                    }}
                  >
                    {showPassword ? <EyeOff style={{ width: '16px', height: '16px' }} /> : <Eye style={{ width: '16px', height: '16px' }} />}
                  </button>
                </div>
              </div>

              {/* WhatsApp Number */}
              <div>
                <label style={labelStyle()}>
                  WhatsApp Number
                </label>
                <div style={{ position: 'relative' }}>
                  <span style={{
                    position: 'absolute',
                    left: '16px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    fontSize: '16px',
                    color: 'rgba(255,255,255,0.4)',
                    fontWeight: 500,
                    fontFamily: '-apple-system, system-ui, sans-serif',
                    pointerEvents: 'none',
                  }}>
                    +91
                  </span>
                  <input
                    type="tel"
                    value={createForm.whatsapp_number}
                    onChange={(e) => setCreateForm({ ...createForm, whatsapp_number: e.target.value })}
                    placeholder="XXXXXXXXXX"
                    disabled={creating}
                    style={{
                      ...createInputStyle(),
                      paddingLeft: '56px',
                    }}
                  />
                </div>
              </div>

              {/* Plan Select */}
              <div>
                <label style={labelStyle()}>
                  Plan
                </label>
                <div style={{ display: 'flex', gap: '12px' }}>
                  {(['BASIC', 'PRO'] as const).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setCreateForm({ ...createForm, plan: p })}
                      disabled={creating}
                      style={{
                        flex: 1,
                        padding: '16px',
                        borderRadius: '14px',
                        fontSize: '14px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        transition: 'all 150ms',
                        border: `2px solid ${createForm.plan === p ? darkStyles.accent : 'rgba(255,255,255,0.06)'}`,
                        background: createForm.plan === p
                          ? 'rgba(230,57,70,0.12)'
                          : 'rgba(255,255,255,0.06)',
                        color: createForm.plan === p
                          ? darkStyles.accent
                          : 'rgba(255,255,255,0.4)',
                        fontFamily: '-apple-system, system-ui, sans-serif',
                        textAlign: 'center',
                        position: 'relative',
                      }}
                    >
                      {p === 'PRO' && (
                        <span style={{
                          position: 'absolute',
                          top: '-8px',
                          right: '12px',
                          background: darkStyles.accent,
                          color: '#FFFFFF',
                          fontSize: '9px',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: '100px',
                          letterSpacing: '0.05em',
                        }}>
                          POPULAR
                        </span>
                      )}
                      {p}
                      <span style={{
                        display: 'block',
                        fontSize: '12px',
                        fontWeight: 400,
                        marginTop: '4px',
                        opacity: 0.7,
                      }}>
                        {p === 'BASIC' ? '₹999/mo' : '₹1,499/mo'}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Expiry Date */}
              <div>
                <label style={labelStyle()}>
                  Expiry Date
                </label>
                <input
                  type="date"
                  value={createForm.plan_expiry_date}
                  onChange={(e) => setCreateForm({ ...createForm, plan_expiry_date: e.target.value })}
                  disabled={creating}
                  style={{
                    ...createInputStyle(),
                    colorScheme: 'dark',
                  }}
                />
              </div>
            </div>

            {/* Submit button */}
            <button
              onClick={handleCreate}
              disabled={creating}
              style={{
                width: '100%',
                height: '52px',
                borderRadius: '100px',
                border: 'none',
                background: creating ? 'rgba(230,57,70,0.5)' : darkStyles.accent,
                color: '#FFFFFF',
                fontSize: '15px',
                fontWeight: 700,
                cursor: creating ? 'not-allowed' : 'pointer',
                transition: 'all 150ms',
                fontFamily: '-apple-system, system-ui, sans-serif',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                marginTop: '28px',
              }}
            >
              {creating ? (
                <>
                  <Loader2 style={{ width: '18px', height: '18px', animation: 'spin 1s linear infinite' }} />
                  Creating...
                </>
              ) : (
                <>
                  Create Restaurant
                  <span style={{ fontSize: '18px' }}>→</span>
                </>
              )}
            </button>
            <style>{`
              @keyframes spin {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
              }
            `}</style>
          </div>
        </div>
      )}

      {/* ==================== CREDENTIALS SUCCESS MODAL ==================== */}
      {showCredentials && credentials && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 60,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
        }}>
          {/* Backdrop */}
          <div
            onClick={() => { setShowCredentials(false); setCredentials(null) }}
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(0,0,0,0.7)',
              backdropFilter: 'blur(4px)',
              WebkitBackdropFilter: 'blur(4px)',
            }}
          />
          {/* Modal */}
          <div style={{
            position: 'relative',
            width: '100%',
            maxWidth: '380px',
            background: '#0F0F0F',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '20px',
            padding: '28px',
          }}>
            {/* Green success card */}
            <div style={{
              background: 'rgba(52,199,89,0.05)',
              border: '1px solid rgba(52,199,89,0.2)',
              borderRadius: '16px',
              padding: '24px',
              marginBottom: '20px',
            }}>
              {/* Check icon */}
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: 'rgba(52,199,89,0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 12px',
              }}>
                <Check style={{ width: '24px', height: '24px', color: darkStyles.green }} />
              </div>

              <h3 style={{
                fontSize: '18px',
                fontWeight: 700,
                color: darkStyles.green,
                textAlign: 'center',
                margin: '0 0 4px 0',
                fontFamily: '-apple-system, system-ui, sans-serif',
              }}>
                ✓ Restaurant Created!
              </h3>
              <p style={{
                fontSize: '13px',
                color: 'rgba(255,255,255,0.4)',
                textAlign: 'center',
                margin: '0 0 16px 0',
                fontFamily: '-apple-system, system-ui, sans-serif',
              }}>
                Send these to the owner on WhatsApp:
              </p>

              {/* Credentials box */}
              <div style={{
                background: 'rgba(255,255,255,0.06)',
                borderRadius: '12px',
                padding: '16px',
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
              }}>
                <div style={{ marginBottom: '10px' }}>
                  <span style={{ fontSize: '10px', fontWeight: 600, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '3px' }}>Email</span>
                  <span style={{ fontSize: '13px', color: darkStyles.textPrimary, fontWeight: 500 }}>{credentials.email}</span>
                </div>
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '10px', marginBottom: '10px' }}>
                  <span style={{ fontSize: '10px', fontWeight: 600, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '3px' }}>Password</span>
                  <span style={{ fontSize: '13px', color: darkStyles.accent, fontWeight: 700 }}>{credentials.password}</span>
                </div>
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '10px' }}>
                  <span style={{ fontSize: '10px', fontWeight: 600, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '3px' }}>Login URL</span>
                  <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)' }}>menumate.in/login</span>
                </div>
              </div>
            </div>

            {/* Copy button */}
            <button
              onClick={handleCopyCredentials}
              style={{
                width: '100%',
                height: '48px',
                borderRadius: '100px',
                border: 'none',
                background: '#25D366',
                color: '#FFFFFF',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 150ms',
                fontFamily: '-apple-system, system-ui, sans-serif',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              {copied ? (
                <>
                  <Check style={{ width: '16px', height: '16px' }} />
                  Copied!
                </>
              ) : (
                <>
                  <Copy style={{ width: '16px', height: '16px' }} />
                  Copy All Credentials
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ==================== EXTEND PLAN BOTTOM SHEET ==================== */}
      {showExtendSheet && extendTarget && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div
            onClick={() => !extending && setShowExtendSheet(false)}
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(0,0,0,0.6)',
              backdropFilter: 'blur(4px)',
              WebkitBackdropFilter: 'blur(4px)',
            }}
          />
          <div style={{
            position: 'relative',
            width: '100%',
            maxWidth: '480px',
            background: '#0F0F0F',
            borderTop: `1px solid ${darkStyles.border}`,
            borderRadius: '20px 20px 0 0',
            padding: '28px 24px 32px',
          }}>
            {/* Drag handle */}
            <div style={{
              width: '36px',
              height: '4px',
              borderRadius: '2px',
              background: 'rgba(255,255,255,0.15)',
              margin: '0 auto 20px',
            }} />

            <h3 style={{
              fontSize: '18px',
              fontWeight: 700,
              color: darkStyles.textPrimary,
              margin: '0 0 4px 0',
              fontFamily: '-apple-system, system-ui, sans-serif',
            }}>
              Extend Plan for {extendTarget.name}
            </h3>
            <p style={{
              fontSize: '13px',
              color: 'rgba(255,255,255,0.4)',
              margin: '0 0 20px 0',
              fontFamily: '-apple-system, system-ui, sans-serif',
            }}>
              Update the subscription expiry date
            </p>

            {/* Current info card */}
            <div style={{
              background: 'rgba(255,255,255,0.06)',
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '20px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', fontFamily: '-apple-system, system-ui, sans-serif' }}>Current Plan</span>
                <span style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '6px',
                  background: extendTarget.plan === 'PRO' ? 'rgba(230,57,70,0.15)' : 'rgba(255,255,255,0.08)',
                  color: extendTarget.plan === 'PRO' ? darkStyles.accent : 'rgba(255,255,255,0.6)',
                  fontFamily: '-apple-system, system-ui, sans-serif',
                }}>
                  {extendTarget.plan}
                </span>
              </div>
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '10px', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', fontFamily: '-apple-system, system-ui, sans-serif' }}>Current Expiry</span>
                <span style={{
                  fontSize: '12px',
                  fontWeight: 600,
                  color: darkStyles.textPrimary,
                  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                }}>
                  {extendTarget.plan_expiry_date ? formatDate(extendTarget.plan_expiry_date) : 'No expiry'}
                </span>
              </div>
            </div>

            {/* New expiry date */}
            <div style={{ marginBottom: '24px' }}>
              <label style={labelStyle()}>New Expiry Date</label>
              <input
                type="date"
                value={newExpiryDate}
                onChange={(e) => setNewExpiryDate(e.target.value)}
                disabled={extending}
                style={{
                  ...createInputStyle(),
                  colorScheme: 'dark',
                }}
              />
            </div>

            {/* Buttons */}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setShowExtendSheet(false)}
                disabled={extending}
                style={secondaryButtonStyle()}
              >
                Cancel
              </button>
              <button
                onClick={handleExtend}
                disabled={extending || !newExpiryDate}
                style={{
                  flex: 1,
                  height: '48px',
                  borderRadius: '100px',
                  border: 'none',
                  background: extending ? 'rgba(52,199,89,0.5)' : darkStyles.green,
                  color: '#FFFFFF',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: extending || !newExpiryDate ? 'not-allowed' : 'pointer',
                  transition: 'all 150ms',
                  fontFamily: '-apple-system, system-ui, sans-serif',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                }}
              >
                {extending ? (
                  <>
                    <Loader2 style={{ width: '16px', height: '16px', animation: 'spin 1s linear infinite' }} />
                    Extending...
                  </>
                ) : (
                  'Extend Plan'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== CHANGE PLAN BOTTOM SHEET ==================== */}
      {showChangePlanSheet && changePlanTarget && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div
            onClick={() => !changingPlan && setShowChangePlanSheet(false)}
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(0,0,0,0.6)',
              backdropFilter: 'blur(4px)',
              WebkitBackdropFilter: 'blur(4px)',
            }}
          />
          <div style={{
            position: 'relative',
            width: '100%',
            maxWidth: '480px',
            background: '#0F0F0F',
            borderTop: `1px solid ${darkStyles.border}`,
            borderRadius: '20px 20px 0 0',
            padding: '28px 24px 32px',
          }}>
            {/* Drag handle */}
            <div style={{
              width: '36px',
              height: '4px',
              borderRadius: '2px',
              background: 'rgba(255,255,255,0.15)',
              margin: '0 auto 20px',
            }} />

            <h3 style={{
              fontSize: '18px',
              fontWeight: 700,
              color: darkStyles.textPrimary,
              margin: '0 0 4px 0',
              fontFamily: '-apple-system, system-ui, sans-serif',
            }}>
              Change Plan for {changePlanTarget.name}
            </h3>
            <p style={{
              fontSize: '13px',
              color: 'rgba(255,255,255,0.4)',
              margin: '0 0 20px 0',
              fontFamily: '-apple-system, system-ui, sans-serif',
            }}>
              Switch between BASIC and PRO plans
            </p>

            {/* Current plan display */}
            <div style={{
              background: 'rgba(255,255,255,0.06)',
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '20px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', fontFamily: '-apple-system, system-ui, sans-serif' }}>Current Plan</span>
              <span style={{
                fontSize: '11px',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '6px',
                background: changePlanTarget.plan === 'PRO' ? 'rgba(230,57,70,0.15)' : 'rgba(255,255,255,0.08)',
                color: changePlanTarget.plan === 'PRO' ? darkStyles.accent : 'rgba(255,255,255,0.6)',
                fontFamily: '-apple-system, system-ui, sans-serif',
              }}>
                {changePlanTarget.plan}
              </span>
            </div>

            {/* Plan toggle */}
            <div style={{ marginBottom: '24px' }}>
              <label style={labelStyle()}>New Plan</label>
              <div style={{ display: 'flex', gap: '12px' }}>
                {(['BASIC', 'PRO'] as const).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setNewPlan(p)}
                    disabled={changingPlan || p === changePlanTarget.plan}
                    style={{
                      flex: 1,
                      padding: '16px',
                      borderRadius: '14px',
                      fontSize: '14px',
                      fontWeight: 700,
                      cursor: p === changePlanTarget.plan ? 'default' : 'pointer',
                      transition: 'all 150ms',
                      border: `2px solid ${newPlan === p ? darkStyles.accent : 'rgba(255,255,255,0.06)'}`,
                      background: newPlan === p
                        ? 'rgba(230,57,70,0.12)'
                        : 'rgba(255,255,255,0.06)',
                      color: newPlan === p
                        ? darkStyles.accent
                        : p === changePlanTarget.plan
                          ? 'rgba(255,255,255,0.2)'
                          : 'rgba(255,255,255,0.4)',
                      fontFamily: '-apple-system, system-ui, sans-serif',
                      textAlign: 'center',
                      opacity: p === changePlanTarget.plan ? 0.5 : 1,
                    }}
                  >
                    {p}
                    <span style={{
                      display: 'block',
                      fontSize: '12px',
                      fontWeight: 400,
                      marginTop: '4px',
                      opacity: 0.7,
                    }}>
                      {p === 'BASIC' ? '₹999/mo' : '₹1,499/mo'}
                    </span>
                  </button>
                ))}
              </div>
              {newPlan === changePlanTarget.plan && (
                <p style={{
                  fontSize: '12px',
                  color: 'rgba(255,255,255,0.3)',
                  textAlign: 'center',
                  marginTop: '8px',
                  fontFamily: '-apple-system, system-ui, sans-serif',
                }}>
                  This is the current plan
                </p>
              )}
            </div>

            {/* Buttons */}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setShowChangePlanSheet(false)}
                disabled={changingPlan}
                style={secondaryButtonStyle()}
              >
                Cancel
              </button>
              <button
                onClick={handleChangePlan}
                disabled={changingPlan || newPlan === changePlanTarget.plan}
                style={{
                  flex: 1,
                  height: '48px',
                  borderRadius: '100px',
                  border: 'none',
                  background: changingPlan || newPlan === changePlanTarget.plan ? 'rgba(230,57,70,0.5)' : darkStyles.accent,
                  color: '#FFFFFF',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: changingPlan || newPlan === changePlanTarget.plan ? 'not-allowed' : 'pointer',
                  transition: 'all 150ms',
                  fontFamily: '-apple-system, system-ui, sans-serif',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                }}
              >
                {changingPlan ? (
                  <>
                    <Loader2 style={{ width: '16px', height: '16px', animation: 'spin 1s linear infinite' }} />
                    Changing...
                  </>
                ) : (
                  'Change Plan'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ==================== SHARED STYLE HELPERS ==================== */

function labelStyle() {
  return {
    display: 'block',
    fontSize: '11px',
    fontWeight: 600 as const,
    color: 'rgba(255,255,255,0.5)',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.08em',
    marginBottom: '8px',
    fontFamily: '-apple-system, system-ui, sans-serif',
  }
}

function createInputStyle() {
  return {
    width: '100%',
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '12px',
    padding: '14px 16px',
    color: '#FFFFFF',
    fontSize: '16px',
    fontFamily: '-apple-system, system-ui, sans-serif',
    outline: 'none',
    transition: 'border-color 150ms',
    boxSizing: 'border-box' as const,
    height: '52px',
  }
}

function secondaryButtonStyle() {
  return {
    flex: 1,
    height: '48px',
    borderRadius: '100px',
    border: '1px solid rgba(255,255,255,0.1)',
    background: 'rgba(255,255,255,0.06)',
    color: 'rgba(255,255,255,0.6)',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 150ms',
    fontFamily: '-apple-system, system-ui, sans-serif',
  }
}
