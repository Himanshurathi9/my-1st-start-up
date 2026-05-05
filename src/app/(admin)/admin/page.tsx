'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Store,
  TrendingUp,
  AlertTriangle,
  XCircle,
  CalendarClock,
  ChevronRight,
  Loader2,
  ArrowRight,
  Activity,
  Plus,
  DollarSign,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { formatDate, daysUntilExpiry, isPlanExpired, formatPrice } from '@/lib/utils'

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
}

const BASIC_PRICE = 999
const PRO_PRICE = 1499

const darkShimmer = `
@keyframes dark-shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
@keyframes pulse-dot {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(1.5); }
}
@keyframes slide-up {
  from { transform: translateY(100%); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}
@keyframes fade-in-overlay {
  from { opacity: 0; }
  to { opacity: 1; }
}
`

function SkeletonOverview() {
  return (
    <div className="px-4 pt-6 space-y-6 max-w-content-lg mx-auto">
      <style>{darkShimmer}</style>
      <div className="flex items-center justify-between">
        <div
          style={{
            width: 180,
            height: 28,
            borderRadius: 8,
            background: 'linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 75%)',
            backgroundSize: '200% 100%',
            animation: 'dark-shimmer 1.5s infinite',
          }}
        />
        <div
          style={{
            width: 60,
            height: 16,
            borderRadius: 8,
            background: 'linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 75%)',
            backgroundSize: '200% 100%',
            animation: 'dark-shimmer 1.5s infinite',
          }}
        />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            style={{
              height: 140,
              borderRadius: 16,
              background: 'linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 75%)',
              backgroundSize: '200% 100%',
              animation: 'dark-shimmer 1.5s infinite',
            }}
          />
        ))}
      </div>
      <div
        style={{
          height: 200,
          borderRadius: 16,
          background: 'linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 75%)',
          backgroundSize: '200% 100%',
          animation: 'dark-shimmer 1.5s infinite',
        }}
      />
    </div>
  )
}

function getStatusInfo(expiryDate: string | null) {
  if (!expiryDate) return { label: 'No Expiry', color: 'rgba(255,255,255,0.3)', dotColor: 'rgba(255,255,255,0.3)' }
  const expired = isPlanExpired(expiryDate)
  const days = daysUntilExpiry(expiryDate)
  if (expired) return { label: 'Expired', color: '#FF3B30', dotColor: '#FF3B30' }
  if (days <= 3) return { label: `${days}d left`, color: '#FF3B30', dotColor: '#FF3B30' }
  if (days <= 7) return { label: `${days}d left`, color: '#FF9500', dotColor: '#FF9500' }
  return { label: 'Active', color: '#34C759', dotColor: '#34C759' }
}

