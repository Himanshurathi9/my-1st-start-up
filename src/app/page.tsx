'use client'

import { useState, useEffect, useRef, useCallback, Fragment } from 'react'
import Link from 'next/link'
import QRCode from 'qrcode'
import {
  UtensilsCrossed,
  QrCode,
  MessageCircle,
  Award,
  ArrowRight,
  Check,
  X,
  Star,
  ChevronDown,
  Menu as MenuIcon,
  X as XIcon,
  Zap,
  BarChart3,
  Smartphone,
  Image as ImageIcon,
  ClipboardList,
  ArrowUp,
  Sun,
  Moon,
  Cookie,
} from 'lucide-react'

/* ── WhatsApp helper (uses env.ts — NO hardcoded numbers) ── */
import { env } from '@/lib/env'
const waLink = (msg: string) =>
  `https://wa.me/${env.WHATSAPP_CONTACT_NUMBER}?text=${encodeURIComponent(msg)}`

/* ── Design tokens (CSS variable-backed for theme switching) ── */
const T = {
  bg: 'var(--mm-bg, #0A0A0A)',
  surface: 'var(--mm-surface, #111111)',
  card: 'var(--mm-card, #1A1A1A)',
  border: 'var(--mm-border, rgba(255,255,255,0.08))',
  borderHover: 'var(--mm-border-hover, rgba(230,57,70,0.3))',
  textPrimary: 'var(--mm-text-primary, #FFFFFF)',
  textSecondary: 'var(--mm-text-secondary, rgba(255,255,255,0.6))',
  textMuted: 'var(--mm-text-muted, rgba(255,255,255,0.35))',
  accent: 'var(--mm-accent, #E63946)',
  accentGlow: 'var(--mm-accent-glow, rgba(230,57,70,0.15))',
  green: 'var(--mm-green, #34C759)',
  waGreen: 'var(--mm-wa-green, #25D366)',
  sectionAlt: 'var(--mm-section-alt, #0D0D0D)',
  navBg: 'var(--mm-nav-bg, rgba(10,10,10,0.8))',
  navBgScroll: 'var(--mm-nav-bg-scroll, rgba(10,10,10,0.95))',
  btnGhostBg: 'var(--mm-btn-ghost-bg, rgba(255,255,255,0.06))',
  btnGhostBorder: 'var(--mm-btn-ghost-border, rgba(255,255,255,0.12))',
  btnGhostHover: 'var(--mm-btn-ghost-hover, rgba(255,255,255,0.1))',
  cardBorder: 'var(--mm-card-border, rgba(255,255,255,0.06))',
  cardBorderHover: 'var(--mm-card-border-hover, rgba(230,57,70,0.2))',
  iconMuted: 'var(--mm-icon-muted, rgba(255,255,255,0.5))',
  overlayBg: 'var(--mm-overlay-bg, rgba(10,10,10,0.98))',
  heroRadial1: 'var(--mm-hero-radial1, rgba(230,57,70,0.15))',
  heroRadial2: 'var(--mm-hero-radial2, rgba(230,57,70,0.08))',
  heroRadial3: 'var(--mm-hero-radial3, rgba(52,199,89,0.05))',
  badgeBg: 'var(--mm-badge-bg, rgba(230,57,70,0.1))',
  badgeBorder: 'var(--mm-badge-border, rgba(230,57,70,0.3))',
  trustBg: 'var(--mm-trust-bg, rgba(255,255,255,0.04))',
  trustBorder: 'var(--mm-trust-border, rgba(255,255,255,0.06))',
  trustText: 'var(--mm-trust-text, rgba(255,255,255,0.4))',
  problemBg: 'var(--mm-problem-bg, rgba(255,59,48,0.05))',
  problemBorder: 'var(--mm-problem-border, rgba(255,59,48,0.15))',
  solutionBg: 'var(--mm-solution-bg, rgba(52,199,89,0.05))',
  solutionBorder: 'var(--mm-solution-border, rgba(52,199,89,0.15))',
}

/* ═══════════════════════════════════════════════════════════
   HOOKS
   ═══════════════════════════════════════════════════════════ */
function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setInView(true)
          obs.disconnect()
        }
      },
      { threshold },
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [threshold])
  return { ref, inView }
}

function useCountUp(target: number, duration = 2000) {
  const [count, setCount] = useState(0)
  const [done, setDone] = useState(false)
  const { ref, inView } = useInView(0.3)
  const hasStarted = useRef(false)

  useEffect(() => {
    if (!inView || hasStarted.current) return
    hasStarted.current = true
    const startTime = performance.now()
    const step = (now: number) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setCount(Math.round(eased * target))
      if (progress < 1) {
        requestAnimationFrame(step)
      } else {
        setDone(true)
      }
    }
    requestAnimationFrame(step)
  }, [inView, target, duration])

  return { count, done, ref }
}

function useScrollDirection() {
  const [dir, setDir] = useState<'up' | 'down'>('up')
  const [scrollY, setScrollY] = useState(0)
  useEffect(() => {
    let prev = window.scrollY
    const onScroll = () => {
      const curr = window.scrollY
      setScrollY(curr)
      setDir(curr > prev ? 'down' : 'up')
      prev = curr
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  return { dir, scrollY }
}

function useLandingTheme() {
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    if (typeof window === 'undefined') return 'dark'
    const stored = localStorage.getItem('menumate-landing-theme')
    return stored === 'light' ? 'light' : 'dark'
  })

  useEffect(() => {
    document.documentElement.classList.toggle('light-mode', theme === 'light')
  }, [theme])

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark'
      localStorage.setItem('menumate-landing-theme', next)
      return next
    })
  }, [])

  return { theme, toggleTheme }
}

/* ═══════════════════════════════════════════════════════════
   ANIMATED SECTION WRAPPER
   ═══════════════════════════════════════════════════════════ */
function AnimatedSection({
  children,
  className = '',
  delay = 0,
}: {
  children: React.ReactNode
  className?: string
  delay?: number
}) {
  const { ref, inView } = useInView(0.1)
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? 'translateY(0)' : 'translateY(32px)',
        transition: `opacity 0.7s cubic-bezier(0,0,0.2,1) ${delay}ms, transform 0.7s cubic-bezier(0,0,0.2,1) ${delay}ms`,
      }}
    >
      {children}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════
   SECTION LABEL COMPONENT
   ═══════════════════════════════════════════════════════════ */
function SectionLabel({ text }: { text: string }) {
  return (
    <span
      style={{
        fontSize: '12px',
        fontWeight: 700,
        color: T.accent,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
      }}
    >
      {text}
    </span>
  )
}

/* ═══════════════════════════════════════════════════════════
   SECTION 1 — NAVBAR
   ═══════════════════════════════════════════════════════════ */
