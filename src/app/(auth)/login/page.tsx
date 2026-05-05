'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { Eye, EyeOff, AlertCircle, Loader2, X, Star, ShieldCheck } from 'lucide-react'
import Link from 'next/link'
import { env } from '@/lib/env'

/* ── Particle data (deterministic on server, enhanced on client) ── */
function generateParticles() {
  return Array.from({ length: 15 }, (_, i) => ({
    id: i,
    left: `${((i * 37 + 13) % 100)}%`,
    size: 2 + ((i * 7 + 3) % 5) * 0.4,
    duration: 14 + ((i * 11 + 5) % 18),
    delay: ((i * 23 + 7) % 12),
  }))
}
const PARTICLES = generateParticles()

/* ── Password strength calculator ── */
function getPasswordStrength(pw: string): { score: number; label: string; color: string; bgColor: string } {
  if (!pw) return { score: 0, label: '', color: '#E5E5EA', bgColor: '#E5E5EA' }
  let score = 0
  if (pw.length >= 6) score++
  if (pw.length >= 10) score++
  if (/[A-Z]/.test(pw)) score++
  if (/[0-9]/.test(pw)) score++
  if (/[^A-Za-z0-9]/.test(pw)) score++

  if (score <= 2) return { score: 1, label: 'Weak', color: '#FF3B30', bgColor: '#FFF5F5' }
  if (score <= 3) return { score: 2, label: 'Fair', color: '#FF9500', bgColor: '#FFF8F0' }
  return { score: 3, label: 'Strong', color: '#34C759', bgColor: '#F0FFF5' }
}

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [errorVisible, setErrorVisible] = useState(false)
  const [loading, setLoading] = useState(false)
  const [focusedField, setFocusedField] = useState<'email' | 'password' | null>(null)
  const [rememberMe, setRememberMe] = useState(false)
  const [errorDismissed, setErrorDismissed] = useState(false)

  /* ── Load remembered email on mount ── */
  useEffect(() => {
    try {
      const saved = localStorage.getItem('menumate-remember-email')
      if (saved) {
        setEmail(saved)
        setRememberMe(true)
      }
    } catch {
      // localStorage not available
    }
  }, [])

  /* ── Sync error visibility with error state ── */
  useEffect(() => {
    if (error) {
      setErrorDismissed(false)
      setErrorVisible(true)
    }
  }, [error])

  const dismissError = useCallback(() => {
    setErrorDismissed(true)
    setErrorVisible(false)
    // Clear actual error after animation completes
    setTimeout(() => {
      setError('')
      setErrorDismissed(false)
    }, 300)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (loading) return // Prevent double-submission
    setError('')
    setErrorVisible(false)
    setErrorDismissed(false)
    setLoading(true)

    /* Persist / clear remembered email */
    try {
      if (rememberMe) {
        localStorage.setItem('menumate-remember-email', email)
      } else {
        localStorage.removeItem('menumate-remember-email')
      }
    } catch {
      // localStorage not available
    }

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError('Invalid email or password')
        return
      }

      // Fetch session to get user role
      const res = await fetch('/api/auth/session')
      const session = await res.json()

      if (session?.user?.role === 'ADMIN') {
        router.push('/admin')
      } else {
        router.push('/dashboard')
      }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  /* ── Password strength ── */
  const pwStrength = getPasswordStrength(password)

  /* ── Shared styles ── */
  const inputStyle: React.CSSProperties = {
    height: 52,
    background: '#FFFFFF',
    border: '1.5px solid #E5E5EA',
    borderRadius: 12,
    padding: '0 16px',
    fontSize: 16,
    color: '#1A1A1A',
    width: '100%',
    outline: 'none',
    transition: 'border-color 250ms ease, box-shadow 400ms ease',
    boxSizing: 'border-box',
  }

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>, field: 'email' | 'password') => {
    setFocusedField(field)
    e.currentTarget.style.borderColor = '#E63946'
    // Brief pulse then settle to steady glow
    e.currentTarget.style.boxShadow = '0 0 0 5px rgba(230,57,70,0.18)'
    setTimeout(() => {
      if (document.activeElement === e.currentTarget) {
        e.currentTarget.style.boxShadow = '0 0 0 4px rgba(230,57,70,0.10)'
      }
    }, 300)
  }

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setFocusedField(null)
    e.currentTarget.style.borderColor = '#E5E5EA'
    e.currentTarget.style.boxShadow = 'none'
  }

  const labelStyle = (field: 'email' | 'password'): React.CSSProperties => ({
    fontSize: 11,
    fontWeight: 700,
    color: focusedField === field ? '#E63946' : '#AEAEB2',
    letterSpacing: '0.08em',
    marginBottom: 6,
    display: 'block',
    transition: 'color 300ms ease',
  })

  return (
    <main style={{ display: 'flex', minHeight: '100dvh' }}>
      {/* ═══════════════════════════════════════════════════
          LEFT PANEL — dark branding (hidden on mobile)
          ═══════════════════════════════════════════════════ */}
      <div
        className="hidden lg:flex"
        style={{
          width: '50%',
          background: 'linear-gradient(135deg, #0A0A0A 0%, #1A0A08 100%)',
          position: 'relative',
          overflow: 'hidden',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: 60,
        }}
      >
        {/* Background glow */}
        <div
          style={{
            position: 'absolute',
            top: -100,
            left: -100,
            width: 600,
            height: 600,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(230,57,70,0.15), transparent)',
            pointerEvents: 'none',
          }}
        />

        {/* Content */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: 16,
                background: 'linear-gradient(135deg, #E63946, #C1303C)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span style={{ fontSize: 28, fontWeight: 800, color: '#FFFFFF' }}>M</span>
            </div>
            <span style={{ fontSize: 32, fontWeight: 800, color: '#FFFFFF' }}>MenuMate</span>
          </div>

          {/* Heading */}
          <h2
            style={{
              fontSize: 28,
              fontWeight: 700,
              color: '#FFFFFF',
              lineHeight: 1.3,
              maxWidth: 320,
              marginTop: 60,
            }}
          >
            The smartest way to run your restaurant
          </h2>
          <p
            style={{
              fontSize: 16,
              color: 'rgba(255,255,255,0.5)',
              marginTop: 16,
            }}
          >
            QR menus. WhatsApp orders. Loyal customers.
          </p>

          {/* Feature pills */}
          <div style={{ marginTop: 40, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { icon: '⚡', text: 'Orders in your WhatsApp in 3 seconds' },
              { icon: '📱', text: 'No app download needed' },
              { icon: '🎁', text: 'Loyalty stamps built in' },
            ].map((pill) => (
              <div
                key={pill.text}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 100,
                  padding: '10px 16px',
                  width: 'fit-content',
                }}
              >
                <span style={{ fontSize: 16 }}>{pill.icon}</span>
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>{pill.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom branding */}
        <span
          style={{
            position: 'absolute',
            bottom: 32,
            left: 60,
            fontSize: 12,
            color: 'rgba(255,255,255,0.2)',
          }}
        >
          Powered by MenuMate
        </span>
      </div>

      {/* ═══════════════════════════════════════════════════
          RIGHT PANEL — login form
          ═══════════════════════════════════════════════════ */}
      <div
        style={{
          flex: 1,
          background: '#FAFAFA',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px 20px',
          minHeight: '100dvh',
          boxSizing: 'border-box',
          position: 'relative',
          overflowY: 'auto',
        }}
      >
        {/* ── Animated background particles ── */}
        {PARTICLES.map((p) => (
          <div
            key={p.id}
            className="login-particle"
            style={{
              position: 'absolute',
              left: p.left,
              bottom: -10,
              width: p.size,
              height: p.size,
              borderRadius: '50%',
              background: '#1A1A1A',
              pointerEvents: 'none',
              animation: `login-float-up ${p.duration}s ${p.delay}s linear infinite`,
            }}
          />
        ))}

        <div
          style={{ width: '100%', maxWidth: 380, boxSizing: 'border-box' }}
        >
          {/* Mobile-only logo — stagger 1 */}
          <div
            className="login-stagger-1 flex items-center gap-2 mb-8 lg:hidden"
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                background: 'linear-gradient(135deg, #E63946, #C1303C)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span style={{ fontSize: 18, fontWeight: 800, color: '#FFFFFF' }}>M</span>
            </div>
            <span style={{ fontSize: 20, fontWeight: 800, color: '#1A1A1A' }}>MenuMate</span>
          </div>

          {/* Heading — stagger 2 */}
          <div className="login-stagger-2">
            <h1
              style={{
                fontSize: 28,
                fontWeight: 800,
                color: '#1A1A1A',
                letterSpacing: '-0.02em',
                lineHeight: 1.2,
              }}
            >
              Welcome back
            </h1>
            <p
              style={{
                fontSize: 14,
                color: '#6E6E73',
                marginTop: 4,
              }}
            >
              Sign in to manage your restaurant
            </p>
          </div>

          {/* Form — stagger 3 */}
          <form onSubmit={handleSubmit} className="login-stagger-3" style={{ marginTop: 32 }}>
            {/* Email */}
            <div>
              <label htmlFor="email" style={labelStyle('email')}>
                EMAIL ADDRESS
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@restaurant.com"
                required
                autoComplete="email"
                style={inputStyle}
                onFocus={(e) => handleFocus(e, 'email')}
                onBlur={(e) => handleBlur(e)}
              />
            </div>

            {/* Password */}
            <div style={{ marginTop: 16 }}>
              <label htmlFor="password" style={labelStyle('password')}>
                PASSWORD
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  autoComplete="current-password"
                  style={{ ...inputStyle, paddingRight: 48 }}
                  onFocus={(e) => handleFocus(e, 'password')}
                  onBlur={(e) => handleBlur(e)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="login-eye-toggle"
                  style={{
                    position: 'absolute',
                    right: 4,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: 44,
                    height: 44,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#AEAEB2',
                    transition: 'color 250ms ease, opacity 250ms ease',
                    opacity: 0.7,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = '#1A1A1A'
                    e.currentTarget.style.opacity = '1'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = '#AEAEB2'
                    e.currentTarget.style.opacity = '0.7'
                  }}
                >
                  {showPassword ? (
                    <EyeOff style={{ width: 18, height: 18 }} />
                  ) : (
                    <Eye style={{ width: 18, height: 18 }} />
                  )}
                </button>
              </div>

              {/* ── Password strength indicator ── */}
              {password.length > 0 && (
                <div
                  className="login-pw-strength-enter"
                  style={{ marginTop: 8 }}
                >
                  <div
                    style={{
                      display: 'flex',
                      gap: 4,
                      height: 4,
                    }}
                  >
                    {[1, 2, 3].map((level) => (
                      <div
                        key={level}
                        style={{
                          flex: 1,
                          height: 4,
                          borderRadius: 100,
                          background: pwStrength.score >= level ? pwStrength.color : '#E5E5EA',
                          transition: 'background 300ms ease',
                        }}
                      />
                    ))}
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginTop: 4,
                    }}
                  >
                    <span style={{ fontSize: 11, fontWeight: 600, color: pwStrength.color, transition: 'color 300ms ease' }}>
                      {pwStrength.label}
                    </span>
                    <span style={{ fontSize: 11, color: '#AEAEB2' }}>
                      {password.length}/8+ chars
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Remember me row */}
            <div
              style={{
                marginTop: 16,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <label
                htmlFor="remember-me"
                className="login-remember-label"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  cursor: 'pointer',
                  userSelect: 'none',
                }}
              >
                <div
                  className="login-remember-checkbox"
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: 5,
                    border: rememberMe ? 'none' : '1.5px solid #C7C7CC',
                    background: rememberMe ? '#E63946' : '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'background 200ms ease, border-color 200ms ease, transform 150ms ease',
                    transform: rememberMe ? 'scale(1)' : 'scale(1)',
                    flexShrink: 0,
                  }}
                >
                  {rememberMe && (
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ marginLeft: 0 }}>
                      <path d="M2.5 6L5 8.5L9.5 3.5" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
                <input
                  id="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  style={{ display: 'none' }}
                />
                <span style={{ fontSize: 13, color: '#6E6E73', fontWeight: 500 }}>Remember me</span>
              </label>
            </div>

            {/* Error — enhanced with slide-in animation and dismiss */}
            {error && !errorDismissed && (
              <div
                className={`login-error-enter ${errorVisible ? 'login-error-visible' : ''}`}
                style={{
                  marginTop: 12,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  background: '#FFF5F5',
                  border: '1px solid rgba(255,59,48,0.15)',
                  borderRadius: 12,
                  padding: '12px 14px',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: 3,
                    height: '100%',
                    background: '#FF3B30',
                    borderRadius: '0 4px 4px 0',
                  }}
                />
                <AlertCircle style={{ width: 18, height: 18, color: '#FF3B30', flexShrink: 0 }} />
                <span style={{ fontSize: 13, color: '#FF3B30', flex: 1, lineHeight: 1.4 }}>{error}</span>
                <button
                  type="button"
                  onClick={dismissError}
                  aria-label="Dismiss error"
                  className="login-error-dismiss"
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 6,
                    color: '#FF3B30',
                    opacity: 0.6,
                    transition: 'opacity 200ms ease, background 200ms ease',
                    flexShrink: 0,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.opacity = '1'
                    e.currentTarget.style.background = 'rgba(255,59,48,0.08)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.opacity = '0.6'
                    e.currentTarget.style.background = 'none'
                  }}
                >
                  <X style={{ width: 14, height: 14 }} />
                </button>
              </div>
            )}

            {/* Sign In Button — enhanced loading state */}
            <button
              type="submit"
              disabled={loading}
              className="login-submit-btn"
              style={{
                width: '100%',
                height: 52,
                marginTop: 24,
                background: loading ? '#2C2C2E' : '#1A1A1A',
                borderRadius: 100,
                color: '#FFFFFF',
                fontSize: 15,
                fontWeight: 600,
                border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                transition: 'background 200ms ease, transform 200ms ease, opacity 200ms ease',
                transform: 'scale(1)',
                position: 'relative',
                overflow: 'hidden',
                opacity: loading ? 0.8 : 1,
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.background = '#2C2C2E'
                  e.currentTarget.style.transform = 'scale(1.02)'
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  e.currentTarget.style.background = '#1A1A1A'
                  e.currentTarget.style.transform = 'scale(1)'
                }
              }}
              onMouseDown={(e) => {
                if (!loading) e.currentTarget.style.transform = 'scale(0.98)'
              }}
              onMouseUp={(e) => {
                if (!loading) e.currentTarget.style.transform = 'scale(1.02)'
              }}
            >
              {/* Shimmer overlay */}
              {!loading && <span className="login-btn-shimmer" />}
              {loading ? (
                <>
                  <Loader2 style={{ width: 18, height: 18 }} className="login-spinner-icon" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Divider + WhatsApp link — stagger 4 */}
          <div className="login-stagger-4" style={{ marginTop: 24 }}>
            {/* "or" divider */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <div
                style={{
                  flex: 1,
                  height: 1,
                  background: '#E5E5EA',
                }}
              />
              <span style={{ fontSize: 13, color: '#AEAEB2' }}>or</span>
              <div
                style={{
                  flex: 1,
                  height: 1,
                  background: '#E5E5EA',
                }}
              />
            </div>

            {/* WhatsApp CTA */}
            <div
              style={{
                textAlign: 'center',
                marginTop: 20,
              }}
            >
              <span style={{ fontSize: 14, color: '#6E6E73' }}>New restaurant? </span>
              <Link
                href={`https://wa.me/${env.WHATSAPP_CONTACT_NUMBER}?text=${encodeURIComponent('Hi, I want to know more about MenuMate')}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontSize: 14,
                  color: '#E63946',
                  fontWeight: 600,
                  textDecoration: 'none',
                }}
              >
                Get started on WhatsApp →
              </Link>
            </div>

            {/* ── Social proof ── */}
            <div
              className="login-social-proof"
              style={{
                marginTop: 32,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 8,
              }}
            >
              {/* Stars */}
              <div style={{ display: 'flex', gap: 2 }}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    style={{
                      width: 16,
                      height: 16,
                      fill: '#FF9500',
                      color: '#FF9500',
                    }}
                  />
                ))}
              </div>
              {/* Text */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <ShieldCheck style={{ width: 14, height: 14, color: '#AEAEB2' }} />
                <span style={{ fontSize: 12, color: '#AEAEB2', fontWeight: 500 }}>
                  Trusted by 50+ restaurants across India
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════
          Global CSS Animations
          ═══════════════════════════════════════════════════ */}
      <style jsx global>{`
        /* ── Floating particles ── */
        @keyframes login-float-up {
          0% {
            transform: translateY(0) translateX(0);
            opacity: 0;
          }
          10% {
            opacity: 0.04;
          }
          90% {
            opacity: 0.04;
          }
          100% {
            transform: translateY(-110vh) translateX(20px);
            opacity: 0;
          }
        }

        .login-particle {
          will-change: transform, opacity;
        }

        /* ── Staggered page entrance ── */
        @keyframes login-fade-up {
          from {
            opacity: 0;
            transform: translateY(16px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .login-stagger-1 {
          animation: login-fade-up 0.6s cubic-bezier(0.22, 1, 0.36, 1) 0.1s both;
        }
        .login-stagger-2 {
          animation: login-fade-up 0.6s cubic-bezier(0.22, 1, 0.36, 1) 0.22s both;
        }
        .login-stagger-3 {
          animation: login-fade-up 0.6s cubic-bezier(0.22, 1, 0.36, 1) 0.36s both;
        }
        .login-stagger-4 {
          animation: login-fade-up 0.6s cubic-bezier(0.22, 1, 0.36, 1) 0.48s both;
        }

        /* ── Error shake ── */
        @keyframes login-shake {
          0%, 100% { transform: translateX(0); }
          15% { transform: translateX(-6px); }
          30% { transform: translateX(5px); }
          45% { transform: translateX(-4px); }
          60% { transform: translateX(3px); }
          75% { transform: translateX(-1px); }
        }

        /* ── Error slide-in animation ── */
        @keyframes login-error-slide-in {
          0% {
            opacity: 0;
            transform: translateY(-8px) scaleY(0.95);
            max-height: 0;
            margin-top: 0;
            padding-top: 0;
            padding-bottom: 0;
          }
          60% {
            transform: translateY(0) scaleY(1);
            max-height: 80px;
            margin-top: 12px;
          }
          80% {
            opacity: 1;
            transform: translateX(-4px);
          }
          100% {
            opacity: 1;
            transform: translateX(0);
            max-height: 80px;
            margin-top: 12px;
          }
        }

        .login-error-enter {
          animation: login-error-slide-in 0.45s cubic-bezier(0.22, 1, 0.36, 1) both;
        }

        .login-error-visible.login-error-enter {
          animation: login-shake 0.5s cubic-bezier(0.36, 0.07, 0.19, 0.97) 0.3s both,
                       login-error-slide-in 0.45s cubic-bezier(0.22, 1, 0.36, 1) both;
        }

        .login-error-dismiss {
          -webkit-tap-highlight-color: transparent;
        }

        /* ── Password strength enter ── */
        @keyframes login-pw-strength-enter {
          from {
            opacity: 0;
            transform: translateY(-4px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .login-pw-strength-enter {
          animation: login-pw-strength-enter 0.25s ease-out both;
        }

        /* ── Remember me checkbox animation ── */
        .login-remember-checkbox {
          transition: background 200ms ease, border-color 200ms ease, transform 150ms ease, box-shadow 200ms ease;
        }

        .login-remember-label:hover .login-remember-checkbox {
          box-shadow: 0 0 0 3px rgba(230,57,70,0.12);
        }

        .login-remember-label:active .login-remember-checkbox {
          transform: scale(0.92);
        }

        /* ── Social proof animation ── */
        @keyframes login-social-fade {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .login-social-proof {
          animation: login-social-fade 0.5s ease-out 0.7s both;
        }

        /* ── Submit button shimmer ── */
        @keyframes login-shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(200%);
          }
        }

        .login-submit-btn {
          -webkit-tap-highlight-color: transparent;
        }

        .login-submit-btn:hover .login-btn-shimmer {
          animation: login-shimmer 0.8s ease-in-out;
        }

        .login-btn-shimmer {
          position: absolute;
          top: 0;
          left: 0;
          width: 50%;
          height: 100%;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255, 255, 255, 0.12),
            transparent
          );
          transform: translateX(-100%);
          pointer-events: none;
        }

        /* ── Loading spinner smooth spin ── */
        @keyframes login-spinner-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .login-spinner-icon {
          animation: login-spinner-spin 0.8s linear infinite;
        }

        /* ── Eye toggle smooth transition ── */
        .login-eye-toggle svg {
          transition: transform 200ms ease, opacity 200ms ease;
        }

        .login-eye-toggle:hover svg {
          transform: scale(1.08);
        }
      `}</style>
    </main>
  )
}
