'use client'

import { useState, useCallback, useRef } from 'react'
import toast from 'react-hot-toast'
import { Award, Check, Copy, Gift, Loader2, Phone, User, Target, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react'
import type { StampSettings } from '@/types'
import type { MenuTheme } from '@/lib/themes'
import { formatDate } from '@/lib/utils'

// ─── Types ─────────────────────────────────────────────────────

interface StampCustomerData {
  exists: boolean
  customer?: {
    id: string
    name: string | null
    phone_number: string
    total_orders: number
    last_visit_date: string | null
  }
  current_count?: number
  stamps_required?: number
  reward_item_name?: string
  is_active?: boolean
  active_reward?: {
    reward_code: string
    reward_item_name: string
    expires_at: string
  } | null
}

type StampsViewState = 'input' | 'loading' | 'card' | 'reward'

interface StampsTabProps {
  restaurantId: string
  restaurantName: string
  stampSettings: StampSettings | null
  theme: MenuTheme
  orderId?: string | null
}

// ═══════════════════════════════════════════════════════════════
// ─── Mini Confetti Component ────────────────────────────────────
// ═══════════════════════════════════════════════════════════════
function MiniConfetti({ count = 20, colors }: { count?: number; colors?: string[] }) {
  const defaultColors = ['#E63946', '#FFB800', '#00C853', '#FF6B35', '#1C1C1E', '#A855F7']
  const palette = colors || defaultColors

  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 100, clipPath: 'inset(0)' }}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: `${Math.random() * 100}%`,
            top: `-${Math.random() * 20}%`,
            width: `${5 + Math.random() * 9}px`,
            height: `${5 + Math.random() * 9}px`,
            borderRadius: Math.random() > 0.5 ? '50%' : '2px',
            backgroundColor: palette[i % palette.length],
            animation: `confetti-fall ${2 + Math.random() * 3}s ease-in ${Math.random() * 1.5}s forwards`,
          }}
        />
      ))}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// ─── Main Component ────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════