function Navbar() {
  const { dir, scrollY } = useScrollDirection()
  const [mobileOpen, setMobileOpen] = useState(false)
  const { theme, toggleTheme } = useLandingTheme()
  const [activeSection, setActiveSection] = useState('')
  const hidden = dir === 'down' && scrollY > 200

  // Track which section is currently in view for active link indicator
  useEffect(() => {
    const sectionIds = ['how-it-works', 'features', 'pricing', 'faq', 'demo']
    const observers: IntersectionObserver[] = []
    sectionIds.forEach((id) => {
      const el = document.getElementById(id)
      if (!el) return
      const obs = new IntersectionObserver(
        ([e]) => {
          if (e.isIntersecting) setActiveSection(id)
        },
        { threshold: 0.3, rootMargin: '-80px 0px -40% 0px' },
      )
      obs.observe(el)
      observers.push(obs)
    })
    return () => observers.forEach((o) => o.disconnect())
  }, [])

  const links = [
    { label: 'How it Works', href: '#how-it-works' },
    { label: 'Features', href: '#features' },
    { label: 'Pricing', href: '#pricing' },
    { label: 'FAQ', href: '#faq' },
    { label: 'Demo', href: '#demo' },
  ]

  return (
    <>
      <nav
        style={{
          position: 'fixed',
          top: hidden ? -80 : 0,
          left: 0,
          right: 0,
          zIndex: 100,
          height: 64,
          background: scrollY > 50 ? T.navBgScroll : T.navBg,
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid var(--mm-card-border, rgba(255,255,255,0.06))',
          boxShadow: scrollY > 50 ? '0 4px 20px rgba(0,0,0,0.3)' : 'none',
          padding: '0 clamp(16px, 5vw, 40px)',
          transition: 'top 0.3s ease, background 0.3s ease, box-shadow 0.3s ease',
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            margin: '0 auto',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          {/* Logo */}
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <UtensilsCrossed size={20} color={T.accent} strokeWidth={2.2} />
            <span
              style={{
                fontWeight: 700,
                fontSize: 18,
                color: T.textPrimary,
                letterSpacing: '-0.03em',
              }}
            >
              MenuMate
            </span>
          </Link>

          {/* Desktop links */}
          <div className="hidden md:flex" style={{ alignItems: 'center', gap: 32 }}>
            {links.map((l) => {
              const isActive = activeSection === l.href.replace('#', '')
              return (
                <a
                  key={l.href}
                  href={l.href}
                  style={{
                    fontSize: 14,
                    color: isActive ? T.textPrimary : T.textSecondary,
                    textDecoration: 'none',
                    transition: 'color 150ms, border-color 200ms ease',
                    borderBottom: `2px solid ${isActive ? T.accent : 'transparent'}`,
                    paddingBottom: 4,
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = T.textPrimary)}
                  onMouseLeave={(e) => (e.currentTarget.style.color = isActive ? T.textPrimary : T.textSecondary)}
                >
                  {l.label}
                </a>
              )
            })}
          </div>

          {/* Desktop CTAs */}
          <div className="hidden md:flex" style={{ alignItems: 'center', gap: 12 }}>
            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                border: `1px solid var(--mm-btn-ghost-border, rgba(255,255,255,0.12))`,
                background: 'var(--mm-btn-ghost-bg, rgba(255,255,255,0.06))',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background 150ms, border-color 150ms',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--mm-btn-ghost-hover, rgba(255,255,255,0.1))')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--mm-btn-ghost-bg, rgba(255,255,255,0.06))')}
            >
              {theme === 'dark' ? (
                <Sun size={16} color={T.textSecondary} />
              ) : (
                <Moon size={16} color={T.textSecondary} />
              )}
            </button>
            <Link
              href="/login"
              style={{
                fontSize: 14,
                color: T.textPrimary,
                textDecoration: 'none',
                fontWeight: 500,
              }}
            >
              Log In
            </Link>
            <button
              onClick={() => window.open(waLink('Hi, I want to know more about MenuMate'), '_blank')}
              style={{
                fontSize: 14,
                fontWeight: 500,
                color: '#FFFFFF',
                background: T.accent,
                border: 'none',
                borderRadius: 100,
                padding: '8px 20px',
                cursor: 'pointer',
                boxShadow: '0 0 20px rgba(230,57,70,0.3)',
                transition: 'filter 150ms',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.filter = 'brightness(1.1)')}
              onMouseLeave={(e) => (e.currentTarget.style.filter = 'brightness(1)')}
            >
              Get Started Free
            </button>
          </div>

          {/* Mobile: theme toggle + hamburger */}
          <div className="flex md:hidden" style={{ alignItems: 'center', gap: 4 }}>
            <button
              onClick={toggleTheme}
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              style={{
                width: 40,
                height: 40,
                alignItems: 'center',
                justifyContent: 'center',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              {theme === 'dark' ? (
                <Sun size={20} color={T.textPrimary} />
              ) : (
                <Moon size={20} color={T.textPrimary} />
              )}
            </button>
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle menu"
              style={{
                width: 44,
                height: 44,
                alignItems: 'center',
                justifyContent: 'center',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              {mobileOpen ? (
                <XIcon size={24} color={T.textPrimary} />
              ) : (
                <MenuIcon size={24} color={T.textPrimary} />
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="flex md:hidden"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99,
            background: T.overlayBg,
            backdropFilter: 'blur(20px)',
            padding: '80px 32px 32px',
            flexDirection: 'column',
            gap: 24,
          }}
        >
          {links.map((l) => {
            const isActive = activeSection === l.href.replace('#', '')
            return (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setMobileOpen(false)}
                style={{
                  fontSize: 20,
                  fontWeight: 500,
                  color: T.textPrimary,
                  textDecoration: 'none',
                  borderLeft: isActive ? `3px solid var(--mm-accent, #E63946)` : '3px solid transparent',
                  paddingLeft: isActive ? 12 : 15,
                  transition: 'border-color 200ms ease, padding-left 200ms ease',
                }}
              >
                {l.label}
              </a>
            )
          })}
          <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Link
              href="/login"
              onClick={() => setMobileOpen(false)}
              style={{
                textAlign: 'center',
                padding: '14px 0',
                borderRadius: 100,
                color: T.textPrimary,
                fontWeight: 500,
                textDecoration: 'none',
                border: `1px solid var(--mm-btn-ghost-border, rgba(255,255,255,0.12))`,
              }}
            >
              Log In
            </Link>
            <button
              onClick={() => {
                window.open(waLink('Hi, I want to know more about MenuMate'), '_blank')
                setMobileOpen(false)
              }}
              style={{
                textAlign: 'center',
                padding: '14px 0',
                borderRadius: 100,
                color: '#FFFFFF',
                fontWeight: 600,
                background: T.accent,
                border: 'none',
                cursor: 'pointer',
                fontSize: 16,
                boxShadow: '0 0 20px rgba(230,57,70,0.3)',
              }}
            >
              Get Started Free
            </button>
          </div>
        </div>
      )}
    </>
  )
}

/* ═══════════════════════════════════════════════════════════
   SECTION 2 — HERO
   ═══════════════════════════════════════════════════════════ */
function HeroSection() {
  const [loaded, setLoaded] = useState(false)
  const [typedText, setTypedText] = useState('')
  const fullText = 'a menu that sells.'

  useEffect(() => {
    const t = setTimeout(() => setLoaded(true), 100)
    return () => clearTimeout(t)
  }, [])

  /* Typewriter effect */
  useEffect(() => {
    if (!loaded) return
    let idx = 0
    const interval = setInterval(() => {
      idx++
      setTypedText(fullText.slice(0, idx))
      if (idx >= fullText.length) clearInterval(interval)
    }, 50)
    return () => clearInterval(interval)
  }, [loaded])

  const stagger = (i: number) =>
    loaded
      ? { opacity: 1, transform: 'translateY(0)', transition: `opacity 0.6s ease ${i * 0.1}s, transform 0.6s ease ${i * 0.1}s` }
      : { opacity: 0, transform: 'translateY(20px)' }

  return (
    <section
      style={{
        minHeight: '100dvh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: `
          radial-gradient(ellipse 80% 50% at 50% -20%, var(--mm-hero-radial1, rgba(230,57,70,0.15)) 0%, transparent 50%),
          radial-gradient(ellipse 60% 40% at 80% 50%, var(--mm-hero-radial2, rgba(230,57,70,0.08)) 0%, transparent 50%),
          radial-gradient(ellipse 60% 40% at 20% 80%, var(--mm-hero-radial3, rgba(52,199,89,0.05)) 0%, transparent 50%),
          var(--mm-bg, #0A0A0A)
        `,
        padding: '100px 24px 60px',
        position: 'relative',
        overflow: 'hidden',
        touchAction: 'pan-y',
        /* Ensure this section doesn't prevent page-level scrolling */
        overscrollBehavior: 'contain',
      }}
    >
      <div className="mesh-orb-1" />
      <div className="mesh-orb-2" />
      <div style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center' }}>
        {/* Badge */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            background: T.badgeBg,
            border: `1px solid ${T.badgeBorder}`,
            borderRadius: 100,
            padding: '6px 12px',
            marginBottom: 24,
            flexWrap: 'wrap',
            ...stagger(0),
          }}
        >
          <span style={{ fontSize: 12, color: T.accent, fontWeight: 600 }}>
            ⚡ Now live in Surat — Join 50+ restaurants
          </span>
        </div>

        {/* Headline */}
        <h1
          style={{
            fontSize: 'clamp(40px, 6vw, 72px)',
            fontWeight: 800,
            color: T.textPrimary,
            letterSpacing: '-0.03em',
            lineHeight: 1.1,
            ...stagger(1),
          }}
        >
          Your restaurant deserves
          <br />
          <span style={{ color: T.accent }}>
            {typedText}
            {typedText.length < fullText.length && <span className="typewriter-cursor" />}
          </span>
        </h1>

        {/* Subheadline */}
        <p
          style={{
            marginTop: 20,
            fontSize: 18,
            color: T.textSecondary,
            maxWidth: 500,
            margin: '20px auto 0',
            lineHeight: 1.6,
            ...stagger(2),
          }}
        >
          Customers scan a QR code, browse your menu, and order — you get it on WhatsApp
          instantly. No app. No printer. No missed orders.
        </p>

        {/* CTA Buttons */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
            marginTop: 40,
            flexWrap: 'wrap',
            ...stagger(3),
          }}
        >
          <button
            onClick={() => window.open('/menu/brew-house-demo', '_blank')}
            style={{
              background: T.accent,
              color: T.textPrimary,
              padding: '14px 24px',
              borderRadius: 100,
              fontWeight: 600,
              fontSize: 15,
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 0 40px rgba(230,57,70,0.35)',
              transition: 'filter 150ms',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.filter = 'brightness(1.15)')}
            onMouseLeave={(e) => (e.currentTarget.style.filter = 'brightness(1)')}
          >
            See Live Demo →
          </button>
          <button
            onClick={() =>
              window.open(waLink('Hi, I want to know more about MenuMate'), '_blank')
            }
            style={{
              background: T.btnGhostBg,
              border: `1px solid ${T.btnGhostBorder}`,
              color: T.textPrimary,
              padding: '14px 24px',
              borderRadius: 100,
              fontWeight: 600,
              fontSize: 15,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              transition: 'background 150ms',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = T.btnGhostHover)}
            onMouseLeave={(e) => (e.currentTarget.style.background = T.btnGhostBg)}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill={T.waGreen}>
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            Get Started on WhatsApp
          </button>
        </div>

        {/* Social proof */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 24,
            marginTop: 32,
            flexWrap: 'wrap',
            ...stagger(4),
          }}
        >
          {[
            '⭐⭐⭐⭐⭐  Loved by 50+ owners',
            '📱 No app download needed',
            '⚡ Setup in 24 hours',
          ].map((text, i) => (
            <span key={i} style={{ fontSize: 14, color: T.textMuted }}>
              {text}
            </span>
          ))}
        </div>

        {/* Trust Badges */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 8,
            justifyContent: 'center',
            marginTop: 20,
            ...stagger(5),
          }}
        >
          {[
            '🔒 Secure Payments',
            '⚡ Instant Setup',
            '🇮🇳 Made in India',
            '💬 WhatsApp Native',
          ].map((text, i) => (
            <span
              key={i}
              style={{
                background: T.trustBg,
                border: `1px solid ${T.trustBorder}`,
                borderRadius: 100,
                padding: '6px 14px',
                fontSize: 12,
                color: T.trustText,
              }}
            >
              {text}
            </span>
          ))}
        </div>

        {/* Phone mockup */}
        <div
          style={{
            marginTop: 48,
            display: 'flex',
            justifyContent: 'center',
            ...stagger(6),
          }}
        >
          <div
            className="phone-float"
            style={{
              width: 'min(280px, 70vw)',
              borderRadius: 40,
              overflow: 'hidden',
              background: '#1A1A18',
              boxShadow: '0 40px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.1)',
              padding: 8,
              position: 'relative',
            }}
          >
            {/* Notch */}
            <div
              style={{
                position: 'absolute',
                top: 8,
                left: '50%',
                transform: 'translateX(-50%)',
                width: 100,
                height: 24,
                background: '#1A1A18',
                borderRadius: '0 0 16px 16px',
                zIndex: 2,
              }}
            />
            {/* Screen */}
            <div
              style={{
                borderRadius: 32,
                overflow: 'hidden',
                background: '#0B0B0F',
                position: 'relative',
              }}
            >
              {/* Minimal Header Bar */}
              <div
                style={{
                  height: 36,
                  background: 'rgba(11,11,15,0.88)',
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                  padding: '28px 14px 8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  position: 'relative',
                  zIndex: 1,
                }}
              >
                <span style={{ color: '#FFFFFF', fontSize: 12, fontWeight: 600 }}>
                  Brew House
                </span>
                <div style={{ display: 'flex', gap: 8 }}>
                  {/* Search icon */}
                  <div
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 6,
                      background: 'rgba(255,255,255,0.06)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="10" cy="10" r="7" />
                      <line x1="15" y1="15" x2="21" y2="21" />
                    </svg>
                  </div>
                  {/* Cart icon with badge */}
                  <div style={{ position: 'relative' }}>
                    <div
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: 6,
                        background: 'rgba(255,255,255,0.06)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="9" cy="21" r="1" />
                        <circle cx="20" cy="21" r="1" />
                        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                      </svg>
                    </div>
                    <div
                      style={{
                        position: 'absolute',
                        top: -3,
                        right: -3,
                        width: 14,
                        height: 14,
                        borderRadius: '50%',
                        background: '#E63946',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <span style={{ color: '#FFFFFF', fontSize: 7, fontWeight: 700 }}>2</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Category Pills */}
              <div
                style={{
                  display: 'flex',
                  gap: 4,
                  padding: '6px 8px',
                  overflow: 'hidden',
                }}
              >
                {['All', 'Starters', 'Mains'].map((c, i) => (
                  <span
                    key={c}
                    style={{
                      fontSize: 8,
                      fontWeight: 600,
                      padding: '3px 8px',
                      borderRadius: 100,
                      background: i === 0 ? '#1C1C1E' : 'rgba(255,255,255,0.04)',
                      color: i === 0 ? '#FFFFFF' : 'rgba(255,255,255,0.4)',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {c}
                  </span>
                ))}
              </div>

              {/* 2-Column Card Grid */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 6,
                  padding: '8px 8px 48px',
                }}
              >
                {[
                  { name: 'Truffle Pasta', price: '₹320', emoji: '🍝', gradient: 'linear-gradient(145deg, #2D1B0E, #1A0F05)' },
                  { name: 'Caesar Salad', price: '₹180', emoji: '🥗', gradient: 'linear-gradient(145deg, #1B2D1E, #0F1A15)' },
                  { name: 'Margherita', price: '₹250', emoji: '🍕', gradient: 'linear-gradient(145deg, #2D1B2D, #1A0F1A)' },
                  { name: 'Tiramisu', price: '₹220', emoji: '🧁', gradient: 'linear-gradient(145deg, #2D2518, #1A1508)' },
                ].map((item) => (
                  <div
                    key={item.name}
                    style={{
                      borderRadius: 10,
                      border: `1px solid ${T.cardBorder}`,
                      overflow: 'hidden',
                      background: '#111114',
                      position: 'relative',
                    }}
                  >
                    {/* Image area */}
                    <div
                      style={{
                        aspectRatio: '1/1',
                        background: item.gradient,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        position: 'relative',
                      }}
                    >
                      <span style={{ fontSize: 32 }}>{item.emoji}</span>
                      {/* Add button */}
                      <div
                        style={{
                          position: 'absolute',
                          bottom: -8,
                          right: -4,
                          width: 16,
                          height: 16,
                          borderRadius: '50%',
                          background: '#E63946',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: '0 2px 6px rgba(230,57,70,0.4)',
                          zIndex: 1,
                        }}
                      >
                        <span style={{ color: '#FFFFFF', fontSize: 10, fontWeight: 700, marginTop: -1 }}>+</span>
                      </div>
                    </div>
                    {/* Text info */}
                    <div style={{ padding: '6px 6px 8px' }}>
                      <div
                        style={{
                          fontSize: 9,
                          fontWeight: 600,
                          color: '#FFFFFF',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {item.name}
                      </div>
                      <div
                        style={{
                          fontSize: 9,
                          fontWeight: 700,
                          color: '#FFFFFF',
                          marginTop: 2,
                        }}
                      >
                        {item.price}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Floating Cart Bar */}
              <div
                style={{
                  position: 'absolute',
                  bottom: 12,
                  left: 10,
                  right: 10,
                  height: 28,
                  background: 'rgba(26,26,34,0.94)',
                  backdropFilter: 'blur(12px)',
                  WebkitBackdropFilter: 'blur(12px)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 100,
                  boxShadow: '0 -4px 16px rgba(0,0,0,0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0 12px',
                  zIndex: 2,
                }}
              >
                <span style={{ color: '#FFFFFF', fontSize: 9, fontWeight: 600 }}>
                  2 items • ₹300
                </span>
                <span style={{ color: '#FFFFFF', fontSize: 8, fontWeight: 600 }}>
                  View Cart →
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .phone-float {
          animation: phoneFloat 4s ease-in-out infinite;
        }
        @keyframes phoneFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        @keyframes meshFloat1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -20px) scale(1.1); }
          66% { transform: translate(-20px, 10px) scale(0.95); }
        }
        @keyframes meshFloat2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(-25px, 15px) scale(1.05); }
          66% { transform: translate(15px, -25px) scale(1.1); }
        }
        .mesh-orb-1 {
          position: absolute;
          top: 20%;
          left: 60%;
          width: min(400px, 80vw);
          height: min(400px, 80vw);
          background: radial-gradient(circle, rgba(230,57,70,0.08) 0%, transparent 70%);
          border-radius: 50%;
          animation: meshFloat1 12s ease-in-out infinite;
          pointer-events: none;
        }
        .mesh-orb-2 {
          position: absolute;
          bottom: 10%;
          left: 10%;
          width: min(350px, 70vw);
          height: min(350px, 70vw);
          background: radial-gradient(circle, rgba(52,199,89,0.05) 0%, transparent 70%);
          border-radius: 50%;
          animation: meshFloat2 15s ease-in-out infinite;
          pointer-events: none;
        }
      `}</style>
    </section>
  )
}

/* ═══════════════════════════════════════════════════════════
   SECTION 3 — PROBLEM / SOLUTION
   ═══════════════════════════════════════════════════════════ */
function ProblemSolutionSection() {
  const problems = [
    'Printed menus cost ₹5,000 every time you update',
    'Customers shout orders across the restaurant',
    'Waiter writes wrong order — kitchen makes wrong dish',
    'No way to know which items are bestsellers',
    "Customers don't come back — no loyalty system",
    'Paying Zomato 25% commission on every order',
  ]
  const solutions = [
    'Update your menu in 30 seconds — free, forever',
    'Every order lands directly in your WhatsApp',
    'Customer types their own order — zero mistakes',
    'See exactly what sells every single day',
    'Digital stamp cards bring customers back',
    'Direct orders from your own QR — zero commission',
  ]

  return (
    <section style={{ background: T.sectionAlt, padding: '80px clamp(16px, 5vw, 40px)' }}>
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        <AnimatedSection>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <h2
              style={{
                fontSize: 'clamp(28px, 5vw, 36px)',
                fontWeight: 800,
                color: T.textPrimary,
                letterSpacing: '-0.03em',
              }}
            >
              Still doing this the old way?
            </h2>
            <p style={{ marginTop: 8, fontSize: 16, color: T.textSecondary }}>
              Every restaurant in Surat faces these problems
            </p>
          </div>
        </AnimatedSection>

        <div
          className="grid md:grid-cols-2"
          style={{ display: 'grid', gap: 24, gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 400px), 1fr))' }}
        >
          {/* Problems */}
          <AnimatedSection delay={100}>
            <div
              style={{
                background: T.problemBg,
                border: `1px solid ${T.problemBorder}`,
                borderRadius: 16,
                padding: 24,
              }}
            >
              <h3
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  color: T.textPrimary,
                  marginBottom: 20,
                }}
              >
                ❌ Without MenuMate
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {problems.map((p, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <X size={18} color="#FF3B30" style={{ flexShrink: 0, marginTop: 2 }} />
                    <span style={{ fontSize: 14, color: T.textSecondary, lineHeight: 1.5 }}>{p}</span>
                  </div>
                ))}
              </div>
            </div>
          </AnimatedSection>

          {/* Solutions */}
          <AnimatedSection delay={200}>
            <div
              style={{
                background: T.solutionBg,
                border: `1px solid ${T.solutionBorder}`,
                borderRadius: 16,
                padding: 24,
              }}
            >
              <h3
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  color: T.textPrimary,
                  marginBottom: 20,
                }}
              >
                ✓ With MenuMate
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {solutions.map((s, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <Check size={18} color={T.green} style={{ flexShrink: 0, marginTop: 2 }} />
                    <span style={{ fontSize: 14, color: T.textSecondary, lineHeight: 1.5 }}>{s}</span>
                  </div>
                ))}
              </div>
            </div>
          </AnimatedSection>
        </div>
      </div>
    </section>
  )
}

