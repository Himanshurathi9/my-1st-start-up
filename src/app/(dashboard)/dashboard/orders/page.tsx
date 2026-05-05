'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  RefreshCw, Loader2, Clock, ChevronDown, ChevronUp,
} from 'lucide-react'
import toast from 'react-hot-toast'
import type { Order, OrderItem, OrderStatus } from '@/types'
import { formatPrice } from '@/lib/utils'
import { useOrderBadgeStore } from '@/lib/store'

// ─── Types ─────────────────────────────────────────────────────
interface OrdersData {
  NEW: Order[]
  PREPARING: Order[]
  SERVED: Order[]
  totalToday: number
  newCount: number
}

// ─── Status Config ─────────────────────────────────────────────
const STATUS_CONFIG: Record<OrderStatus, {
  label: string
  color: string
  gradient: string
  dotBg: string
  shadow: string
  badgeClass: string
}> = {
  NEW: {
    label: 'New',
    color: '#ef4444',
    gradient: 'linear-gradient(135deg, #ef4444, #dc2626)',
    dotBg: 'rgba(239,68,68,0.12)',
    shadow: '0 0 16px rgba(239,68,68,0.25)',
    badgeClass: 'dash-badge-error',
  },
  PREPARING: {
    label: 'Preparing',
    color: '#f59e0b',
    gradient: 'linear-gradient(135deg, #f59e0b, #d97706)',
    dotBg: 'rgba(245,158,11,0.12)',
    shadow: '0 0 16px rgba(245,158,11,0.25)',
    badgeClass: 'dash-badge-warning',
  },
  SERVED: {
    label: 'Served',
    color: '#22c55e',
    gradient: 'linear-gradient(135deg, #22c55e, #16a34a)',
    dotBg: 'rgba(34,197,94,0.12)',
    shadow: '0 0 16px rgba(34,197,94,0.25)',
    badgeClass: 'dash-badge-success',
  },
}

const TAB_STATUSES: OrderStatus[] = ['NEW', 'PREPARING', 'SERVED']

