'use client'

import { useState, useEffect } from 'react'
import { ShoppingBag, MessageCircle, Loader2, CheckCircle2, X, ExternalLink } from 'lucide-react'
import type { FoodType } from '@/types'
import { formatPrice } from '@/lib/utils'

// ─── Types ────────────────────────────────────────────────────
interface CartItem {
  menuItemId: string
  name: string
  price: number
  quantity: number
  foodType: FoodType
}

interface CartSheetProps {
  cart: CartItem[]
  tableNumber: number | null
  restaurantName: string
  restaurantId: string
  slug: string
  onClose: () => void
  onAdd: (menuItemId: string) => void
  onRemove: (menuItemId: string) => void
  onOrderPlaced: () => void
}

interface OrderResult {
  orderId: string
  orderNumber: string
  whatsappUrl: string | null
  trackUrl: string | null
}

// ─── Food type dot ────────────────────────────────────────────
function FoodDot({ type }: { type: FoodType }) {
  const colorMap: Record<FoodType, string> = {
    VEG: 'var(--m-veg)',
    NONVEG: 'var(--m-nonveg)',
    EGG: 'var(--m-warning)',
  }
  const c = colorMap[type]
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="menu-food-dot-svg">
      <rect x="0.5" y="0.5" width="11" height="11" rx="1.5" stroke={c} strokeWidth="1.5" />
      <circle cx="6" cy="6" r="3.5" fill={c} />
    </svg>
  )
}

// ─── Lock body scroll ─────────────────────────────────────────
let bodyLockCount = 0
function useBodyLock(locked: boolean) {
  useEffect(() => {
    if (locked) {
      bodyLockCount++
      if (bodyLockCount === 1) {
        document.body.style.overflow = 'hidden'
      }
      return () => {
        bodyLockCount--
        if (bodyLockCount <= 0) {
          bodyLockCount = 0
          document.body.style.overflow = ''
        }
      }
    }
  }, [locked])
}