export default function AdminOverviewPage() {
  const router = useRouter()
  const [restaurants, setRestaurants] = useState<RestaurantInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [showExtendSheet, setShowExtendSheet] = useState(false)
  const [extendTarget, setExtendTarget] = useState<RestaurantInfo | null>(null)
  const [newExpiryDate, setNewExpiryDate] = useState('')
  const [extending, setExtending] = useState(false)

  const fetchRestaurants = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/restaurants')
      if (res.status === 401 || res.status === 403) {
        router.push('/login')
        return
      }
      if (!res.ok) {
        toast.error('Failed to load data')
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

  // Stats calculations
  const activeCount = restaurants.filter((r) => !isPlanExpired(r.plan_expiry_date)).length
  const expiring7 = restaurants.filter((r) => {
    const days = daysUntilExpiry(r.plan_expiry_date)
    return days <= 7 && days > 0
  }).length
  const expiredCount = restaurants.filter((r) => isPlanExpired(r.plan_expiry_date)).length
  const totalMRR = restaurants.reduce((sum, r) => {
    if (isPlanExpired(r.plan_expiry_date)) return sum
    return sum + (r.plan === 'PRO' ? PRO_PRICE : BASIC_PRICE)
  }, 0)

  // Expiring soon list (sorted by days left)
  const expiringSoon = restaurants
    .filter((r) => {
      const days = daysUntilExpiry(r.plan_expiry_date)
      return days <= 7 && r.plan_expiry_date !== null
    })
    .sort((a, b) => daysUntilExpiry(a.plan_expiry_date) - daysUntilExpiry(b.plan_expiry_date))

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
      toast.success(`${extendTarget.name} plan extended to ${formatDate(newExpiryDate)}`)
      setShowExtendSheet(false)
      setExtendTarget(null)
      fetchRestaurants()
    } catch {
      toast.error('Something went wrong')
    } finally {
      setExtending(false)
    }
  }

  return (
    <div className="min-h-screen" style={{ background: '#0A0A0A' }}>
      <style>{darkShimmer}</style>

      {loading ? (
        <SkeletonOverview />
      ) : restaurants.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center px-6 pt-32"
          style={{ animation: 'fade-in-overlay 0.4s ease' }}
        >
          <div
            className="flex items-center justify-center mb-5"
            style={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.04)',
            }}
          >
            <Store className="w-12 h-12" style={{ color: 'rgba(255,255,255,0.15)' }} />
          </div>
          <h3
            style={{
              color: 'rgba(255,255,255,0.6)',
              fontSize: 15,
              fontWeight: 600,
              marginBottom: 6,
              fontFamily: '-apple-system, system-ui, sans-serif',
            }}
          >
            No restaurants yet
          </h3>
          <p
            style={{
              color: 'rgba(255,255,255,0.3)',
              fontSize: 13,
              marginBottom: 32,
              fontFamily: '-apple-system, system-ui, sans-serif',
            }}
          >
            Create your first restaurant to get started.
          </p>
          <button
            onClick={() => router.push('/admin/restaurants')}
            className="transition-all active:scale-95"
            style={{
              background: 'rgba(255,255,255,0.08)',
              color: 'rgba(255,255,255,0.8)',
              border: 'none',
              borderRadius: 10,
              padding: '12px 24px',
              fontSize: 14,
              fontWeight: 600,
              fontFamily: '-apple-system, system-ui, sans-serif',
            }}
          >
            Add Restaurant
          </button>
        </div>
      ) : (
        <div className="px-4 pt-6 pb-24 max-w-content-lg mx-auto" style={{ fontFamily: '-apple-system, system-ui, sans-serif' }}>

          {/* ===== PAGE HEADER ===== */}
          <div
            className="flex items-center justify-between"
            style={{ marginTop: 0 }}
          >
            <h1
              style={{
                color: '#FFFFFF',
                fontSize: 24,
                fontWeight: 800,
                letterSpacing: '-0.02em',
                fontFamily: '-apple-system, system-ui, sans-serif',
              }}
            >
              Dashboard
            </h1>
            <div className="flex items-center gap-2">
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: '#34C759',
                  animation: 'pulse-dot 2s ease-in-out infinite',
                  display: 'inline-block',
                }}
              />
              <span
                style={{
                  fontSize: 12,
                  color: '#34C759',
                  fontWeight: 600,
                  letterSpacing: '0.02em',
                }}
              >
                Live
              </span>
            </div>
          </div>

          {/* ===== STATS GRID ===== */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4" style={{ marginTop: 24 }}>
            {/* Card 1 — Active Plans */}
            <div
              className="relative overflow-hidden transition-all"
              style={{
                background: '#111111',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 16,
                padding: '20px 24px',
              }}
            >
              <span
                className="absolute select-none pointer-events-none"
                style={{
                  fontSize: 80,
                  fontWeight: 900,
                  color: 'rgba(255,255,255,0.02)',
                  right: 16,
                  top: 8,
                  lineHeight: 1,
                  fontFamily: '-apple-system, system-ui, sans-serif',
                }}
              >
                {activeCount}
              </span>
              <div className="flex items-center gap-3 mb-2">
                <div
                  className="flex items-center justify-center"
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: '10px',
                    background: 'rgba(52,199,89,0.1)',
                  }}
                >
                  <Activity size={18} style={{ color: '#34C759' }} />
                </div>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                    color: 'rgba(255,255,255,0.3)',
                    textTransform: 'uppercase',
                  }}
                >
                  ACTIVE PLANS
                </span>
              </div>
              <p
                style={{
                  fontSize: 36,
                  fontWeight: 800,
                  color: activeCount > 0 ? '#34C759' : '#FFFFFF',
                  letterSpacing: '-0.03em',
                  marginTop: 8,
                  lineHeight: 1.1,
                }}
              >
                {activeCount}
              </p>
              <p
                style={{
                  fontSize: 11,
                  color: 'rgba(255,255,255,0.3)',
                  marginTop: 6,
                }}
              >
                restaurants live right now
              </p>
            </div>

            {/* Card 2 — Expiring Soon */}
            <div
              className="relative overflow-hidden transition-all"
              style={{
                background: '#111111',
                border: expiring7 > 0 ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(255,255,255,0.06)',
                borderLeft: expiring7 > 0 ? '3px solid #FF9500' : '1px solid rgba(255,255,255,0.06)',
                borderRadius: 16,
                padding: '20px 24px',
              }}
            >
              <span
                className="absolute select-none pointer-events-none"
                style={{
                  fontSize: 80,
                  fontWeight: 900,
                  color: 'rgba(255,255,255,0.02)',
                  right: 16,
                  top: 8,
                  lineHeight: 1,
                  fontFamily: '-apple-system, system-ui, sans-serif',
                }}
              >
                {expiring7}
              </span>
              <div className="flex items-center gap-3 mb-2">
                <div
                  className="flex items-center justify-center"
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: '10px',
                    background: 'rgba(255,149,0,0.1)',
                  }}
                >
                  <AlertTriangle size={18} style={{ color: '#FF9500' }} />
                </div>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                    color: 'rgba(255,255,255,0.3)',
                    textTransform: 'uppercase',
                  }}
                >
                  EXPIRING ≤7 DAYS
                </span>
              </div>
              <p
                style={{
                  fontSize: 36,
                  fontWeight: 800,
                  color: expiring7 > 0 ? '#FF9500' : '#FFFFFF',
                  letterSpacing: '-0.03em',
                  marginTop: 8,
                  lineHeight: 1.1,
                }}
              >
                {expiring7}
              </p>
              <p
                style={{
                  fontSize: 11,
                  color: 'rgba(255,255,255,0.3)',
                  marginTop: 6,
                }}
              >
                need renewal this week
              </p>
            </div>

            {/* Card 3 — Expired */}
            <div
              className="relative overflow-hidden transition-all"
              style={{
                background: '#111111',
                border: expiredCount > 0 ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(255,255,255,0.06)',
                borderLeft: expiredCount > 0 ? '3px solid #FF3B30' : '1px solid rgba(255,255,255,0.06)',
                borderRadius: 16,
                padding: '20px 24px',
              }}
            >
              <span
                className="absolute select-none pointer-events-none"
                style={{
                  fontSize: 80,
                  fontWeight: 900,
                  color: 'rgba(255,255,255,0.02)',
                  right: 16,
                  top: 8,
                  lineHeight: 1,
                  fontFamily: '-apple-system, system-ui, sans-serif',
                }}
              >
                {expiredCount}
              </span>
              <div className="flex items-center gap-3 mb-2">
                <div
                  className="flex items-center justify-center"
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: '10px',
                    background: 'rgba(255,59,48,0.1)',
                  }}
                >
                  <XCircle size={18} style={{ color: '#FF3B30' }} />
                </div>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                    color: 'rgba(255,255,255,0.3)',
                    textTransform: 'uppercase',
                  }}
                >
                  EXPIRED
                </span>
              </div>
              <p
                style={{
                  fontSize: 36,
                  fontWeight: 800,
                  color: expiredCount > 0 ? '#FF3B30' : '#FFFFFF',
                  letterSpacing: '-0.03em',
                  marginTop: 8,
                  lineHeight: 1.1,
                }}
              >
                {expiredCount}
              </p>
              <p
                style={{
                  fontSize: 11,
                  color: 'rgba(255,255,255,0.3)',
                  marginTop: 6,
                }}
              >
                plans offline
              </p>
            </div>

            {/* Card 4 — Monthly Revenue */}
            <div
              className="relative overflow-hidden transition-all"
              style={{
                background: '#111111',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 16,
                padding: '20px 24px',
              }}
            >
              <span
                className="absolute select-none pointer-events-none"
                style={{
                  fontSize: 80,
                  fontWeight: 900,
                  color: 'rgba(255,255,255,0.02)',
                  right: 16,
                  top: 8,
                  lineHeight: 1,
                  fontFamily: '-apple-system, system-ui, sans-serif',
                }}
              >
                ₹
              </span>
              <div className="flex items-center gap-3 mb-2">
                <div
                  className="flex items-center justify-center"
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: '10px',
                    background: 'rgba(230,57,70,0.1)',
                  }}
                >
                  <TrendingUp size={18} style={{ color: '#E63946' }} />
                </div>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                    color: 'rgba(255,255,255,0.3)',
                    textTransform: 'uppercase',
                  }}
                >
                  MONTHLY REVENUE
                </span>
              </div>
              <p
                style={{
                  fontSize: 36,
                  fontWeight: 800,
                  color: '#FFFFFF',
                  letterSpacing: '-0.03em',
                  marginTop: 8,
                  lineHeight: 1.1,
                }}
              >
                {formatPrice(totalMRR)}
              </p>
              <p
                style={{
                  fontSize: 11,
                  color: 'rgba(255,255,255,0.3)',
                  marginTop: 6,
                }}
              >
                active subscriptions × plan price
              </p>
            </div>
          </div>

          {/* ===== QUICK ACTIONS ROW ===== */}
          <div className="flex gap-3" style={{ marginTop: 16 }}>
            <button
              onClick={() => router.push('/admin/restaurants')}
              className="flex items-center gap-2 transition-all active:scale-95"
              style={{
                background: '#E63946',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: 10,
                padding: '12px 20px',
                fontSize: 13,
                fontWeight: 600,
                fontFamily: '-apple-system, system-ui, sans-serif',
                boxShadow: '0 4px 16px rgba(230,57,70,0.25)',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => {
                ;(e.currentTarget as HTMLElement).style.filter = 'brightness(1.1)'
              }}
              onMouseLeave={(e) => {
                ;(e.currentTarget as HTMLElement).style.filter = 'none'
              }}
            >
              <Plus size={16} />
              Create Restaurant
            </button>
            <button
              onClick={() => router.push('/admin/payments')}
              className="flex items-center gap-2 transition-all active:scale-95"
              style={{
                background: 'rgba(255,255,255,0.06)',
                color: '#FFFFFF',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 10,
                padding: '12px 20px',
                fontSize: 13,
                fontWeight: 600,
                fontFamily: '-apple-system, system-ui, sans-serif',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => {
                ;(e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.1)'
              }}
              onMouseLeave={(e) => {
                ;(e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)'
              }}
            >
              <DollarSign size={16} />
              Record Payment
            </button>
          </div>

          {/* ===== EXPIRING SOON TABLE ===== */}
          {expiringSoon.length > 0 && (
            <div style={{ marginTop: 32 }}>
              <div className="flex items-center gap-3">
                <span style={{ fontSize: 13, fontWeight: 700, color: '#FF9500' }}>
                  ⚠️ Needs Attention
                </span>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
                  {expiringSoon.length} restaurant{expiringSoon.length !== 1 ? 's' : ''} expiring soon
                </span>
              </div>

              <div
                style={{
                  background: '#111111',
                  border: '1px solid rgba(255,149,0,0.15)',
                  borderRadius: 16,
                  overflow: 'hidden',
                  marginTop: 12,
                }}
              >
                {/* Header Row */}
                <div
                  className="hidden md:grid"
                  style={{
                    gridTemplateColumns: '1fr 80px 100px 90px 90px',
                    gap: 12,
                    background: 'rgba(255,255,255,0.03)',
                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                    padding: '10px 20px',
                  }}
                >
                  {['RESTAURANT', 'PLAN', 'EXPIRY', 'DAYS LEFT', 'ACTION'].map((col) => (
                    <span
                      key={col}
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: 'rgba(255,255,255,0.3)',
                        letterSpacing: '0.06em',
                      }}
                    >
                      {col}
                    </span>
                  ))}
                </div>

                {/* Data Rows */}
                {expiringSoon.map((restaurant) => {
                  const days = daysUntilExpiry(restaurant.plan_expiry_date)

                  return (
                    <div
                      key={restaurant.id}
                      className="transition-colors"
                      style={{
                        borderBottom: '1px solid rgba(255,255,255,0.04)',
                        cursor: 'default',
                      }}
                      onMouseEnter={(e) => {
                        ;(e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.02)'
                      }}
                      onMouseLeave={(e) => {
                        ;(e.currentTarget as HTMLElement).style.background = 'transparent'
                      }}
                    >
                      {/* Desktop Grid Row */}
                      <div
                        className="hidden md:grid items-center"
                        style={{
                          gridTemplateColumns: '1fr 80px 100px 90px 90px',
                          gap: 12,
                          padding: '14px 20px',
                        }}
                      >
                        <div className="min-w-0">
                          <p
                            className="truncate"
                            style={{
                              fontSize: 14,
                              fontWeight: 600,
                              color: '#FFFFFF',
                            }}
                          >
                            {restaurant.name}
                          </p>
                          <p
                            className="truncate"
                            style={{
                              fontSize: 12,
                              color: 'rgba(255,255,255,0.35)',
                            }}
                          >
                            {restaurant.owner_email}
                          </p>
                        </div>
                        <div>
                          <span
                            style={{
                              fontSize: 11,
                              fontWeight: 600,
                              padding: '4px 10px',
                              borderRadius: 6,
                              background: restaurant.plan === 'PRO' ? 'rgba(230,57,70,0.15)' : 'rgba(255,255,255,0.08)',
                              color: restaurant.plan === 'PRO' ? '#E63946' : 'rgba(255,255,255,0.6)',
                            }}
                          >
                            {restaurant.plan}
                          </span>
                        </div>
                        <span
                          style={{
                            fontSize: 13,
                            color: 'rgba(255,255,255,0.6)',
                          }}
                        >
                          {restaurant.plan_expiry_date ? formatDate(restaurant.plan_expiry_date) : '—'}
                        </span>
                        <span
                          style={{
                            fontSize: 13,
                            fontWeight: days <= 3 ? 700 : 600,
                            color: days <= 3 ? '#FF3B30' : '#FF9500',
                          }}
                        >
                          {days} day{days !== 1 ? 's' : ''}
                        </span>
                        <button
                          onClick={() => handleOpenExtend(restaurant)}
                          disabled={extending}
                          className="transition-all active:scale-95"
                          style={{
                            background: 'rgba(52,199,89,0.1)',
                            border: '1px solid rgba(52,199,89,0.2)',
                            color: '#34C759',
                            borderRadius: 8,
                            padding: '6px 14px',
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          Extend
                        </button>
                      </div>

                      {/* Mobile Card Row */}
                      <div
                        className="md:hidden"
                        style={{
                          padding: '14px 20px',
                        }}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <p
                                className="truncate"
                                style={{
                                  fontSize: 14,
                                  fontWeight: 600,
                                  color: '#FFFFFF',
                                }}
                              >
                                {restaurant.name}
                              </p>
                              <span
                                className="flex-shrink-0"
                                style={{
                                  fontSize: 11,
                                  fontWeight: 600,
                                  padding: '2px 8px',
                                  borderRadius: 6,
                                  background: restaurant.plan === 'PRO' ? 'rgba(230,57,70,0.15)' : 'rgba(255,255,255,0.08)',
                                  color: restaurant.plan === 'PRO' ? '#E63946' : 'rgba(255,255,255,0.6)',
                                }}
                              >
                                {restaurant.plan}
                              </span>
                            </div>
                            <p
                              className="truncate"
                              style={{
                                fontSize: 12,
                                color: 'rgba(255,255,255,0.35)',
                              }}
                            >
                              {restaurant.owner_email}
                            </p>
                            <div className="flex items-center gap-3 mt-2">
                              <span
                                style={{
                                  fontSize: 12,
                                  color: 'rgba(255,255,255,0.5)',
                                }}
                              >
                                {restaurant.plan_expiry_date ? formatDate(restaurant.plan_expiry_date) : '—'}
                              </span>
                              <span
                                style={{
                                  fontSize: 12,
                                  fontWeight: days <= 3 ? 700 : 600,
                                  color: days <= 3 ? '#FF3B30' : '#FF9500',
                                }}
                              >
                                {days}d left
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={() => handleOpenExtend(restaurant)}
                            disabled={extending}
                            className="flex-shrink-0 transition-all active:scale-95"
                            style={{
                              background: 'rgba(52,199,89,0.1)',
                              border: '1px solid rgba(52,199,89,0.2)',
                              color: '#34C759',
                              borderRadius: 8,
                              padding: '6px 14px',
                              fontSize: 12,
                              fontWeight: 600,
                              cursor: 'pointer',
                            }}
                          >
                            Extend
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* ===== ALL RESTAURANTS TABLE ===== */}
          <div style={{ marginTop: 32 }}>
            <div className="flex items-center justify-between mb-3">
              <h2
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  color: '#FFFFFF',
                }}
              >
                All Restaurants
              </h2>
              <button
                onClick={() => router.push('/admin/restaurants')}
                className="flex items-center gap-1 transition-all"
                style={{ color: 'rgba(255,255,255,0.4)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}
              >
                View All
                <ArrowRight size={14} />
              </button>
            </div>

            <div
              style={{
                background: '#111111',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 16,
                overflow: 'hidden',
              }}
            >
              {/* Header Row */}
              <div
                className="hidden md:grid"
                style={{
                  gridTemplateColumns: '1fr 80px 100px 110px 40px',
                  gap: 12,
                  background: 'rgba(255,255,255,0.03)',
                  borderBottom: '1px solid rgba(255,255,255,0.06)',
                  padding: '10px 20px',
                }}
              >
                {['RESTAURANT', 'PLAN', 'STATUS', 'EXPIRY', ''].map((col) => (
                  <span
                    key={col}
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: 'rgba(255,255,255,0.3)',
                      letterSpacing: '0.06em',
                    }}
                  >
                    {col}
                  </span>
                ))}
              </div>

              {/* Data Rows */}
              {restaurants.slice(0, 5).map((restaurant) => {
                const statusInfo = getStatusInfo(restaurant.plan_expiry_date)
                const isExpired = isPlanExpired(restaurant.plan_expiry_date)
                const days = restaurant.plan_expiry_date ? daysUntilExpiry(restaurant.plan_expiry_date) : null
                const isExpiring = days !== null && days <= 7 && days > 0

                let statusLabel = 'Active'
                if (isExpired) statusLabel = 'Expired'
                else if (isExpiring) statusLabel = 'Expiring'

                return (
                  <div
                    key={restaurant.id}
                    className="transition-colors cursor-pointer"
                    style={{
                      borderBottom: '1px solid rgba(255,255,255,0.04)',
                    }}
                    onMouseEnter={(e) => {
                      ;(e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.02)'
                    }}
                    onMouseLeave={(e) => {
                      ;(e.currentTarget as HTMLElement).style.background = 'transparent'
                    }}
                    onClick={() => router.push('/admin/restaurants')}
                  >
                    {/* Desktop Grid Row */}
                    <div
                      className="hidden md:grid items-center"
                      style={{
                        gridTemplateColumns: '1fr 80px 100px 110px 40px',
                        gap: 12,
                        padding: '14px 20px',
                      }}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className="flex items-center justify-center flex-shrink-0"
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: 10,
                            background: 'rgba(255,255,255,0.06)',
                            fontWeight: 600,
                            fontSize: 16,
                            color: 'rgba(255,255,255,0.5)',
                          }}
                        >
                          {restaurant.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p
                            className="truncate"
                            style={{
                              fontSize: 14,
                              fontWeight: 600,
                              color: '#FFFFFF',
                            }}
                          >
                            {restaurant.name}
                          </p>
                          <p
                            className="truncate"
                            style={{
                              fontSize: 12,
                              color: 'rgba(255,255,255,0.35)',
                            }}
                          >
                            {restaurant.owner_email}
                          </p>
                        </div>
                      </div>
                      <div>
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 600,
                            padding: '4px 10px',
                            borderRadius: 6,
                            background: restaurant.plan === 'PRO' ? 'rgba(230,57,70,0.15)' : 'rgba(255,255,255,0.08)',
                            color: restaurant.plan === 'PRO' ? '#E63946' : 'rgba(255,255,255,0.6)',
                          }}
                        >
                          {restaurant.plan}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          style={{
                            width: 6,
                            height: 6,
                            borderRadius: '50%',
                            background: statusInfo.dotColor,
                            display: 'inline-block',
                          }}
                        />
                        <span
                          style={{
                            fontSize: 13,
                            color: statusInfo.color,
                            fontWeight: 600,
                          }}
                        >
                          {statusLabel}
                        </span>
                      </div>
                      <span
                        style={{
                          fontSize: 13,
                          color: 'rgba(255,255,255,0.5)',
                        }}
                      >
                        {restaurant.plan_expiry_date ? formatDate(restaurant.plan_expiry_date) : '—'}
                      </span>
                      <ChevronRight size={16} style={{ color: 'rgba(255,255,255,0.2)' }} />
                    </div>

                    {/* Mobile Card Row */}
                    <div
                      className="md:hidden"
                      style={{ padding: '14px 20px' }}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div
                            className="flex items-center justify-center flex-shrink-0"
                            style={{
                              width: 36,
                              height: 36,
                              borderRadius: 10,
                              background: 'rgba(255,255,255,0.06)',
                              fontWeight: 600,
                              fontSize: 16,
                              color: 'rgba(255,255,255,0.5)',
                            }}
                          >
                            {restaurant.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p
                              className="truncate"
                              style={{
                                fontSize: 14,
                                fontWeight: 600,
                                color: '#FFFFFF',
                              }}
                            >
                              {restaurant.name}
                            </p>
                            <p
                              className="truncate"
                              style={{
                                fontSize: 12,
                                color: 'rgba(255,255,255,0.35)',
                              }}
                            >
                              {restaurant.owner_email}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <div className="flex items-center gap-1.5">
                            <span
                              style={{
                                width: 5,
                                height: 5,
                                borderRadius: '50%',
                                background: statusInfo.dotColor,
                                display: 'inline-block',
                              }}
                            />
                            <span
                              style={{
                                fontSize: 11,
                                fontWeight: 600,
                                color: statusInfo.color,
                              }}
                            >
                              {statusLabel}
                            </span>
                          </div>
                          <span
                            style={{
                              fontSize: 11,
                              fontWeight: 600,
                              padding: '2px 8px',
                              borderRadius: 6,
                              background: restaurant.plan === 'PRO' ? 'rgba(230,57,70,0.15)' : 'rgba(255,255,255,0.08)',
                              color: restaurant.plan === 'PRO' ? '#E63946' : 'rgba(255,255,255,0.6)',
                            }}
                          >
                            {restaurant.plan}
                          </span>
                          <ChevronRight size={16} style={{ color: 'rgba(255,255,255,0.2)' }} />
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* ===== EXTEND PLAN BOTTOM SHEET ===== */}
      {showExtendSheet && extendTarget && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center"
          style={{ animation: 'fade-in-overlay 0.2s ease' }}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0"
            style={{
              background: 'rgba(0,0,0,0.7)',
              backdropFilter: 'blur(4px)',
              WebkitBackdropFilter: 'blur(4px)',
            }}
            onClick={() => setShowExtendSheet(false)}
          />
          {/* Sheet */}
          <div
            className="relative w-full max-w-lg p-6 pb-10"
            style={{
              background: '#111111',
              borderTop: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '20px 20px 0 0',
              animation: 'slide-up 0.3s ease-out',
            }}
          >
            {/* Drag handle */}
            <div
              className="mx-auto mb-5"
              style={{
                width: 36,
                height: 4,
                borderRadius: 2,
                background: 'rgba(255,255,255,0.15)',
              }}
            />

            <h3
              style={{
                color: '#FFFFFF',
                fontSize: 18,
                fontWeight: 700,
                marginBottom: 4,
                fontFamily: '-apple-system, system-ui, sans-serif',
              }}
            >
              Extend Plan for {extendTarget.name}
            </h3>
            <p
              style={{
                color: 'rgba(255,255,255,0.4)',
                fontSize: 13,
                marginBottom: 24,
                fontFamily: '-apple-system, system-ui, sans-serif',
              }}
            >
              Set a new expiry date for the subscription
            </p>

            {/* Current Info */}
            <div
              className="p-4 mb-5"
              style={{
                background: '#161616',
                borderRadius: 12,
                border: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              <div className="flex items-center justify-between mb-3">
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>Current Plan</span>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    padding: '3px 10px',
                    borderRadius: 6,
                    background: extendTarget.plan === 'PRO' ? 'rgba(230,57,70,0.15)' : 'rgba(255,255,255,0.08)',
                    color: extendTarget.plan === 'PRO' ? '#E63946' : 'rgba(255,255,255,0.6)',
                  }}
                >
                  {extendTarget.plan}
                </span>
              </div>
              <div
                style={{
                  borderBottom: '1px solid rgba(255,255,255,0.06)',
                  margin: '0 -16px',
                }}
              />
              <div className="flex items-center justify-between mt-3">
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>Current Expiry</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.8)' }}>
                  {extendTarget.plan_expiry_date ? formatDate(extendTarget.plan_expiry_date) : 'No expiry'}
                </span>
              </div>
            </div>

            {/* New Expiry Date */}
            <div className="mb-6">
              <label
                style={{
                  display: 'block',
                  fontSize: 13,
                  fontWeight: 600,
                  color: 'rgba(255,255,255,0.6)',
                  marginBottom: 8,
                }}
              >
                New Expiry Date
              </label>
              <input
                type="date"
                value={newExpiryDate}
                onChange={(e) => setNewExpiryDate(e.target.value)}
                style={{
                  width: '100%',
                  background: '#161616',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 10,
                  padding: '12px 16px',
                  fontSize: 14,
                  color: '#FFFFFF',
                  fontFamily: '-apple-system, system-ui, sans-serif',
                  outline: 'none',
                  colorScheme: 'dark',
                }}
                onFocus={(e) => {
                  ;(e.currentTarget as HTMLElement).style.borderColor = 'rgba(52,199,89,0.5)'
                }}
                onBlur={(e) => {
                  ;(e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.1)'
                }}
              />
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => setShowExtendSheet(false)}
                className="flex-1 transition-all active:scale-95"
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  color: 'rgba(255,255,255,0.7)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 10,
                  padding: '12px 20px',
                  fontSize: 14,
                  fontWeight: 600,
                  fontFamily: '-apple-system, system-ui, sans-serif',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleExtend}
                disabled={extending || !newExpiryDate}
                className="flex items-center justify-center gap-2 flex-1 transition-all active:scale-95"
                style={{
                  background: extending || !newExpiryDate ? 'rgba(52,199,89,0.3)' : '#34C759',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: 10,
                  padding: '12px 20px',
                  fontSize: 14,
                  fontWeight: 600,
                  fontFamily: '-apple-system, system-ui, sans-serif',
                  cursor: extending || !newExpiryDate ? 'not-allowed' : 'pointer',
                }}
              >
                {extending ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
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
    </div>
  )
}
