'use client'

/**
 * SoundToggle — Accessible but non-prominent sound on/off button
 *
 * Props:
 *   context: 'customer' | 'dashboard'
 *   variant: 'menu' (small icon button) | 'settings' (labeled row)
 */

import { useState, useEffect } from 'react'
import {
  getCustomerSoundEnabled,
  getDashSoundEnabled,
  setCustomerSound,
  setDashSound,
  touchUnlock,
} from '@/lib/soundManager'

interface SoundToggleProps {
  context: 'customer' | 'dashboard'
  variant?: 'menu' | 'settings'
  className?: string
}

export default function SoundToggle({ context, variant = 'menu', className = '' }: SoundToggleProps) {
  const [enabled, setEnabled] = useState(true)

  useEffect(() => {
    const isOn = context === 'customer' ? getCustomerSoundEnabled() : getDashSoundEnabled()
    setEnabled(isOn)
  }, [context])

  const handleToggle = () => {
    // Unlock AudioContext on user gesture
    touchUnlock()
    const next = !enabled
    setEnabled(next)
    if (context === 'customer') setCustomerSound(next)
    else setDashSound(next)
  }

  if (variant === 'settings') {
    return (
      <div
        className={`flex items-center justify-between ${className}`}
        style={{
          padding: '14px 0',
          borderBottom: '1px solid var(--border-light, rgba(255,255,255,0.08))',
        }}
      >
        <div>
          <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--dash-text, #f1f1f1)' }}>
            Sound Effects
          </div>
          <div style={{ fontSize: '12px', color: 'var(--dash-text-3, #888)', marginTop: '2px' }}>
            ASMR-style audio feedback
          </div>
        </div>
        <button
          id={`sound-toggle-${context}`}
          onClick={handleToggle}
          aria-label={enabled ? 'Disable sound effects' : 'Enable sound effects'}
          aria-pressed={enabled}
          style={{
            position: 'relative',
            width: '44px',
            height: '26px',
            borderRadius: '13px',
            background: enabled ? '#22c55e' : 'rgba(255,255,255,0.12)',
            border: 'none',
            cursor: 'pointer',
            transition: 'background 200ms ease',
            flexShrink: 0,
          }}
        >
          <span
            style={{
              position: 'absolute',
              top: '3px',
              left: enabled ? '21px' : '3px',
              width: '20px',
              height: '20px',
              borderRadius: '50%',
              background: '#ffffff',
              boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
              transition: 'left 200ms cubic-bezier(0.34, 1.56, 0.64, 1)',
            }}
          />
        </button>
      </div>
    )
  }

  // variant === 'menu' — small icon button for customer menu header
  return (
    <button
      id={`sound-toggle-${context}-icon`}
      onClick={handleToggle}
      aria-label={enabled ? 'Mute sound effects' : 'Unmute sound effects'}
      aria-pressed={enabled}
      className={className}
      title={enabled ? 'Sound on' : 'Sound off'}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '34px',
        height: '34px',
        borderRadius: '10px',
        background: 'var(--m-pill-bg, rgba(255,255,255,0.08))',
        border: 'none',
        cursor: 'pointer',
        color: enabled ? 'var(--m-text, #f1f1f1)' : 'var(--m-text-muted, #888)',
        transition: 'all 150ms ease',
        opacity: enabled ? 1 : 0.6,
      }}
    >
      {enabled ? (
        /* Sound On — speaker with waves */
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
          <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
        </svg>
      ) : (
        /* Sound Off — speaker with X */
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
          <line x1="23" y1="9" x2="17" y2="15" />
          <line x1="17" y1="9" x2="23" y2="15" />
        </svg>
      )}
    </button>
  )
}
