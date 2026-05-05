'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React, { useState, useCallback, useEffect, useRef } from 'react'
import { House, ClipboardList, UtensilsCrossed, Settings2, Image } from 'lucide-react'
import { useOrderBadgeStore, useRewardBadgeStore } from '@/lib/store'

const tabs = [
  { href: '/dashboard', label: 'Home', icon: House },
  { href: '/dashboard/orders', label: 'Orders', icon: ClipboardList },
  { href: '/dashboard/menu', label: 'Menu', icon: UtensilsCrossed },
  { href: '/dashboard/banners', label: 'Banners', icon: Image },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings2 },
]

export default function BottomNav() {
  const pathname = usePathname()
  const newCount = useOrderBadgeStore((s) => s.newCount)
  const activeRewards = useRewardBadgeStore((s) => s.activeCount)
  const setActiveRewards = useRewardBadgeStore((s) => s.setActiveCount)
  const navRef = useRef<HTMLElement>(null)
  const tabRefs = useRef<(HTMLAnchorElement | null)[]>([])

  const activeIndex = tabs.findIndex((tab) =>
    tab.href === '/dashboard'
      ? pathname === '/dashboard' || pathname === '/dashboard/'
      : pathname.startsWith(tab.href)
  )

  // Slide pill indicator behind active tab
  const [pillStyle, setPillStyle] = useState<React.CSSProperties>({})

  useEffect(() => {
    const el = tabRefs.current[activeIndex]
    const nav = navRef.current
    if (!el || !nav) return

    const navRect = nav.getBoundingClientRect()
    const elRect = el.getBoundingClientRect()

    setPillStyle({
      width: `${elRect.width}px`,
      transform: `translateX(${elRect.left - navRect.left}px) translateY(-50%)`,
    })
  }, [activeIndex])

  // Poll for active rewards every 30 seconds
  useEffect(() => {
    const fetchActiveRewards = async () => {
      try {
        const res = await fetch('/api/rewards?status=active')
        if (res.ok) {
          const data = await res.json()
          setActiveRewards(data.activeCount || 0)
        }
      } catch {
        // Silently fail
      }
    }

    fetchActiveRewards()
    const interval = setInterval(fetchActiveRewards, 30000)
    return () => clearInterval(interval)
  }, [setActiveRewards])

  return (
    <nav ref={navRef} className="dash-nav-float animate-dash-nav-enter" style={{ position: 'relative' }}>
      {/* Sliding active pill indicator */}
      {activeIndex >= 0 && (
        <span
          className="dash-nav-pill"
          style={{
            ...pillStyle,
            opacity: Object.keys(pillStyle).length > 0 ? 1 : 0,
          }}
        />
      )}
      {tabs.map((tab, i) => {
        const isActive = i === activeIndex

        const Icon = tab.icon
        const showBadge = tab.href === '/dashboard/orders' && newCount > 0
        const showRewardBadge = tab.href === '/dashboard/settings' && activeRewards > 0

        return (
          <NavLink
            key={tab.href}
            href={tab.href}
            isActive={isActive}
            ref={(el) => { tabRefs.current[i] = el }}
          >
            <div className="relative flex items-center justify-center" style={{ position: 'relative', zIndex: 1 }}>
              <Icon
                style={{
                  width: isActive ? 22 : 20,
                  height: isActive ? 22 : 20,
                  color: isActive ? 'var(--dash-accent)' : 'var(--dash-text-3)',
                  strokeWidth: isActive ? 2.2 : 1.5,
                  fill: 'none',
                  transition: 'all 200ms cubic-bezier(0.34, 1.56, 0.64, 1)',
                }}
              />
              {showBadge && (
                <span
                  className="absolute flex items-center justify-center font-bold animate-dash-live-pulse"
                  style={{
                    top: -7,
                    right: -8,
                    minWidth: 16,
                    height: 16,
                    borderRadius: 'var(--dash-radius-pill)',
                    background: '#ef4444',
                    fontSize: 9,
                    fontWeight: 800,
                    color: '#fff',
                    border: '2px solid var(--dash-bg)',
                    padding: '0 4px',
                    lineHeight: 1,
                  }}
                >
                  {newCount > 99 ? '99+' : newCount}
                </span>
              )}
              {showRewardBadge && (
                <span
                  className="absolute flex items-center justify-center font-bold animate-dash-live-pulse"
                  style={{
                    top: -7,
                    right: -8,
                    minWidth: 16,
                    height: 16,
                    borderRadius: 'var(--dash-radius-pill)',
                    background: '#22c55e',
                    fontSize: 9,
                    fontWeight: 800,
                    color: '#fff',
                    border: '2px solid var(--dash-bg)',
                    padding: '0 4px',
                    lineHeight: 1,
                  }}
                >
                  {activeRewards > 99 ? '99+' : activeRewards}
                </span>
              )}
            </div>
            <span
              style={{
                fontSize: 10,
                fontWeight: isActive ? 700 : 500,
                color: isActive ? 'var(--dash-accent)' : 'var(--dash-text-3)',
                transition: 'color 200ms',
                lineHeight: 1,
              }}
            >
              {tab.label}
            </span>
          </NavLink>
        )
      })}
    </nav>
  )
}

const NavLink = React.forwardRef<HTMLAnchorElement, {
  href: string
  isActive: boolean
  children: React.ReactNode
}>(function NavLink({ href, isActive, children, ref }, forwardedRef) {
  const [pressed, setPressed] = useState(false)
  const [bouncing, setBouncing] = useState(false)

  const handleDown = useCallback(() => setPressed(true), [])
  const handleUp = useCallback(() => {
    setPressed(false)
    setBouncing(true)
  }, [])
  const handleAnimationEnd = useCallback(() => setBouncing(false), [])

  return (
    <Link
      href={href}
      ref={ref}
      className={`dash-nav-item ${isActive ? 'dash-nav-item-active' : ''}`}
      style={{
        transform: pressed ? 'scale(0.9)' : 'scale(1)',
        transition: 'transform 150ms cubic-bezier(0.34, 1.56, 0.64, 1)',
      }}
      onMouseDown={handleDown}
      onMouseUp={handleUp}
      onMouseLeave={handleUp}
      onTouchStart={handleDown}
      onTouchEnd={handleUp}
    >
      {bouncing ? (
        <div
          className={bouncing ? 'animate-dash-nav-bounce' : ''}
          onAnimationEnd={handleAnimationEnd}
        >
          {children}
        </div>
      ) : (
        children
      )}
    </Link>
  )
})

NavLink.displayName = 'NavLink'
