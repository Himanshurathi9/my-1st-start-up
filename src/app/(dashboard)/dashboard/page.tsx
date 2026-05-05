'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  UtensilsCrossed,
  ChevronRight,
  Loader2,
  TrendingUp,
  ClipboardList,
  QrCode,
  Image as ImageIcon,
  ExternalLink,
  Sun,
  Moon,
  Cloud,
  Target,
  DollarSign,
} from 'lucide-react'
import toast from 'react-hot-toast'
import type { Restaurant } from '@/types'
import { formatPrice, isPlanExpired, daysUntilExpiry } from '@/lib/utils'
import AdminNotificationListener from '@/components/menu/AdminNotificationListener'

interface RestaurantData {
  restaurant: Restaurant
  todayOrders: number
  todayRevenue: number
  newOrdersCount: number
}

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

function GreetingIcon() {
  const hour = new Date().getHours()
  if (hour < 12) return <Cloud className="w-[16px] h-[16px]" style={{ color: 'var(--dash-accent)' }} />
  if (hour < 17) return <Sun className="w-[16px] h-[16px]" style={{ color: 'var(--dash-accent)' }} />
  return <Moon className="w-[16px] h-[16px]" style={{ color: 'var(--dash-accent)' }} />
}

/* ── Sparkline mock data ── */
const orderSparkData = [4, 7, 3, 8, 5, 9, 6]
const revenueSparkData = [30, 50, 20, 60, 45, 70, 55]

function SkeletonDashboard() {
  return (
    <div className="px-4 pt-5 space-y-4">
      {/* Greeting skeleton */}
      <div className="space-y-2 pt-0.5">
        <div className="dash-skeleton h-[18px] w-[140px] rounded-[8px]" />
        <div className="dash-skeleton h-[28px] w-[200px] rounded-[8px]" />
      </div>

      {/* Toggle card skeleton */}
      <div className="dash-skeleton h-[88px] rounded-[20px]" />

      {/* Stats skeleton */}
      <div className="grid grid-cols-2 gap-3">
        <div className="dash-skeleton h-[120px] rounded-[16px]" />
        <div className="dash-skeleton h-[120px] rounded-[16px]" />
      </div>

      {/* New orders skeleton */}
      <div className="dash-skeleton h-[56px] rounded-[16px]" />

      {/* Subscription skeleton */}
      <div className="dash-skeleton h-[80px] rounded-[20px]" />

      {/* View menu skeleton */}
      <div className="dash-skeleton h-[72px] rounded-[20px]" />

      {/* Quick actions skeleton */}
      <div className="grid grid-cols-2 gap-3">
        <div className="dash-skeleton h-[100px] rounded-[16px]" />
        <div className="dash-skeleton h-[100px] rounded-[16px]" />
        <div className="dash-skeleton h-[100px] rounded-[16px]" />
        <div className="dash-skeleton h-[100px] rounded-[16px]" />
      </div>

      {/* Performance skeleton */}
      <div className="dash-skeleton h-[140px] rounded-[20px]" />
    </div>
  )
}

