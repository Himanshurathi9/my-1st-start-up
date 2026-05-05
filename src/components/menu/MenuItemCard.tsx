'use client'

import { useState } from 'react'
import { Plus, Minus, UtensilsCrossed } from 'lucide-react'
import type { FoodType } from '@/types'

// ─── Props ────────────────────────────────────────────────────
interface MenuItemCardProps {
  name: string
  price: number
  image_url: string | null
  food_type: FoodType
  is_available: boolean
  is_best_seller: boolean
  quantity: number
  onAdd: () => void
  onRemove: () => void
  onImageTap?: () => void
  index?: number
}

// ─── Food type dot color ──────────────────────────────────────
function dotColor(type: FoodType): string {
  switch (type) {
    case 'VEG': return 'var(--m-veg)'
    case 'NONVEG': return 'var(--m-nonveg)'
    case 'EGG': return 'var(--m-warning)'
  }
}

// ═══════════════════════════════════════════════════════════════
export default function MenuItemCard({
  name,
  price,
  image_url,
  food_type,
  is_available,
  is_best_seller,
  quantity,
  onAdd,
  onRemove,
  onImageTap,
  index = 0,
}: MenuItemCardProps) {
  const [imgLoaded, setImgLoaded] = useState(false)
  const [imgError, setImgError] = useState(false)
  const foodDot = dotColor(food_type)

  return (
    <div
      className="menu-card menu-card-enter"
      style={{ animationDelay: `${index * 25}ms` }}
    >
      {/* ── Image ── */}
      <div className="menu-card-image" onClick={onImageTap}>
        {!imgError && image_url ? (
          <img
            src={image_url}
            alt={name}
            loading="lazy"
            onLoad={() => setImgLoaded(true)}
            onError={() => setImgError(true)}
            className={`menu-card-img ${imgLoaded ? 'menu-card-img-loaded' : ''}`}
          />
        ) : (
          <div className="menu-card-placeholder">
            <UtensilsCrossed size={22} style={{ color: 'var(--m-text-muted)' }} strokeWidth={1.5} />
          </div>
        )}

        {/* Bestseller badge */}
        {is_best_seller && (
          <span className="menu-badge-best">★ Best</span>
        )}

        {/* Sold out overlay */}
        {!is_available && (
          <div className="menu-soldout-overlay">
            <span className="menu-soldout-text">Sold Out</span>
          </div>
        )}
      </div>

      {/* ── Content ── */}
      <div className="menu-card-content">
        {/* Name + food dot */}
        <div className="menu-card-row">
          <div className="menu-food-dot" style={{ background: foodDot }} />
          <h3 className="menu-card-name">{name}</h3>
        </div>

        {/* Price + Action */}
        <div className="menu-card-footer">
          <span className="menu-card-price">₹{price}</span>

          {is_available &&
            (quantity === 0 ? (
              <button
                className="menu-add-btn"
                onClick={(e) => { e.stopPropagation(); onAdd() }}
                aria-label={`Add ${name}`}
              >
                <Plus size={14} strokeWidth={2.5} />
              </button>
            ) : (
              <div className="menu-qty-control">
                <button onClick={(e) => { e.stopPropagation(); onRemove() }} aria-label="Decrease">
                  <Minus size={11} strokeWidth={2.5} />
                </button>
                <span>{quantity}</span>
                <button onClick={(e) => { e.stopPropagation(); onAdd() }} aria-label="Increase">
                  <Plus size={11} strokeWidth={2.5} />
                </button>
              </div>
            ))}
        </div>
      </div>
    </div>
  )
}