export default function StampsTab({
  restaurantId,
  restaurantName,
  stampSettings,
  theme,
  orderId,
}: StampsTabProps) {
  const [view, setView] = useState<StampsViewState>('input')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [data, setData] = useState<StampCustomerData | null>(null)
  const [collecting, setCollecting] = useState(false)
  const submittingRef = useRef(false)
  const [stampResult, setStampResult] = useState<{
    current_count: number
    stamps_required: number
    reward_earned?: boolean
    reward_code?: string
    reward_item_name?: string
    whatsapp_notification_url?: string
    owner_whatsapp_url?: string
    halfway?: boolean
  } | null>(null)

  const { stamps_required, reward_item_name } = stampSettings || { stamps_required: 0, reward_item_name: '' }

  // ─── Check card handler ─────────────────────────────────────
  const handleCheckCard = useCallback(async () => {
    const cleanPhone = phone.replace(/\D/g, '')
    if (!cleanPhone || cleanPhone.length < 10) {
      toast.error('Please enter a valid phone number')
      return
    }

    const formattedPhone = cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`

    setView('loading')
    try {
      const res = await fetch(
        `/api/stamps?phone=${formattedPhone}&restaurant_id=${restaurantId}`,
      )
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to check card')
      }
      const json: StampCustomerData = await res.json()
      setData(json)
      setView('card')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Something went wrong'
      toast.error(msg)
      setView('input')
    }
  }, [phone, restaurantId])

  // ─── Collect stamp handler ──────────────────────────────────
  const handleCollectStamp = useCallback(async () => {
    if (!orderId) return
    if (submittingRef.current) return
    submittingRef.current = true

    const cleanPhone = phone.replace(/\D/g, '')
    if (!cleanPhone || cleanPhone.length < 10) {
      toast.error('Please enter a valid phone number')
      submittingRef.current = false
      return
    }

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

      setStampResult(json)

      if (json.reward_earned) {
        toast.success('🎉 Reward unlocked!', { duration: 5000 })
        if (json.whatsapp_notification_url) {
          window.open(json.whatsapp_notification_url, '_blank')
        }
        setView('reward')
      } else {
        toast.success(`Stamp collected! ${json.current_count}/${json.stamps_required}`)
        if (json.halfway) {
          setTimeout(() => toast('🎯 Halfway there!', { icon: '🔥', duration: 3000 }), 1000)
        }
        // Refresh card data
        const cardRes = await fetch(
          `/api/stamps?phone=${formattedPhone}&restaurant_id=${restaurantId}`,
        )
        if (cardRes.ok) {
          const cardJson = await cardRes.json()
          setData(cardJson)
          setView('card')
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

  // ─── Copy code ─────────────────────────────────────────────
  const copyCode = useCallback((code: string) => {
    navigator.clipboard.writeText(code).then(
      () => toast.success('Code copied!'),
      () => toast.error('Failed to copy'),
    )
  }, [])

  // ─── Format phone for display ──────────────────────────────
  const formatPhone = (p: string) => {
    const clean = p.replace(/\D/g, '')
    if (clean.length === 12 && clean.startsWith('91')) {
      return `+91 ${clean.slice(2, 7)} ${clean.slice(7)}`
    }
    if (clean.length === 10) {
      return `+91 ${clean.slice(0, 5)} ${clean.slice(5)}`
    }
    return p
  }

  // ═══════════════════════════════════════════════════════════
  // ─── INLINE STYLES ──────────────────────────────────────────
  // ═══════════════════════════════════════════════════════════
  const styles = {
    cardBg: theme.stampCardBg,
    cardBorder: theme.stampCardBorder,
    text: theme.text,
    textSub: theme.textSub,
    textMuted: theme.textMuted,
    accent: theme.accent,
    accentGradient: theme.accentGradient,
    accentSoft: theme.accentSoft,
    border: theme.border,
    searchBg: theme.searchBg,
    cardShadow: theme.cardShadow,
    stampFilledBg: theme.stampFilledBg,
    stampFilledIcon: theme.stampFilledIcon,
    stampEmptyBg: theme.stampEmptyBg,
    stampEmptyBorder: theme.stampEmptyBorder,
    stampEmptyText: theme.stampEmptyText,
    bg: theme.bg,
  }

  // ═══════════════════════════════════════════════════════════
  // ─── LOADING VIEW ──────────────────────────────────────────
  // ═══════════════════════════════════════════════════════════
  if (view === 'loading') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 0' }}>
        <div style={{ animation: 'spin 1s linear infinite' }}>
          <Loader2 size={28} style={{ color: theme.accent }} />
        </div>
        <p style={{ color: theme.textSub, fontSize: '14px', marginTop: '12px' }}>
          Checking your card...
        </p>
      </div>
    )
  }

  // ═══════════════════════════════════════════════════════════
  // ─── REWARD VIEW ───────────────────────────────────────────
  // ═══════════════════════════════════════════════════════════
  if (view === 'reward' && stampResult) {
    const expiryDate = data?.active_reward?.expires_at
      ? formatDate(data.active_reward.expires_at)
      : formatDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString())

    const customerPhone = data?.customer?.phone_number || phone

    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 24px' }}>
        <style>{`
          @keyframes confetti-fall {
            0% { transform: translateY(-10vh) rotate(0deg); opacity: 1; }
            100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
          }
          @keyframes reward-bounce {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.15); }
          }
          @keyframes reward-slide-up {
            0% { opacity: 0; transform: translateY(20px); }
            100% { opacity: 1; transform: translateY(0); }
          }
          @keyframes reward-glow {
            0%, 100% { box-shadow: 0 0 20px ${theme.accent}30, 0 0 60px ${theme.accent}10; }
            50% { box-shadow: 0 0 30px ${theme.accent}50, 0 0 80px ${theme.accent}20; }
          }
        `}</style>

        {/* Confetti */}
        <MiniConfetti count={30} colors={[theme.accent, theme.accentEnd, '#FFD700', '#FF6B35', '#00C853']} />

        {/* Digital Reward Card */}
        <div
          style={{
            width: '100%',
            maxWidth: '340px',
            textAlign: 'center',
            background: styles.cardBg,
            borderRadius: '24px',
            border: `1px solid ${styles.cardBorder}`,
            padding: '32px 24px',
            color: styles.text,
            animation: 'reward-slide-up 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
          }}
        >
          <div
            style={{
              fontSize: '56px',
              animation: 'reward-bounce 1s ease-in-out infinite',
              display: 'inline-block',
              lineHeight: 1.2,
            }}
          >
            🎉
          </div>

          <p
            style={{
              fontSize: '24px',
              fontWeight: 900,
              color: styles.text,
              marginTop: '12px',
              letterSpacing: '-0.03em',
            }}
          >
            You&apos;ve earned it!
          </p>
          <p
            style={{
              fontSize: '18px',
              color: styles.accent,
              marginTop: '4px',
              fontWeight: 700,
            }}
          >
            1 Free {stampResult.reward_item_name}
          </p>

          {/* Reward ID Card */}
          <div
            style={{
              marginTop: '24px',
              background: styles.searchBg,
              border: `1px solid ${styles.border}`,
              borderRadius: '20px',
              padding: '20px',
            }}
          >
            {/* Active badge */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 12px',
                borderRadius: '100px',
                background: 'rgba(0,200,83,0.1)',
                fontSize: '11px',
                fontWeight: 700,
                color: '#00C853',
                textTransform: 'uppercase' as const,
                letterSpacing: '0.06em',
                marginBottom: '12px',
              }}
            >
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#00C853' }} />
              Active
            </div>

            <p
              style={{
                fontSize: '11px',
                fontWeight: 600,
                color: styles.textMuted,
                letterSpacing: '0.1em',
                textTransform: 'uppercase' as const,
              }}
            >
              REWARD ID
            </p>
            <p
              style={{
                fontFamily: 'monospace',
                fontSize: '32px',
                fontWeight: 900,
                color: styles.text,
                letterSpacing: '0.15em',
                marginTop: '4px',
              }}
            >
              {stampResult.reward_code}
            </p>
            <button
              onClick={() => stampResult.reward_code && copyCode(stampResult.reward_code)}
              style={{
                marginTop: '10px',
                background: 'rgba(255,255,255,0.08)',
                color: styles.text,
                borderRadius: '100px',
                padding: '8px 20px',
                fontSize: '13px',
                fontWeight: 600,
                border: `1px solid ${styles.border}`,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Copy size={14} />
              Copy Code
            </button>

            {/* Divider */}
            <div style={{ height: 1, background: styles.border, margin: '16px 0' }} />

            {/* Card details */}
            <div style={{ textAlign: 'left' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span style={{ fontSize: '12px', color: styles.textMuted }}>Reward</span>
                <span style={{ fontSize: '12px', fontWeight: 600, color: styles.text }}>Free {stampResult.reward_item_name}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span style={{ fontSize: '12px', color: styles.textMuted }}>Customer</span>
                <span style={{ fontSize: '12px', fontWeight: 600, color: styles.text }}>{name || 'Guest'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span style={{ fontSize: '12px', color: styles.textMuted }}>Phone</span>
                <span style={{ fontSize: '12px', fontWeight: 600, color: styles.text, fontFamily: 'monospace' }}>{formatPhone(customerPhone)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '12px', color: styles.textMuted }}>Valid until</span>
                <span style={{ fontSize: '12px', fontWeight: 600, color: styles.text }}>{expiryDate}</span>
              </div>
            </div>
          </div>

          {/* Claim guidance */}
          <div
            style={{
              marginTop: '20px',
              background: `${theme.accent}08`,
              borderRadius: '14px',
              padding: '14px 16px',
              border: `1px solid ${theme.accent}18`,
              textAlign: 'left',
            }}
          >
            <p style={{ fontSize: '14px', fontWeight: 700, color: styles.text, marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Sparkles size={14} style={{ color: theme.accent }} />
              How to claim your reward
            </p>
            <p style={{ fontSize: '13px', color: styles.textSub, lineHeight: 1.5 }}>
              Visit the café and show your <strong style={{ color: styles.text }}>Reward ID</strong> to the staff to claim your free {stampResult.reward_item_name}.
            </p>
          </div>

          {/* WhatsApp button */}
          {stampResult.whatsapp_notification_url && (
            <button
              onClick={() => window.open(stampResult.whatsapp_notification_url!, '_blank')}
              style={{
                marginTop: '16px',
                width: '100%',
                minHeight: '48px',
                background: '#25D366',
                color: '#FFFFFF',
                borderRadius: '14px',
                fontWeight: 700,
                fontSize: '15px',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              Save Reward to WhatsApp
            </button>
          )}
        </div>

        <button
          onClick={() => {
            setView('input')
            setStampResult(null)
          }}
          style={{
            marginTop: '24px',
            color: styles.textMuted,
            fontSize: '14px',
            fontWeight: 500,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            minHeight: '44px',
          }}
        >
          Check My Card Again
          <ArrowRight size={14} />
        </button>
      </div>
    )
  }

  // ═══════════════════════════════════════════════════════════
  // ─── CARD VIEW ─────────────────────────────────────────────
  // ═══════════════════════════════════════════════════════════
  if (view === 'card' && data) {
    const count = data.current_count || 0
    const required = data.stamps_required || stamps_required
    const rewardName = data.reward_item_name || reward_item_name
    const customerName = data.customer?.name
    const isNew = !customerName || data.customer?.total_orders === 1
    const halfway = Math.ceil(required / 2)
    const isHalfway = count >= halfway && count < required
    const cols = required <= 9 ? 3 : 4
    const progressPercent = Math.round((count / required) * 100)

    return (
      <div style={{ padding: '24px 20px' }}>
        {/* Welcome text */}
        <div style={{ marginBottom: '20px' }}>
          <p
            style={{
              fontSize: '20px',
              fontWeight: 800,
              color: styles.text,
              letterSpacing: '-0.03em',
            }}
          >
            {isNew ? 'Welcome' : 'Welcome back'}, {customerName || 'friend'}! 👋
          </p>
          <p style={{ fontSize: '13px', color: styles.textMuted, marginTop: '4px' }}>
            {formatPhone(data.customer?.phone_number || '')}
          </p>
        </div>

        {/* Stamp card */}
        <div
          style={{
            background: styles.cardBg,
            borderRadius: '24px',
            border: `1px solid ${styles.cardBorder}`,
            boxShadow: styles.cardShadow,
            padding: '24px',
            marginBottom: '16px',
          }}
        >
          {/* Header row */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <p
              style={{
                fontSize: '15px',
                fontWeight: 600,
                color: styles.text,
              }}
            >
              {restaurantName}
            </p>
            <p
              style={{
                fontSize: '14px',
                fontWeight: 700,
                color: styles.accent,
              }}
            >
              {count}/{required}
            </p>
          </div>

          {/* Progress bar */}
          <div
            style={{
              marginTop: '14px',
              background: styles.stampEmptyBg,
              borderRadius: '100px',
              height: '6px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                borderRadius: '100px',
                background: styles.accentGradient,
                width: `${progressPercent}%`,
                transition: 'width 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
              }}
            />
          </div>

          {/* Stamp grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${cols}, 64px)`,
              gap: '12px',
              justifyContent: 'center',
              marginTop: '20px',
            }}
          >
            {Array.from({ length: required }).map((_, i) => {
              const isFilled = i < count
              const isNext = i === count // The next empty slot (target)
              return (
                <div
                  key={i}
                  style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 300ms ease',
                    ...(isFilled
                      ? {
                          background: styles.stampFilledBg,
                          boxShadow: styles.cardShadow,
                        }
                      : isNext
                        ? {
                            background: styles.stampEmptyBg,
                            border: `2px dashed ${styles.accent}40`,
                          }
                        : {
                            background: styles.stampEmptyBg,
                            border: `2px dashed ${styles.stampEmptyBorder}`,
                          }),
                  }}
                >
                  {isFilled ? (
                    <Check size={24} style={{ color: styles.stampFilledIcon }} strokeWidth={3} />
                  ) : (
                    <span
                      style={{
                        fontFamily: 'monospace',
                        fontSize: '13px',
                        fontWeight: 500,
                        color: isNext ? styles.accent : styles.stampEmptyText,
                        userSelect: 'none',
                      }}
                    >
                      {i + 1}
                    </span>
                  )}
                </div>
              )
            })}
          </div>

          {/* Progress text */}
          <div style={{ textAlign: 'center', marginTop: '20px' }}>
            <p style={{ fontSize: '14px', color: styles.textSub, marginTop: '4px', lineHeight: 1.4 }}>
              <span style={{ fontSize: '28px', fontWeight: 900, color: styles.text, letterSpacing: '-0.03em', fontFamily: 'monospace' }}>{count}</span>
              <span style={{ fontSize: '14px', color: styles.textSub }}> of </span>
              <span style={{ fontSize: '28px', fontWeight: 900, color: styles.text, letterSpacing: '-0.03em', fontFamily: 'monospace' }}>{required}</span>
              <span style={{ fontSize: '14px', color: styles.textSub }}> stamps collected</span>
            </p>
            <p style={{ fontSize: '12px', color: styles.textMuted, marginTop: '4px' }}>
              {required - count > 0
                ? `${required - count} more visit${required - count > 1 ? 's' : ''} for a free ${rewardName.toLowerCase()}`
                : 'All stamps collected! 🎉'
              }
            </p>
          </div>
        </div>

        {/* Halfway motivation */}
        {isHalfway && (
          <div
            style={{
              background: styles.accentSoft,
              border: `1px solid ${theme.accent}20`,
              borderRadius: '14px',
              padding: '14px 16px',
              textAlign: 'center',
              marginBottom: '16px',
            }}
          >
            <p
              style={{
                fontSize: '15px',
                fontWeight: 700,
                color: styles.accent,
              }}
            >
              <Target size={14} style={{ display: 'inline', verticalAlign: '-2px', marginRight: '4px' }} />
              Halfway there!
            </p>
            <p
              style={{
                fontSize: '13px',
                color: styles.accent,
                marginTop: '4px',
                opacity: 0.75,
              }}
            >
              {required - count} more visits for your free {rewardName}
            </p>
          </div>
        )}

        {/* Active reward */}
        {data.active_reward && (
          <div
            style={{
              background: styles.cardBg,
              borderRadius: '20px',
              border: `1px solid ${styles.cardBorder}`,
              padding: '16px',
              marginBottom: '16px',
              animation: 'reward-glow 2s ease-in-out infinite',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <Gift size={20} style={{ color: styles.accent }} />
              <p
                style={{ fontSize: '14px', fontWeight: 700, color: styles.text }}
              >
                Unclaimed Reward!
              </p>
            </div>
            <p style={{ fontSize: '13px', color: styles.textSub, marginBottom: '8px' }}>
              You earned a free <strong style={{ color: styles.text }}>{data.active_reward.reward_item_name}</strong>
            </p>
            <p style={{ fontSize: '12px', color: styles.textMuted, marginBottom: '8px' }}>
              📍 Visit the café and show this Reward ID to claim your gift.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span
                style={{
                  fontFamily: 'monospace',
                  fontSize: '17px',
                  fontWeight: 700,
                  color: styles.accent,
                  letterSpacing: '0.08em',
                }}
              >
                {data.active_reward.reward_code}
              </span>
              <button
                onClick={() => copyCode(data.active_reward!.reward_code)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  borderRadius: '100px',
                  padding: '6px 14px',
                  background: styles.searchBg,
                  fontSize: '12px',
                  fontWeight: 500,
                  color: styles.textSub,
                  border: `1px solid ${styles.border}`,
                  cursor: 'pointer',
                  minHeight: '36px',
                }}
              >
                <Copy size={12} />
                Copy
              </button>
            </div>
            <p style={{ fontSize: '12px', color: styles.textMuted, marginTop: '6px' }}>
              Expires {formatDate(data.active_reward.expires_at)}
            </p>
          </div>
        )}

        {/* Collect stamp button (only from tracking page) */}
        {orderId && (
          <button
            onClick={handleCollectStamp}
            disabled={collecting}
            style={{
              width: '100%',
              minHeight: '52px',
              background: styles.accentGradient,
              color: theme.accentText,
              borderRadius: '14px',
              fontWeight: 700,
              fontSize: '16px',
              border: 'none',
              cursor: collecting ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              opacity: collecting ? 0.5 : 1,
              marginBottom: '12px',
            }}
          >
            {collecting ? (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                Collecting...
              </span>
            ) : (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <Award size={18} />
                Collect My Stamp
              </span>
            )}
          </button>
        )}

        <button
          onClick={() => {
            setView('input')
            setData(null)
          }}
          style={{
            width: '100%',
            textAlign: 'center',
            fontSize: '14px',
            fontWeight: 500,
            color: styles.textMuted,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            minHeight: '44px',
          }}
        >
          Check a different number
        </button>
      </div>
    )
  }

  // ═══════════════════════════════════════════════════════════
  // ─── INPUT VIEW (default) ──────────────────────────────────
  // ═══════════════════════════════════════════════════════════
  const isPhoneValid = phone.replace(/\D/g, '').length >= 10

  return (
    <div style={{ background: styles.bg, padding: '24px 20px' }}>
      {/* Header */}
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '48px', lineHeight: 1 }}>🎁</div>
        <p
          style={{
            fontSize: '22px',
            fontWeight: 800,
            color: styles.text,
            marginTop: '12px',
            letterSpacing: '-0.03em',
          }}
        >
          Earn Rewards
        </p>
        <p
          style={{
            fontSize: '14px',
            color: styles.textSub,
            marginTop: '8px',
          }}
        >
          Complete {stamps_required} visits, get 1 free {reward_item_name}
        </p>
      </div>

      {/* Trust badge */}
      <div
        style={{
          marginTop: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
          marginBottom: '4px',
        }}
      >
        <ShieldCheck size={14} style={{ color: styles.accent }} />
        <p style={{ fontSize: '12px', color: styles.textMuted, fontWeight: 500 }}>
          Secure · One stamp per visit · Phone-protected
        </p>
      </div>

      {/* Glass card */}
      <div
        style={{
          marginTop: '20px',
          background: styles.cardBg,
          border: `1px solid ${styles.cardBorder}`,
          borderRadius: '20px',
          padding: '24px',
        }}
      >
        {/* Name input */}
        <div>
          <label
            style={{
              display: 'block',
              fontSize: '12px',
              fontWeight: 700,
              color: styles.textMuted,
              textTransform: 'uppercase' as const,
              letterSpacing: '0.06em',
              marginBottom: '8px',
            }}
          >
            Your Name
          </label>
          <div style={{ position: 'relative' }}>
            <User
              size={16}
              style={{
                position: 'absolute',
                top: '50%',
                left: '16px',
                transform: 'translateY(-50%)',
                color: styles.textMuted,
                pointerEvents: 'none',
              }}
            />
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              style={{
                width: '100%',
                paddingLeft: '44px',
                paddingRight: '16px',
                paddingTop: '14px',
                paddingBottom: '14px',
                background: styles.searchBg,
                borderRadius: '12px',
                border: `1px solid ${styles.border}`,
                fontSize: '15px',
                color: styles.text,
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>
        </div>

        {/* Phone input */}
        <div style={{ marginTop: '14px' }}>
          <label
            style={{
              display: 'block',
              fontSize: '12px',
              fontWeight: 700,
              color: styles.textMuted,
              textTransform: 'uppercase' as const,
              letterSpacing: '0.06em',
              marginBottom: '8px',
            }}
          >
            WhatsApp Number
          </label>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              background: styles.searchBg,
              borderRadius: '12px',
              border: `1px solid ${styles.border}`,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                paddingLeft: '16px',
                paddingRight: '12px',
                fontSize: '14px',
                fontWeight: 600,
                color: styles.textSub,
                borderRight: `1px solid ${styles.border}`,
                height: '48px',
                flexShrink: 0,
              }}
            >
              <Phone size={16} style={{ color: styles.textMuted }} />
              <span>+91</span>
            </div>
            <input
              type="tel"
              inputMode="numeric"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
              placeholder="9876543210"
              maxLength={10}
              style={{
                flex: 1,
                padding: '14px 16px',
                background: 'transparent',
                border: 'none',
                fontSize: '15px',
                color: styles.text,
                outline: 'none',
                minWidth: 0,
              }}
            />
          </div>
        </div>

        {/* Check My Card / Collect Stamp button */}
        <button
          onClick={orderId ? handleCollectStamp : handleCheckCard}
          disabled={!isPhoneValid || collecting}
          style={{
            width: '100%',
            minHeight: '52px',
            background: styles.accentGradient,
            color: theme.accentText,
            borderRadius: '14px',
            fontWeight: 700,
            fontSize: '16px',
            border: 'none',
            cursor: isPhoneValid && !collecting ? 'pointer' : 'not-allowed',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            marginTop: '20px',
            opacity: isPhoneValid && !collecting ? 1 : 0.5,
            transition: 'opacity 0.2s ease',
          }}
        >
          {collecting ? (
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
              Processing...
            </span>
          ) : orderId ? (
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <Award size={18} />
              Collect My Stamp
              <ArrowRight size={16} />
            </span>
          ) : (
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              Check My Card
              <ArrowRight size={18} />
            </span>
          )}
        </button>
      </div>

      {/* How it works */}
      <div
        style={{
          marginTop: '20px',
          padding: '16px',
          background: styles.cardBg,
          border: `1px solid ${styles.cardBorder}`,
          borderRadius: '16px',
        }}
      >
        <p style={{ fontSize: '13px', fontWeight: 700, color: styles.text, marginBottom: '10px' }}>
          ✨ How it works
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {[
            `Order food at ${restaurantName}`,
            'Collect 1 stamp per visit',
            `Get a free ${reward_item_name} at ${stamps_required} stamps!`,
          ].map((step, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  background: styles.accentGradient,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  fontSize: '11px',
                  fontWeight: 700,
                  color: theme.accentText,
                }}
              >
                {i + 1}
              </div>
              <p style={{ fontSize: '13px', color: styles.textSub, lineHeight: 1.4 }}>
                {step}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Info text */}
      <p
        style={{
          textAlign: 'center',
          lineHeight: '1.6',
          fontSize: '12px',
          color: styles.textMuted,
          maxWidth: '280px',
          marginTop: '20px',
          marginLeft: 'auto',
          marginRight: 'auto',
        }}
      >
        Each visit earns you one stamp. Collect all{' '}
        <span style={{ fontFamily: 'monospace', color: styles.accent }}>{stamps_required}</span> to
        claim your free {reward_item_name.toLowerCase()}!
      </p>
    </div>
  )
}
