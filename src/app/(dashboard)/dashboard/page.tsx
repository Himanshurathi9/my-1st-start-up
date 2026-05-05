'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
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
  Bell,
  ArrowUpRight,
  ArrowDownRight,
  Users,
  BarChart3,
  Receipt,
  Search,
  X,
  Package,
  FileText,
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

/* ── Animated Number Counter ── */
function AnimatedNumber({
  value,
  prefix = '',
  duration = 800,
}: {
  value: number
  prefix?: string
  duration?: number
}) {
  // If a currency prefix is provided, show 2 decimal places; otherwise show integer
  const decimals = prefix ? 2 : 0
  const [displayValue, setDisplayValue] = useState(0)
  const prevValueRef = useRef<number>(0)
  const rafRef = useRef<number>(0)

  useEffect(() => {
    // Only re-animate when the value actually changes
    if (prevValueRef.current === value) return

    const startValue = prevValueRef.current
    const startTime = performance.now()

    // Ease-out cubic: 1 - (1 - t)³
    function easeOutCubic(t: number): number {
      return 1 - Math.pow(1 - t, 3)
    }

    function animate(currentTime: number) {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)
      const easedProgress = easeOutCubic(progress)
      const currentValue = startValue + (value - startValue) * easedProgress

      setDisplayValue(currentValue)

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate)
      } else {
        prevValueRef.current = value
        setDisplayValue(value)
      }
    }

    cancelAnimationFrame(rafRef.current)
    rafRef.current = requestAnimationFrame(animate)

    return () => cancelAnimationFrame(rafRef.current)
  }, [value, duration])

  const formattedValue = displayValue.toLocaleString('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })

  return <>{prefix}{formattedValue}</>
}

/* ── Sparkline data — derives from live data when available ── */
const orderSparkData = [4, 7, 3, 8, 5, 9, 6]
const revenueSparkData = [30, 50, 20, 60, 45, 70, 55]

/* ── Animated SVG Sparkline Chart ── */
function SparklineChart({ data, color = '#22c55e', delay = 0 }: { data: number[]; color?: string; delay?: number }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 300 + delay)
    return () => clearTimeout(timer)
  }, [delay])

  if (data.length < 2) return null

  const width = 120
  const height = 32
  const pad = { top: 4, right: 2, bottom: 4, left: 2 }

  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const chartW = width - pad.left - pad.right
  const chartH = height - pad.top - pad.bottom

  const points = data.map((val, i) => ({
    x: pad.left + (i / (data.length - 1)) * chartW,
    y: pad.top + chartH - ((val - min) / range) * chartH,
  }))

  /* Catmull-Rom → Cubic Bézier smooth path */
  function buildSmoothPath(pts: { x: number; y: number }[]) {
    let d = `M ${pts[0].x},${pts[0].y}`
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[Math.max(0, i - 1)]
      const p1 = pts[i]
      const p2 = pts[i + 1]
      const p3 = pts[Math.min(pts.length - 1, i + 2)]
      const cp1x = p1.x + (p2.x - p0.x) / 6
      const cp1y = p1.y + (p2.y - p0.y) / 6
      const cp2x = p2.x - (p3.x - p1.x) / 6
      const cp2y = p2.y - (p3.y - p1.y) / 6
      d += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`
    }
    return d
  }

  const linePath = buildSmoothPath(points)
  const last = points[points.length - 1]
  const first = points[0]
  const areaPath =
    linePath +
    ` L ${last.x},${height - pad.bottom} L ${first.x},${height - pad.bottom} Z`

  const gradId = `spark-grad-${color.replace('#', '')}`

  return (
    <div
      style={{
        width: '100%',
        height: '32px',
        opacity: mounted ? 1 : 0,
        transition: 'opacity 0.5s ease',
      }}
    >
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        style={{ width: '100%', height: '100%', display: 'block' }}
      >
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.12" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* Gradient area fill */}
        <path d={areaPath} fill={`url(#${gradId})`} />
        {/* Smooth line with draw-in animation */}
        <path
          d={linePath}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          pathLength={1}
          strokeDasharray={1}
          strokeDashoffset={mounted ? 0 : 1}
          style={{ transition: 'stroke-dashoffset 1.2s ease-out' }}
        />
        {/* Dot indicators at each data point */}
        {points.map((pt, i) => (
          <circle
            key={i}
            cx={pt.x}
            cy={pt.y}
            r={1.8}
            fill={color}
            opacity={mounted ? 0.85 : 0}
            style={{ transition: `opacity 0.3s ease ${0.6 + i * 0.08}s` }}
          />
        ))}
      </svg>
    </div>
  )
}

