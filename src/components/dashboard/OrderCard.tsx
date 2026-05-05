'use client'

import { useState } from 'react'
import {
  ChevronDown,
  ChevronUp,
  ChefHat,
  Loader2,
  Clock,
} from 'lucide-react'
import type { Order } from '@/types'
import { formatPrice } from '@/lib/utils'

interface OrderCardProps {
  order: Order
  index?: number
  onAdvanceStatus?: (orderId: string) => void
  loadingStatus?: boolean
}

// ─── Time Elapsed Color ────────────────────────────────────────

function getTimeElapsedColor(createdAt: string): { color: string; bg: string } {
  const created = new Date(createdAt)
  const now = new Date()
  const diffMs = now.getTime() - created.getTime()
  const diffMin = Math.floor(diffMs / 60000)

  if (diffMin < 5) {
    return { color: 'var(--success)', bg: 'var(--success-soft)' }
  }
  if (diffMin <= 15) {
    return { color: 'var(--warning)', bg: 'var(--warning-soft)' }
  }
  return { color: 'var(--error)', bg: 'var(--error-soft)' }
}

function getTimeElapsedLabel(createdAt: string): string {
  const created = new Date(createdAt)
  const now = new Date()
  const diffMs = now.getTime() - created.getTime()
  const diffMin = Math.floor(diffMs / 60000)

  if (diffMin < 1) return 'Just now'
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHr = Math.floor(diffMin / 60)
  return `${diffHr}h ago`
}

// ─── Status Badge ──────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { color: string; bg: string; label: string }> = {
    NEW: { color: 'var(--error)', bg: 'var(--error-soft)', label: 'New' },
    PREPARING: { color: 'var(--warning)', bg: 'var(--warning-soft)', label: 'Preparing' },
    SERVED: { color: 'var(--success)', bg: 'var(--success-soft)', label: 'Served' },
  }

  const c = config[status] || config.NEW

  return (
    <span
      className="badge"
      style={{ background: c.bg, color: c.color, borderRadius: '9999px' }}
    >
      {c.label}
    </span>
  )
}

// ─── OrderCard ─────────────────────────────────────────────────

export default function OrderCard({
  order,
  index = 0,
  onAdvanceStatus,
  loadingStatus,
}: OrderCardProps) {
  const [expanded, setExpanded] = useState(false)
  const delay = Math.min(index, 8) * 50

  const timeColors = getTimeElapsedColor(order.created_at)
  const timeLabel = getTimeElapsedLabel(order.created_at)

  const actionConfig: Record<string, { label: string; color: string; bg: string }> = {
    NEW: { label: 'Prepare', color: '#FFFFFF', bg: 'var(--warning)' },
    PREPARING: { label: 'Served ✓', color: '#FFFFFF', bg: 'var(--success)' },
  }

  const action = actionConfig[order.status]

  const itemsPreview = order.order_items
    ? order.order_items.map((item) => `${item.item_name} ×${item.quantity}`).join(', ')
    : ''

  return (
    <div
      className="animate-page-enter animate-page-enter-1"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div
        className="rounded-[20px] p-4"
        style={{
          background: 'var(--surface)',
          boxShadow: 'var(--shadow-card)',
          border: '1px solid var(--border-light)',
        }}
      >
        {/* Top row */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            {order.table_number && (
              <span
                className="badge"
                style={{ background: 'var(--surface-subtle)', color: 'var(--text-primary)', borderRadius: '9999px' }}
              >
                Table {order.table_number}
              </span>
            )}
            <StatusBadge status={order.status} />
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" style={{ color: timeColors.color }} />
            <span className="text-xs font-medium" style={{ color: timeColors.color }}>
              {timeLabel}
            </span>
          </div>
        </div>

        {/* Items preview */}
        <p
          className="text-sm leading-relaxed mb-2"
          style={{
            color: 'var(--text-secondary)',
            display: '-webkit-box',
            WebkitLineClamp: expanded ? undefined : 2,
            WebkitBoxOrient: 'vertical',
            overflow: expanded ? 'visible' : 'hidden',
          }}
        >
          {itemsPreview || 'No items'}
        </p>

        {/* Expand button (when items are long) */}
        {itemsPreview && itemsPreview.length > 50 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-xs font-medium mb-2 min-h-[44px] py-1"
            style={{ color: 'var(--accent)' }}
          >
            {expanded ? (
              <>
                Show less <ChevronUp className="w-3 h-3" />
              </>
            ) : (
              <>
                Show more <ChevronDown className="w-3 h-3" />
              </>
            )}
          </button>
        )}

        {/* Expanded items with prices */}
        {expanded && order.order_items && (
          <div className="mb-3 space-y-1 animate-fade-in">
            {order.order_items.map((item) => (
              <div key={item.id} className="flex items-center justify-between py-1">
                <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  {item.item_name} ×{item.quantity}
                </span>
                <span
                  className="text-sm font-medium"
                  style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}
                >
                  {formatPrice(item.item_price * item.quantity)}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Customer note */}
        {expanded && order.note && (
          <div
            className="rounded-[10px] px-3 py-2 mb-3 text-xs"
            style={{ background: 'var(--warning-soft)', color: 'var(--warning)' }}
          >
            <ChefHat className="w-3 h-3 inline mr-1" />
            {order.note}
          </div>
        )}

        {/* Bottom row */}
        <div className="flex items-center justify-between pt-2" style={{ borderTop: '1px solid var(--border-light)' }}>
          <span
            className="text-base font-semibold"
            style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}
          >
            {formatPrice(order.total_amount)}
          </span>

          {/* Action button */}
          {action && onAdvanceStatus && (
            <button
              onClick={() => onAdvanceStatus(order.id)}
              disabled={loadingStatus}
              className="btn min-h-[40px] py-2 px-5 text-sm font-semibold animate-btn-press"
              style={{ background: action.bg, color: action.color, boxShadow: 'none' }}
            >
              {loadingStatus ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                action.label
              )}
            </button>
          )}

          {order.status === 'SERVED' && (
            <span className="text-xs font-medium" style={{ color: 'var(--text-tertiary)' }}>
              Done
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
