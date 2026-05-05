'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Receipt, ChefHat, Star, Check, Award, Phone, User, Loader2, Target, Copy, Gift, ArrowLeft, PartyPopper } from 'lucide-react'
import toast from 'react-hot-toast'
import type { OrderStatus, OrderItem, Plan, StampSettings } from '@/types'
import { formatPrice } from '@/lib/utils'

// ─── Types ─────────────────────────────────────────────────────
interface OrderStatusData {
  status: OrderStatus
  order_number: string | number
  table_number: number | null
  total_amount: number
  items: OrderItem[]
  updated_at: string
  created_at: string
}

interface OrderTrackClientProps {
  orderId: string
  restaurantId: string
  restaurantName: string
  slug: string
  plan: Plan
  initialOrder: OrderStatusData
  stampSettings: StampSettings | null
}

// ─── Constants ─────────────────────────────────────────────────
const STATUS_STEP: Record<OrderStatus, number> = {
  NEW: 0,
  PREPARING: 1,
  SERVED: 2,
}

const STATUS_MESSAGES: Record<OrderStatus, { title: string; subtitle: string; emoji: string }> = {
  NEW: {
    title: "Order received!",
    subtitle: "We'll start preparing your order shortly",
    emoji: "🍽️",
  },
  PREPARING: {
    title: "Being prepared...",
    subtitle: "Your food is being freshly prepared 🔥",
    emoji: "👨‍🍳",
  },
  SERVED: {
    title: "Enjoy your meal!",
    subtitle: "Hope you love every bite! 😊",
    emoji: "⭐",
  },
}

const CONFETTI_COLORS = [
  '#E63946', '#FFB800', '#00A651', '#007AFF',
  '#FF6B35', '#1C1C1E', '#E63946', '#FFB800',
]

// ─── Confetti Generator ────────────────────────────────────────
function Confetti() {
  const [pieces, setPieces] = useState<Array<{
    id: number; left: string; color: string; delay: string; duration: string; size: string
  }>>([])

  useEffect(() => {
    const generated = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      delay: `${Math.random() * 1.5}s`,
      duration: `${2 + Math.random() * 2}s`,
      size: `${8 + Math.random() * 10}px`,
    }))
    setPieces(generated)
  }, [])

  return (
    <div className="fixed inset-0 pointer-events-none z-[100]" style={{ clipPath: 'inset(0)' }}>
      {pieces.map((p) => (
        <div
          key={p.id}
          className="confetti-piece"
          style={{
            left: p.left,
            backgroundColor: p.color,
            animationDelay: p.delay,
            animationDuration: p.duration,
            width: p.size,
            height: p.size,
            borderRadius: Math.random() > 0.5 ? '50%' : '2px',
          }}
        />
      ))}
    </div>
  )
}

