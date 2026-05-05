'use client'

import { useEffect, useCallback } from 'react'
import { X, Plus, Minus, UtensilsCrossed, ZoomIn } from 'lucide-react'
import type { FoodType } from '@/types'
import type { MenuTheme } from '@/lib/themes'
import { formatPrice, handleImgError } from '@/lib/utils'

// ─── Types ─────────────────────────────────────────────────────
interface ItemDetailModalProps {
  isOpen: boolean
  onClose: () => void
  item: {
    id: string
    name: string
    description: string | null
    price: number
    image_url: string | null
    food_type: FoodType
    is_available: boolean
    is_best_seller: boolean
    is_chefs_special: boolean
  } | null
  quantity: number
  theme: MenuTheme
  onAdd: () => void
  onRemove: () => void
}

// ═══════════════════════════════════════════════════════════════
// ─── Item Detail Modal Component ───────────────────────────────
// ═══════════════════════════════════════════════════════════════
export default function ItemDetailModal({
  isOpen,
  onClose,
  item,
  quantity,
  theme,
  onAdd,
  onRemove,
}: ItemDetailModalProps) {
  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  // Prevent body scroll when open
  useEffect(() => {
    if (!isOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev || '' }
  }, [isOpen])

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) onClose()
    },
    [onClose],
  )

  if (!isOpen || !item) return null

  const totalPrice = item.price * quantity

  // Food type styling derived from theme colors
  const foodColorMap: Record<FoodType, { color: string; label: string }> = {
    VEG: { color: theme.vegColor, label: 'Veg' },
    NONVEG: { color: theme.nonvegColor, label: 'Non-Veg' },
    EGG: { color: theme.eggColor, label: 'Egg' },
  }
  const fc = foodColorMap[item.food_type]

  return (
    <div
      onClick={handleBackdropClick}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 60,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
      }}
    >
      {/* ── Backdrop ── */}
      <div
        className="animate-fade-in"
        style={{
          position: 'absolute',
          inset: 0,
          background: theme.overlay,
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
        }}
      />

      {/* ── Bottom Sheet ── */}
      <div
        className="animate-slide-up"
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '600px',
          background: theme.sheetBg,
          borderRadius: '24px 24px 0 0',
          maxHeight: '92vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 -8px 40px rgba(0,0,0,0.18)',
        }}
      >
        {/* ── Scrollable Content ── */}
        <div style={{ overflowY: 'auto', flex: 1 }}>
          {/* Drag Handle + Close Button */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              paddingTop: '10px',
              paddingBottom: '4px',
              position: 'relative',
            }}
          >
            <div
              style={{
                width: '36px',
                height: '4px',
                borderRadius: '9999px',
                background: theme.divider,
              }}
            />

            {/* Close Button */}
            <button
              onClick={onClose}
              className="animate-btn-press"
              aria-label="Close"
              style={{
                position: 'absolute',
                top: '6px',
                right: '16px',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                border: 'none',
                background: theme.searchBg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'opacity 120ms ease, transform 120ms ease',
                padding: 0,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = '0.7'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = '1'
              }}
            >
              <X size={16} color={theme.text} strokeWidth={2.5} />
            </button>
          </div>

          {/* ── Hero Image ── */}
          <div
            style={{
              margin: '0 16px',
              borderRadius: '16px',
              overflow: 'hidden',
              aspectRatio: '16 / 10',
              background: theme.imagePlaceholder,
              position: 'relative',
              cursor: 'zoom-in',
            }}
          >
            {item.image_url ? (
              <img
                src={item.image_url}
                alt={item.name}
                onError={handleImgError}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  cursor: 'zoom-in',
                }}
              />
            ) : (
              <div
                className="w-full h-full flex items-center justify-center"
                style={{ background: theme.imagePlaceholder }}
              >
                <UtensilsCrossed
                  size={40}
                  style={{ color: theme.imagePlaceholder === 'linear-gradient(145deg, #1E1E28, #141419)' ? '#4B5563' : '#C8BEB4' }}
                  strokeWidth={1.5}
                />
              </div>
            )}

            {/* ZoomIn overlay — bottom center */}
            {item.image_url && (
              <div
                style={{
                  position: 'absolute',
                  bottom: '10px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: theme.overlay,
                  backdropFilter: 'blur(8px)',
                  WebkitBackdropFilter: 'blur(8px)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  pointerEvents: 'none',
                }}
              >
                <ZoomIn size={16} color="#FFFFFF" strokeWidth={2} />
              </div>
            )}

            {/* Food type badge — top right */}
            <div
              style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                display: 'flex',
                gap: '6px',
              }}
            >
              <div
                className="animate-badge-fade-in"
                style={{
                  background: `${fc.color}18`,
                  border: `1.5px solid ${fc.color}`,
                  borderRadius: '8px',
                  padding: '4px 10px',
                  fontSize: '11px',
                  fontWeight: 700,
                  color: fc.color,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                }}
              >
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <circle cx="5" cy="5" r="4" fill={fc.color} />
                </svg>
                {fc.label}
              </div>
            </div>

            {/* Badges — bottom left (stacked) */}
            {(item.is_best_seller || item.is_chefs_special) && (
              <div
                style={{
                  position: 'absolute',
                  bottom: '10px',
                  left: '10px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                }}
              >
                {item.is_best_seller && (
                  <div
                    className="animate-badge-fade-in"
                    style={{
                      background: theme.bestsellerBg,
                      backdropFilter: 'blur(8px)',
                      WebkitBackdropFilter: 'blur(8px)',
                      borderRadius: '8px',
                      padding: '4px 10px',
                      fontSize: '11px',
                      fontWeight: 700,
                      color: theme.bestsellerText,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <span style={{ fontSize: '12px' }}>🏆</span>
                    Bestseller
                  </div>
                )}
                {item.is_chefs_special && (
                  <div
                    className="animate-badge-fade-in"
                    style={{
                      background: theme.chefSpecialBg,
                      backdropFilter: 'blur(8px)',
                      WebkitBackdropFilter: 'blur(8px)',
                      borderRadius: '8px',
                      padding: '4px 10px',
                      fontSize: '11px',
                      fontWeight: 700,
                      color: theme.chefSpecialText,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <span style={{ fontSize: '12px' }}>👨‍🍳</span>
                    Chef&apos;s Special
                  </div>
                )}
              </div>
            )}

            {/* Sold out overlay */}
            {!item.is_available && (
              <div
                className="absolute inset-0 flex items-center justify-center"
                style={{
                  background: theme.soldOutOverlay,
                  backdropFilter: 'blur(2px)',
                  zIndex: 3,
                  cursor: 'default',
                }}
              >
                <span
                  style={{
                    fontSize: '16px',
                    fontWeight: 700,
                    color: theme.soldOutText,
                    background: theme.soldOutBg,
                    padding: '8px 20px',
                    borderRadius: '100px',
                  }}
                >
                  Sold Out
                </span>
              </div>
            )}
          </div>

          {/* ── Content Area ── */}
          <div style={{ padding: '20px 20px 8px' }}>
            {/* Item name */}
            <h2
              style={{
                fontSize: '22px',
                fontWeight: 800,
                color: theme.text,
                lineHeight: 1.25,
                letterSpacing: '-0.02em',
                margin: 0,
              }}
            >
              {item.name}
            </h2>

            {/* Inline badges row */}
            {(item.is_best_seller || item.is_chefs_special) && (
              <div
                style={{
                  display: 'flex',
                  gap: '6px',
                  marginTop: '8px',
                }}
              >
                {item.is_best_seller && (
                  <span
                    style={{
                      background: theme.accentSoft,
                      color: theme.bestsellerText,
                      fontSize: '11px',
                      fontWeight: 600,
                      padding: '3px 8px',
                      borderRadius: '6px',
                    }}
                  >
                    🏆 Bestseller
                  </span>
                )}
                {item.is_chefs_special && (
                  <span
                    style={{
                      background: 'rgba(124,58,237,0.08)',
                      color: '#7C3AED',
                      fontSize: '11px',
                      fontWeight: 600,
                      padding: '3px 8px',
                      borderRadius: '6px',
                    }}
                  >
                    👨‍🍳 Chef&apos;s Special
                  </span>
                )}
              </div>
            )}

            {/* Description */}
            {item.description && (
              <p
                style={{
                  fontSize: '14px',
                  color: theme.textSub,
                  lineHeight: 1.6,
                  marginTop: '12px',
                  margin: 0,
                  paddingTop: '12px',
                }}
              >
                {item.description}
              </p>
            )}

            {/* Price */}
            <div style={{ marginTop: '16px' }}>
              <span
                style={{
                  fontSize: '24px',
                  fontWeight: 800,
                  color: theme.text,
                  letterSpacing: '-0.02em',
                }}
              >
                {formatPrice(item.price)}
              </span>
            </div>
          </div>
        </div>

        {/* ── Bottom Bar: Quantity Selector + Add to Cart ── */}
        <div
          style={{
            padding: '16px 20px',
            paddingBottom: 'calc(16px + env(safe-area-inset-bottom, 0px))',
            borderTop: `1px solid ${theme.divider}`,
            background: theme.sheetBg,
          }}
        >
          {item.is_available ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {/* Quantity Selector Pill */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  background: theme.qtyBg,
                  borderRadius: '100px',
                  height: '48px',
                  padding: '0 4px',
                  gap: '0',
                  flexShrink: 0,
                }}
              >
                <button
                  onClick={onRemove}
                  disabled={quantity === 0}
                  aria-label="Decrease quantity"
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    border: 'none',
                    background: 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: quantity === 0 ? 'default' : 'pointer',
                    padding: 0,
                    transition: 'background 120ms ease',
                    opacity: quantity === 0 ? 0.35 : 1,
                  }}
                  onMouseEnter={(e) => {
                    if (quantity > 0) e.currentTarget.style.background = 'rgba(255,255,255,0.15)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent'
                  }}
                >
                  <Minus size={18} color={theme.qtyText} strokeWidth={2.5} />
                </button>
                <span
                  className="select-none"
                  style={{
                    fontSize: '16px',
                    fontWeight: 700,
                    color: theme.qtyText,
                    minWidth: '24px',
                    textAlign: 'center',
                    lineHeight: 1,
                  }}
                >
                  {quantity}
                </span>
                <button
                  onClick={onAdd}
                  aria-label="Increase quantity"
                  className="animate-btn-press"
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    border: 'none',
                    background: 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    padding: 0,
                    transition: 'background 120ms ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.15)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent'
                  }}
                >
                  <Plus size={18} color={theme.qtyText} strokeWidth={2.5} />
                </button>
              </div>

              {/* Add to Cart Button */}
              <button
                onClick={quantity === 0 ? onAdd : undefined}
                disabled={quantity === 0}
                className="animate-btn-press"
                style={{
                  flex: 1,
                  height: '48px',
                  background: theme.accent,
                  color: theme.accentText,
                  border: 'none',
                  borderRadius: '16px',
                  fontSize: '15px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: theme.accentGlow,
                  padding: 0,
                  transition: 'transform 120ms ease, filter 120ms ease',
                  letterSpacing: '-0.01em',
                  opacity: quantity === 0 ? 0.85 : 1,
                }}
                onMouseDown={(e) => {
                  e.currentTarget.style.transform = 'scale(0.98)'
                }}
                onMouseUp={(e) => {
                  e.currentTarget.style.transform = 'scale(1)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)'
                }}
              >
                {quantity === 0 ? (
                  'Add to Cart'
                ) : (
                  <>
                    <span>Add to Cart</span>
                    <span
                      style={{
                        background: 'rgba(255,255,255,0.2)',
                        padding: '2px 8px',
                        borderRadius: '8px',
                        fontSize: '13px',
                        fontWeight: 700,
                      }}
                    >
                      {formatPrice(totalPrice)}
                    </span>
                  </>
                )}
              </button>
            </div>
          ) : (
            /* Sold out state */
            <div
              style={{
                width: '100%',
                height: '48px',
                background: theme.soldOutBg,
                borderRadius: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '15px',
                fontWeight: 600,
                color: theme.soldOutText,
              }}
            >
              Currently Unavailable
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
