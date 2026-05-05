'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import toast from 'react-hot-toast'
import { CreditCard, TrendingUp, Search, Calendar } from 'lucide-react'

// ── Types ──────────────────────────────────────────────────────────────────
interface Payment {
  id: string
  restaurant: string
  email: string
  amount: number
  type: 'SETUP' | 'SUBSCRIPTION'
  method: 'UPI' | 'CASH'
  date: string
  notes: string
}

// ── Helpers ────────────────────────────────────────────────────────────────
function formatINR(n: number): string {
  return (
    '₹' +
    n.toLocaleString('en-IN', {
      maximumFractionDigits: 0,
    })
  )
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 11)
}

function getTodayISO(): string {
  return new Date().toISOString().split('T')[0]
}

// ── Mock Data ──────────────────────────────────────────────────────────────
const mockPayments: Payment[] = []

// ── Component ──────────────────────────────────────────────────────────────
export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>(mockPayments)
  const [isLoading, setIsLoading] = useState(true)

  // Simulate a brief loading state on mount
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 600)
    return () => clearTimeout(timer)
  }, [])

  // ── Form State ─────────────────────────────────────────────────────────
  const [restaurant, setRestaurant] = useState('')
  const [amount, setAmount] = useState('')
  const [payType, setPayType] = useState<'SETUP' | 'SUBSCRIPTION'>('SETUP')
  const [payMethod, setPayMethod] = useState<'UPI' | 'CASH'>('UPI')
  const [notes, setNotes] = useState('')
  const [extendPlan, setExtendPlan] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // ── Computed Revenue ───────────────────────────────────────────────────
  const { thisMonth, allTime, thisMonthChange } = useMemo(() => {
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()

    const thisMonthPayments = payments.filter((p) => {
      const d = new Date(p.date)
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear
    })

    const thisMonthTotal = thisMonthPayments.reduce((s, p) => s + p.amount, 0)

    // Last month
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear
    const lastMonthPayments = payments.filter((p) => {
      const d = new Date(p.date)
      return d.getMonth() === lastMonth && d.getFullYear() === lastMonthYear
    })
    const lastMonthTotal = lastMonthPayments.reduce((s, p) => s + p.amount, 0)

    const allTimeTotal = payments.reduce((s, p) => s + p.amount, 0)
    const change = thisMonthTotal - lastMonthTotal

    return {
      thisMonth: thisMonthTotal,
      allTime: allTimeTotal,
      thisMonthChange: change,
    }
  }, [payments])

  // ── Form Submit ───────────────────────────────────────────────────────
  const handleSubmit = useCallback(() => {
    const trimmedRestaurant = restaurant.trim()
    const parsedAmount = parseFloat(amount)

    if (!trimmedRestaurant) {
      toast.error('Restaurant name is required')
      return
    }
    if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) {
      toast.error('Enter a valid amount greater than ₹0')
      return
    }

    setIsSubmitting(true)

    // Simulate a small delay for UX feel
    setTimeout(() => {
      const newPayment: Payment = {
        id: generateId(),
        restaurant: trimmedRestaurant,
        email: `owner@${trimmedRestaurant.toLowerCase().replace(/\s+/g, '')}.com`,
        amount: parsedAmount,
        type: payType,
        method: payMethod,
        date: getTodayISO(),
        notes: notes.trim(),
      }

      setPayments((prev) => [newPayment, ...prev])
      toast.success(`Payment of ${formatINR(parsedAmount)} recorded`)

      // Reset form
      setRestaurant('')
      setAmount('')
      setPayType('SETUP')
      setPayMethod('UPI')
      setNotes('')
      setExtendPlan(false)
      setIsSubmitting(false)
    }, 400)
  }, [restaurant, amount, payType, payMethod, notes])

  // ── Sort payments newest first ────────────────────────────────────────
  const sortedPayments = useMemo(
    () => [...payments].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [payments],
  )

  // ── Styles ────────────────────────────────────────────────────────────
  const labelStyle: React.CSSProperties = {
    fontSize: '11px',
    fontWeight: 600,
    letterSpacing: '0.08em',
    textTransform: 'uppercase' as const,
    color: 'rgba(255,255,255,0.5)',
    marginBottom: '8px',
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '10px',
    padding: '10px 14px',
    color: '#FFFFFF',
    fontSize: '14px',
    outline: 'none',
    transition: 'border-color 0.15s',
  }

  const toggleBase: React.CSSProperties = {
    padding: '8px 16px',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.15s',
    border: 'none',
    outline: 'none',
  }

  // ── Render ────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div style={{ padding: '0 0 40px 0' }}>
        {/* Skeleton header */}
        <div
          style={{
            width: '120px',
            height: '28px',
            borderRadius: '6px',
            background:
              'linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 75%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 1.5s infinite',
          }}
        />
        {/* Skeleton cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
          {[0, 1].map((i) => (
            <div
              key={i}
              style={{
                background: '#111111',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: '16px',
                padding: '20px 24px',
              }}
            >
              <div
                style={{
                  width: '90px',
                  height: '12px',
                  borderRadius: '4px',
                  marginBottom: '12px',
                  background:
                    'linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 75%)',
                  backgroundSize: '200% 100%',
                  animation: 'shimmer 1.5s infinite',
                }}
              />
              <div
                style={{
                  width: '160px',
                  height: '32px',
                  borderRadius: '6px',
                  marginBottom: '8px',
                  background:
                    'linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 75%)',
                  backgroundSize: '200% 100%',
                  animation: 'shimmer 1.5s infinite',
                }}
              />
              <div
                style={{
                  width: '120px',
                  height: '12px',
                  borderRadius: '4px',
                  background:
                    'linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 75%)',
                  backgroundSize: '200% 100%',
                  animation: 'shimmer 1.5s infinite',
                }}
              />
            </div>
          ))}
        </div>
        {/* Skeleton form */}
        <div
          style={{
            marginTop: '20px',
            background: '#111111',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: '16px',
            padding: '24px',
          }}
        >
          <div
            style={{
              width: '160px',
              height: '18px',
              borderRadius: '6px',
              marginBottom: '20px',
              background:
                'linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 75%)',
              backgroundSize: '200% 100%',
              animation: 'shimmer 1.5s infinite',
            }}
          />
          {[0, 1, 2, 3].map((i) => (
            <div key={i} style={{ marginBottom: '16px' }}>
              <div
                style={{
                  width: '80px',
                  height: '10px',
                  borderRadius: '4px',
                  marginBottom: '8px',
                  background:
                    'linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 75%)',
                  backgroundSize: '200% 100%',
                  animation: 'shimmer 1.5s infinite',
                }}
              />
              <div
                style={{
                  width: '100%',
                  height: '40px',
                  borderRadius: '10px',
                  background:
                    'linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 75%)',
                  backgroundSize: '200% 100%',
                  animation: 'shimmer 1.5s infinite',
                }}
              />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div style={{ padding: '0 0 40px 0' }}>
      {/* Shimmer keyframes */}
      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>

      {/* ── Page Header ──────────────────────────────────────────────── */}
      <h1
        style={{
          color: '#FFFFFF',
          fontSize: '24px',
          fontWeight: 800,
          letterSpacing: '-0.02em',
          fontFamily: '-apple-system, system-ui, sans-serif',
        }}
      >
        Payments
      </h1>

      {/* ── Revenue Summary Row ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
        {/* THIS MONTH */}
        <div
          style={{
            background: '#111111',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: '16px',
            padding: '20px 24px',
          }}
        >
          <div
            style={{
              fontSize: '11px',
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.4)',
              marginBottom: '8px',
            }}
          >
            This Month
          </div>
          <div
            style={{
              color: '#FFFFFF',
              fontSize: '36px',
              fontWeight: 800,
              letterSpacing: '-0.02em',
              lineHeight: 1.1,
            }}
          >
            {formatINR(thisMonth)}
          </div>
          {thisMonthChange !== 0 && (
            <div
              className="flex items-center gap-1 mt-2"
              style={{
                fontSize: '13px',
                color: thisMonthChange >= 0 ? '#34C759' : '#FF3B30',
                fontWeight: 600,
              }}
            >
              <TrendingUp className="w-3.5 h-3.5" style={{ transform: thisMonthChange < 0 ? 'rotate(180deg)' : 'none' }} />
              {thisMonthChange >= 0 ? '+' : ''}
              {formatINR(thisMonthChange)} from last month
            </div>
          )}
          {thisMonthChange === 0 && payments.length > 0 && (
            <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.3)', marginTop: '8px' }}>
              Same as last month
            </div>
          )}
          {payments.length === 0 && (
            <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.3)', marginTop: '8px' }}>
              No payments yet
            </div>
          )}
        </div>

        {/* ALL TIME */}
        <div
          style={{
            background: '#111111',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: '16px',
            padding: '20px 24px',
          }}
        >
          <div
            style={{
              fontSize: '11px',
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.4)',
              marginBottom: '8px',
            }}
          >
            All Time
          </div>
          <div
            style={{
              color: '#FFFFFF',
              fontSize: '36px',
              fontWeight: 800,
              letterSpacing: '-0.02em',
              lineHeight: 1.1,
            }}
          >
            {formatINR(allTime)}
          </div>
          <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.3)', marginTop: '8px' }}>
            since launch
          </div>
        </div>
      </div>

      {/* ── Record Payment Form ──────────────────────────────────────── */}
      <div
        style={{
          marginTop: '20px',
          background: '#111111',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: '16px',
          padding: '24px',
        }}
      >
        <h2
          style={{
            color: '#FFFFFF',
            fontSize: '16px',
            fontWeight: 700,
            marginBottom: '20px',
          }}
        >
          Record New Payment
        </h2>

        {/* Restaurant */}
        <div style={{ marginBottom: '16px' }}>
          <label style={labelStyle}>Restaurant</label>
          <div style={{ position: 'relative' }}>
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2"
              style={{ width: '16px', height: '16px', color: 'rgba(255,255,255,0.25)' }}
            />
            <input
              type="text"
              value={restaurant}
              onChange={(e) => setRestaurant(e.target.value)}
              placeholder="Search restaurant name..."
              style={{ ...inputStyle, paddingLeft: '36px' }}
            />
          </div>
        </div>

        {/* Amount */}
        <div style={{ marginBottom: '16px' }}>
          <label style={labelStyle}>Amount</label>
          <div style={{ position: 'relative' }}>
            <span
              style={{
                position: 'absolute',
                left: '14px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'rgba(255,255,255,0.4)',
                fontSize: '14px',
                fontWeight: 600,
                pointerEvents: 'none',
              }}
            >
              ₹
            </span>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              min="0"
              step="1"
              style={{ ...inputStyle, paddingLeft: '32px' }}
            />
          </div>
        </div>

        {/* Type + Method toggles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" style={{ marginBottom: '16px' }}>
          {/* Type */}
          <div>
            <label style={labelStyle}>Type</label>
            <div className="flex gap-1 p-1" style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '10px' }}>
              {(['SETUP', 'SUBSCRIPTION'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setPayType(t)}
                  style={{
                    ...toggleBase,
                    flex: 1,
                    background: payType === t ? '#E63946' : 'transparent',
                    color: payType === t ? '#FFFFFF' : 'rgba(255,255,255,0.5)',
                  }}
                >
                  {t === 'SETUP' ? 'Setup' : 'Subscription'}
                </button>
              ))}
            </div>
          </div>

          {/* Method */}
          <div>
            <label style={labelStyle}>Method</label>
            <div className="flex gap-1 p-1" style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '10px' }}>
              {(['UPI', 'CASH'] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setPayMethod(m)}
                  style={{
                    ...toggleBase,
                    flex: 1,
                    background: payMethod === m ? '#E63946' : 'transparent',
                    color: payMethod === m ? '#FFFFFF' : 'rgba(255,255,255,0.5)',
                  }}
                >
                  {m === 'UPI' ? 'UPI' : 'Cash'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Extend Plan Toggle (only for SUBSCRIPTION) */}
        {payType === 'SUBSCRIPTION' && (
          <div
            className="flex items-center justify-between"
            style={{
              marginBottom: '16px',
              padding: '12px 16px',
              background: 'rgba(255,255,255,0.03)',
              borderRadius: '10px',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '13px', fontWeight: 500 }}>
              Also extend plan by 30 days?
            </span>
            <button
              onClick={() => setExtendPlan(!extendPlan)}
              style={{
                width: '44px',
                height: '24px',
                borderRadius: '12px',
                border: 'none',
                cursor: 'pointer',
                position: 'relative',
                transition: 'background 0.2s',
                background: extendPlan ? '#34C759' : 'rgba(255,255,255,0.15)',
                flexShrink: 0,
              }}
            >
              <span
                style={{
                  position: 'absolute',
                  top: '2px',
                  left: extendPlan ? '22px' : '2px',
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  background: '#FFFFFF',
                  transition: 'left 0.2s',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                }}
              />
            </button>
          </div>
        )}

        {/* Notes */}
        <div style={{ marginBottom: '20px' }}>
          <label style={labelStyle}>Notes <span style={{ fontWeight: 400, opacity: 0.6 }}>(optional)</span></label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add a note..."
            style={inputStyle}
          />
        </div>

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          style={{
            width: '100%',
            padding: '12px 24px',
            borderRadius: '12px',
            border: 'none',
            cursor: isSubmitting ? 'not-allowed' : 'pointer',
            background: isSubmitting ? 'rgba(230,57,70,0.6)' : '#E63946',
            color: '#FFFFFF',
            fontSize: '14px',
            fontWeight: 700,
            transition: 'all 0.15s',
            fontFamily: '-apple-system, system-ui, sans-serif',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
          }}
        >
          {isSubmitting && (
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              style={{ animation: 'spin 0.6s linear infinite' }}
            >
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeDasharray="31.4 31.4" />
            </svg>
          )}
          {isSubmitting ? 'Recording...' : 'Record Payment'}
        </button>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>

      {/* ── Payment History Table ─────────────────────────────────────── */}
      <div
        style={{
          marginTop: '20px',
          background: '#111111',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: '16px',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between"
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <div className="flex items-center gap-2">
            <Calendar style={{ width: '16px', height: '16px', color: 'rgba(255,255,255,0.4)' }} />
            <h3 style={{ color: '#FFFFFF', fontSize: '15px', fontWeight: 700 }}>Payment History</h3>
          </div>
          {payments.length > 0 && (
            <span
              style={{
                fontSize: '12px',
                color: 'rgba(255,255,255,0.3)',
                fontWeight: 500,
              }}
            >
              {payments.length} {payments.length === 1 ? 'payment' : 'payments'}
            </span>
          )}
        </div>

        {/* Empty State */}
        {payments.length === 0 && (
          <div
            className="flex flex-col items-center justify-center"
            style={{ padding: '48px 20px' }}
          >
            <div
              className="flex items-center justify-center mb-4"
              style={{
                width: '72px',
                height: '72px',
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.04)',
              }}
            >
              <CreditCard style={{ width: '32px', height: '32px', color: 'rgba(255,255,255,0.15)' }} />
            </div>
            <p
              style={{
                color: 'rgba(255,255,255,0.6)',
                fontSize: '15px',
                fontWeight: 600,
                marginBottom: '4px',
              }}
            >
              No payments recorded
            </p>
            <p
              style={{
                color: 'rgba(255,255,255,0.3)',
                fontSize: '13px',
              }}
            >
              Record your first payment above
            </p>
          </div>
        )}

        {/* Table */}
        {payments.length > 0 && (
          <>
            {/* Table Header Row */}
            <div
              className="hidden sm:grid"
              style={{
                gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1.5fr',
                padding: '10px 20px',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
                background: 'rgba(255,255,255,0.02)',
              }}
            >
              {['Restaurant', 'Amount', 'Type', 'Method', 'Date', 'Notes'].map((h) => (
                <div
                  key={h}
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    color: 'rgba(255,255,255,0.3)',
                  }}
                >
                  {h}
                </div>
              ))}
            </div>

            {/* Rows */}
            <div>
              {sortedPayments.map((p) => (
                <div
                  key={p.id}
                  className="hidden sm:grid"
                  style={{
                    gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1.5fr',
                    padding: '14px 20px',
                    borderBottom: '1px solid rgba(255,255,255,0.04)',
                    borderLeft: `3px solid ${p.type === 'SETUP' ? '#E63946' : '#34C759'}`,
                    transition: 'background 0.1s',
                    cursor: 'default',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.02)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent'
                  }}
                >
                  {/* Restaurant */}
                  <div className="flex flex-col justify-center">
                    <span style={{ color: '#FFFFFF', fontSize: '14px', fontWeight: 600, lineHeight: 1.3 }}>
                      {p.restaurant}
                    </span>
                    <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: '12px' }}>
                      {p.email}
                    </span>
                  </div>

                  {/* Amount */}
                  <div
                    className="flex items-center"
                    style={{ color: '#FFFFFF', fontSize: '14px', fontWeight: 700 }}
                  >
                    {formatINR(p.amount)}
                  </div>

                  {/* Type Badge */}
                  <div className="flex items-center">
                    <span
                      style={{
                        padding: '3px 10px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: 700,
                        letterSpacing: '0.04em',
                        background:
                          p.type === 'SETUP'
                            ? 'rgba(230,57,70,0.15)'
                            : 'rgba(52,199,89,0.15)',
                        color: p.type === 'SETUP' ? '#E63946' : '#34C759',
                      }}
                    >
                      {p.type === 'SETUP' ? 'SETUP' : 'SUB'}
                    </span>
                  </div>

                  {/* Method Badge */}
                  <div className="flex items-center">
                    <span
                      style={{
                        padding: '3px 10px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: 700,
                        letterSpacing: '0.04em',
                        background:
                          p.method === 'UPI'
                            ? 'rgba(59,130,246,0.15)'
                            : 'rgba(255,149,0,0.15)',
                        color: p.method === 'UPI' ? '#3B82F6' : '#FF9500',
                      }}
                    >
                      {p.method}
                    </span>
                  </div>

                  {/* Date */}
                  <div
                    className="flex items-center"
                    style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px' }}
                  >
                    {new Date(p.date).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </div>

                  {/* Notes */}
                  <div
                    className="flex items-center"
                    style={{
                      color: 'rgba(255,255,255,0.3)',
                      fontSize: '12px',
                      fontStyle: 'italic',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {p.notes || '—'}
                  </div>
                </div>
              ))}
            </div>

            {/* Mobile Cards */}
            <div className="sm:hidden">
              {sortedPayments.map((p) => (
                <div
                  key={`mobile-${p.id}`}
                  style={{
                    padding: '14px 16px',
                    borderBottom: '1px solid rgba(255,255,255,0.04)',
                    borderLeft: `3px solid ${p.type === 'SETUP' ? '#E63946' : '#34C759'}`,
                  }}
                >
                  <div className="flex items-start justify-between" style={{ marginBottom: '8px' }}>
                    <div>
                      <div style={{ color: '#FFFFFF', fontSize: '14px', fontWeight: 600 }}>
                        {p.restaurant}
                      </div>
                      <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: '12px' }}>
                        {p.email}
                      </div>
                    </div>
                    <div style={{ color: '#FFFFFF', fontSize: '16px', fontWeight: 700 }}>
                      {formatINR(p.amount)}
                    </div>
                  </div>
                  <div className="flex items-center gap-2" style={{ flexWrap: 'wrap' }}>
                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: '5px',
                        fontSize: '10px',
                        fontWeight: 700,
                        letterSpacing: '0.04em',
                        background: p.type === 'SETUP' ? 'rgba(230,57,70,0.15)' : 'rgba(52,199,89,0.15)',
                        color: p.type === 'SETUP' ? '#E63946' : '#34C759',
                      }}
                    >
                      {p.type === 'SETUP' ? 'SETUP' : 'SUB'}
                    </span>
                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: '5px',
                        fontSize: '10px',
                        fontWeight: 700,
                        letterSpacing: '0.04em',
                        background: p.method === 'UPI' ? 'rgba(59,130,246,0.15)' : 'rgba(255,149,0,0.15)',
                        color: p.method === 'UPI' ? '#3B82F6' : '#FF9500',
                      }}
                    >
                      {p.method}
                    </span>
                    <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px' }}>
                      {new Date(p.date).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                  {p.notes && (
                    <div
                      style={{
                        color: 'rgba(255,255,255,0.3)',
                        fontSize: '12px',
                        fontStyle: 'italic',
                        marginTop: '6px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {p.notes}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Mobile bottom padding for bottom nav */}
      <div className="md:hidden" style={{ height: '80px' }} />
    </div>
  )
}