// ─── Stamp Earned Popup Modal (HIGH-VISIBILITY) ───────────────
function StampEarnedPopup({
  restaurantId,
  orderId,
  stampSettings,
  onClose,
}: {
  restaurantId: string
  orderId: string
  stampSettings: StampSettings
  onClose: () => void
}) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [collecting, setCollecting] = useState(false)
  const [result, setResult] = useState<{
    stamp_collected: boolean
    current_count: number
    stamps_required: number
    reward_earned?: boolean
    reward_code?: string
    reward_item_name?: string
    whatsapp_notification_url?: string
    owner_whatsapp_url?: string
    halfway?: boolean
  } | null>(null)

  const submittingRef = useRef(false)
  const popupRef = useRef<HTMLDivElement>(null)

  // Lock body scroll when popup is open
  useEffect(() => {
    // Always lock since this component only renders when popup is visible
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev || '' }
  }, [])

  // Close on Escape
  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && result) onClose()
    }
    document.addEventListener('keydown', fn)
    return () => document.removeEventListener('keydown', fn)
  }, [onClose, result])

  const handleCollect = useCallback(async () => {
    const cleanPhone = phone.replace(/\D/g, '')
    if (cleanPhone.length < 10) {
      toast.error('Please enter a valid phone number')
      return
    }
    if (submittingRef.current) return
    submittingRef.current = true

    const formattedPhone = cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`

    setCollecting(true)
    try {
      const res = await fetch('/api/stamps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone_number: formattedPhone,
          name: name || undefined,
          restaurant_id: restaurantId,
          order_id: orderId,
        }),
      })

      const json = await res.json()

      if (!res.ok) {
        if (json.cooldown && json.cooldown_remaining_minutes) {
          toast.error(`⏳ ${json.error}`, { duration: 5000 })
        } else {
          throw new Error(json.error || 'Failed to collect stamp')
        }
        return
      }

      setResult(json)

      if (json.reward_earned) {
        toast.success('🎉 Reward unlocked!', { duration: 5000 })
        if (json.whatsapp_notification_url) {
          window.open(json.whatsapp_notification_url, '_blank')
        }
      } else {
        toast.success(`Stamp collected! ${json.current_count}/${json.stamps_required} 🎉`)
        if (json.halfway) {
          setTimeout(() => {
            toast('🎯 Halfway there! Keep going!', { icon: '🔥', duration: 3000 })
          }, 1000)
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to collect stamp'
      toast.error(msg)
    } finally {
      setCollecting(false)
      submittingRef.current = false
    }
  }, [phone, name, restaurantId, orderId])

  return (
    <>
      {/* ── Backdrop ── */}
      <div
        style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
          zIndex: 200, display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
          animation: 'stamp-backdrop-in 0.3s ease',
        }}
        onClick={onClose}
      >
        <style>{`
          @keyframes stamp-backdrop-in {
            0% { opacity: 0; }
            100% { opacity: 1; }
          }
          @keyframes stamp-popup-in {
            0% { transform: translateY(100%); opacity: 0; }
            100% { transform: translateY(0); opacity: 1; }
          }
          @keyframes stamp-collected-bounce {
            0% { transform: scale(0); opacity: 0; }
            60% { transform: scale(1.2); opacity: 1; }
            100% { transform: scale(1); opacity: 1; }
          }
          @keyframes glow-pulse {
            0%, 100% { box-shadow: 0 0 20px rgba(230,57,70,0.3); }
            50% { box-shadow: 0 0 40px rgba(230,57,70,0.6), 0 0 60px rgba(255,184,0,0.2); }
          }
          @keyframes float-badge {
            0%, 100% { transform: translateY(0) rotate(-3deg); }
            50% { transform: translateY(-6px) rotate(3deg); }
          }
          @keyframes shimmer {
            0% { background-position: -200% center; }
            100% { background-position: 200% center; }
          }
          @keyframes progress-fill {
            0% { width: 0%; }
            100% { width: var(--progress-width); }
          }
        `}</style>

        {/* ── Popup Sheet ── */}
        <div
          ref={popupRef}
          style={{
            width: '100%', maxWidth: '480px', maxHeight: '90vh',
            background: '#FFFFFF', borderTopLeftRadius: '28px', borderTopRightRadius: '28px',
            overflowY: 'auto', animation: 'stamp-popup-in 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Handle */}
          <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 0' }}>
            <div style={{ width: '40px', height: '4px', borderRadius: '2px', background: '#E5E5E5' }} />
          </div>

          <div style={{ padding: '8px 24px 40px' }}>
            {!result ? (
              <>
                {/* ── Hero Section ── */}
                <div style={{ textAlign: 'center', padding: '16px 0 20px' }}>
                  {/* Animated badge */}
                  <div
                    style={{
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      width: '80px', height: '80px', borderRadius: '50%',
                      background: 'linear-gradient(135deg, #E63946, #D62828)',
                      animation: 'glow-pulse 2s ease-in-out infinite',
                      marginBottom: '16px',
                    }}
                  >
                    <Gift style={{ color: '#FFFFFF' }} size={36} strokeWidth={1.5} />
                  </div>

                  <h2
                    style={{
                      fontSize: '24px', fontWeight: 900, color: '#1C1C1E',
                      letterSpacing: '-0.03em', lineHeight: 1.2,
                    }}
                  >
                    🎉 You earned a stamp!
                  </h2>
                  <p style={{ fontSize: '15px', color: '#6B6B6B', marginTop: '8px', lineHeight: 1.5 }}>
                    Your order is being prepared.<br />
                    Claim your loyalty stamp now!
                  </p>
                </div>

                {/* ── Stamp Progress Preview ── */}
                <div
                  style={{
                    background: 'linear-gradient(135deg, #FFF8F3, #FFF0E8)',
                    borderRadius: '16px', padding: '16px', marginBottom: '20px',
                    border: '1px solid rgba(230,57,70,0.1)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: '#ABABAB', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                      Collect {stampSettings.stamps_required} stamps
                    </span>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#E63946' }}>
                      Free {stampSettings.reward_item_name}
                    </span>
                  </div>
                  {/* Mini stamp grid preview */}
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {Array.from({ length: stampSettings.stamps_required }).map((_, i) => (
                      <div
                        key={i}
                        style={{
                          width: '28px', height: '28px', borderRadius: '50%',
                          border: i === 0
                            ? '2px solid #E63946'
                            : '2px solid #EFEFED',
                          background: i === 0
                            ? 'linear-gradient(135deg, #E63946, #D62828)'
                            : '#FAFAF8',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          animation: i === 0 ? 'stamp-collected-bounce 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 0.3s both' : 'none',
                        }}
                      >
                        {i === 0 && <Check size={14} style={{ color: '#FFFFFF' }} strokeWidth={3} />}
                      </div>
                    ))}
                  </div>
                </div>

                {/* ── Name / Phone Form ── */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {/* Name input */}
                  <div style={{ position: 'relative' }}>
                    <User
                      style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', left: '14px', color: '#ABABAB' }}
                      size={14}
                    />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your name (optional)"
                      style={{
                        width: '100%', paddingLeft: '36px', paddingRight: '12px',
                        paddingTop: '14px', paddingBottom: '14px', borderRadius: '14px',
                        background: '#FAFAF8', border: '1.5px solid #EFEFED',
                        fontSize: '15px', color: '#1C1C1E', outline: 'none', boxSizing: 'border-box',
                      }}
                    />
                  </div>
                  {/* Phone input */}
                  <div
                    style={{
                      display: 'flex', alignItems: 'center',
                      background: '#FAFAF8', border: '1.5px solid #EFEFED',
                      borderRadius: '14px', overflow: 'hidden',
                    }}
                  >
                    <span style={{
                      paddingLeft: '14px', paddingRight: '10px', fontSize: '14px',
                      color: '#6B6B6B', borderRight: '1px solid #EFEFED',
                      height: '48px', display: 'flex', alignItems: 'center',
                    }}>
                      +91
                    </span>
                    <input
                      type="tel"
                      inputMode="numeric"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      placeholder="Phone number (required)"
                      maxLength={10}
                      style={{
                        flex: 1, padding: '14px', background: 'transparent',
                        border: 'none', fontSize: '16px', color: '#1C1C1E', outline: 'none',
                      }}
                    />
                  </div>

                  {/* Collect button */}
                  <button
                    onClick={handleCollect}
                    disabled={collecting || phone.replace(/\D/g, '').length < 10}
                    style={{
                      marginTop: '4px', minHeight: '52px',
                      background: phone.replace(/\D/g, '').length >= 10
                        ? 'linear-gradient(135deg, #E63946, #D62828)'
                        : '#E5E5E5',
                      color: phone.replace(/\D/g, '').length >= 10 ? '#FFFFFF' : '#ABABAB',
                      borderRadius: '16px', fontWeight: 700, fontSize: '16px',
                      border: 'none', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    {collecting ? (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Loader2 size={18} className="animate-spin" />
                        Collecting...
                      </span>
                    ) : (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Award size={18} />
                        Claim Your Stamp
                      </span>
                    )}
                  </button>
                </div>

                {/* ── Skip for now ── */}
                <button
                  onClick={onClose}
                  style={{
                    marginTop: '12px', width: '100%', minHeight: '44px',
                    background: 'transparent', color: '#ABABAB',
                    borderRadius: '14px', fontWeight: 600, fontSize: '14px',
                    border: 'none', cursor: 'pointer',
                  }}
                >
                  Skip for now
                </button>
              </>
            ) : result.reward_earned ? (
              /* ── REWARD UNLOCKED ── */
              <div style={{ textAlign: 'center', padding: '16px 0 20px' }}>
                <Confetti />
                <div
                  style={{
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    width: '80px', height: '80px', borderRadius: '50%',
                    background: 'linear-gradient(135deg, #FFB800, #FF9500)',
                    animation: 'glow-pulse 2s ease-in-out infinite',
                    marginBottom: '16px',
                  }}
                >
                  <PartyPopper style={{ color: '#FFFFFF' }} size={36} strokeWidth={1.5} />
                </div>

                <h2 style={{ fontSize: '22px', fontWeight: 900, color: '#1C1C1E', letterSpacing: '-0.03em' }}>
                  🎉 Reward Unlocked!
                </h2>
                <p style={{ fontSize: '16px', fontWeight: 700, color: '#E63946', marginTop: '6px' }}>
                  Free {result.reward_item_name}
                </p>

                {/* Reward ID */}
                <div style={{
                  background: '#FFF5F5', borderRadius: '16px', padding: '20px',
                  marginTop: '16px', border: '1px solid rgba(230,57,70,0.1)',
                }}>
                  <p style={{ fontSize: '11px', fontWeight: 600, color: '#ABABAB', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '6px' }}>
                    Your Reward ID
                  </p>
                  <p style={{ fontSize: '28px', fontWeight: 900, color: '#E63946', letterSpacing: '0.12em', fontFamily: 'monospace' }}>
                    {result.reward_code}
                  </p>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(result.reward_code || '')
                        .then(() => toast.success('Reward ID copied!'))
                        .catch(() => toast.error('Failed to copy'))
                    }}
                    style={{
                      marginTop: '8px', display: 'inline-flex', alignItems: 'center', gap: '4px',
                      background: 'rgba(230,57,70,0.08)', color: '#E63946',
                      borderRadius: '100px', padding: '6px 14px', fontSize: '12px',
                      fontWeight: 600, border: 'none', cursor: 'pointer',
                    }}
                  >
                    <Copy size={12} /> Copy ID
                  </button>
                </div>

                <p style={{ fontSize: '13px', color: '#6B6B6B', lineHeight: 1.6, marginTop: '12px' }}>
                  📍 Show this <strong style={{ color: '#1C1C1E' }}>Reward ID</strong> at the cafe to claim your free {result.reward_item_name}!
                </p>

                {result.whatsapp_notification_url && (
                  <button
                    onClick={() => window.open(result.whatsapp_notification_url!, '_blank')}
                    style={{
                      marginTop: '16px', width: '100%', minHeight: '48px',
                      background: '#25D366', color: '#FFFFFF',
                      borderRadius: '16px', fontWeight: 700, fontSize: '15px',
                      border: 'none', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                    Save to WhatsApp
                  </button>
                )}

                <button
                  onClick={onClose}
                  style={{
                    marginTop: '10px', width: '100%', minHeight: '44px',
                    background: 'transparent', color: '#6B6B6B',
                    borderRadius: '14px', fontWeight: 600, fontSize: '14px',
                    border: 'none', cursor: 'pointer',
                  }}
                >
                  Close
                </button>
              </div>
            ) : (
              /* ── STAMP COLLECTED SUCCESS ── */
              <div style={{ textAlign: 'center', padding: '16px 0 20px' }}>
                <div
                  style={{
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    width: '72px', height: '72px', borderRadius: '50%',
                    background: 'linear-gradient(135deg, #E63946, #D62828)',
                    boxShadow: '0 4px 20px rgba(230,57,70,0.3)',
                    marginBottom: '16px',
                    animation: 'stamp-collected-bounce 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  }}
                >
                  <Check style={{ color: '#FFFFFF' }} size={32} strokeWidth={3} />
                </div>

                <h2 style={{ fontSize: '22px', fontWeight: 900, color: '#1C1C1E', letterSpacing: '-0.03em' }}>
                  Stamp Collected!
                </h2>

                {result.halfway && (
                  <div
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: '4px',
                      padding: '4px 12px', borderRadius: '100px',
                      background: 'linear-gradient(135deg, #FFF8F3, #FFF0E8)',
                      border: '1px solid rgba(255,107,53,0.2)',
                      marginTop: '8px',
                    }}
                  >
                    <Target size={12} style={{ color: '#FF6B35' }} />
                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#FF6B35' }}>
                      Halfway there!
                    </span>
                  </div>
                )}

                {/* Progress bar */}
                <div style={{ marginTop: '20px', padding: '0 8px' }}>
                  <div style={{
                    display: 'flex', justifyContent: 'space-between', marginBottom: '6px',
                  }}>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: '#6B6B6B' }}>
                      Your progress
                    </span>
                    <span style={{ fontSize: '14px', fontWeight: 800, color: '#1C1C1E', fontFamily: 'monospace' }}>
                      {result.current_count} / {result.stamps_required}
                    </span>
                  </div>
                  <div style={{
                    background: '#F5F5F3', borderRadius: '100px', height: '12px', overflow: 'hidden',
                  }}>
                    <div style={{
                      height: '100%', borderRadius: '100px',
                      background: result.halfway
                        ? 'linear-gradient(90deg, #E63946, #FF6B35)'
                        : 'linear-gradient(90deg, #E63946, #D62828)',
                      width: `${(result.current_count / result.stamps_required) * 100}%`,
                      transition: 'width 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)',
                      '--progress-width': `${(result.current_count / result.stamps_required) * 100}%`,
                    }} />
                  </div>
                  <p style={{ fontSize: '13px', color: '#ABABAB', marginTop: '8px' }}>
                    {result.stamps_required - result.current_count} more stamps for your free {stampSettings.reward_item_name}
                  </p>
                </div>

                {/* Mini stamp grid */}
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'center', marginTop: '16px' }}>
                  {Array.from({ length: result.stamps_required }).map((_, i) => (
                    <div
                      key={i}
                      style={{
                        width: '30px', height: '30px', borderRadius: '50%',
                        border: i < result.current_count
                          ? '2px solid #E63946'
                          : '2px solid #EFEFED',
                        background: i < result.current_count
                          ? 'linear-gradient(135deg, #E63946, #D62828)'
                          : '#FAFAF8',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        animation: i === result.current_count - 1
                          ? 'stamp-collected-bounce 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)'
                          : 'none',
                        animationDelay: i === result.current_count - 1 ? '0.2s' : '0s',
                      }}
                    >
                      {i < result.current_count && <Check size={14} style={{ color: '#FFFFFF' }} strokeWidth={3} />}
                    </div>
                  ))}
                </div>

                {/* Guidance text */}
                <div style={{
                  background: '#F5F5F3', borderRadius: '12px', padding: '12px 16px',
                  marginTop: '20px', textAlign: 'left',
                }}>
                  <p style={{ fontSize: '12px', color: '#6B6B6B', lineHeight: 1.6 }}>
                    💡 <strong>How it works:</strong> Collect stamps on each order. After {stampSettings.stamps_required} stamps, get a free <strong style={{ color: '#E63946' }}>{stampSettings.reward_item_name}</strong>! Show your Reward ID at the cafe to claim.
                  </p>
                </div>

                <button
                  onClick={onClose}
                  style={{
                    marginTop: '20px', width: '100%', minHeight: '48px',
                    background: '#1C1C1E', color: '#FFFFFF',
                    borderRadius: '16px', fontWeight: 700, fontSize: '15px',
                    border: 'none', cursor: 'pointer',
                  }}
                >
                  Got it!
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

// ─── Step Icon ─────────────────────────────────────────────────
function StepIcon({ step, activeStep }: { step: number; activeStep: number }) {
  const isCompleted = step < activeStep
  const isActive = step === activeStep

  if (isCompleted) {
    return (
      <div
        className="flex items-center justify-center flex-shrink-0"
        style={{ width: '52px', height: '52px', borderRadius: '50%', background: '#1C1C1E' }}
      >
        <Check className="w-5 h-5" style={{ color: '#FFFFFF' }} strokeWidth={3} />
      </div>
    )
  }

  if (isActive) {
    return (
      <div
        className="flex items-center justify-center flex-shrink-0"
        style={{
          width: '52px', height: '52px', borderRadius: '50%',
          background: '#E63946',
          boxShadow: '0 0 0 0 rgba(230,57,70,0.4), 0 4px 14px rgba(230,57,70,0.25)',
          animation: 'pulse-ring 1.5s ease-out infinite',
        }}
      >
        {step === 0 && <Receipt className="w-5 h-5" style={{ color: '#FFFFFF' }} />}
        {step === 1 && <ChefHat className="w-5 h-5" style={{ color: '#FFFFFF' }} />}
        {step === 2 && <Star className="w-5 h-5" style={{ color: '#FFFFFF' }} />}
      </div>
    )
  }

  return (
    <div
      className="flex items-center justify-center flex-shrink-0"
      style={{ width: '52px', height: '52px', borderRadius: '50%', background: '#F5F5F3' }}
    >
      {step === 0 && <Receipt className="w-5 h-5" style={{ color: '#ABABAB' }} />}
      {step === 1 && <ChefHat className="w-5 h-5" style={{ color: '#ABABAB' }} />}
      {step === 2 && <Star className="w-5 h-5" style={{ color: '#ABABAB' }} />}
    </div>
  )
}

// ─── Progress Bar ──────────────────────────────────────────────
function ProgressBar({ activeStep }: { activeStep: number }) {
  const steps = [
    { label: 'Pending', value: 0 },
    { label: 'Preparing', value: 1 },
    { label: 'Ready', value: 2 },
  ]

  return (
    <div style={{ padding: '32px 20px 28px' }}>
      <div className="flex items-start justify-between relative">
        {/* Connecting lines (behind circles) */}
        <div
          className="absolute flex z-0"
          style={{
            top: '26px',
            left: 'calc(16.67% - 8px)',
            right: 'calc(16.67% - 8px)',
            height: '2px',
          }}
        >
          <div
            className="flex-1"
            style={{
              background: activeStep >= 1 ? '#1C1C1E' : '#EFEFED',
              transition: 'background-color 700ms cubic-bezier(0.4, 0, 0.2, 1)',
              borderRight: activeStep < 1 ? '2px dashed #DDDDD8' : 'none',
            }}
          />
          <div
            className="flex-1"
            style={{
              background: activeStep >= 2 ? '#1C1C1E' : '#EFEFED',
              transition: 'background-color 700ms cubic-bezier(0.4, 0, 0.2, 1)',
              borderRight: activeStep < 2 ? '2px dashed #DDDDD8' : 'none',
            }}
          />
        </div>

        {/* Step circles */}
        {steps.map((step) => {
          const isCompleted = step.value < activeStep
          const isActive = step.value === activeStep

          return (
            <div key={step.value} className="flex flex-col items-center z-10 flex-1">
              <StepIcon step={step.value} activeStep={activeStep} />
              <p
                className="mt-2.5 text-center leading-tight"
                style={{
                  fontSize: '12px',
                  fontWeight: isActive ? 700 : 600,
                  transition: 'color 500ms cubic-bezier(0.4, 0, 0.2, 1)',
                  color: isCompleted
                    ? '#1C1C1E'
                    : isActive
                      ? '#E63946'
                      : '#ABABAB',
                }}
              >
                {step.label}
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Order Summary Card ────────────────────────────────────────
function OrderSummary({
  items,
  total,
  tableNumber,
}: {
  items: OrderItem[]
  total: number
  tableNumber: number | null
}) {
  return (
    <div
      className="mx-5 overflow-hidden"
      style={{ background: '#FFFFFF', borderRadius: '20px', border: '1px solid #EFEFED' }}
    >
      {/* Header */}
      <div
        style={{
          padding: '16px', borderBottom: '1px solid #F5F5F3',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}
      >
        <p style={{ fontSize: '14px', fontWeight: 700, color: '#1C1C1E' }}>
          Order Summary
        </p>
        {tableNumber && (
          <p style={{ fontSize: '14px', color: '#6B6B6B' }}>
            Table {tableNumber}
          </p>
        )}
      </div>

      {/* Items list */}
      <div>
        {items.map((item, i) => (
          <div
            key={item.id}
            style={{
              padding: '12px 16px',
              display: 'flex', alignItems: 'center',
              borderBottom: i < items.length - 1 ? '1px solid #F5F5F3' : 'none',
            }}
          >
            <p style={{ flex: 1, fontSize: '14px', color: '#1C1C1E' }}>
              {item.item_name}
              <span style={{ color: '#ABABAB', marginLeft: '6px' }}>×{item.quantity}</span>
            </p>
            <span
              className="font-mono flex-shrink-0"
              style={{ fontSize: '14px', fontWeight: 600, color: '#1C1C1E' }}
            >
              {formatPrice(item.item_price * item.quantity)}
            </span>
          </div>
        ))}
      </div>

      {/* Total row */}
      <div
        style={{
          padding: '14px 16px', background: '#F9F9F7',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}
      >
        <p style={{ fontSize: '14px', fontWeight: 700, color: '#1C1C1E' }}>
          Total
        </p>
        <p className="font-mono" style={{ fontSize: '16px', fontWeight: 700, color: '#1C1C1E' }}>
          {formatPrice(total)}
        </p>
      </div>
    </div>
  )
}

// ─── Stamp Info Card (shown when PRO, stamps active, user dismissed popup) ─
function StampInfoCard({
  stampSettings,
  onClick,
}: {
  stampSettings: StampSettings
  onClick: () => void
}) {
  return (
    <div
      className="mx-5"
      style={{
        marginTop: '16px',
        background: 'linear-gradient(135deg, #FFF8F3, #FFF0E8)',
        border: '1.5px solid rgba(230,57,70,0.15)',
        borderRadius: '20px',
        padding: '20px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div
          style={{
            width: '44px', height: '44px', borderRadius: '50%', flexShrink: 0,
            background: 'linear-gradient(135deg, #E63946, #D62828)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <Gift style={{ color: '#FFFFFF' }} size={20} />
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: '14px', fontWeight: 700, color: '#1C1C1E' }}>
            Collect a stamp for this order!
          </p>
          <p style={{ fontSize: '12px', color: '#6B6B6B', marginTop: '2px' }}>
            Collect {stampSettings.stamps_required} stamps → Free {stampSettings.reward_item_name}
          </p>
        </div>
        <button
          onClick={onClick}
          style={{
            padding: '10px 16px', borderRadius: '12px',
            background: '#E63946', color: '#FFFFFF',
            border: 'none', cursor: 'pointer', fontSize: '13px',
            fontWeight: 700, whiteSpace: 'nowrap',
          }}
        >
          Claim
        </button>
      </div>
    </div>
  )
}

// ─── Guidance Card ────────────────────────────────────────────
function GuidanceCard() {
  return (
    <div
      className="mx-5"
      style={{
        marginTop: '16px',
        background: '#F9F9F7',
        borderRadius: '16px',
        padding: '16px 20px',
        border: '1px solid #EFEFED',
      }}
    >
      <p style={{ fontSize: '13px', fontWeight: 700, color: '#1C1C1E', marginBottom: '10px' }}>
        💡 How rewards work
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
          <span style={{ fontSize: '16px', lineHeight: '20px', flexShrink: 0 }}>1️⃣</span>
          <p style={{ fontSize: '13px', color: '#6B6B6B', lineHeight: 1.5 }}>
            Collect a stamp on each completed order
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
          <span style={{ fontSize: '16px', lineHeight: '20px', flexShrink: 0 }}>2️⃣</span>
          <p style={{ fontSize: '13px', color: '#6B6B6B', lineHeight: 1.5 }}>
            After collecting enough stamps, claim your reward
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
          <span style={{ fontSize: '16px', lineHeight: '20px', flexShrink: 0 }}>3️⃣</span>
          <p style={{ fontSize: '13px', color: '#6B6B6B', lineHeight: 1.5 }}>
            Show your <strong style={{ color: '#1C1C1E' }}>Reward ID</strong> at the cafe to enjoy!
          </p>
        </div>
      </div>
    </div>
  )
}

// ─── Skeleton Loader ───────────────────────────────────────────
function SkeletonTrack() {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#FAFAF8' }}>
      <div className="h-32" style={{ background: '#FFFFFF' }} />
      <div style={{ padding: '32px 20px 28px' }} className="flex items-center justify-between">
        <div className="skeleton" style={{ width: '52px', height: '52px', borderRadius: '50%' }} />
        <div className="skeleton" style={{ width: '52px', height: '52px', borderRadius: '50%' }} />
        <div className="skeleton" style={{ width: '52px', height: '52px', borderRadius: '50%' }} />
      </div>
      <div className="px-6 py-4 space-y-2">
        <div className="skeleton" style={{ height: '20px', width: '75%' }} />
        <div className="skeleton" style={{ height: '16px', width: '50%' }} />
      </div>
      <div className="mx-5 mt-2 skeleton" style={{ height: '192px', borderRadius: '20px' }} />
    </div>
  )
}

// ─── Not Found ─────────────────────────────────────────────────
function OrderNotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6" style={{ background: '#FAFAF8' }}>
      <div className="flex items-center justify-center mb-5" style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#F5F5F3' }}>
        <Receipt className="w-9 h-9" style={{ color: '#ABABAB' }} />
      </div>
      <h1 className="font-bold mb-2" style={{ fontSize: '22px', color: '#1C1C1E', letterSpacing: '-0.03em' }}>
        Order Not Found
      </h1>
      <p className="text-center leading-relaxed" style={{ fontSize: '14px', color: '#6B6B6B', maxWidth: '280px' }}>
        We couldn&apos;t find this order. The link may be incorrect or the order may have expired.
      </p>
      <footer className="absolute bottom-6 left-0 right-0 text-center">
        <p style={{ color: '#ABABAB', fontSize: '11px' }}>Powered by MenuMate</p>
      </footer>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// ─── Main Client Component ─────────────────────────────────────
// ═══════════════════════════════════════════════════════════════
export default function OrderTrackClient({
  orderId,
  restaurantId,
  restaurantName,
  slug,
  plan,
  initialOrder,
  stampSettings,
}: OrderTrackClientProps) {
  const [order, setOrder] = useState<OrderStatusData>(initialOrder)
  const [error, setError] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)
  const [showStampPopup, setShowStampPopup] = useState(false)
  const [stampPopupDismissed, setStampPopupDismissed] = useState(false)
  const lastStatusRef = useRef<OrderStatus>(initialOrder.status)
  const hasFiredConfetti = useRef(false)
  const hasFiredStampPopup = useRef(false)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // ─── Polling logic ──
  useEffect(() => {
    const poll = async () => {
      try {
        const res = await fetch(`/api/orders/${orderId}/status`)
        if (!res.ok) {
          setError(true)
          return
        }
        const data = await res.json()
        setOrder(data)

        const prevStatus = lastStatusRef.current

        // ── Detect status change to SERVED → confetti ──
        if (data.status === 'SERVED' && !hasFiredConfetti.current) {
          hasFiredConfetti.current = true
          setShowConfetti(true)
          if (pollRef.current) {
            clearInterval(pollRef.current)
            pollRef.current = null
          }
        }

        // ── Detect status change to PREPARING → stamp popup (PRO only) ──
        if (data.status === 'PREPARING' && prevStatus === 'NEW' && !hasFiredStampPopup.current && stampSettings && stampSettings.is_active) {
          hasFiredStampPopup.current = true
          // Show stamp popup after a brief delay so user sees "Preparing" status first
          setTimeout(() => {
            setShowStampPopup(true)
          }, 1500)
        }

        // Update last status ref
        lastStatusRef.current = data.status
      } catch {
        // Silently retry on network error
      }
    }

    // Initial fetch + polling
    poll()
    pollRef.current = setInterval(poll, 8000)
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [orderId, stampSettings])

  // ─── Derived state ───────────────────────────────────────
  const activeStep = STATUS_STEP[order.status] ?? 0
  const statusMessage = STATUS_MESSAGES[order.status]
  const isPro = plan === 'PRO'
  const canShowStampUI = isPro && ['PREPARING', 'SERVED'].includes(order.status) && stampSettings && stampSettings.is_active

  if (error) {
    return <OrderNotFound />
  }

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: '#FAFAF8', padding: '24px 20px 100px' }}
    >
      {/* ═══ Pulsing ring animation ═══ */}
      <style>{`
        @keyframes pulse-ring {
          0% { box-shadow: 0 0 0 0 rgba(230,57,70,0.4), 0 4px 14px rgba(230,57,70,0.25); }
          70% { box-shadow: 0 0 0 12px rgba(230,57,70,0), 0 4px 14px rgba(230,57,70,0.25); }
          100% { box-shadow: 0 0 0 0 rgba(230,57,70,0), 0 4px 14px rgba(230,57,70,0.25); }
        }
        @keyframes page-enter {
          0% { opacity: 0; transform: translateY(8px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes btn-press {
          0% { transform: scale(1); }
          50% { transform: scale(0.97); }
          100% { transform: scale(1); }
        }
      `}</style>

      {/* ═══ RESTAURANT HEADER ═══ */}
      <header style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button
          onClick={() => window.location.href = `/menu/${slug}`}
          style={{
            width: '40px', height: '40px', borderRadius: '50%', border: 'none',
            background: '#F5F5F3', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}
          aria-label="Back to menu"
        >
          <ArrowLeft size={18} style={{ color: '#6B6B6B' }} />
        </button>
        <div
          style={{
            width: '40px', height: '40px', borderRadius: '50%', background: '#F5F5F3',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}
        >
          <span style={{ fontSize: '18px' }}>🍽️</span>
        </div>
        <div>
          <p style={{ fontSize: '16px', fontWeight: 700, color: '#1C1C1E' }}>
            {restaurantName}
          </p>
          <p style={{ fontSize: '11px', color: '#ABABAB', fontWeight: 500 }}>
            Live order tracking
          </p>
        </div>
      </header>

      {/* ═══ ORDER NUMBER ═══ */}
      <div style={{ textAlign: 'center', marginTop: '24px' }}>
        <p style={{
          fontSize: '12px', color: '#ABABAB', textTransform: 'uppercase',
          letterSpacing: '0.1em', fontWeight: 500,
        }}>
          Order
        </p>
        <p style={{
          fontSize: '40px', fontWeight: 900, color: '#1C1C1E',
          letterSpacing: '-0.04em', lineHeight: 1.1,
        }}>
          #{order.order_number}
        </p>
        <p style={{ fontSize: '12px', color: '#ABABAB', marginTop: '4px' }}>
          {new Date(order.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>

      {/* ═══ PROGRESS TRACKER ═══ */}
      <ProgressBar activeStep={activeStep} />

      {/* ═══ STATUS MESSAGE CARD ═══ */}
      <div
        style={{
          marginTop: '28px', background: '#FFFFFF', border: '1px solid #EFEFED',
          borderRadius: '20px', padding: '20px', textAlign: 'center',
        }}
      >
        <div style={{ fontSize: '40px', lineHeight: 1 }}>{statusMessage.emoji}</div>
        <p style={{ fontSize: '17px', fontWeight: 700, color: '#1C1C1E', marginTop: '12px' }}>
          {statusMessage.title}
        </p>
        <p style={{ fontSize: '14px', color: '#6B6B6B', marginTop: '6px' }}>
          {statusMessage.subtitle}
        </p>
      </div>

      {/* ═══ ORDER SUMMARY ═══ */}
      <div style={{ marginTop: '16px' }}>
        <OrderSummary
          items={order.items}
          total={order.total_amount}
          tableNumber={order.table_number}
        />
      </div>

      {/* ═══ STAMP INFO (PRO only) ── show claim card if popup was dismissed ─ */}
      {canShowStampUI && stampPopupDismissed && (
        <StampInfoCard
          stampSettings={stampSettings}
          onClick={() => setShowStampPopup(true)}
        />
      )}

      {/* ═══ GUIDANCE CARD (PRO only) ─ */}
      {isPro && stampSettings && stampSettings.is_active && (
        <GuidanceCard />
      )}

      {/* ═══ FOOTER ═══ */}
      <footer className="mt-auto text-center" style={{ paddingTop: '32px' }}>
        <p style={{ color: '#ABABAB', fontSize: '11px' }}>
          Powered by MenuMate
        </p>
      </footer>

      {/* ═══ CONFETTI ═══ */}
      {showConfetti && <Confetti />}

      {/* ═══ STAMP POPUP ═══ */}
      {showStampPopup && stampSettings && (
        <StampEarnedPopup
          restaurantId={restaurantId}
          orderId={orderId}
          stampSettings={stampSettings}
          onClose={() => {
            setShowStampPopup(false)
            setStampPopupDismissed(true)
          }}
        />
      )}
    </div>
  )
}

// ─── Export skeleton for server component ──────────────────────
export { SkeletonTrack }