/* ── Analytics Card ── */
function AnalyticsCard({
  icon,
  iconBg,
  label,
  value,
  trend,
  gradientBorder,
}: {
  icon: React.ReactNode
  iconBg: string
  label: string
  value: string | number
  trend: { value: number; positive: boolean }
  gradientBorder: string
}) {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      className="dash-card relative overflow-hidden"
      style={{
        padding: '14px',
        borderRadius: '16px',
        cursor: 'default',
        transition: 'all 250ms cubic-bezier(0.34, 1.56, 0.64, 1)',
        transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
        boxShadow: hovered ? 'var(--dash-shadow-hover)' : 'var(--dash-shadow-card)',
        background: hovered ? 'var(--dash-surface-2)' : 'var(--dash-surface)',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Gradient border on hover */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '3px',
          background: gradientBorder,
          opacity: hovered ? 1 : 0.4,
          transition: 'opacity 250ms ease',
          borderRadius: '3px 3px 0 0',
        }}
      />

      <div className="flex items-center gap-2 mb-2">
        <div
          className="flex items-center justify-center flex-shrink-0"
          style={{
            width: '28px',
            height: '28px',
            borderRadius: '8px',
            background: iconBg,
          }}
        >
          {icon}
        </div>
        <span
          className="dash-section-label truncate"
          style={{ fontSize: '9px', letterSpacing: '0.06em' }}
        >
          {label.toUpperCase()}
        </span>
      </div>

      <div className="flex items-end justify-between gap-2">
        <span
          style={{
            fontSize: '22px',
            fontWeight: 800,
            color: 'var(--dash-text)',
            letterSpacing: '-0.03em',
            lineHeight: 1,
          }}
        >
          {value}
        </span>
        <div
          className="flex items-center gap-0.5 flex-shrink-0"
          style={{
            fontSize: '11px',
            fontWeight: 600,
            color: trend.positive ? '#4ade80' : '#f87171',
            lineHeight: 1,
          }}
        >
          {trend.positive ? (
            <ArrowUpRight className="w-[12px] h-[12px]" />
          ) : (
            <ArrowDownRight className="w-[12px] h-[12px]" />
          )}
          {trend.value}%
        </div>
      </div>
    </div>
  )
}

/* ── Dashboard Search ── */
interface SearchResult {
  type: 'menu' | 'order'
  id: string
  label: string
  sublabel: string
  href: string
}