// ─── Helpers ───────────────────────────────────────────────────
function formatTime(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleTimeString('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

function getOrderNumber(order: Order): string {
  return (order as Record<string, unknown>).order_number as string || order.id.slice(0, 8).toUpperCase()
}

function summarizeItems(items: OrderItem[], max: number = 3): string {
  if (!items || items.length === 0) return ''
  const parts = items.slice(0, max).map((i) => `${i.item_name} ×${i.quantity}`)
  let result = parts.join('  ·  ')
  if (items.length > max) {
    result += `  +${items.length - max} more`
  }
  return result
}

function timeAgoShort(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const secs = Math.floor(diff / 1000)
  if (secs < 10) return 'just now'
  if (secs < 60) return `${secs}s ago`
  const mins = Math.floor(secs / 60)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  return `${hrs}h ago`
}

function getTimeElapsedInfo(dateStr: string): { dotColor: string; textColor: string; animate: boolean; text: string } {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  const text = timeAgoShort(dateStr)

  if (mins < 5) {
    return { dotColor: '#22c55e', textColor: '#4ade80', animate: true, text }
  } else if (mins <= 15) {
    return { dotColor: '#f59e0b', textColor: '#fbbf24', animate: false, text }
  } else {
    return { dotColor: '#ef4444', textColor: '#f87171', animate: true, text }
  }
}

// ─── Skeleton Loader ───────────────────────────────────────────
function SkeletonOrders() {
  return (
    <div className="px-4 pt-4 space-y-4">
      {/* Tab skeleton */}
      <div
        className="dash-skeleton"
        style={{ height: 48, borderRadius: 14 }}
      />
      {/* Card skeletons */}
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="dash-card"
          style={{ padding: 0, overflow: 'hidden' }}
        >
          <div className="dash-skeleton" style={{ height: 4, borderRadius: 0 }} />
          <div style={{ padding: '16px' }} className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="dash-skeleton" style={{ width: 100, height: 22, borderRadius: 8 }} />
              <div className="dash-skeleton" style={{ width: 60, height: 28, borderRadius: 100 }} />
            </div>
            <div className="dash-skeleton" style={{ width: '100%', height: 16, borderRadius: 8 }} />
            <div className="dash-skeleton" style={{ width: '75%', height: 16, borderRadius: 8 }} />
            <div className="flex items-center justify-between" style={{ marginTop: 4 }}>
              <div className="dash-skeleton" style={{ width: 72, height: 20, borderRadius: 8 }} />
              <div className="dash-skeleton" style={{ width: 120, height: 36, borderRadius: 100 }} />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Empty State ───────────────────────────────────────────────
function EmptyState({ status }: { status: OrderStatus }) {
  const config = STATUS_CONFIG[status]
  const messages: Record<OrderStatus, { title: string; subtitle: string }> = {
    NEW: { title: 'No new orders', subtitle: 'Waiting for incoming orders' },
    PREPARING: { title: 'Nothing preparing', subtitle: 'All caught up — no orders in progress' },
    SERVED: { title: 'No served orders', subtitle: 'Served orders will appear here' },
  }
  const msg = messages[status]

  return (
    <div className="flex flex-col items-center py-16 px-6">
      <div
        className="dash-card flex items-center justify-center animate-dash-section-enter"
        style={{
          width: 80,
          height: 80,
          borderRadius: 24,
          background: config.dotBg,
        }}
      >
        <Clock className="w-10 h-10" style={{ color: config.color, opacity: 0.7 }} />
      </div>
      <h3
        className="animate-dash-section-enter animate-dash-section-2"
        style={{
          fontSize: 18,
          fontWeight: 700,
          color: 'var(--dash-text)',
          marginTop: 20,
          letterSpacing: '-0.01em',
        }}
      >
        {msg.title}
      </h3>
      <p
        className="animate-dash-section-enter animate-dash-section-3"
        style={{
          fontSize: 14,
          color: 'var(--dash-text-2)',
          marginTop: 6,
          textAlign: 'center',
          lineHeight: 1.5,
        }}
      >
        {msg.subtitle}
      </p>
    </div>
  )
}

// ─── Order Card ────────────────────────────────────────────────
function OrderCard({
  order,
  status,
  onUpdate,
  index,
}: {
  order: Order
  status: OrderStatus
  onUpdate: () => void
  index: number
}) {
  const [expanded, setExpanded] = useState(false)
  const [updating, setUpdating] = useState(false)
  const items = order.order_items || []

  const handleAction = async () => {
    const nextStatus: OrderStatus = status === 'NEW' ? 'PREPARING' : 'SERVED'
    setUpdating(true)
    try {
      const res = await fetch(`/api/orders/${order.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      })
      if (!res.ok) {
        const j = await res.json()
        toast.error(j.error || 'Could not update order')
        return
      }
      toast.success(
        nextStatus === 'PREPARING'
          ? 'Order sent to kitchen'
          : 'Order marked as served',
      )
      onUpdate()
    } catch {
      toast.error('Something went wrong')
    } finally {
      setUpdating(false)
    }
  }

  const timeSince = timeAgoShort(order.created_at)
  const timeInfo = getTimeElapsedInfo(order.created_at)
  const config = STATUS_CONFIG[status]
  const nextConfig = status === 'NEW' ? STATUS_CONFIG.PREPARING : STATUS_CONFIG.SERVED
  const nextLabel = status === 'NEW' ? 'Start Preparing' : 'Mark Served'

  return (
    <div
      className="dash-card"
      style={{
        margin: '0 16px 12px',
        padding: 0,
        overflow: 'hidden',
        opacity: 0,
        animation: `dash-order-in 350ms cubic-bezier(0.34, 1.56, 0.64, 1) ${index * 60}ms forwards`,
      }}
    >
      {/* Status color strip */}
      <div style={{ height: 4, background: config.gradient }} />

      {/* Card body */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left"
        style={{
          padding: '14px 16px 16px',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          minHeight: 44,
        }}
      >
        {/* Top row: table + order number + time pill */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span
              style={{
                fontSize: 17,
                fontWeight: 800,
                color: 'var(--dash-text)',
                letterSpacing: '-0.02em',
              }}
            >
              {order.table_number ? `Table ${order.table_number}` : 'Takeaway'}
            </span>
            <span
              style={{
                fontSize: 11,
                color: 'var(--dash-text-3)',
                fontFamily: 'var(--font-mono)',
              }}
            >
              #{getOrderNumber(order)}
            </span>
          </div>

          {/* Time pill */}
          <div
            className="flex items-center gap-1.5"
            style={{
              background: timeInfo.dotColor === '#22c55e'
                ? 'rgba(34,197,94,0.1)'
                : timeInfo.dotColor === '#f59e0b'
                  ? 'rgba(245,158,11,0.1)'
                  : 'rgba(239,68,68,0.1)',
              borderRadius: 100,
              padding: '4px 10px',
              fontSize: 11,
              fontWeight: 600,
              color: timeInfo.textColor,
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: timeInfo.dotColor,
                display: 'inline-block',
                animation: timeInfo.animate ? 'dash-live-pulse 2s ease-in-out infinite' : 'none',
              }}
            />
            {expanded ? (
              <ChevronUp className="w-3 h-3" style={{ color: timeInfo.textColor }} />
            ) : (
              <ChevronDown className="w-3 h-3" style={{ color: timeInfo.textColor }} />
            )}
            {timeSince}
          </div>
        </div>

        {/* Items preview (collapsed) */}
        {!expanded && items.length > 0 && (
          <div
            style={{
              marginTop: 12,
              background: 'var(--dash-surface-2)',
              borderRadius: 12,
              padding: '10px 12px',
              fontSize: 13,
              color: 'var(--dash-text-2)',
              lineHeight: 1.5,
            }}
          >
            {summarizeItems(items, 4)}
          </div>
        )}

        {/* Expanded items list */}
        {expanded && items.length > 0 && (
          <div
            style={{
              marginTop: 12,
              background: 'var(--dash-surface-2)',
              borderRadius: 12,
              padding: '10px 12px',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {items.map((item) => (
                <div key={item.id} className="flex items-center justify-between">
                  <span style={{ fontSize: 13, color: 'var(--dash-text)' }}>
                    <span className="mr-1" style={{ color: 'var(--dash-text-2)' }}>{item.quantity}×</span>
                    {item.item_name}
                  </span>
                  <span
                    style={{
                      fontSize: 13,
                      color: 'var(--dash-text-2)',
                      fontFamily: 'var(--font-mono)',
                    }}
                  >
                    {formatPrice(item.item_price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Note */}
        {expanded && order.note && (
          <div
            style={{
              marginTop: 8,
              padding: '8px 12px',
              borderRadius: 12,
              background: 'rgba(245,158,11,0.08)',
              border: '1px solid rgba(245,158,11,0.12)',
            }}
          >
            <p style={{ fontSize: 12, lineHeight: 1.5, color: '#fbbf24' }}>
              <span style={{ fontWeight: 600 }}>Note:</span> {order.note}
            </p>
          </div>
        )}

        {/* Bottom row: price + action */}
        <div className="flex items-center justify-between" style={{ marginTop: 14 }}>
          {/* Price */}
          <span
            className="flex-shrink-0"
            style={{
              fontSize: 18,
              fontWeight: 800,
              color: 'var(--dash-text)',
              fontFamily: 'var(--font-mono)',
              letterSpacing: '-0.02em',
            }}
          >
            {formatPrice(order.total_amount)}
          </span>

          {/* Action button */}
          {status !== 'SERVED' ? (
            <button
              onClick={(e) => { e.stopPropagation(); handleAction() }}
              disabled={updating}
              className="flex items-center justify-center animate-btn-press flex-shrink-0"
              style={{
                height: 36,
                borderRadius: 100,
                padding: '0 14px',
                fontSize: 13,
                fontWeight: 700,
                background: nextConfig.gradient,
                color: '#fff',
                boxShadow: nextConfig.shadow,
                border: 'none',
                cursor: 'pointer',
                minWidth: 44,
                transition: 'all 150ms cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            >
              {updating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  {nextLabel}
                  <ChevronRight className="w-3.5 h-3.5" style={{ marginLeft: 2 }} />
                </>
              )}
            </button>
          ) : (
            <span
              className="flex items-center justify-center"
              style={{
                height: 36,
                borderRadius: 100,
                padding: '0 16px',
                fontSize: 12,
                fontWeight: 600,
                background: 'rgba(34,197,94,0.08)',
                color: '#4ade80',
              }}
            >
              ✓ Completed
            </span>
          )}
        </div>
      </button>
    </div>
  )
}

// ─── ChevronRight (needed for action button arrow) ─────────────
function ChevronRight({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg
      className={className}
      style={style}
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 18l6-6-6-6" />
    </svg>
  )
}

// ═══════════════════════════════════════════════════════════════
// ─── Main Page ─────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════
export default function OrdersPage() {
  const [data, setData] = useState<OrdersData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [lastUpdatedText, setLastUpdatedText] = useState('')
  const [activeTab, setActiveTab] = useState<OrderStatus>('NEW')
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // ─── Fetch orders ─────────────────────────────────────────
  const fetchOrders = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else if (!data) setLoading(true)

    try {
      const res = await fetch('/api/orders/restaurant')
      if (res.status === 401) return
      if (!res.ok) { toast.error('Could not load orders'); return }
      const json = await res.json()
      setData(json)
      setLastUpdated(new Date())
      setLastUpdatedText('just now')
      // Update badge in BottomNav
      useOrderBadgeStore.getState().setNewCount(json.newCount || 0)
    } catch {
      toast.error('Something went wrong')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [data])

  // Initial fetch
  useEffect(() => { fetchOrders() }, [])

  // Auto-refresh every 15 seconds
  useEffect(() => {
    pollRef.current = setInterval(() => {
      fetchOrders(true)
    }, 15000)
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [fetchOrders])

  // Update "last updated" text every 30 seconds
  useEffect(() => {
    if (!lastUpdated) return
    const interval = setInterval(() => {
      setLastUpdatedText(timeAgoShort(lastUpdated.toISOString()))
    }, 30000)
    return () => clearInterval(interval)
  }, [lastUpdated])

  // ─── Update document title ────────────────────────────────
  const newCount = data?.newCount || 0
  useEffect(() => {
    if (newCount > 0) {
      document.title = `(${newCount}) New Orders — MenuMate`
    } else {
      document.title = 'Orders — MenuMate'
    }
    return () => { document.title = 'MenuMate' }
  }, [newCount])

  // ─── Manual refresh ───────────────────────────────────────
  const handleRefresh = () => { fetchOrders(true) }

  // ─── Section data ─────────────────────────────────────────
  const activeOrders = data?.[activeTab] || []

  return (
    <div style={{ minHeight: '100vh', background: 'var(--dash-bg)' }}>
      {/* ═══ STICKY HEADER ═══ */}
      <header
        className="dash-glass animate-dash-section-enter"
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 40,
          padding: '0 16px',
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* Left: title + live indicator */}
        <div className="flex items-center gap-3">
          {/* Live pulse dot */}
          {newCount > 0 && (
            <span
              className="animate-dash-live-pulse"
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: '#ef4444',
                flexShrink: 0,
              }}
            />
          )}
          <h1
            style={{
              fontSize: 24,
              fontWeight: 800,
              color: 'var(--dash-text)',
              letterSpacing: '-0.03em',
            }}
          >
            Live Orders
          </h1>
        </div>

        {/* Right: updated text + refresh button */}
        <div className="flex items-center gap-2 sm:gap-3">
          {lastUpdatedText && (
            <span
              className="hidden sm:inline truncate max-w-[100px]"
              style={{
                fontSize: 12,
                color: 'var(--dash-text-3)',
                fontWeight: 500,
              }}
            >
              Updated {lastUpdatedText}
            </span>
          )}
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="animate-btn-press"
            style={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid var(--dash-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 150ms cubic-bezier(0.4, 0, 0.2, 1)',
            }}
            aria-label="Refresh orders"
          >
            <RefreshCw
              className="w-[16px] h-[16px]"
              style={{
                color: 'var(--dash-text-2)',
                transition: 'transform 150ms ease',
              }}
            />
          </button>
        </div>
      </header>

      {/* ═══ STATUS TAB SWITCHER ═══ */}
      <div
        className="animate-dash-section-enter animate-dash-section-1"
        style={{ marginTop: 16, padding: '0 16px' }}
      >
        <div
          className="flex"
          style={{
            background: 'var(--dash-surface-2)',
            borderRadius: 14,
            padding: 4,
            border: '1px solid var(--dash-border)',
          }}
        >
          {TAB_STATUSES.map((tabStatus) => {
            const isActive = activeTab === tabStatus
            const config = STATUS_CONFIG[tabStatus]
            const count = data?.[tabStatus]?.length || 0

            return (
              <button
                key={tabStatus}
                onClick={() => setActiveTab(tabStatus)}
                className="flex-1 flex items-center justify-center gap-1 animate-btn-press min-w-0"
                style={{
                  padding: '9px 2px',
                  borderRadius: 10,
                  textAlign: 'center',
                  fontSize: 13,
                  fontWeight: 700,
                  transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
                  background: isActive ? config.gradient : 'transparent',
                  color: isActive ? '#fff' : 'var(--dash-text-3)',
                  boxShadow: isActive ? config.shadow : 'none',
                  minHeight: 44,
                  border: 'none',
                  cursor: 'pointer',
                  letterSpacing: '-0.01em',
                }}
              >
                {config.label}
                {count > 0 && (
                  <span
                    className="flex items-center justify-center"
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      padding: '1px 6px',
                      borderRadius: 100,
                      lineHeight: '16px',
                      minWidth: 18,
                      background: isActive ? 'rgba(255,255,255,0.25)' : config.dotBg,
                      color: isActive ? '#fff' : config.color,
                    }}
                  >
                    {count}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* ═══ Total today stat ═══ */}
      {data && !loading && (
        <div
          className="animate-dash-section-enter animate-dash-section-2"
          style={{
            padding: '12px 16px 0',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            overflow: 'hidden',
          }}
        >
          <span className="dash-section-label flex-shrink-0">TODAY</span>
          <span
            className="truncate"
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: 'var(--dash-text-2)',
            }}
          >
            {data.totalToday} orders
          </span>
          <div
            className="dash-separator flex-shrink-0"
            style={{ width: 1, height: 12, margin: '0 4px' }}
          />
          <span
            className="truncate"
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: newCount > 0 ? '#f87171' : 'var(--dash-text-2)',
            }}
          >
            {newCount} new
          </span>
        </div>
      )}

      {/* ═══ ORDER CARDS ═══ */}
      <div style={{ padding: '12px 0 120px' }}>
        {loading ? (
          <SkeletonOrders />
        ) : (
          (() => {
            if (activeOrders.length === 0) {
              return <EmptyState status={activeTab} />
            }

            return (
              <div className="animate-dash-section-enter animate-dash-section-3">
                {activeOrders.map((order, orderIdx) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    status={activeTab}
                    onUpdate={fetchOrders}
                    index={orderIdx}
                  />
                ))}
              </div>
            )
          })()
        )}
      </div>
    </div>
  )
}
