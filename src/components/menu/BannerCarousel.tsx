'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import type { Banner } from '@/types'
import type { MenuTheme } from '@/lib/themes'
import { ArrowRight } from 'lucide-react'
import { handleImgError } from '@/lib/utils'

// ═══════════════════════════════════════════════════════════════
// ─── Theme-Aware Premium Banner Carousel ──────────────────────
// ─── Scroll-snap, auto-rotate 3.5s, touch swipe, dot nav ────
// ═══════════════════════════════════════════════════════════════

interface BannerCarouselProps {
  banners: Banner[]
  theme: MenuTheme
}

export default function BannerCarousel({ banners, theme }: BannerCarouselProps) {
  const [active, setActive] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const touchStartX = useRef(0)
  const touchStartY = useRef(0)
  const activeRef = useRef(0)

  // Keep ref in sync
  useEffect(() => {
    activeRef.current = active
  }, [active])

  // Scroll to a specific slide smoothly
  const scrollToSlide = useCallback((index: number) => {
    const container = containerRef.current
    if (!container) return
    const slideWidth = container.clientWidth
    container.scrollTo({ left: slideWidth * index, behavior: 'smooth' })
    setActive(index)
  }, [])

  // Go to next/prev slide (programmatic navigation)
  const goToSlide = useCallback((updater: number | ((prev: number) => number)) => {
    setActive((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater
      activeRef.current = next
      const container = containerRef.current
      if (container) {
        const slideWidth = container.clientWidth
        container.scrollTo({ left: slideWidth * next, behavior: 'smooth' })
      }
      return next
    })
  }, [])

  // Auto-advance every 3.5 seconds
  useEffect(() => {
    if (banners.length <= 1) return
    const interval = setInterval(() => {
      goToSlide((prev) => (prev + 1) % banners.length)
    }, 3500)
    return () => clearInterval(interval)
  }, [banners.length, goToSlide])

  // Track scroll position to update active dot
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleScroll = () => {
      const slideWidth = container.clientWidth
      if (slideWidth === 0) return
      const index = Math.round(container.scrollLeft / slideWidth)
      if (index !== active && index >= 0 && index < banners.length) {
        setActive(index)
      }
    }

    container.addEventListener('scroll', handleScroll, { passive: true })
    return () => container.removeEventListener('scroll', handleScroll)
  }, [active, banners.length])

  // Touch swipe handling with 50px threshold
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    const diffX = e.changedTouches[0].clientX - touchStartX.current
    const diffY = e.changedTouches[0].clientY - touchStartY.current
    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 50) {
      if (diffX > 0) {
        goToSlide((prev) => (prev - 1 + banners.length) % banners.length)
      } else {
        goToSlide((prev) => (prev + 1) % banners.length)
      }
    }
  }

  // CTA: scroll to menu content section
  const handleOrderNow = () => {
    document.getElementById('menu-content-start')?.scrollIntoView({ behavior: 'smooth' })
  }

  if (banners.length === 0) return null

  return (
    <div style={{ width: '100%' }}>
      <div
        ref={containerRef}
        className="scrollbar-hide"
        style={{
          overflowX: 'auto',
          display: 'flex',
          scrollSnapType: 'x mandatory',
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none',
        }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {banners.map((banner) => (
          <div
            key={banner.id}
            className="relative flex-shrink-0"
            style={{
              minWidth: '100%',
              width: '100%',
              scrollSnapAlign: 'start',
              height: '160px',
            }}
          >
            {/* Image or placeholder */}
            {banner.image_url ? (
              <img
                src={banner.image_url}
                alt={banner.title || 'Banner'}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  display: 'block',
                }}
                onError={handleImgError}
              />
            ) : (
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  background: theme.imagePlaceholder,
                }}
              />
            )}

            {/* Dark gradient overlay */}
            <div
              className="absolute inset-0"
              style={{
                background: theme.bannerOverlay,
                pointerEvents: 'none',
              }}
            />

            {/* Title text */}
            {banner.title && (
              <p
                className="absolute"
                style={{
                  bottom: '36px',
                  left: '16px',
                  color: theme.bannerText,
                  fontSize: '16px',
                  fontWeight: 700,
                  textShadow: '0 1px 6px rgba(0,0,0,0.5)',
                  fontFamily: "-apple-system, 'SF Pro Display', system-ui, sans-serif",
                  maxWidth: 'calc(100% - 32px)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {banner.title}
              </p>
            )}

            {/* CTA Button */}
            <button
              className="absolute"
              style={{
                bottom: '12px',
                left: '16px',
                height: '32px',
                padding: '0 16px',
                borderRadius: '100px',
                background: theme.accent,
                color: theme.accentText,
                fontSize: '12px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                border: 'none',
                cursor: 'pointer',
                boxShadow: theme.addBtnShadow,
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
                fontFamily: "-apple-system, 'SF Pro Display', system-ui, sans-serif",
                letterSpacing: '0.02em',
                transition: 'transform 150ms ease, box-shadow 150ms ease',
              }}
              onClick={handleOrderNow}
              onMouseDown={(e) => {
                ;(e.currentTarget as HTMLElement).style.transform = 'scale(0.96)'
              }}
              onMouseUp={(e) => {
                ;(e.currentTarget as HTMLElement).style.transform = 'scale(1)'
              }}
              onMouseLeave={(e) => {
                ;(e.currentTarget as HTMLElement).style.transform = 'scale(1)'
              }}
            >
              Order Now
              <ArrowRight size={12} strokeWidth={2.5} />
            </button>

            {/* Dot indicators */}
            {banners.length > 1 && (
              <div
                className="absolute flex"
                style={{ bottom: '10px', right: '12px', gap: '4px' }}
              >
                {banners.map((_, i) => (
                  <div
                    key={i}
                    style={{
                      width: '5px',
                      height: '5px',
                      borderRadius: '50%',
                      background: i === active
                        ? '#FFFFFF'
                        : 'rgba(255,255,255,0.35)',
                      transition: 'background 200ms ease',
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
