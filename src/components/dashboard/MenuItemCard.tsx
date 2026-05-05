'use client'

import { Award, ChefHat, UtensilsCrossed } from 'lucide-react'
import type { MenuItem, FoodType } from '@/types'
import { formatPrice, handleImgError } from '@/lib/utils'

interface MenuItemCardProps {
  item: MenuItem
  index?: number
  category?: string
  onEdit?: (item: MenuItem) => void
  onToggleAvailability?: (id: string, available: boolean) => void
}

// ─── Food Type Badge ───────────────────────────────────────────

function FoodTypeBadge({ type }: { type: FoodType }) {
  if (type === 'VEG') {
    return <span className="veg-badge" />
  }
  if (type === 'NONVEG') {
    return <span className="nonveg-badge" />
  }
  // EGG
  return (
    <span
      className="w-4 h-4 rounded-[3px] flex items-center justify-center flex-shrink-0"
      style={{ border: '2px solid var(--egg-color)' }}
    >
      <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--egg-color)', display: 'block' }} />
    </span>
  )
}

// ─── MenuItemCard ──────────────────────────────────────────────

export default function MenuItemCard({
  item,
  index = 0,
  category,
  onEdit,
}: MenuItemCardProps) {
  const delay = Math.min(index, 8) * 50

  return (
    <div
      className="animate-page-enter animate-scale-in"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div
        className="rounded-[20px] overflow-hidden cursor-pointer group"
        style={{
          background: 'var(--surface)',
          boxShadow: 'var(--shadow-card)',
          border: item.is_available ? '1px solid var(--border-light)' : '1px solid var(--border)',
          opacity: item.is_available ? 1 : 0.6,
        }}
        onClick={() => onEdit?.(item)}
      >
        {/* Image */}
        <div className="relative h-[180px] overflow-hidden">
          {item.image_url ? (
            <img
              src={item.image_url}
              alt={item.name}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              onError={handleImgError}
            />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center"
              style={{ background: 'var(--surface-subtle)' }}
            >
              <UtensilsCrossed className="w-10 h-10" style={{ color: 'var(--text-tertiary)' }} />
            </div>
          )}

          {/* Food type badge */}
          <div className="absolute top-3 left-3">
            <FoodTypeBadge type={item.food_type} />
          </div>

          {/* PRO badges */}
          <div className="absolute top-3 right-3 flex flex-col gap-1.5">
            {item.is_best_seller && (
              <span className="badge" style={{ background: 'var(--warning-soft)', color: 'var(--warning)' }}>
                <Award className="w-2.5 h-2.5" /> Best Seller
              </span>
            )}
            {item.is_chefs_special && (
              <span className="badge" style={{ background: '#F3E8FF', color: '#9333EA' }}>
                <ChefHat className="w-2.5 h-2.5" /> Chef&apos;s Special
              </span>
            )}
          </div>

          {/* Availability overlay */}
          {!item.is_available && (
            <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'rgba(250,250,248,0.6)' }}>
              <span className="badge badge-neutral text-xs font-semibold">Unavailable</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-3.5">
          <h3
            className="font-semibold text-[15px] truncate mb-0.5"
            style={{ color: 'var(--text-primary)' }}
          >
            {item.name}
          </h3>
          {category && (
            <p className="text-xs truncate mb-2" style={{ color: 'var(--text-tertiary)' }}>
              {category}
            </p>
          )}

          <span
            className="font-mono text-base font-semibold"
            style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}
          >
            {formatPrice(item.price)}
          </span>
        </div>
      </div>
    </div>
  )
}