// ─── Success checkmark animation ─────────────────────────────
function AnimatedCheck() {
  return (
    <div
      className="menu-success-icon"
      style={{
        animation: 'success-pop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
      }}
    >
      <CheckCircle2 size={36} style={{ color: 'var(--m-success)' }} strokeWidth={2.5} />
      <style>{`
        @keyframes success-pop {
          0% { transform: scale(0); opacity: 0; }
          60% { transform: scale(1.15); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes slide-up {
          0% { opacity: 0; transform: translateY(12px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes fade-in {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }
      `}</style>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
export default function CartSheet({
  cart,
  tableNumber,
  restaurantName,
  restaurantId,
  slug,
  onClose,
  onAdd,
  onRemove,
  onOrderPlaced,
}: CartSheetProps) {
  const [note, setNote] = useState('')
  const [placing, setPlacing] = useState(false)
  const [result, setResult] = useState<OrderResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [redirectCountdown, setRedirectCountdown] = useState(0)

  useBodyLock(true)

  const cartCount = cart.reduce((s, i) => s + i.quantity, 0)
  const cartTotal = cart.reduce((s, i) => s + i.price * i.quantity, 0)

  // ── Close on Escape ──
  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === 'Escape' && !result) onClose() }
    document.addEventListener('keydown', fn)
    return () => document.removeEventListener('keydown', fn)
  }, [onClose, result])

  // ── Auto-redirect countdown after success ──
  useEffect(() => {
    if (!result || !result.trackUrl) return
    setRedirectCountdown(4)
    const timer = setInterval(() => {
      setRedirectCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          // Navigate to tracking page
          window.location.href = result.trackUrl!
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [result])

  // ── Place order ──
  const handlePlaceOrder = async () => {
    if (placing || cart.length === 0) return
    setPlacing(true)
    setError(null)

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurant_id: restaurantId,
          table_number: tableNumber,
          note: note.trim() || null,
          items: cart.map((item) => ({
            menuItemId: item.menuItemId,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            foodType: item.foodType,
          })),
          total_amount: cartTotal,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to place order. Please try again.')
        return
      }

      // ✅ IMMEDIATELY clear cart on success
      onOrderPlaced()

      setResult({
        orderId: data.order_id,
        orderNumber: data.order_number,
        whatsappUrl: data.whatsapp_url || null,
        trackUrl: data.track_url || null,
      })

      // Auto-open WhatsApp after short delay (if URL is valid)
      if (data.whatsapp_url && data.whatsapp_url.startsWith('https://wa.me/')) {
        setTimeout(() => { window.open(data.whatsapp_url, '_blank', 'noopener') }, 800)
      }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setPlacing(false)
    }
  }

  return (
    <>
      {/* ── Backdrop ── */}
      <div
        className="menu-sheet-backdrop"
        onClick={!result ? onClose : undefined}
        style={!result ? undefined : { cursor: 'default' }}
      />

      {/* ── Sheet ── */}
      <div className="menu-sheet">
        <div className="menu-sheet-handle" />

        {/* ═══ SUCCESS STATE ═══ */}
        {result ? (
          <div style={{ padding: '36px clamp(16px, 5vw, 24px) 48px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <AnimatedCheck />

            <span
              style={{
                fontSize: '22px', fontWeight: 800, marginTop: '20px', color: 'var(--m-text)',
                animation: 'slide-up 0.4s ease 0.15s both',
              }}
            >
              Order Placed!
            </span>
            <span
              style={{
                fontSize: '13px', color: 'var(--m-text-secondary)', marginTop: '4px',
                animation: 'slide-up 0.4s ease 0.2s both',
              }}
            >
              #{result.orderNumber}{tableNumber ? ` · Table ${tableNumber}` : ''}
            </span>

            <div className="menu-success-card" style={{ marginTop: '18px', animation: 'slide-up 0.4s ease 0.25s both' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--m-primary)' }}>
                ⏱ Estimated: 15–20 mins
              </span>
            </div>

            {result.whatsappUrl && (
              <div
                className="menu-success-card"
                style={{
                  marginTop: '8px', background: 'var(--m-success-soft)',
                  borderColor: 'rgba(52,199,89,0.2)',
                  animation: 'slide-up 0.4s ease 0.3s both',
                }}
              >
                <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--m-success)' }}>
                  ✅ WhatsApp sent to kitchen
                </span>
              </div>
            )}

            {/* ── TRACK YOUR ORDER BUTTON (PRIMARY CTA) ── */}
            {result.trackUrl && (
              <button
                onClick={() => { window.location.href = result.trackUrl! }}
                className="menu-sheet-order-btn"
                style={{
                  marginTop: '20px',
                  animation: 'slide-up 0.4s ease 0.35s both',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                }}
              >
                <ExternalLink size={18} />
                Track Your Order
              </button>
            )}

            {/* ── Redirect notice ── */}
            {redirectCountdown > 0 && (
              <p
                style={{
                  fontSize: '12px', color: 'var(--m-text-muted)', marginTop: '10px',
                  animation: 'fade-in 0.3s ease 0.5s both',
                }}
              >
                Auto-redirecting to tracking page in {redirectCountdown}s...
              </p>
            )}

            <button
              onClick={onClose}
              style={{
                marginTop: '8px', fontSize: '13px', color: 'var(--m-text-muted)',
                background: 'none', border: 'none', cursor: 'pointer',
              }}
            >
              Close
            </button>
          </div>
        ) : (
          <>
            {/* ── Header ── */}
            <div style={{ padding: '16px clamp(14px, 5vw, 20px) 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '17px', fontWeight: 800, color: 'var(--m-text)' }}>Your Order</span>
                {cartCount > 0 && (
                  <span style={{
                    background: 'var(--m-pill-bg)', borderRadius: '20px',
                    padding: '2px 10px', fontSize: '11px', fontWeight: 600, color: 'var(--m-text-secondary)',
                  }}>
                    {cartCount} {cartCount === 1 ? 'item' : 'items'}
                  </span>
                )}
              </div>
              <button onClick={onClose} style={{
                width: '32px', height: '32px', borderRadius: '10px', border: 'none',
                background: 'var(--m-pill-bg)', cursor: 'pointer', display: 'flex',
                alignItems: 'center', justifyContent: 'center', color: 'var(--m-text-secondary)', padding: 0,
              }}>
                <X size={16} strokeWidth={2.5} />
              </button>
            </div>

            {restaurantName && (
              <div style={{ padding: '0 clamp(14px, 5vw, 20px) 4px', fontSize: '12px', color: 'var(--m-text-muted)' }}>
                {restaurantName}
                {tableNumber && <span style={{ marginLeft: '6px', color: 'var(--m-text-secondary)', fontWeight: 600 }}>Table {tableNumber}</span>}
              </div>
            )}

            {/* ── Error ── */}
            {error && (
              <div style={{
                margin: '8px clamp(14px, 5vw, 20px) 0', padding: '10px 14px',
                background: 'var(--m-error-soft)', borderRadius: '12px',
                fontSize: '13px', color: 'var(--m-error)', fontWeight: 500,
              }}>
                {error}
              </div>
            )}

            {/* ── Items ── */}
            <div style={{ marginTop: '8px' }}>
              {cart.length === 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 20px' }}>
                  <ShoppingBag size={24} style={{ color: 'var(--m-text-muted)', marginBottom: '10px' }} />
                  <span style={{ fontSize: '13px', color: 'var(--m-text-muted)' }}>Your cart is empty</span>
                </div>
              ) : (
                <>
                  {cart.map((item) => (
                    <div key={item.menuItemId} className="menu-sheet-item" style={{ padding: '12px clamp(14px, 5vw, 20px)' }}>
                      <FoodDot type={item.foodType} />
                      <span className="menu-sheet-item-name">{item.name}</span>
                      <div className="menu-sheet-qty">
                        <button onClick={() => onRemove(item.menuItemId)} aria-label="Decrease">−</button>
                        <span>{item.quantity}</span>
                        <button onClick={() => onAdd(item.menuItemId)} aria-label="Increase">+</button>
                      </div>
                      <span className="menu-sheet-item-total">{formatPrice(item.price * item.quantity)}</span>
                    </div>
                  ))}

                  {/* ── Note ── */}
                  <div style={{ padding: '12px clamp(14px, 5vw, 20px) 4px' }}>
                    <textarea
                      className="menu-sheet-note"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="Special requests..."
                      rows={2}
                    />
                  </div>
                </>
              )}
            </div>

            {/* ── Total + CTA ── */}
            {cart.length > 0 && (
              <>
                <div style={{ padding: '8px clamp(14px, 5vw, 20px) 4px', borderTop: '1px solid var(--m-card-border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--m-text-secondary)' }}>
                    <span>Item Total</span>
                    <span>{formatPrice(cartTotal)}</span>
                  </div>
                </div>
                <div style={{ padding: '4px clamp(14px, 5vw, 20px)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px', fontWeight: 800, color: 'var(--m-text)' }}>
                    <span>Total</span>
                    <span>{formatPrice(cartTotal)}</span>
                  </div>
                </div>
                <div style={{ padding: '8px clamp(14px, 5vw, 20px) 28px' }}>
                  <button
                    className="menu-sheet-order-btn"
                    onClick={handlePlaceOrder}
                    disabled={placing}
                  >
                    {placing ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <MessageCircle size={18} />
                    )}
                    {placing ? 'Placing...' : `Place Order · ${formatPrice(cartTotal)}`}
                  </button>
                </div>
              </>
            )}

            <div style={{ height: 'env(safe-area-inset-bottom, 0px)' }} />
          </>
        )}
      </div>
    </>
  )
}