/* ═══════════════════════════════════════════════════════════
   SECTION 4 — HOW IT WORKS
   ═══════════════════════════════════════════════════════════ */
function HowItWorksSection() {
  const steps = [
    {
      num: '01',
      icon: <ClipboardList size={40} color={T.accent} />,
      title: 'You fill a form',
      desc: 'Fill our simple inquiry form with your restaurant details. We call you within 2 hours.',
    },
    {
      num: '02',
      icon: <UtensilsCrossed size={40} color={T.accent} />,
      title: 'We build your menu',
      desc: 'Send us your menu photos and prices. We set everything up for you — beautifully.',
    },
    {
      num: '03',
      icon: <Zap size={40} color={T.accent} />,
      title: 'Go live in 24 hours',
      desc: 'Print your QR codes, place them on tables, and start receiving orders on WhatsApp.',
    },
  ]

  return (
    <section id="how-it-works" style={{ background: `radial-gradient(ellipse 80% 50% at 50% 0%, rgba(230,57,70,0.04) 0%, transparent 60%), ${T.bg}`, padding: '80px clamp(16px, 5vw, 40px)' }}>
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        <AnimatedSection>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <SectionLabel text="HOW IT WORKS" />
            <h2
              style={{
                fontSize: 'clamp(28px, 4vw, 40px)',
                fontWeight: 800,
                color: T.textPrimary,
                marginTop: 12,
                letterSpacing: '-0.03em',
              }}
            >
              Up and running in 24 hours
            </h2>
          </div>
        </AnimatedSection>

        <div
          className="grid md:grid-cols-3"
          style={{
            display: 'grid',
            gap: 24,
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))',
          }}
        >
          {steps.map((s, i) => (
            <Fragment key={i}>
              <AnimatedSection delay={i * 120}>
                <div
                  style={{
                    background: T.surface,
                    border: `1px solid ${T.cardBorder}`,
                    borderRadius: 20,
                    padding: 28,
                    height: '100%',
                    position: 'relative',
                    transition: 'transform 200ms ease, border-color 200ms ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)'
                    e.currentTarget.style.borderColor = T.cardBorderHover
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.borderColor = T.cardBorder
                  }}
                >
                  <span
                    style={{
                      fontSize: 48,
                      fontWeight: 900,
                      color: 'rgba(230,57,70,0.2)',
                      display: 'block',
                      marginBottom: 12,
                      lineHeight: 1,
                    }}
                  >
                    {s.num}
                  </span>
                  {s.icon}
                  <h3
                    style={{
                      fontSize: 18,
                      fontWeight: 700,
                      color: T.textPrimary,
                      marginTop: 16,
                    }}
                  >
                    {s.title}
                  </h3>
                  <p
                    style={{
                      fontSize: 14,
                      color: T.iconMuted,
                      lineHeight: 1.6,
                      marginTop: 8,
                    }}
                  >
                    {s.desc}
                  </p>

                  {/* Arrow */}
                  {i < steps.length - 1 && (
                    <div
                      className="hidden md:block"
                      style={{
                        position: 'absolute',
                        right: -24,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: T.accent,
                        fontSize: 24,
                      }}
                    >
                      →
                    </div>
                  )}
                </div>
              </AnimatedSection>
              {/* Mobile vertical connector */}
              {i < steps.length - 1 && (
                <div
                  className="flex md:hidden"
                  style={{
                    justifyContent: 'center',
                  }}
                >
                  <div
                    style={{
                      width: 2,
                      background: 'rgba(255,255,255,0.06)',
                      height: 32,
                      margin: '0 auto',
                    }}
                  />
                </div>
              )}
            </Fragment>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ═══════════════════════════════════════════════════════════
   SECTION 5 — LIVE DEMO CTA
   ═══════════════════════════════════════════════════════════ */
function DemoSection() {
  const [qrUrl, setQrUrl] = useState<string | null>(null)

  useEffect(() => {
    const demoUrl = typeof window !== 'undefined' ? `${window.location.origin}/menu/brew-house-demo` : 'https://menumate.in/menu/brew-house-demo'
    QRCode.toDataURL(demoUrl, {
      width: 400,
      margin: 2,
      color: { dark: '#0A0A0A', light: '#FFFFFF' },
      errorCorrectionLevel: 'H',
    }).then(setQrUrl)
  }, [])

  return (
    <section
      id="demo"
      style={{
        background: `radial-gradient(ellipse at center, rgba(230,57,70,0.08) 0%, transparent 70%), #0D0D0D`,
        padding: '80px clamp(16px, 5vw, 40px)',
        textAlign: 'center',
      }}
    >
      <div style={{ maxWidth: 560, margin: '0 auto' }}>
        <AnimatedSection>
          <SectionLabel text="SEE IT IN ACTION" />
          <h2
            style={{
              fontSize: 'clamp(28px, 4vw, 36px)',
              fontWeight: 800,
              color: T.textPrimary,
              marginTop: 12,
              letterSpacing: '-0.03em',
            }}
          >
            Scan this to see a live menu
          </h2>
          <p
            style={{
              fontSize: 16,
              color: T.textSecondary,
              marginTop: 8,
              lineHeight: 1.6,
            }}
          >
            This is exactly what your customers will see when they scan your restaurant&apos;s QR
            code
          </p>
        </AnimatedSection>

        <AnimatedSection delay={150}>
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: 20,
              padding: 20,
              width: 200,
              height: 200,
              margin: '32px auto 0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 60px rgba(255,255,255,0.05)',
            }}
          >
            {qrUrl ? (
              <img
                src={qrUrl}
                alt="Demo QR Code"
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              />
            ) : (
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  background: '#F0F0F0',
                  borderRadius: 12,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <QrCode size={48} color="#CCC" />
              </div>
            )}
          </div>

          <div style={{ margin: '20px 0', color: T.textMuted, fontSize: 13 }}>— or —</div>

          <button
            onClick={() => window.open('/menu/brew-house-demo', '_blank')}
            style={{
              background: T.textPrimary,
              color: T.bg,
              padding: '14px 28px',
              borderRadius: 100,
              fontWeight: 600,
              fontSize: 15,
              border: 'none',
              cursor: 'pointer',
              transition: 'filter 150ms',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.filter = 'brightness(0.9)')}
            onMouseLeave={(e) => (e.currentTarget.style.filter = 'brightness(1)')}
          >
            View Demo Menu →
          </button>
        </AnimatedSection>
      </div>
    </section>
  )
}

/* ═══════════════════════════════════════════════════════════
   SECTION 6 — FEATURES
   ═══════════════════════════════════════════════════════════ */
function FeaturesSection() {
  const features = [
    {
      icon: <QrCode size={20} color={T.accent} />,
      title: 'QR Code Per Table',
      desc: 'Each table gets its own QR. Customer scans, table number is automatic. No confusion.',
      badge: null,
    },
    {
      icon: <MessageCircle size={20} color={T.accent} />,
      title: 'WhatsApp Orders',
      desc: 'Every order arrives in your WhatsApp in 3 seconds. With table number and full item list.',
      badge: null,
    },
    {
      icon: <Award size={20} color={T.accent} />,
      title: 'Loyalty Stamp Cards',
      desc: 'Digital stamp cards bring customers back. 9 orders = 1 free item. Automatic rewards.',
      badge: 'PRO',
    },
    {
      icon: <ImageIcon size={20} color={T.accent} />,
      title: 'Promotional Banners',
      desc: 'Run festival offers, happy hours, new launches. Schedule them in advance. Auto on/off.',
      badge: null,
    },
    {
      icon: <BarChart3 size={20} color={T.accent} />,
      title: 'Live Order Dashboard',
      desc: 'See every order live. New → Preparing → Served. Your kitchen stays organized.',
      badge: null,
    },
    {
      icon: <Smartphone size={20} color={T.accent} />,
      title: 'No App Needed',
      desc: "Customers open in their browser. No download. Works on any phone, any network.",
      badge: null,
    },
  ]

  return (
    <section id="features" style={{ background: `radial-gradient(ellipse 60% 40% at 30% 50%, rgba(52,199,89,0.03) 0%, transparent 60%), ${T.bg}`, padding: '80px clamp(16px, 5vw, 40px)' }}>
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        <AnimatedSection>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <SectionLabel text="FEATURES" />
            <h2
              style={{
                fontSize: 'clamp(28px, 4vw, 40px)',
                fontWeight: 800,
                color: T.textPrimary,
                marginTop: 12,
                letterSpacing: '-0.03em',
              }}
            >
              Everything your restaurant needs
            </h2>
          </div>
        </AnimatedSection>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))',
            gap: 16,
          }}
        >
          {features.map((f, i) => (
            <AnimatedSection key={i} delay={i * 80}>
              <div
                style={{
                  background: T.surface,
                  border: `1px solid ${T.cardBorder}`,
                  borderRadius: 16,
                  padding: 24,
                  height: '100%',
                  transition: 'all 200ms ease, box-shadow 200ms ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(230,57,70,0.3)'
                  e.currentTarget.style.background = 'rgba(230,57,70,0.03)'
                  e.currentTarget.style.boxShadow = '0 0 20px rgba(230,57,70,0.15), 0 8px 32px rgba(0,0,0,0.3)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = T.cardBorder
                  e.currentTarget.style.background = T.surface
                  e.currentTarget.style.boxShadow = 'none'
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    background: 'rgba(230,57,70,0.1)',
                    borderRadius: 10,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                  }}
                >
                  {f.icon}
                  {f.badge && (
                    <span
                      style={{
                        position: 'absolute',
                        top: -6,
                        right: -6,
                        background: T.accent,
                        color: '#FFFFFF',
                        fontSize: 9,
                        fontWeight: 700,
                        padding: '2px 6px',
                        borderRadius: 100,
                        letterSpacing: '0.04em',
                      }}
                    >
                      {f.badge}
                    </span>
                  )}
                </div>
                <h3
                  style={{
                    fontSize: 16,
                    fontWeight: 600,
                    color: T.textPrimary,
                    marginTop: 16,
                  }}
                >
                  {f.title}
                </h3>
                <p
                  style={{
                    fontSize: 13,
                    color: T.iconMuted,
                    lineHeight: 1.6,
                    marginTop: 8,
                  }}
                >
                  {f.desc}
                </p>
              </div>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ═══════════════════════════════════════════════════════════
   SECTION — RESTAURANT SHOWCASE
   ═══════════════════════════════════════════════════════════ */
function RestaurantShowcaseSection() {
  return (
    <section style={{ background: T.sectionAlt, padding: '80px clamp(16px, 5vw, 40px)' }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        <AnimatedSection>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <SectionLabel text="SEE THE MAGIC" />
            <h2
              style={{
                fontSize: 'clamp(28px, 4vw, 40px)',
                fontWeight: 800,
                color: T.textPrimary,
                marginTop: 12,
                letterSpacing: '-0.03em',
              }}
            >
              Your menu, beautifully designed
            </h2>
            <p
              style={{
                fontSize: 16,
                color: T.textSecondary,
                marginTop: 8,
                lineHeight: 1.6,
              }}
            >
              This is what your customers see — a fast, stunning digital menu that works on every phone
            </p>
          </div>
        </AnimatedSection>

        <AnimatedSection delay={150}>
          <div style={{
            maxWidth: 480,
            margin: '0 auto',
            borderRadius: 16,
            overflow: 'hidden',
            background: '#0B0B0F',
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 40px 100px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)',
          }}>
            {/* Browser chrome */}
            <div style={{
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              borderBottom: '1px solid rgba(255,255,255,0.06)',
              background: 'rgba(255,255,255,0.03)',
              overflow: 'hidden',
            }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#FF5F57' }} />
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#FEBC2E' }} />
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#28C840' }} />
              <div style={{
                flex: 1,
                marginLeft: 8,
                height: 24,
                borderRadius: 6,
                background: 'rgba(255,255,255,0.06)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>menumate.in/menu/brew-house</span>
              </div>
            </div>
            {/* Menu content - simplified preview */}
            <div style={{ padding: 16 }}>
              {/* Restaurant header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #2D1B0E, #1A0F05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: 18 }}>☕</span>
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#FFFFFF' }}>Brew House Cafe</div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>Open now · Scan to order</div>
                </div>
              </div>
              {/* Category pills */}
              <div style={{ display: 'flex', gap: 6, marginBottom: 14, overflow: 'hidden' }}>
                {['All', 'Starters', 'Mains', 'Desserts'].map((c, i) => (
                  <span key={c} style={{
                    fontSize: 10,
                    fontWeight: 600,
                    padding: '4px 12px',
                    borderRadius: 100,
                    background: i === 0 ? 'rgba(230,57,70,0.15)' : 'rgba(255,255,255,0.04)',
                    color: i === 0 ? '#E63946' : 'rgba(255,255,255,0.4)',
                    whiteSpace: 'nowrap',
                    border: i === 0 ? '1px solid rgba(230,57,70,0.3)' : '1px solid transparent',
                  }}>
                    {c}
                  </span>
                ))}
              </div>
              {/* Food grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {[
                  { name: 'Truffle Pasta', price: '₹320', emoji: '🍝', bg: 'linear-gradient(145deg, #2D1B0E, #1A0F05)' },
                  { name: 'Caesar Salad', price: '₹180', emoji: '🥗', bg: 'linear-gradient(145deg, #1B2D1E, #0F1A15)' },
                  { name: 'Margherita', price: '₹250', emoji: '🍕', bg: 'linear-gradient(145deg, #2D1B2D, #1A0F1A)' },
                  { name: 'Tiramisu', price: '₹220', emoji: '🧁', bg: 'linear-gradient(145deg, #2D2518, #1A1508)' },
                ].map((item) => (
                  <div key={item.name} style={{
                    borderRadius: 10,
                    border: `1px solid ${T.cardBorder}`,
                    overflow: 'hidden',
                    background: '#111114',
                  }}>
                    <div style={{
                      aspectRatio: '1/1',
                      background: item.bg,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      <span style={{ fontSize: 28 }}>{item.emoji}</span>
                    </div>
                    <div style={{ padding: '6px 8px' }}>
                      <div style={{ fontSize: 10, fontWeight: 600, color: '#FFFFFF' }}>{item.name}</div>
                      <div style={{ fontSize: 10, fontWeight: 700, color: '#FFFFFF', marginTop: 1 }}>{item.price}</div>
                    </div>
                  </div>
                ))}
              </div>
              {/* Cart bar */}
              <div style={{
                marginTop: 12,
                height: 32,
                background: 'rgba(230,57,70,0.95)',
                borderRadius: 100,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 14px',
              }}>
                <span style={{ color: '#FFFFFF', fontSize: 10, fontWeight: 600 }}>2 items · ₹500</span>
                <span style={{ color: '#FFFFFF', fontSize: 10, fontWeight: 600 }}>View Cart →</span>
              </div>
            </div>
          </div>
        </AnimatedSection>
      </div>
    </section>
  )
}

/* ═══════════════════════════════════════════════════════════
   SECTION — TRUSTED BY (Partner logos marquee)
   ═══════════════════════════════════════════════════════════ */
function TrustedBySection() {
  const partners = [
    'Brew House Cafe', 'The Spice Kitchen', 'Pizza Planet',
    'Royal Dining', 'Cafe Milano', 'Surat Biryani House',
    'Chai & Co.', 'Green Bowl', 'Urban Tadka',
    'Masala Trail', 'Coastal Catch', 'Dessert Den',
  ]
  // Double the list for seamless loop
  const doubled = [...partners, ...partners]

  return (
    <section style={{ background: T.sectionAlt, padding: '48px 0', overflow: 'hidden' }}>
      <AnimatedSection>
        <p style={{
          textAlign: 'center',
          fontSize: 13,
          fontWeight: 600,
          color: T.textMuted,
          textTransform: 'uppercase',
          letterSpacing: '0.12em',
          marginBottom: 28,
        }}>
          Trusted by restaurants across Gujarat
        </p>
      </AnimatedSection>
      <div style={{
        position: 'relative',
        maskImage: 'linear-gradient(90deg, transparent, black 10%, black 90%, transparent)',
        WebkitMaskImage: 'linear-gradient(90deg, transparent, black 10%, black 90%, transparent)',
      }}>
        <div className="marquee-track" style={{
          display: 'flex',
          gap: 48,
          animation: 'marqueeScroll 30s linear infinite',
          width: 'max-content',
        }}>
          {doubled.map((name, i) => (
            <div key={i} style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '10px 20px',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.05)',
              borderRadius: 100,
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}>
              <div style={{
                width: 28,
                height: 28,
                borderRadius: 8,
                background: `linear-gradient(135deg, ${T.accent}20, ${T.accent}08)`,
                border: `1px solid ${T.accent}30`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 14,
              }}>
                🍽️
              </div>
              <span style={{ fontSize: 14, fontWeight: 500, color: T.textSecondary }}>{name}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ═══════════════════════════════════════════════════════════
   SECTION — COMPARISON TABLE (MenuMate vs Competition)
   ═══════════════════════════════════════════════════════════ */
function ComparisonSection() {
  const features = [
    { feature: 'Commission per order', menumate: '0%', zomato: '20-25%', swiggy: '18-25%', printed: '—' },
    { feature: 'Setup time', menumate: '24 hours', zomato: '2-3 weeks', swiggy: '2-3 weeks', printed: '2-3 days' },
    { feature: 'Menu updates', menumate: 'Instant (free)', zomato: '24-48 hrs', swiggy: '24-48 hrs', printed: '₹5,000+ reprint' },
    { feature: 'Customer data', menumate: '✓ You own it', zomato: '✗ Zomato owns', swiggy: '✗ Swiggy owns', printed: '—' },
    { feature: 'WhatsApp orders', menumate: '✓ Direct', zomato: '✗ App only', swiggy: '✗ App only', printed: '✗' },
    { feature: 'Loyalty program', menumate: '✓ Built-in', zomato: '✗', swiggy: '✗', printed: '✗' },
    { feature: 'QR per table', menumate: '✓', zomato: '✗', swiggy: '✗', printed: '✗' },
    { feature: 'Monthly cost', menumate: '₹999-1,499', zomato: '₹0 + commission', swiggy: '₹0 + commission', printed: '₹0 + reprint' },
  ]

  const cellStyle: React.CSSProperties = {
    padding: '12px 16px',
    fontSize: 13,
    lineHeight: 1.4,
    borderBottom: '1px solid rgba(255,255,255,0.05)',
  }

  return (
    <section style={{ background: T.bg, padding: '80px clamp(16px, 5vw, 40px)' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <AnimatedSection>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <SectionLabel text="COMPARE" />
            <h2 style={{
              fontSize: 'clamp(28px, 4vw, 40px)',
              fontWeight: 800,
              color: T.textPrimary,
              marginTop: 12,
              letterSpacing: '-0.03em',
            }}>
              Why restaurants choose MenuMate
            </h2>
            <p style={{ fontSize: 16, color: T.textSecondary, marginTop: 8 }}>
              See how we compare to other ordering solutions
            </p>
          </div>
        </AnimatedSection>

        <AnimatedSection delay={150}>
          <div style={{
            borderRadius: 16,
            overflow: 'hidden',
            border: '1px solid rgba(255,255,255,0.08)',
            background: T.surface,
          }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 600 }}>
                <thead>
                  <tr>
                    <th style={{ ...cellStyle, textAlign: 'left', fontWeight: 600, color: T.textMuted, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em', background: 'rgba(255,255,255,0.02)' }}>Feature</th>
                    <th style={{ ...cellStyle, textAlign: 'center', fontWeight: 700, color: T.accent, fontSize: 13, background: 'rgba(230,57,70,0.06)', borderBottom: '2px solid rgba(230,57,70,0.3)' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                        <UtensilsCrossed size={16} color={T.accent} />
                        MenuMate
                      </div>
                    </th>
                    <th style={{ ...cellStyle, textAlign: 'center', fontWeight: 500, color: T.textMuted, fontSize: 13, background: 'rgba(255,255,255,0.01)' }}>Zomato</th>
                    <th style={{ ...cellStyle, textAlign: 'center', fontWeight: 500, color: T.textMuted, fontSize: 13, background: 'rgba(255,255,255,0.01)' }}>Swiggy</th>
                    <th style={{ ...cellStyle, textAlign: 'center', fontWeight: 500, color: T.textMuted, fontSize: 13, background: 'rgba(255,255,255,0.01)' }}>Printed Menu</th>
                  </tr>
                </thead>
                <tbody>
                  {features.map((row, i) => (
                    <tr key={i} style={{ transition: 'background 150ms' }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      <td style={{ ...cellStyle, color: T.textPrimary, fontWeight: 500 }}>{row.feature}</td>
                      <td style={{ ...cellStyle, textAlign: 'center', color: T.accent, fontWeight: 600, background: 'rgba(230,57,70,0.03)' }}>{row.menumate}</td>
                      <td style={{ ...cellStyle, textAlign: 'center', color: T.textSecondary }}>{row.zomato}</td>
                      <td style={{ ...cellStyle, textAlign: 'center', color: T.textSecondary }}>{row.swiggy}</td>
                      <td style={{ ...cellStyle, textAlign: 'center', color: T.textSecondary }}>{row.printed}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </AnimatedSection>

        <AnimatedSection delay={300}>
          <div style={{
            marginTop: 24,
            textAlign: 'center',
            background: 'rgba(52,199,89,0.06)',
            border: '1px solid rgba(52,199,89,0.15)',
            borderRadius: 12,
            padding: '14px 20px',
          }}>
            <span style={{ color: T.green, fontWeight: 600, fontSize: 14 }}>
              💰 Save ₹50,000+ per year on commissions with MenuMate vs Zomato/Swiggy
            </span>
          </div>
        </AnimatedSection>
      </div>
    </section>
  )
}

/* ═══════════════════════════════════════════════════════════
   SECTION — CTA BANNER (Mid-page conversion)
   ═══════════════════════════════════════════════════════════ */
function CTABanner() {
  return (
    <section style={{
      background: `linear-gradient(135deg, rgba(230,57,70,0.12) 0%, rgba(230,57,70,0.04) 100%), ${T.bg}`,
      padding: '64px clamp(16px, 5vw, 40px)',
      borderTop: '1px solid rgba(230,57,70,0.1)',
      borderBottom: '1px solid rgba(230,57,70,0.1)',
    }}>
      <div style={{ maxWidth: 700, margin: '0 auto', textAlign: 'center' }}>
        <AnimatedSection>
          <h2 style={{
            fontSize: 'clamp(24px, 4vw, 36px)',
            fontWeight: 800,
            color: T.textPrimary,
            letterSpacing: '-0.03em',
          }}>
            Ready to ditch commissions?
          </h2>
          <p style={{
            fontSize: 16,
            color: T.textSecondary,
            marginTop: 12,
            lineHeight: 1.6,
            maxWidth: 500,
            margin: '12px auto 0',
          }}>
            Join 50+ Surat restaurants that own their customers, keep 100% revenue, and never pay commission again.
          </p>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
            marginTop: 28,
            flexWrap: 'wrap',
          }}>
            <button
              onClick={() => window.open(waLink('Hi, I want to start with MenuMate!'), '_blank')}
              style={{
                background: T.accent,
                color: '#FFFFFF',
                padding: '14px 28px',
                borderRadius: 100,
                fontWeight: 600,
                fontSize: 15,
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 0 30px rgba(230,57,70,0.35)',
                transition: 'filter 150ms, transform 150ms',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.filter = 'brightness(1.1)'
                e.currentTarget.style.transform = 'translateY(-2px)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.filter = 'brightness(1)'
                e.currentTarget.style.transform = 'translateY(0)'
              }}
            >
              Start Free Trial →
            </button>
            <a
              href="#pricing"
              style={{
                padding: '14px 28px',
                borderRadius: 100,
                fontWeight: 600,
                fontSize: 15,
                border: `1px solid ${T.btnGhostBorder}`,
                color: T.textPrimary,
                textDecoration: 'none',
                transition: 'background 150ms',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = T.btnGhostHover)}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              See Pricing
            </a>
          </div>
        </AnimatedSection>
      </div>
    </section>
  )
}

/* ═══════════════════════════════════════════════════════════
   SECTION 7 — PRICING
   ═══════════════════════════════════════════════════════════ */
function PricingSection() {
  const plans = [
    {
      name: 'Basic',
      subtitle: 'For cafes getting started',
      setupPrice: '₹3,000',
      monthlyPrice: '₹999',
      perDay: '= just ₹33/day ☕',
      perDayColor: T.green,
      features: [
        'Up to 40 menu items',
        '8 categories',
        '10 tables with QR codes',
        'WhatsApp order notifications',
        '1 promotional banner',
        'Live order dashboard',
        'We set everything up for you',
      ],
      cta: 'Get Started on Basic',
      waMsg: 'Hi, I want MenuMate Basic Plan',
      popular: false,
    },
    {
      name: 'Pro',
      subtitle: 'For serious restaurants',
      setupPrice: '₹5,000',
      monthlyPrice: '₹1,499',
      perDay: '= just ₹50/day 🔥',
      perDayColor: T.accent,
      features: [
        'Everything in Basic',
        'Unlimited menu items',
        '30 tables with QR codes',
        '5 rotating banners',
        'Festival banner templates',
        'Digital loyalty stamp cards',
        'Customer database (phone numbers)',
        "Best Seller + Chef's Special badges",
        'Weekly WhatsApp report',
        'Priority support from founder',
      ],
      cta: 'Get Started on Pro →',
      waMsg: 'Hi, I want MenuMate Pro Plan',
      popular: true,
    },
  ]

  return (
    <section id="pricing" style={{ background: T.sectionAlt, padding: '80px clamp(16px, 5vw, 40px)' }}>
      <div style={{ maxWidth: 880, margin: '0 auto' }}>
        <AnimatedSection>
          <div style={{ textAlign: 'center', marginBottom: 16 }}>
            <SectionLabel text="PRICING" />
            <h2
              style={{
                fontSize: 'clamp(28px, 4vw, 40px)',
                fontWeight: 800,
                color: T.textPrimary,
                marginTop: 12,
                letterSpacing: '-0.03em',
              }}
            >
              Simple, honest pricing
            </h2>
            <p style={{ fontSize: 16, color: T.textSecondary, marginTop: 8 }}>
              One-time setup fee + monthly subscription. We build everything for you.
            </p>
          </div>
        </AnimatedSection>

        {/* Trial banner */}
        <AnimatedSection delay={100}>
          <div
            style={{
              background: 'rgba(52,199,89,0.08)',
              border: '1px solid rgba(52,199,89,0.2)',
              borderRadius: 12,
              padding: '14px 20px',
              textAlign: 'center',
              marginBottom: 40,
            }}
          >
            <span style={{ color: T.green, fontWeight: 600, fontSize: 14 }}>
              🎁 Special offer — First 7 days free. No payment needed to start.
            </span>
          </div>
        </AnimatedSection>

        <div
          className="grid md:grid-cols-2"
          style={{
            display: 'grid',
            gap: 24,
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 360px), 1fr))',
            alignItems: 'start',
          }}
        >
          {plans.map((plan, i) => (
            <AnimatedSection key={i} delay={i * 120 + 200}>
              <div
                className={plan.popular ? 'pricing-shimmer pro-gradient-border' : ''}
                style={{
                  background: plan.popular
                    ? 'linear-gradient(135deg, rgba(230,57,70,0.08), rgba(26,16,16,0.95))'
                    : 'rgba(17,17,17,0.7)',
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                  border: plan.popular
                    ? '1px solid rgba(230,57,70,0.3)'
                    : '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 20,
                  padding: 'clamp(20px, 5vw, 32px)',
                  position: 'relative',
                  overflow: 'hidden',
                  boxShadow: plan.popular ? '0 0 40px rgba(230,57,70,0.1)' : 'none',
                  transition: 'box-shadow 200ms ease',
                }}
                onMouseEnter={(e) => {
                  if (plan.popular)
                    e.currentTarget.style.boxShadow = '0 0 60px rgba(230,57,70,0.2)'
                }}
                onMouseLeave={(e) => {
                  if (plan.popular)
                    e.currentTarget.style.boxShadow = '0 0 40px rgba(230,57,70,0.1)'
                }}
              >
                {/* Most popular badge */}
                {plan.popular && (
                  <div
                    className="popular-badge"
                    style={{
                      position: 'absolute',
                      top: -12,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      background: T.accent,
                      color: '#FFFFFF',
                      fontSize: 11,
                      fontWeight: 700,
                      padding: '4px 16px',
                      borderRadius: 100,
                      zIndex: 2,
                    }}
                  >
                    MOST POPULAR
                  </div>
                )}

                <h3 style={{ fontSize: 20, fontWeight: 700, color: T.textPrimary }}>
                  {plan.name}
                </h3>
                <p style={{ fontSize: 14, color: T.textSecondary, marginTop: 2 }}>
                  {plan.subtitle}
                </p>

                {/* Pricing */}
                <div style={{ marginTop: 20 }}>
                  <span
                    style={{
                      fontSize: 32,
                      fontWeight: 700,
                      color: T.textPrimary,
                    }}
                  >
                    {plan.setupPrice}
                  </span>
                  <span
                    style={{
                      fontSize: 14,
                      color: 'rgba(255,255,255,0.4)',
                      marginLeft: 4,
                    }}
                  >
                    /one-time setup
                  </span>
                </div>
                <p
                  style={{
                    fontSize: 16,
                    color: 'rgba(255,255,255,0.6)',
                    marginTop: 4,
                  }}
                >
                  then {plan.monthlyPrice}/month
                </p>
                <p
                  style={{
                    fontSize: 13,
                    color: plan.perDayColor,
                    marginTop: 4,
                  }}
                >
                  {plan.perDay}
                </p>

                {/* Divider */}
                <div
                  style={{
                    height: 1,
                    background: 'rgba(255,255,255,0.06)',
                    margin: '24px 0',
                  }}
                />

                {/* Features */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {plan.features.map((f, j) => (
                    <div key={j} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                      <Check size={16} color={T.green} style={{ flexShrink: 0, marginTop: 2 }} />
                      <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)' }}>{f}</span>
                    </div>
                  ))}
                </div>

                {/* CTA */}
                <button
                  onClick={() => window.open(waLink(plan.waMsg), '_blank')}
                  style={{
                    width: '100%',
                    marginTop: 24,
                    height: 52,
                    borderRadius: 100,
                    fontWeight: 600,
                    fontSize: 15,
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'filter 150ms',
                    background: plan.popular ? T.accent : '#FFFFFF',
                    color: plan.popular ? '#FFFFFF' : '#0A0A0A',
                    boxShadow: plan.popular
                      ? '0 0 30px rgba(230,57,70,0.3)'
                      : 'none',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.filter = 'brightness(0.9)')}
                  onMouseLeave={(e) => (e.currentTarget.style.filter = 'brightness(1)')}
                >
                  {plan.cta}
                </button>
              </div>
            </AnimatedSection>
          ))}
        </div>

        {/* Below cards */}
        <AnimatedSection delay={500}>
          <p
            style={{
              textAlign: 'center',
              marginTop: 32,
              fontSize: 14,
              color: 'rgba(255,255,255,0.4)',
            }}
          >
            🤝 We set up your entire menu for you. Just send us your photos and prices.
          </p>
        </AnimatedSection>
      </div>
    </section>
  )
}

/* ═══════════════════════════════════════════════════════════
   SECTION 8 — TESTIMONIALS
   ═══════════════════════════════════════════════════════════ */
function TestimonialsSection() {
  const testimonials = [
    {
      text: 'MenuMate changed everything. We get 40+ orders daily through QR now. No more wrong orders!',
      name: 'Rajesh Patel',
      restaurant: 'Brew House Cafe',
      initials: 'RP',
      color: '#E63946',
    },
    {
      text: 'The stamp card feature alone has brought back 30% of our customers. Best investment ever.',
      name: 'Priya Sharma',
      restaurant: 'The Spice Kitchen',
      initials: 'PS',
      color: '#FF9500',
    },
    {
      text: 'Setup was done in one day. My customers love the digital menu. I love the WhatsApp orders.',
      name: 'Amit Desai',
      restaurant: 'Pizza Planet',
      initials: 'AD',
      color: '#34C759',
    },
  ]

  return (
    <section style={{ background: `radial-gradient(ellipse 60% 40% at 70% 50%, rgba(230,57,70,0.04) 0%, transparent 60%), ${T.bg}`, padding: '80px clamp(16px, 5vw, 40px)' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <AnimatedSection>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <SectionLabel text="TESTIMONIALS" />
            <h2
              style={{
                fontSize: 'clamp(28px, 4vw, 40px)',
                fontWeight: 800,
                color: T.textPrimary,
                marginTop: 12,
                letterSpacing: '-0.03em',
              }}
            >
              Restaurant owners love it
            </h2>
          </div>
        </AnimatedSection>

        <div
          style={{
            display: 'grid',
            gap: 20,
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))',
          }}
        >
          {testimonials.map((t, i) => (
            <AnimatedSection key={i} delay={i * 120}>
              <div
                className="testimonial-card"
                style={{
                  background: T.surface,
                  border: `1px solid ${T.cardBorder}`,
                  borderRadius: 16,
                  padding: 28,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'relative',
                  overflow: 'hidden',
                  zIndex: 0,
                  transition: 'border-color 300ms ease, box-shadow 300ms ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(230,57,70,0.3)'
                  e.currentTarget.style.boxShadow = '0 0 30px rgba(230,57,70,0.08)'
                  e.currentTarget.classList.add('testimonial-card-hover')
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = T.cardBorder
                  e.currentTarget.style.boxShadow = 'none'
                  e.currentTarget.classList.remove('testimonial-card-hover')
                }}
              >
                <MessageCircle size={24} color={T.accent} style={{ opacity: 0.6 }} />
                <p
                  style={{
                    fontSize: 15,
                    color: 'rgba(255,255,255,0.8)',
                    fontStyle: 'italic',
                    lineHeight: 1.7,
                    marginTop: 16,
                    flex: 1,
                  }}
                >
                  &ldquo;{t.text}&rdquo;
                </p>
                <div style={{ display: 'flex', gap: 2, marginTop: 16 }}>
                  {[...Array(5)].map((_, si) => (
                    <Star
                      key={si}
                      size={14}
                      color={T.accent}
                      fill={T.accent}
                      className="testimonial-star"
                      style={{
                        opacity: 0,
                        animation: `starFadeIn 0.4s ease forwards ${i * 0.15 + si * 0.08}s`,
                      }}
                    />
                  ))}
                </div>
                <div style={{ marginTop: 12 }}>
                  <div style={{
                    width: 44,
                    height: 44,
                    borderRadius: '50%',
                    background: `${t.color}20`,
                    border: `1px solid ${t.color}40`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 12,
                  }}>
                    <span style={{
                      fontSize: 16,
                      fontWeight: 700,
                      color: t.color,
                    }}>
                      {t.initials}
                    </span>
                  </div>
                  <p style={{ fontSize: 14, fontWeight: 600, color: T.textPrimary }}>
                    {t.name}
                  </p>
                  <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>
                    {t.restaurant}
                  </p>
                </div>
              </div>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ═══════════════════════════════════════════════════════════
   SECTION — STATS COUNTER
   ═══════════════════════════════════════════════════════════ */
function StatCounter({ target, suffix, label, duration = 2000, formatter }: { target: number; suffix: string; label: string; duration?: number; formatter?: (n: number) => string }) {
  const { count, done, ref } = useCountUp(target, duration)
  return (
    <div ref={ref} style={{ textAlign: 'center', padding: '20px 16px' }}>
      <div
        className={done ? 'stat-pulse' : ''}
        style={{
          fontSize: 'clamp(32px, 5vw, 48px)',
          fontWeight: 800,
          color: T.accent,
          letterSpacing: '-0.03em',
          lineHeight: 1,
          position: 'relative',
          display: 'inline-block',
        }}
      >
        {formatter ? formatter(count) : count}{suffix}
        {done && (
          <div
            style={{
              position: 'absolute',
              bottom: -6,
              left: '10%',
              right: '10%',
              height: 3,
              borderRadius: 2,
              background: `linear-gradient(90deg, transparent, ${T.accent}, transparent)`,
              boxShadow: `0 0 12px ${T.accent}, 0 0 24px rgba(230,57,70,0.3)`,
              animation: 'glowUnderline 2s ease-in-out infinite',
            }}
          />
        )}
      </div>
      <p
        style={{
          fontSize: 14,
          color: T.textSecondary,
          marginTop: 8,
          lineHeight: 1.5,
        }}
      >
        {label}
      </p>
    </div>
  )
}

function StatsCounterSection() {
  const stats = [
    { target: 50, suffix: '+', label: 'Restaurants using MenuMate' },
    { target: 10000, suffix: '+', label: 'Orders processed' },
    { target: 999, suffix: '%', label: 'Uptime', duration: 2500, formatter: (n: number) => (n / 10).toFixed(1) },
    { target: 24, suffix: 'hr', label: 'Setup time' },
  ]

  return (
    <section
      style={{
        background: `radial-gradient(ellipse at center, ${T.accentGlow} 0%, transparent 70%), ${T.surface}`,
        padding: '80px clamp(16px, 5vw, 40px)',
      }}
    >
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <AnimatedSection>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <SectionLabel text="BY THE NUMBERS" />
            <h2
              style={{
                fontSize: 'clamp(28px, 4vw, 40px)',
                fontWeight: 800,
                color: T.textPrimary,
                marginTop: 12,
                letterSpacing: '-0.03em',
              }}
            >
              Trusted by restaurants across Surat
            </h2>
          </div>
        </AnimatedSection>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))',
            gap: 24,
          }}
        >
          {stats.map((s, i) => (
            <AnimatedSection key={i} delay={i * 100}>
              <div
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: `1px solid ${T.cardBorder}`,
                  borderRadius: 16,
                  padding: '28px 16px',
                }}
              >
                <StatCounter target={s.target} suffix={s.suffix} label={s.label} duration={s.duration} formatter={s.formatter} />
              </div>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ═══════════════════════════════════════════════════════════
   SECTION — FAQ
   ═══════════════════════════════════════════════════════════ */
function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false)
  const [maxH, setMaxH] = useState(0)
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open && contentRef.current) {
      setMaxH(contentRef.current.scrollHeight)
    }
  }, [open])

  return (
    <div
      style={{
        background: open ? 'rgba(230,57,70,0.03)' : T.surface,
        border: `1px solid ${open ? T.cardBorderHover : T.cardBorder}`,
        borderRadius: 12,
        overflow: 'hidden',
        transition: 'border-color 200ms ease, background-color 200ms ease',
      }}
    >
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          padding: '20px 24px',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        <span
          style={{
            fontSize: 16,
            fontWeight: 600,
            color: T.textPrimary,
            lineHeight: 1.4,
          }}
        >
          {question}
        </span>
        <ChevronDown
          size={20}
          color={T.textSecondary}
          className="faq-chevron"
          style={{
            flexShrink: 0,
            transition: 'transform 300ms cubic-bezier(0.4,0,0.2,1)',
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
        />
      </button>
      <div
        style={{
          maxHeight: open ? maxH : 0,
          overflow: 'hidden',
          transition: 'max-height 400ms cubic-bezier(0.4,0,0.2,1)',
        }}
      >
        <div ref={contentRef} style={{ padding: '0 24px 20px' }}>
          <p
            style={{
              fontSize: 14,
              color: T.textSecondary,
              lineHeight: 1.7,
            }}
          >
            {answer}
          </p>
        </div>
      </div>
    </div>
  )
}

function FAQSection() {
  const faqs = [
    {
      question: 'How does MenuMate work?',
      answer: 'Customers scan your unique QR code, browse your digital menu on their phone, and place an order. You receive the order instantly on WhatsApp.',
    },
    {
      question: 'Do I need any hardware?',
      answer: 'No! Just a phone with WhatsApp. We handle everything else — hosting, menu updates, order management.',
    },
    {
      question: 'How long does setup take?',
      answer: 'We can have your restaurant live within 24 hours. Just send us your menu and we do the rest.',
    },
    {
      question: 'What if my menu changes?',
      answer: 'Update your menu anytime from the dashboard — changes go live instantly. No reprinting, no cost.',
    },
    {
      question: 'Is there a free trial?',
      answer: 'Yes! Start with our BASIC plan for free. Upgrade to PRO anytime for advanced features like loyalty stamps and analytics.',
    },
    {
      question: 'How do I get paid?',
      answer: 'Customers pay directly at your restaurant. MenuMate handles the ordering — you keep 100% of your revenue. Zero commission.',
    },
  ]

  return (
    <section id="faq" style={{ background: `radial-gradient(ellipse 80% 50% at 50% 100%, rgba(230,57,70,0.03) 0%, transparent 60%), ${T.bg}`, padding: '80px clamp(16px, 5vw, 40px)' }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        <AnimatedSection>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <SectionLabel text="FAQ" />
            <h2
              style={{
                fontSize: 'clamp(28px, 4vw, 40px)',
                fontWeight: 800,
                color: T.textPrimary,
                marginTop: 12,
                letterSpacing: '-0.03em',
              }}
            >
              Frequently asked questions
            </h2>
            <p style={{ fontSize: 16, color: T.textSecondary, marginTop: 8 }}>
              Everything you need to know about MenuMate
            </p>
          </div>
        </AnimatedSection>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {faqs.map((faq, i) => (
            <AnimatedSection key={i} delay={i * 60}>
              <FAQItem question={faq.question} answer={faq.answer} />
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ═══════════════════════════════════════════════════════════
   SECTION 9 — INQUIRY FORM
   ═══════════════════════════════════════════════════════════ */
function InquiryForm() {
  const [form, setForm] = useState({
    restaurantName: '',
    ownerName: '',
    phone: '',
    city: 'Surat',
    plan: 'basic',
  })
  const [submitting, setSubmitting] = useState(false)

  const cities = ['Surat', 'Ahmedabad', 'Vadodara', 'Rajkot', 'Other']

  const handleSubmit = useCallback(() => {
    if (!form.restaurantName || !form.ownerName || !form.phone) {
      return
    }
    setSubmitting(true)
    const message = `Hi MenuMate! 🍽️

Restaurant: ${form.restaurantName}
Name: ${form.ownerName}
City: ${form.city}
Plan: ${form.plan === 'basic' ? 'Basic (₹999/mo)' : 'Pro (₹1,499/mo)'}

I want to get started with MenuMate.`

    window.open(waLink(message), '_blank')
    setTimeout(() => setSubmitting(false), 2000)
  }, [form])

  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: '14px 16px',
    color: T.textPrimary,
    fontSize: 16,
    outline: 'none',
    fontFamily: 'inherit',
    transition: 'border-color 150ms, background 150ms',
    boxSizing: 'border-box',
  }

  const labelStyle: React.CSSProperties = {
    fontSize: 12,
    fontWeight: 600,
    color: T.iconMuted,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    marginBottom: 6,
    display: 'block',
  }

  const isFormValid = form.restaurantName && form.ownerName && form.phone

  return (
    <section id="get-started" style={{ background: T.sectionAlt, padding: '80px clamp(16px, 5vw, 40px)' }}>
      <div style={{ maxWidth: 560, margin: '0 auto' }}>
        <AnimatedSection>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <SectionLabel text="GET STARTED" />
            <h2
              style={{
                fontSize: 'clamp(28px, 4vw, 36px)',
                fontWeight: 800,
                color: T.textPrimary,
                marginTop: 12,
                letterSpacing: '-0.03em',
              }}
            >
              Let&apos;s set up your restaurant
            </h2>
            <p style={{ fontSize: 16, color: T.textSecondary, marginTop: 8, lineHeight: 1.6 }}>
              Fill this form. We&apos;ll call you within 2 hours and set everything up in 24 hours.
            </p>
          </div>
        </AnimatedSection>

        <AnimatedSection delay={150}>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleSubmit()
            }}
            style={{
              background: T.surface,
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 20,
              padding: 'clamp(20px, 5vw, 32px)',
              display: 'flex',
              flexDirection: 'column',
              gap: 20,
            }}
          >
            {/* Restaurant Name */}
            <div>
              <label style={labelStyle}>Restaurant Name *</label>
              <input
                type="text"
                placeholder="The Brew House"
                value={form.restaurantName}
                onChange={(e) => setForm({ ...form, restaurantName: e.target.value })}
                style={inputStyle}
                onFocus={(e) => {
                  e.target.style.borderColor = 'rgba(230,57,70,0.5)'
                  e.target.style.background = 'rgba(230,57,70,0.03)'
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(255,255,255,0.1)'
                  e.target.style.background = 'rgba(255,255,255,0.05)'
                }}
              />
            </div>

            {/* Your Name */}
            <div>
              <label style={labelStyle}>Your Name *</label>
              <input
                type="text"
                placeholder="Rajesh Patel"
                value={form.ownerName}
                onChange={(e) => setForm({ ...form, ownerName: e.target.value })}
                style={inputStyle}
                onFocus={(e) => {
                  e.target.style.borderColor = 'rgba(230,57,70,0.5)'
                  e.target.style.background = 'rgba(230,57,70,0.03)'
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(255,255,255,0.1)'
                  e.target.style.background = 'rgba(255,255,255,0.05)'
                }}
              />
            </div>

            {/* WhatsApp Number */}
            <div>
              <label style={labelStyle}>WhatsApp Number *</label>
              <div style={{ position: 'relative' }}>
                <span
                  style={{
                    position: 'absolute',
                    left: 16,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'rgba(255,255,255,0.4)',
                    fontSize: 16,
                    fontWeight: 500,
                    pointerEvents: 'none',
                  }}
                >
                  +91
                </span>
                <input
                  type="tel"
                  placeholder="98765 43210"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  style={{ ...inputStyle, paddingLeft: 52 }}
                  onFocus={(e) => {
                    e.target.style.borderColor = 'rgba(230,57,70,0.5)'
                    e.target.style.background = 'rgba(230,57,70,0.03)'
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'rgba(255,255,255,0.1)'
                    e.target.style.background = 'rgba(255,255,255,0.05)'
                  }}
                />
              </div>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', marginTop: 4 }}>
                We&apos;ll call you on this number only
              </p>
            </div>

            {/* City */}
            <div>
              <label style={labelStyle}>Your City *</label>
              <select
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                style={{
                  ...inputStyle,
                  appearance: 'none',
                  WebkitAppearance: 'none',
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1.5L6 6.5L11 1.5' stroke='rgba(255,255,255,0.4)' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 16px center',
                  paddingRight: 40,
                  cursor: 'pointer',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = 'rgba(230,57,70,0.5)'
                  e.target.style.background = 'rgba(230,57,70,0.03)'
                  e.target.style.backgroundImage = `url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1.5L6 6.5L11 1.5' stroke='rgba(230,57,70,0.7)' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`
                  e.target.style.backgroundRepeat = 'no-repeat'
                  e.target.style.backgroundPosition = 'right 16px center'
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(255,255,255,0.1)'
                  e.target.style.background = 'rgba(255,255,255,0.05)'
                  e.target.style.backgroundImage = `url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1.5L6 6.5L11 1.5' stroke='rgba(255,255,255,0.4)' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`
                  e.target.style.backgroundRepeat = 'no-repeat'
                  e.target.style.backgroundPosition = 'right 16px center'
                }}
              >
                {cities.map((c) => (
                  <option key={c} value={c} style={{ background: '#111', color: '#fff' }}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Plan Selection */}
            <div>
              <label style={labelStyle}>Plan Interested In *</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {(['basic', 'pro'] as const).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setForm({ ...form, plan: p })}
                    style={{
                      padding: '14px 16px',
                      borderRadius: 12,
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: 14,
                      fontWeight: 600,
                      textAlign: 'center',
                      background: form.plan === p ? T.accent : 'rgba(255,255,255,0.05)',
                      color: form.plan === p ? '#FFFFFF' : 'rgba(255,255,255,0.6)',
                      transition: 'all 150ms',
                    }}
                  >
                    {p === 'basic' ? 'BASIC' : 'PRO'} — {p === 'basic' ? '₹999/mo' : '₹1,499/mo'}
                  </button>
                ))}
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={!isFormValid || submitting}
              style={{
                width: '100%',
                height: 56,
                borderRadius: 100,
                background: isFormValid ? T.waGreen : 'rgba(255,255,255,0.1)',
                color: '#FFFFFF',
                fontSize: 16,
                fontWeight: 700,
                border: 'none',
                cursor: isFormValid ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                boxShadow: isFormValid ? '0 0 30px rgba(37,211,102,0.25)' : 'none',
                transition: 'all 150ms',
                marginTop: 4,
                opacity: isFormValid ? 1 : 0.5,
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="#FFFFFF">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              Send on WhatsApp →
            </button>

            <p
              style={{
                textAlign: 'center',
                fontSize: 12,
                color: 'rgba(255,255,255,0.25)',
              }}
            >
              By submitting you agree to be contacted on WhatsApp
            </p>
          </form>
        </AnimatedSection>
      </div>
    </section>
  )
}

/* ═══════════════════════════════════════════════════════════
   SECTION 10 — FOOTER
   ═══════════════════════════════════════════════════════════ */
function FooterSection() {
  const footerLinks = [
    { label: 'How it Works', href: '#how-it-works' },
    { label: 'Features', href: '#features' },
    { label: 'Pricing', href: '#pricing' },
    { label: 'FAQ', href: '#faq' },
  ]

  return (
    <footer
      style={{
        background: '#080808',
        borderTop: '1px solid transparent',
        borderImage: 'linear-gradient(90deg, transparent, rgba(230,57,70,0.3), transparent) 1',
        padding: '60px clamp(16px, 5vw, 40px) 32px',
      }}
    >
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))',
            gap: 40,
            marginBottom: 40,
          }}
        >
          {/* Logo & Tagline */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <UtensilsCrossed size={20} color={T.accent} strokeWidth={2.2} />
              <span style={{ fontWeight: 700, fontSize: 18, color: T.textPrimary, letterSpacing: '-0.03em' }}>
                MenuMate
              </span>
            </div>
            <p style={{ fontSize: 14, color: T.textSecondary, lineHeight: 1.6 }}>
              Digital menus that sell
            </p>
          </div>

          {/* Navigation */}
          <div>
            <h4 style={{ fontSize: 12, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 16 }}>
              Navigation
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {footerLinks.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  style={{
                    fontSize: 14,
                    color: T.textSecondary,
                    textDecoration: 'none',
                    transition: 'color 200ms, transform 200ms ease',
                    display: 'inline-block',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = T.textPrimary
                    e.currentTarget.style.transform = 'translateX(4px)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = T.textSecondary
                    e.currentTarget.style.transform = 'translateX(0)'
                  }}
                >
                  {l.label}
                </a>
              ))}
            </div>
          </div>

          {/* Contact */}
          <div>
            <h4 style={{ fontSize: 12, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 16 }}>
              Contact
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button
                onClick={() => window.open(waLink('Hi MenuMate!'), '_blank')}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 14,
                  color: T.waGreen,
                  fontWeight: 500,
                  padding: 0,
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  transition: 'opacity 200ms, transform 200ms ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.opacity = '0.8'
                  e.currentTarget.style.transform = 'translateX(4px)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = '1'
                  e.currentTarget.style.transform = 'translateX(0)'
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill={T.waGreen}>
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                WhatsApp Us
              </button>
              <a
                href="mailto:hello@menumate.in"
                style={{
                  fontSize: 14,
                  color: T.textSecondary,
                  textDecoration: 'none',
                  transition: 'color 200ms, transform 200ms ease',
                  display: 'inline-block',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = T.textPrimary
                  e.currentTarget.style.transform = 'translateX(4px)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = T.textSecondary
                  e.currentTarget.style.transform = 'translateX(0)'
                }}
              >
                hello@menumate.in
              </a>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div
          style={{
            height: 1,
            background: 'rgba(255,255,255,0.06)',
            marginBottom: 24,
          }}
        />

        {/* Copyright */}
        <p
          style={{
            textAlign: 'center',
            fontSize: 13,
            color: 'rgba(255,255,255,0.25)',
          }}
        >
          © 2024 MenuMate. All rights reserved.
        </p>
      </div>
    </footer>
  )
}

/* ═══════════════════════════════════════════════════════════
   COOKIE CONSENT BANNER
   ═══════════════════════════════════════════════════════════ */
function CookieConsent() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const consent = localStorage.getItem('menumate-cookie-consent')
    if (!consent) {
      const t = setTimeout(() => setVisible(true), 1500)
      return () => clearTimeout(t)
    }
  }, [])

  const handleAccept = () => {
    localStorage.setItem('menumate-cookie-consent', 'accepted')
    setVisible(false)
  }

  const handleDecline = () => {
    localStorage.setItem('menumate-cookie-consent', 'declined')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div
      className="cookie-consent-enter"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 60,
        background: 'var(--mm-surface, #111111)',
        borderTop: '1px solid var(--mm-card-border, rgba(255,255,255,0.06))',
        padding: '16px clamp(16px, 5vw, 40px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
        flexWrap: 'wrap',
        boxShadow: '0 -4px 20px rgba(0,0,0,0.3)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: '1 1 auto', minWidth: 200 }}>
        <Cookie size={20} color={T.accent} style={{ flexShrink: 0 }} />
        <p style={{ fontSize: 13, color: T.textSecondary, lineHeight: 1.5, margin: 0 }}>
          We use cookies to enhance your experience. By continuing to visit this site you agree to our use of cookies.
        </p>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        <button
          onClick={handleDecline}
          style={{
            fontSize: 13,
            fontWeight: 500,
            color: T.textSecondary,
            background: 'transparent',
            border: `1px solid ${T.btnGhostBorder}`,
            borderRadius: 100,
            padding: '8px 18px',
            cursor: 'pointer',
            transition: 'background 150ms',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = T.btnGhostHover)}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
        >
          Decline
        </button>
        <button
          onClick={handleAccept}
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: '#FFFFFF',
            background: T.accent,
            border: 'none',
            borderRadius: 100,
            padding: '8px 18px',
            cursor: 'pointer',
            boxShadow: '0 0 12px rgba(230,57,70,0.3)',
            transition: 'filter 150ms',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.filter = 'brightness(1.1)')}
          onMouseLeave={(e) => (e.currentTarget.style.filter = 'brightness(1)')}
        >
          Accept
        </button>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════
   SCROLL TO TOP BUTTON (with progress indicator)
   ═══════════════════════════════════════════════════════════ */
function ScrollToTopButton() {
  const [visible, setVisible] = useState(false)
  const [bounce, setBounce] = useState(false)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    let prev = false
    const onScroll = () => {
      const show = window.scrollY > 400
      if (show && !prev) setBounce(true)
      setVisible(show)
      prev = show

      /* Calculate scroll progress */
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight
      const scrolled = scrollHeight > 0 ? window.scrollY / scrollHeight : 0
      setProgress(Math.min(scrolled, 1))
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (bounce) {
      const t = setTimeout(() => setBounce(false), 500)
      return () => clearTimeout(t)
    }
  }, [bounce])

  /* SVG circle properties */
  const size = 48
  const strokeWidth = 3
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const dashOffset = circumference - progress * circumference

  return (
    <button
      className={bounce ? 'scroll-top-bounce' : ''}
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      aria-label="Scroll to top"
      style={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        zIndex: 50,
        width: size,
        height: size,
        borderRadius: '50%',
        background: 'transparent',
        border: 'none',
        cursor: visible ? 'pointer' : 'default',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'opacity 300ms ease',
        opacity: visible ? 1 : 0,
        pointerEvents: visible ? 'auto' : 'none',
        padding: 0,
      }}
    >
      {/* Progress ring */}
      <svg
        width={size}
        height={size}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          transform: 'rotate(-90deg)',
        }}
      >
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--mm-card-border, rgba(255,255,255,0.1))"
          strokeWidth={strokeWidth}
        />
        {/* Progress arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--mm-accent, #E63946)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          style={{ transition: 'stroke-dashoffset 100ms ease' }}
        />
      </svg>
      {/* Inner circle + arrow */}
      <div
        style={{
          width: size - strokeWidth * 2 - 4,
          height: size - strokeWidth * 2 - 4,
          borderRadius: '50%',
          background: 'var(--mm-accent, #E63946)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 20px rgba(230,57,70,0.4)',
          transition: 'transform 200ms ease',
        }}
        onMouseEnter={(e) => visible && (e.currentTarget.style.transform = 'translateY(-2px)')}
        onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
      >
        <ArrowUp size={16} color="#FFFFFF" />
      </div>
    </button>
  )
}

/* ═══════════════════════════════════════════════════════════
   MAIN LANDING PAGE
   ═══════════════════════════════════════════════════════════ */
export default function LandingPage() {
  return (
    <div style={{ background: T.bg, color: T.textPrimary }}>
      <Navbar />
      <HeroSection />
      <TrustedBySection />
      <ProblemSolutionSection />
      <HowItWorksSection />
      <DemoSection />
      <FeaturesSection />
      <ComparisonSection />
      <CTABanner />
      <RestaurantShowcaseSection />
      <PricingSection />
      <TestimonialsSection />
      <StatsCounterSection />
      <FAQSection />
      <InquiryForm />
      <FooterSection />
      <ScrollToTopButton />
      <CookieConsent />

      <style jsx global>{`
        /* ── Marquee scroll animation ── */
        @keyframes marqueeScroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .marquee-track:hover {
          animation-play-state: paused;
        }

        /* ── Stat counter pulse (bounce) ── */
        @keyframes statPulse {
          0% { transform: scale(1); }
          30% { transform: scale(1.05); }
          60% { transform: scale(0.98); }
          80% { transform: scale(1.01); }
          100% { transform: scale(1); }
        }
        .stat-pulse {
          animation: statPulse 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        /* ── Stat glow underline ── */
        @keyframes glowUnderline {
          0%, 100% { opacity: 0.7; }
          50% { opacity: 1; }
        }

        /* ── Testimonial gradient shimmer ── */
        .testimonial-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: -150%;
          width: 100%;
          height: 100%;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(230,57,70,0.12),
            rgba(230,57,70,0.22),
            rgba(230,57,70,0.12),
            transparent
          );
          z-index: -1;
          pointer-events: none;
        }
        .testimonial-card-hover::before {
          animation: testimonialShimmer 1.2s ease forwards;
        }
        @keyframes testimonialShimmer {
          0% { left: -150%; }
          100% { left: 150%; }
        }

        /* ── Pricing card shimmer ── */
        .pricing-shimmer::after {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 60%;
          height: 100%;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255,255,255,0.04),
            rgba(255,255,255,0.07),
            rgba(255,255,255,0.04),
            transparent
          );
          animation: pricingShimmer 4s ease-in-out infinite;
          pointer-events: none;
          z-index: 1;
        }
        @keyframes pricingShimmer {
          0% { left: -100%; }
          100% { left: 200%; }
        }

        /* ── Popular badge pulse + glow ── */
        @keyframes badgePulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(230,57,70,0.5), 0 0 12px rgba(230,57,70,0.3); }
          50% { box-shadow: 0 0 0 8px rgba(230,57,70,0), 0 0 20px rgba(230,57,70,0.5); }
        }
        .popular-badge {
          animation: badgePulse 2s ease-in-out infinite;
        }

        /* ── Scroll-to-top bounce ── */
        @keyframes scrollTopBounce {
          0% { transform: translateY(20px); opacity: 0; }
          50% { transform: translateY(-4px); opacity: 1; }
          70% { transform: translateY(2px); }
          100% { transform: translateY(0); }
        }
        .scroll-top-bounce {
          animation: scrollTopBounce 0.5s ease-out;
        }

        /* ── Testimonial star staggered fade-in ── */
        @keyframes starFadeIn {
          0% { opacity: 0; transform: scale(0.5); }
          60% { opacity: 1; transform: scale(1.15); }
          100% { opacity: 1; transform: scale(1); }
        }
        .testimonial-star {
          display: inline-block;
        }

        /* ── Pro card animated gradient border ── */
        @property --border-angle {
          syntax: '<angle>';
          initial-value: 0deg;
          inherits: false;
        }
        .pro-gradient-border::before {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: 20px;
          padding: 2px;
          background: conic-gradient(from var(--border-angle), #E63946, #FF6B6B, #E63946, #B71C1C, #E63946);
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          z-index: 0;
          pointer-events: none;
          animation: rotateGradientBorder 4s linear infinite;
        }
        @keyframes rotateGradientBorder {
          to { --border-angle: 360deg; }
        }
      `}</style>
    </div>
  )
}
