'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { Banner } from '@/types'

interface BannerSliderProps {
  banners: Banner[]
}

export default function BannerSlider({ banners }: BannerSliderProps) {
  const total = banners.length
  const [current, setCurrent] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const goTo = useCallback((index: number) => {
    setCurrent(((index % total) + total) % total)
  }, [total])

  const goNext = useCallback(() => goTo(current + 1), [current, goTo])
  const goPrev = useCallback(() => goTo(current - 1), [current, goTo])

  // Auto-scroll every 4 seconds
  useEffect(() => {
    if (isPaused || total <= 1) return

    timerRef.current = setInterval(goNext, 4000)
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [isPaused, total, goNext])

  if (total === 0) return null

  return (
    <div
      className="menu-banner-slider"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setIsPaused(false)}
    >
      {/* Slides */}
      <div className="menu-banner-track" style={{ transform: `translateX(-${current * 100}%)` }}>
        {banners.map((banner) => (
          <div key={banner.id} className="menu-banner-slide">
            <img
              src={banner.image_url}
              alt={banner.title || 'Banner'}
              className="menu-banner-img"
              loading="lazy"
            />
            {/* Overlay */}
            {banner.title && (
              <div className="menu-banner-overlay">
                <h3 className="menu-banner-title">{banner.title}</h3>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Navigation arrows — only show on hover / desktop */}
      {total > 1 && (
        <>
          <button
            className="menu-banner-arrow menu-banner-arrow-left"
            onClick={goPrev}
            aria-label="Previous banner"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            className="menu-banner-arrow menu-banner-arrow-right"
            onClick={goNext}
            aria-label="Next banner"
          >
            <ChevronRight size={16} />
          </button>
        </>
      )}

      {/* Dots indicator */}
      {total > 1 && (
        <div className="menu-banner-dots">
          {banners.map((_, i) => (
            <button
              key={i}
              className={`menu-banner-dot ${i === current ? 'menu-banner-dot-active' : ''}`}
              onClick={() => goTo(i)}
              aria-label={`Go to banner ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
