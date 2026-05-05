'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import { LayoutDashboard, Store, LogOut, CreditCard, UtensilsCrossed } from 'lucide-react'

const navLinks = [
  { href: '/admin', label: 'Overview', icon: LayoutDashboard },
  { href: '/admin/restaurants', label: 'Restaurants', icon: Store },
  { href: '/admin/payments', label: 'Payments', icon: CreditCard },
]

export default function AdminTopNavClient() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const email = session?.user?.email || ''
  const initial = email ? email.charAt(0).toUpperCase() : 'A'

  return (
    <>
      {/* ── Desktop / Tablet Header ── */}
      <header
        className="sticky top-0 z-40 hidden md:flex items-center justify-between"
        style={{
          height: '52px',
          background: 'rgba(10,10,10,0.9)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          padding: '0 32px',
        }}
      >
        {/* Left: Logo + Divider + ADMIN badge */}
        <Link
          href="/admin"
          className="flex items-center gap-3 min-h-[44px]"
        >
          <span
            className="flex items-center justify-center"
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '8px',
              background: '#E63946',
            }}
          >
            <UtensilsCrossed className="w-[14px] h-[14px] text-white" />
          </span>
          <span
            className="text-white font-bold"
            style={{ fontSize: '14px' }}
          >
            MenuMate
          </span>
          <span
            style={{
              width: '1px',
              height: '20px',
              background: 'rgba(255,255,255,0.15)',
            }}
          />
          <span
            style={{
              background: 'rgba(230,57,70,0.15)',
              border: '1px solid rgba(230,57,70,0.3)',
              color: '#E63946',
              fontSize: '11px',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: '6px',
            }}
          >
            ADMIN
          </span>
        </Link>

        {/* Center: Navigation tabs */}
        <nav className="flex items-center gap-1">
          {navLinks.map((link) => {
            const isActive = pathname === link.href
            return (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-center gap-1.5 px-4 py-1.5 min-h-[44px] transition-all duration-150"
                style={{
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 500,
                  color: isActive ? '#FFFFFF' : 'rgba(255,255,255,0.45)',
                  background: isActive ? 'rgba(255,255,255,0.08)' : 'transparent',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) e.currentTarget.style.color = 'rgba(255,255,255,0.75)'
                }}
                onMouseLeave={(e) => {
                  if (!isActive) e.currentTarget.style.color = 'rgba(255,255,255,0.45)'
                }}
              >
                {link.label}
              </Link>
            )
          })}
        </nav>

        {/* Right: Avatar + Email + Logout */}
        <div className="flex items-center gap-3">
          <span
            className="flex items-center justify-center font-bold text-white"
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              background: '#E63946',
              fontSize: '12px',
            }}
          >
            {initial}
          </span>
          <span
            className="hidden lg:block"
            style={{
              fontSize: '12px',
              color: 'rgba(255,255,255,0.4)',
            }}
          >
            {email}
          </span>
          <button
            onClick={() => signOut({ redirect: true, callbackUrl: '/login' })}
            className="flex items-center gap-1.5 min-h-[44px] transition-all duration-150"
            style={{
              padding: '4px 12px',
              borderRadius: '8px',
              border: '1px solid rgba(255,255,255,0.1)',
              color: 'rgba(255,255,255,0.5)',
              fontSize: '12px',
              background: 'transparent',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)'
              e.currentTarget.style.color = '#FFFFFF'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'
              e.currentTarget.style.color = 'rgba(255,255,255,0.5)'
            }}
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">Logout</span>
          </button>
        </div>
      </header>

      {/* ── Mobile Header ── */}
      <header
        className="md:hidden sticky top-0 z-40 flex items-center justify-between"
        style={{
          height: '52px',
          background: 'rgba(10,10,10,0.9)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          padding: '0 16px',
        }}
      >
        {/* Logo + Divider + ADMIN badge */}
        <Link
          href="/admin"
          className="flex items-center gap-2.5 min-h-[44px]"
        >
          <span
            className="flex items-center justify-center"
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '8px',
              background: '#E63946',
            }}
          >
            <UtensilsCrossed className="w-[14px] h-[14px] text-white" />
          </span>
          <span className="text-white font-bold" style={{ fontSize: '14px' }}>
            MenuMate
          </span>
          <span
            style={{
              background: 'rgba(230,57,70,0.15)',
              border: '1px solid rgba(230,57,70,0.3)',
              color: '#E63946',
              fontSize: '11px',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: '6px',
            }}
          >
            ADMIN
          </span>
        </Link>

        {/* Avatar + Logout */}
        <div className="flex items-center gap-2">
          <span
            className="flex items-center justify-center font-bold text-white"
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              background: '#E63946',
              fontSize: '12px',
            }}
          >
            {initial}
          </span>
          <button
            onClick={() => signOut({ redirect: true, callbackUrl: '/login' })}
            className="flex items-center justify-center min-h-[44px] min-w-[44px] transition-all duration-150"
            style={{
              padding: '4px 8px',
              borderRadius: '8px',
              border: '1px solid rgba(255,255,255,0.1)',
              color: 'rgba(255,255,255,0.5)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)'
              e.currentTarget.style.color = '#FFFFFF'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'
              e.currentTarget.style.color = 'rgba(255,255,255,0.5)'
            }}
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* ── Mobile Bottom Nav ── */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40"
        style={{
          background: 'rgba(10,10,10,0.92)',
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          borderTop: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <div className="flex items-center justify-around" style={{ height: 'var(--bottom-nav-height)' }}>
          {navLinks.map((link) => {
            const isActive = pathname === link.href
            return (
              <Link
                key={link.href}
                href={link.href}
                className="flex flex-col items-center gap-0.5 min-w-[64px] min-h-[44px] justify-center transition-colors duration-150"
                style={{ color: isActive ? '#FFFFFF' : 'rgba(255,255,255,0.35)' }}
              >
                <link.icon className="w-5 h-5" />
                <span className="text-[10px] font-semibold tracking-tight">
                  {link.label}
                </span>
              </Link>
            )
          })}
          <button
            onClick={() => signOut({ redirect: true, callbackUrl: '/login' })}
            className="flex flex-col items-center gap-0.5 min-w-[64px] min-h-[44px] justify-center transition-colors duration-150"
            style={{ color: 'rgba(255,255,255,0.35)' }}
          >
            <LogOut className="w-5 h-5" />
            <span className="text-[10px] font-medium">Logout</span>
          </button>
        </div>
        <div style={{ height: 'var(--safe-bottom)' }} />
      </nav>
    </>
  )
}