export default function DashboardPage() {
  const router = useRouter()
  const [data, setData] = useState<RestaurantData | null>(null)
  const [loading, setLoading] = useState(true)
  const [toggling, setToggling] = useState(false)

  const fetchRestaurant = useCallback(async () => {
    try {
      const res = await fetch('/api/restaurant')
      if (res.status === 401) {
        router.push('/login')
        return
      }
      if (!res.ok) {
        toast.error('Could not load restaurant data')
        return
      }
      const json = await res.json()
      setData(json)
    } catch {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => {
    fetchRestaurant()
  }, [fetchRestaurant])

  const handleToggle = async () => {
    if (!data || toggling) return
    const newStatus = !data.restaurant.is_open
    setToggling(true)

    try {
      const res = await fetch('/api/restaurant', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_open: newStatus }),
      })

      if (!res.ok) {
        toast.error('Could not update status')
        return
      }

      setData((prev) =>
        prev
          ? {
              ...prev,
              restaurant: { ...prev.restaurant, is_open: newStatus },
            }
          : null
      )

      toast.success(newStatus ? 'Restaurant is now open for orders' : 'Restaurant is now closed')
    } catch {
      toast.error('Something went wrong')
    } finally {
      setToggling(false)
    }
  }

  const restaurant = data?.restaurant
  const isOpen = restaurant?.is_open ?? false
  const planExpired = restaurant ? isPlanExpired(restaurant.plan_expiry_date) : false
  const daysLeft = restaurant ? daysUntilExpiry(restaurant.plan_expiry_date) : Infinity

  const todayOrders = data?.todayOrders ?? 0
  const todayRevenue = data?.todayRevenue ?? 0

  /* Performance progress values (simulated targets) */
  const orderTarget = 30
  const revenueTarget = 5000
  const orderProgress = Math.min((todayOrders / orderTarget) * 100, 100)
  const revenueProgress = Math.min((todayRevenue / revenueTarget) * 100, 100)

  return (
    <div style={{ background: 'var(--dash-bg)' }}>
      {/* ═══ STICKY HEADER (52px) ═══ */}
      <header
        className="dash-glass sticky top-0 z-40 flex items-center justify-between px-4"
        style={{ height: '52px' }}
      >
        {/* Left: MenuMate logo */}
        <div className="flex items-center gap-2.5">
          <div
            className="flex items-center justify-center"
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #f97316, #ef4444)',
              boxShadow: '0 2px 8px rgba(249,115,22,0.3)',
            }}
          >
            <UtensilsCrossed className="w-[14px] h-[14px] text-white" />
          </div>
          <span
            className="text-[15px] font-bold tracking-[-0.02em]"
            style={{ color: 'var(--dash-text)' }}
          >
            MenuMate
          </span>
        </div>

        {/* Right: Restaurant name pill */}
        {restaurant && (
          <span
            className="text-[11px] font-semibold truncate max-w-[140px] sm:max-w-[180px] px-3 py-1"
            style={{
              color: 'var(--dash-text-2)',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid var(--dash-border)',
              borderRadius: '100px',
            }}
          >
            {restaurant.name}
          </span>
        )}
      </header>

      {/* ═══ PAGE CONTENT ═══ */}
      <div style={{ padding: '20px 16px 100px 16px' }}>
        {loading ? (
          <SkeletonDashboard />
        ) : !restaurant ? (
          /* ── NO RESTAURANT STATE ── */
          <div className="flex flex-col items-center justify-center px-6 animate-dash-section-enter" style={{ paddingTop: '120px' }}>
            <div
              className="flex items-center justify-center mb-4"
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '16px',
                background: 'var(--dash-surface-2)',
              }}
            >
              <UtensilsCrossed className="w-6 h-6" style={{ color: 'var(--dash-text-3)' }} />
            </div>
            <h3
              className="text-[15px] font-semibold mb-1"
              style={{ color: 'var(--dash-text)' }}
            >
              No restaurant yet
            </h3>
            <p
              className="text-[13px] text-center leading-relaxed max-w-[260px]"
              style={{ color: 'var(--dash-text-2)' }}
            >
              Contact support to get your restaurant set up on MenuMate.
            </p>
          </div>
        ) : (
          <>
            {/* ═══ 1. GREETING SECTION ═══ */}
            <div className="animate-dash-section-enter animate-dash-section-1">
              <div className="flex items-center gap-1.5">
                <GreetingIcon />
                <span
                  className="text-[14px] font-normal"
                  style={{ color: 'var(--dash-text-2)' }}
                >
                  {getGreeting()}
                </span>
              </div>
              <h1
                className="mt-1 truncate max-w-full"
                style={{
                  fontSize: '28px',
                  fontWeight: 800,
                  color: 'var(--dash-text)',
                  letterSpacing: '-0.03em',
                  lineHeight: 1.1,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {restaurant.name}
              </h1>
            </div>

            {/* ═══ 2. OPEN/CLOSE TOGGLE CARD ═══ */}
            <button
              onClick={handleToggle}
              disabled={toggling}
              className="dash-card w-full flex items-center justify-between animate-dash-section-enter animate-dash-section-2"
              style={{
                marginTop: '20px',
                borderRadius: '20px',
                padding: '20px 20px',
                background: isOpen ? 'rgba(34, 197, 94, 0.06)' : 'var(--dash-surface)',
                border: isOpen
                  ? '1px solid rgba(34, 197, 94, 0.15)'
                  : '1px solid var(--dash-border)',
                boxShadow: isOpen ? 'var(--dash-shadow-glow-green)' : 'var(--dash-shadow-card)',
                cursor: 'pointer',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {/* Gradient top border when open */}
              {isOpen && (
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '3px',
                    background: 'var(--dash-gradient)',
                    borderRadius: '3px 3px 0 0',
                  }}
                />
              )}

              <div className="flex items-center gap-3">
                {toggling ? (
                  <div className="w-[10px] h-[10px] flex items-center justify-center">
                    <Loader2 className="w-3 h-3 animate-spin" style={{ color: 'var(--dash-text-3)' }} />
                  </div>
                ) : (
                  <div
                    className={`w-[10px] h-[10px] rounded-full flex-shrink-0 ${
                      isOpen ? 'animate-dash-toggle-glow' : ''
                    }`}
                    style={{
                      background: isOpen ? 'var(--dash-accent)' : 'var(--dash-text-3)',
                      boxShadow: isOpen ? '0 0 8px rgba(34,197,94,0.5)' : 'none',
                    }}
                  />
                )}
                <div className="text-left">
                  <p
                    style={{
                      fontSize: '18px',
                      fontWeight: 700,
                      color: 'var(--dash-text)',
                    }}
                  >
                    {toggling
                      ? 'Updating...'
                      : isOpen
                        ? 'Open for Orders'
                        : 'Closed'}
                  </p>
                  <p
                    className="mt-0.5"
                    style={{
                      fontSize: '13px',
                      color: isOpen ? 'var(--dash-accent)' : 'var(--dash-text-3)',
                    }}
                  >
                    {toggling
                      ? 'Please wait...'
                      : isOpen
                        ? 'Customers can see your menu right now'
                        : 'Menu hidden from customers'}
                  </p>
                </div>
              </div>

              {/* Toggle Switch using dash-toggle classes */}
              <div className="flex-shrink-0">
                <div
                  className={`dash-toggle-track ${isOpen ? 'dash-toggle-track-on' : ''}`}
                  style={{
                    background: isOpen ? 'var(--dash-accent)' : 'var(--dash-surface-3)',
                    boxShadow: isOpen ? '0 0 12px rgba(34,197,94,0.3)' : 'none',
                  }}
                >
                  <div
                    className="dash-toggle-thumb"
                    style={{
                      transform: isOpen ? 'translateX(24px)' : 'translateX(0)',
                    }}
                  />
                </div>
              </div>
            </button>

            {/* ═══ 3. STATS ROW (2-col grid) ═══ */}
            <div
              className="grid grid-cols-2 gap-3 animate-dash-section-enter animate-dash-section-3"
              style={{ marginTop: '14px' }}
            >
              {/* Today's Orders Card */}
              <div className="dash-card dash-card-accent overflow-hidden" style={{ padding: '16px', borderRadius: '16px' }}>
                {/* Blue top accent */}
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '3px',
                    background: 'var(--dash-gradient-blue)',
                    borderRadius: '3px 3px 0 0',
                    zIndex: 1,
                  }}
                />
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className="flex items-center justify-center"
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '8px',
                      background: 'rgba(59,130,246,0.12)',
                    }}
                  >
                    <ClipboardList className="w-[14px] h-[14px]" style={{ color: '#60a5fa' }} />
                  </div>
                  <span
                    className="dash-section-label"
                    style={{ fontSize: '10px', letterSpacing: '0.06em' }}
                  >
                    TODAY&apos;S ORDERS
                  </span>
                </div>
                <p
                  style={{
                    fontSize: '32px',
                    fontWeight: 800,
                    letterSpacing: '-0.04em',
                    lineHeight: 1,
                    color: todayOrders > 0 ? '#60a5fa' : 'var(--dash-text)',
                  }}
                >
                  {todayOrders}
                </p>
                {/* Sparkline chart */}
                <div className="dash-sparkline" style={{ marginTop: '10px', height: '24px' }}>
                  {orderSparkData.map((val, i) => (
                    <div
                      key={i}
                      className="dash-sparkline-bar"
                      style={{
                        height: `${(val / 10) * 100}%`,
                        background: `rgba(59,130,246,${0.3 + (i / orderSparkData.length) * 0.5})`,
                        borderRadius: '2px',
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Revenue Card */}
              <div className="dash-card dash-card-accent overflow-hidden" style={{ padding: '16px', borderRadius: '16px' }}>
                {/* Green top accent - uses default gradient from ::before */}
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className="flex items-center justify-center"
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '8px',
                      background: 'rgba(34,197,94,0.12)',
                    }}
                  >
                    <TrendingUp className="w-[14px] h-[14px]" style={{ color: '#4ade80' }} />
                  </div>
                  <span
                    className="dash-section-label"
                    style={{ fontSize: '10px', letterSpacing: '0.06em' }}
                  >
                    REVENUE
                  </span>
                </div>
                <p
                  style={{
                    fontSize: '28px',
                    fontWeight: 800,
                    letterSpacing: '-0.04em',
                    lineHeight: 1,
                    color: todayRevenue > 0 ? '#4ade80' : 'var(--dash-text)',
                  }}
                >
                  {todayRevenue ? formatPrice(todayRevenue) : '₹0'}
                </p>
                {/* Sparkline chart */}
                <div className="dash-sparkline" style={{ marginTop: '10px', height: '24px' }}>
                  {revenueSparkData.map((val, i) => (
                    <div
                      key={i}
                      className="dash-sparkline-bar"
                      style={{
                        height: `${(val / 80) * 100}%`,
                        background: `rgba(34,197,94,${0.3 + (i / revenueSparkData.length) * 0.5})`,
                        borderRadius: '2px',
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* ═══ 4. NEW ORDERS ALERT ═══ */}
            {data.newOrdersCount > 0 && (
              <button
                onClick={() => router.push('/dashboard/orders')}
                className="w-full flex items-center justify-between animate-dash-section-enter animate-dash-section-4"
                style={{
                  marginTop: '12px',
                  borderRadius: '16px',
                  padding: '14px 18px',
                  background: 'rgba(239, 68, 68, 0.08)',
                  border: '1px solid rgba(239, 68, 68, 0.15)',
                  cursor: 'pointer',
                }}
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-2 h-2 rounded-full flex-shrink-0 animate-pulse-dot"
                    style={{ background: '#ef4444' }}
                  />
                  <span
                    style={{
                      fontSize: '14px',
                      fontWeight: 700,
                      color: '#f87171',
                    }}
                  >
                    {data.newOrdersCount} new orders waiting
                  </span>
                </div>
                <div className="flex items-center gap-0.5">
                  <span
                    style={{
                      fontSize: '13px',
                      fontWeight: 600,
                      color: '#f87171',
                    }}
                  >
                    View
                  </span>
                  <ChevronRight className="w-4 h-4" style={{ color: '#f87171' }} />
                </div>
              </button>
            )}

            {/* ═══ 5. SUBSCRIPTION CARD ═══ */}
            <div
              className="dash-card relative overflow-hidden animate-dash-section-enter animate-dash-section-4"
              style={{
                marginTop: '12px',
                borderRadius: '20px',
                padding: '18px 20px',
                background: 'linear-gradient(135deg, var(--dash-surface-2) 0%, var(--dash-surface) 100%)',
                borderLeft: '3px solid var(--dash-accent)',
              }}
            >
              {/* Decorative circle */}
              <div
                className="absolute rounded-full"
                style={{
                  width: '160px',
                  height: '160px',
                  background: 'rgba(34, 197, 94, 0.04)',
                  right: '-30px',
                  top: '-30px',
                  pointerEvents: 'none',
                }}
              />

              <div className="relative flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="dash-badge dash-badge-success flex-shrink-0">
                      {restaurant.plan}
                    </span>
                    <span
                      className="truncate"
                      style={{
                        color: 'var(--dash-text)',
                        fontSize: '15px',
                        fontWeight: 700,
                      }}
                    >
                      Plan
                    </span>
                  </div>
                  <p
                    style={{
                      color: 'var(--dash-text-3)',
                      fontSize: '12px',
                      marginTop: '4px',
                    }}
                  >
                    Active subscription
                  </p>
                </div>

                <div className="text-right flex-shrink-0">
                  {planExpired ? (
                    <>
                      <p style={{ color: 'var(--dash-text-3)', fontSize: '11px' }}>Expires in</p>
                      <p style={{ color: '#f87171', fontSize: '18px', fontWeight: 800 }}>Expired</p>
                    </>
                  ) : daysLeft === Infinity ? (
                    <>
                      <p style={{ color: 'var(--dash-text-3)', fontSize: '11px' }}>Expires in</p>
                      <p style={{ color: 'var(--dash-text)', fontSize: '18px', fontWeight: 800 }}>—</p>
                    </>
                  ) : (
                    <>
                      <p style={{ color: 'var(--dash-text-3)', fontSize: '11px' }}>Expires in</p>
                      <p
                        style={{
                          color: daysLeft <= 7 ? 'var(--dash-warning)' : 'var(--dash-text)',
                          fontSize: '18px',
                          fontWeight: 800,
                        }}
                      >
                        {daysLeft} day{daysLeft !== 1 ? 's' : ''}
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* ═══ 6. VIEW MY MENU BUTTON ═══ */}
            <button
              onClick={() => window.open(`/menu/${restaurant.slug}`, '_blank')}
              className="dash-card w-full flex items-center justify-between animate-dash-section-enter animate-dash-section-5"
              style={{
                marginTop: '12px',
                borderRadius: '20px',
                padding: '16px 18px',
                cursor: 'pointer',
              }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="flex items-center justify-center flex-shrink-0"
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '12px',
                    background: 'var(--dash-gradient-orange)',
                    boxShadow: '0 4px 12px rgba(249,115,22,0.2)',
                  }}
                >
                  <ExternalLink className="w-[20px] h-[20px] text-white" />
                </div>
                <div className="text-left">
                  <p
                    style={{
                      fontSize: '15px',
                      fontWeight: 700,
                      color: 'var(--dash-text)',
                    }}
                  >
                    View My Menu
                  </p>
                  <p
                    style={{
                      fontSize: '12px',
                      color: 'var(--dash-text-3)',
                    }}
                  >
                    See what your customers see
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--dash-text-3)' }} />
            </button>

            {/* ═══ 7. QUICK ACTIONS GRID (2x2) ═══ */}
            <div className="animate-dash-section-enter animate-dash-section-5" style={{ marginTop: '24px' }}>
              <p className="dash-section-label" style={{ marginBottom: '12px' }}>
                QUICK ACTIONS
              </p>
              <div className="grid grid-cols-2 gap-3">
                {/* Edit Menu */}
                <button
                  onClick={() => router.push('/dashboard/menu')}
                  className="dash-card flex flex-col items-center text-center"
                  style={{ padding: '18px 14px', borderRadius: '16px', cursor: 'pointer' }}
                >
                  <div
                    className="flex items-center justify-center mb-3"
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '12px',
                      background: 'rgba(59,130,246,0.1)',
                    }}
                  >
                    <UtensilsCrossed className="w-5 h-5" style={{ color: '#60a5fa' }} />
                  </div>
                  <span
                    style={{
                      fontSize: '13px',
                      fontWeight: 600,
                      color: 'var(--dash-text)',
                    }}
                  >
                    Edit Menu
                  </span>
                </button>

                {/* Live Orders */}
                <button
                  onClick={() => router.push('/dashboard/orders')}
                  className="dash-card flex flex-col items-center text-center relative"
                  style={{ padding: '18px 14px', borderRadius: '16px', cursor: 'pointer' }}
                >
                  <div
                    className="flex items-center justify-center mb-3 relative"
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '12px',
                      background: 'rgba(239, 68, 68, 0.1)',
                    }}
                  >
                    <ClipboardList className="w-5 h-5" style={{ color: '#f87171' }} />
                    {data.newOrdersCount > 0 && (
                      <span
                        className="absolute rounded-full animate-pulse-dot"
                        style={{
                          width: '8px',
                          height: '8px',
                          background: '#ef4444',
                          top: '-2px',
                          right: '-2px',
                          border: '2px solid var(--dash-surface)',
                        }}
                      />
                    )}
                  </div>
                  <span
                    style={{
                      fontSize: '13px',
                      fontWeight: 600,
                      color: 'var(--dash-text)',
                    }}
                  >
                    Live Orders
                  </span>
                </button>

                {/* Banners */}
                <button
                  onClick={() => router.push('/dashboard/banners')}
                  className="dash-card flex flex-col items-center text-center"
                  style={{ padding: '18px 14px', borderRadius: '16px', cursor: 'pointer' }}
                >
                  <div
                    className="flex items-center justify-center mb-3"
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '12px',
                      background: 'rgba(168, 85, 247, 0.1)',
                    }}
                  >
                    <ImageIcon className="w-5 h-5" style={{ color: '#c084fc' }} />
                  </div>
                  <span
                    style={{
                      fontSize: '13px',
                      fontWeight: 600,
                      color: 'var(--dash-text)',
                    }}
                  >
                    Banners
                  </span>
                </button>

                {/* QR Codes */}
                <button
                  onClick={() => router.push('/dashboard/settings')}
                  className="dash-card flex flex-col items-center text-center"
                  style={{ padding: '18px 14px', borderRadius: '16px', cursor: 'pointer' }}
                >
                  <div
                    className="flex items-center justify-center mb-3"
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '12px',
                      background: 'rgba(34, 197, 94, 0.1)',
                    }}
                  >
                    <QrCode className="w-5 h-5" style={{ color: '#4ade80' }} />
                  </div>
                  <span
                    style={{
                      fontSize: '13px',
                      fontWeight: 600,
                      color: 'var(--dash-text)',
                    }}
                  >
                    QR Codes
                  </span>
                </button>
              </div>
            </div>

            {/* ═══ 8. TODAY PERFORMANCE SECTION ═══ */}
            <div
              className="dash-card animate-dash-section-enter animate-dash-section-6"
              style={{
                marginTop: '16px',
                borderRadius: '20px',
                padding: '20px',
              }}
            >
              <div className="flex items-center gap-2 mb-4">
                <div
                  className="flex items-center justify-center"
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '8px',
                    background: 'rgba(34, 197, 94, 0.1)',
                  }}
                >
                  <Target className="w-[14px] h-[14px]" style={{ color: 'var(--dash-accent)' }} />
                </div>
                <span className="dash-section-label">DAILY PERFORMANCE</span>
              </div>

              {/* Orders Progress */}
              <div style={{ marginBottom: '18px' }}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <ClipboardList className="w-[13px] h-[13px]" style={{ color: '#60a5fa' }} />
                    <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--dash-text)' }}>
                      Orders
                    </span>
                  </div>
                  <span style={{ fontSize: '12px', color: 'var(--dash-text-2)' }}>
                    {todayOrders} / {orderTarget}
                  </span>
                </div>
                <div className="dash-progress">
                  <div
                    className="dash-progress-fill"
                    style={{
                      width: `${orderProgress}%`,
                      background: 'var(--dash-gradient-blue)',
                    }}
                  />
                </div>
              </div>

              {/* Revenue Progress */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-[13px] h-[13px]" style={{ color: '#4ade80' }} />
                    <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--dash-text)' }}>
                      Revenue
                    </span>
                  </div>
                  <span style={{ fontSize: '12px', color: 'var(--dash-text-2)' }} className="truncate max-w-[140px]">
                    {formatPrice(todayRevenue)} / {formatPrice(revenueTarget)}
                  </span>
                </div>
                <div className="dash-progress">
                  <div
                    className="dash-progress-fill"
                    style={{
                      width: `${revenueProgress}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Admin notification listener — plays bell sounds on waiter/bill requests */}
      {restaurant && (
        <AdminNotificationListener restaurantId={restaurant.id} />
      )}
    </div>
  )
}