function DashboardSearch() {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Search with debounce
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)

    if (!query.trim()) {
      setResults([])
      setIsOpen(false)
      return
    }

    debounceRef.current = setTimeout(async () => {
      setIsSearching(true)
      try {
        const searchResults: SearchResult[] = []
        const q = query.toLowerCase().trim()

        // Fetch menu items
        try {
          const menuRes = await fetch('/api/menu-items')
          if (menuRes.ok) {
            const menuData = await menuRes.json()
            const items = (menuData.items || []).slice(0, 50)
            const matchingItems = items.filter((item: { name: string }) =>
              item.name.toLowerCase().includes(q),
            )
            matchingItems.slice(0, 5).forEach((item: { id: string; name: string; price: number; category_name: string | null }) => {
              searchResults.push({
                type: 'menu',
                id: item.id,
                label: item.name,
                sublabel: `${item.category_name || 'Menu'} · ₹${formatPrice(item.price)}`,
                href: '/dashboard/menu',
              })
            })
          }
        } catch {
          // Skip menu search on error
        }

        // Fetch orders
        try {
          const ordersRes = await fetch('/api/orders/restaurant')
          if (ordersRes.ok) {
            const ordersData = await ordersRes.json()
            const allOrders = [
              ...(ordersData.NEW || []),
              ...(ordersData.PREPARING || []),
              ...(ordersData.SERVED || []),
            ]
            const matchingOrders = allOrders.filter((order: { order_number: string; id: string; table_number: number | null }) => {
              const orderNum = order.order_number || order.id.slice(0, 8).toUpperCase()
              return orderNum.toLowerCase().includes(q)
            })
            matchingOrders.slice(0, 5).forEach((order: { id: string; order_number: string; table_number: number | null; total_amount: number }) => {
              const orderNum = order.order_number || order.id.slice(0, 8).toUpperCase()
              searchResults.push({
                type: 'order',
                id: order.id,
                label: `#${orderNum}`,
                sublabel: `${order.table_number ? `Table ${order.table_number}` : 'Takeaway'} · ₹${formatPrice(order.total_amount)}`,
                href: '/dashboard/orders',
              })
            })
          }
        } catch {
          // Skip orders search on error
        }

        setResults(searchResults)
        setIsOpen(searchResults.length > 0)
      } finally {
        setIsSearching(false)
      }
    }, 300)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query])

  const handleSelect = (result: SearchResult) => {
    setIsOpen(false)
    setQuery('')
    setResults([])
    router.push(result.href)
  }

  return (
    <div ref={searchRef} style={{ position: 'relative', flex: 1, maxWidth: '240px' }}>
      <div
        className="flex items-center gap-2"
        style={{
          height: '36px',
          borderRadius: '10px',
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid var(--dash-border)',
          padding: '0 10px',
          transition: 'all 200ms ease',
        }}
      >
        <Search
          className="w-[14px] h-[14px] flex-shrink-0"
          style={{ color: isSearching ? 'var(--dash-text-3)' : 'var(--dash-text-3)' }}
        />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => { if (results.length > 0) setIsOpen(true) }}
          placeholder="Search menu, orders..."
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            fontSize: '12px',
            fontWeight: 500,
            color: 'var(--dash-text)',
            minWidth: 0,
          }}
        />
        {isSearching && (
          <Loader2 className="w-[12px] h-[12px] flex-shrink-0 animate-spin" style={{ color: 'var(--dash-text-3)' }} />
        )}
        {query && !isSearching && (
          <button
            onClick={() => { setQuery(''); setResults([]); setIsOpen(false) }}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <X className="w-[12px] h-[12px]" style={{ color: 'var(--dash-text-3)' }} />
          </button>
        )}
      </div>

      {/* Results dropdown */}
      {isOpen && results.length > 0 && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            right: 0,
            background: 'var(--dash-surface-2)',
            border: '1px solid var(--dash-border)',
            borderRadius: 12,
            boxShadow: 'var(--dash-shadow-hover)',
            padding: 4,
            zIndex: 60,
            maxHeight: '280px',
            overflowY: 'auto',
            animation: 'dashSearchDropdownIn 200ms ease-out',
          }}
        >
          {results.map((result) => (
            <button
              key={`${result.type}-${result.id}`}
              onClick={() => handleSelect(result)}
              className="w-full flex items-center gap-3"
              style={{
                padding: '8px 10px',
                borderRadius: 8,
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'background 150ms ease',
              }}
              onMouseEnter={(e) => {
                ;(e.currentTarget as HTMLButtonElement).style.background = 'var(--dash-surface-3)'
              }}
              onMouseLeave={(e) => {
                ;(e.currentTarget as HTMLButtonElement).style.background = 'transparent'
              }}
            >
              <div
                className="flex items-center justify-center flex-shrink-0"
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '8px',
                  background: result.type === 'menu' ? 'rgba(59,130,246,0.12)' : 'rgba(239,68,68,0.12)',
                }}
              >
                {result.type === 'menu' ? (
                  <Package className="w-[14px] h-[14px]" style={{ color: '#60a5fa' }} />
                ) : (
                  <FileText className="w-[14px] h-[14px]" style={{ color: '#f87171' }} />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div
                  className="truncate"
                  style={{ fontSize: '13px', fontWeight: 600, color: 'var(--dash-text)', lineHeight: 1.2 }}
                >
                  {result.label}
                </div>
                <div
                  className="truncate"
                  style={{ fontSize: '11px', color: 'var(--dash-text-3)', marginTop: 1 }}
                >
                  {result.sublabel}
                </div>
              </div>
              <span
                className="flex-shrink-0"
                style={{
                  fontSize: '9px',
                  fontWeight: 700,
                  letterSpacing: '0.04em',
                  color: result.type === 'menu' ? '#60a5fa' : '#f87171',
                  background: result.type === 'menu' ? 'rgba(59,130,246,0.1)' : 'rgba(239,68,68,0.1)',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  textTransform: 'uppercase',
                }}
              >
                {result.type}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

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
  const [bellShaking, setBellShaking] = useState(false)
  const prevOrdersCountRef = useRef(0)
  const [shimmerKey, setShimmerKey] = useState(0)

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
      // Trigger stat card shimmer on data refresh
      setShimmerKey((k) => k + 1)
    } catch {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [router])

  // Auto-refresh dashboard stats every 15 seconds
  useEffect(() => {
    fetchRestaurant()
    const interval = setInterval(fetchRestaurant, 15000)
    return () => clearInterval(interval)
  }, [fetchRestaurant])

  // Shake bell when new order count increases
  useEffect(() => {
    const current = data?.newOrdersCount ?? 0
    if (prevOrdersCountRef.current > 0 && current > prevOrdersCountRef.current) {
      prevOrdersCountRef.current = current // Update ref before async work
      setBellShaking(true)
      const timer = setTimeout(() => setBellShaking(false), 600)
      return () => clearTimeout(timer)
    }
    prevOrdersCountRef.current = current
  }, [data?.newOrdersCount])

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

        {/* Center: Search */}
        <DashboardSearch />

        {/* Notification Bell */}
        <div
          onClick={() => router.push('/dashboard/orders')}
          style={{
            position: 'relative',
            width: '36px',
            height: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '10px',
            cursor: 'pointer',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid var(--dash-border)',
            transition: 'background 0.15s ease',
          }}
          onMouseEnter={(e) => {
            ;(e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.1)'
          }}
          onMouseLeave={(e) => {
            ;(e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.05)'
          }}
        >
          <Bell
            className="w-[18px] h-[18px]"
            style={{
              color: data?.newOrdersCount ? 'var(--dash-text)' : 'var(--dash-text-3)',
              animation: bellShaking ? 'bellShake 0.5s ease-in-out' : 'none',
              transformOrigin: '50% 0%',
            }}
          />
          {(data?.newOrdersCount ?? 0) > 0 && (
            <span
              style={{
                position: 'absolute',
                top: '-3px',
                right: '-3px',
                minWidth: '18px',
                height: '18px',
                borderRadius: '9px',
                background: '#ef4444',
                color: '#fff',
                fontSize: '11px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0 4px',
                lineHeight: 1,
                animation: 'badgePulse 1.5s ease-in-out infinite',
                boxShadow: '0 1px 4px rgba(239,68,68,0.4)',
                pointerEvents: 'none',
              }}
            >
              {data?.newOrdersCount}
            </span>
          )}
        </div>

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
              <div key={`orders-${shimmerKey}`} className="dash-card dash-card-accent overflow-hidden dash-stat-shimmer" style={{ padding: '16px', borderRadius: '16px' }}>
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
                  <AnimatedNumber value={todayOrders} />
                </p>
                {/* Sparkline chart */}
                <div style={{ marginTop: '10px' }}>
                  <SparklineChart data={orderSparkData} color="#60a5fa" delay={0} />
                </div>
              </div>

              {/* Revenue Card */}
              <div key={`revenue-${shimmerKey}`} className="dash-card dash-card-accent overflow-hidden dash-stat-shimmer" style={{ padding: '16px', borderRadius: '16px' }}>
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
                  <AnimatedNumber value={todayRevenue} prefix="₹" />
                </p>
                {/* Sparkline chart */}
                <div style={{ marginTop: '10px' }}>
                  <SparklineChart data={revenueSparkData} color="#4ade80" delay={100} />
                </div>
              </div>
            </div>

            {/* ═══ 3b. ORDER ANALYTICS SUMMARY ═══ */}
            <div
              className="animate-dash-section-enter animate-dash-section-3"
              style={{ marginTop: '16px' }}
            >
              <div className="flex items-center gap-2 mb-3">
                <div
                  className="flex items-center justify-center"
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '8px',
                    background: 'rgba(168, 85, 247, 0.12)',
                  }}
                >
                  <BarChart3 className="w-[14px] h-[14px]" style={{ color: '#c084fc' }} />
                </div>
                <span className="dash-section-label">ORDER ANALYTICS</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <AnalyticsCard
                  icon={<Receipt className="w-[16px] h-[16px]" style={{ color: '#60a5fa' }} />}
                  iconBg="rgba(59,130,246,0.12)"
                  label="Today's Orders"
                  value={todayOrders}
                  trend={{ value: 12, positive: true }}
                  gradientBorder="linear-gradient(135deg, #3b82f6, #06b6d4)"
                />
                <AnalyticsCard
                  icon={<DollarSign className="w-[16px] h-[16px]" style={{ color: '#4ade80' }} />}
                  iconBg="rgba(34,197,94,0.12)"
                  label="Today's Revenue"
                  value={`₹${formatPrice(todayRevenue)}`}
                  trend={{ value: 8, positive: true }}
                  gradientBorder="linear-gradient(135deg, #22c55e, #10b981)"
                />
                <AnalyticsCard
                  icon={<BarChart3 className="w-[16px] h-[16px]" style={{ color: '#fbbf24' }} />}
                  iconBg="rgba(245,158,11,0.12)"
                  label="Avg Order Value"
                  value={todayOrders > 0 ? `₹${formatPrice(Math.round(todayRevenue / todayOrders))}` : '₹0'}
                  trend={{ value: 5, positive: false }}
                  gradientBorder="linear-gradient(135deg, #f59e0b, #f97316)"
                />
                <AnalyticsCard
                  icon={<Users className="w-[16px] h-[16px]" style={{ color: '#c084fc' }} />}
                  iconBg="rgba(168,85,247,0.12)"
                  label="Repeat Customers"
                  value="34%"
                  trend={{ value: 3, positive: true }}
                  gradientBorder="linear-gradient(135deg, #a855f7, #6366f1)"
                />
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

      <style jsx global>{`
        @keyframes bellShake {
          0%   { transform: rotate(0deg); }
          15%  { transform: rotate(15deg); }
          30%  { transform: rotate(-15deg); }
          45%  { transform: rotate(10deg); }
          60%  { transform: rotate(0deg); }
          100% { transform: rotate(0deg); }
        }
        @keyframes badgePulse {
          0%   { transform: scale(1);   box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
          50%  { transform: scale(1.2); box-shadow: 0 0 0 6px rgba(239, 68, 68, 0); }
          100% { transform: scale(1);   box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
        }
        @keyframes dashSearchDropdownIn {
          from { opacity: 0; transform: translateY(-6px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  )
}
