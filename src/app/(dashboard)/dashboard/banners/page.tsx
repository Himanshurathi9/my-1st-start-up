'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import toast from 'react-hot-toast'
import {
  Image as ImageIcon,
  Plus,
  X,
  Pencil,
  Trash2,
  Loader2,
  Calendar,
  Sparkles,
  Camera,
  ArrowLeft,
  Info,
  Megaphone,
  Edit2,
} from 'lucide-react'
import type { Banner } from '@/types'
import { cn, formatDate, handleImgError } from '@/lib/utils'

// ─── Types ─────────────────────────────────────────────────────

interface BannersData {
  banners: Banner[]
  plan: string
  maxBanners: number
  activeCount: number
}

interface FestivalTemplate {
  name: string
  gradient: string
  textColor: string
  emoji: string
}

// ─── Festival Templates ────────────────────────────────────────

const FESTIVAL_TEMPLATES: FestivalTemplate[] = [
  {
    name: 'Diwali',
    gradient: 'linear-gradient(135deg, #FF6B35 0%, #FF9F1C 40%, #FFD700 100%)',
    textColor: '#4A1E00',
    emoji: '🪔',
  },
  {
    name: 'Eid',
    gradient: 'linear-gradient(135deg, #0D7C66 0%, #14A085 40%, #A8DADC 100%)',
    textColor: '#FFFFFF',
    emoji: '🌙',
  },
  {
    name: 'New Year',
    gradient: 'linear-gradient(135deg, #1A1A2E 0%, #16213E 40%, #E94560 100%)',
    textColor: '#FFD700',
    emoji: '🎆',
  },
  {
    name: 'Holi',
    gradient: 'linear-gradient(135deg, #FF6B9D 0%, #C44DFF 40%, #FFD93D 100%)',
    textColor: '#FFFFFF',
    emoji: '🎨',
  },
  {
    name: 'Christmas',
    gradient: 'linear-gradient(135deg, #1B4332 0%, #2D6A4F 40%, #B7E4C7 100%)',
    textColor: '#FFFFFF',
    emoji: '🎄',
  },
  {
    name: 'Independence Day',
    gradient: 'linear-gradient(135deg, #FF9933 0%, #FFFFFF 50%, #138808 100%)',
    textColor: '#1A1A2E',
    emoji: '🇮🇳',
  },
  {
    name: 'Valentine',
    gradient: 'linear-gradient(135deg, #E63946 0%, #FF6B9D 40%, #FFB3C6 100%)',
    textColor: '#FFFFFF',
    emoji: '💕',
  },
  {
    name: 'Navratri',
    gradient: 'linear-gradient(135deg, #6C3483 0%, #D4AC0D 40%, #F39C12 100%)',
    textColor: '#FFFFFF',
    emoji: '🙏',
  },
]

// ─── Helpers ───────────────────────────────────────────────────

function getBannerStatus(banner: Banner): { label: string; dotColor: string } {
  const today = new Date().toISOString().split('T')[0]

  if (!banner.is_active) {
    return { label: 'Inactive', dotColor: '#6b7280' }
  }
  if (banner.start_date && banner.start_date > today) {
    return { label: 'Scheduled', dotColor: '#3b82f6' }
  }
  if (banner.end_date && banner.end_date < today) {
    return { label: 'Expired', dotColor: '#ef4444' }
  }
  return { label: 'Active', dotColor: '#22c55e' }
}

function compressImage(file: File, maxWidth: number, quality: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    img.onload = () => {
      let { width, height } = img
      const targetWidth = Math.min(width, maxWidth)
      const targetHeight = Math.round(targetWidth * 9 / 16)
      canvas.width = targetWidth
      canvas.height = targetHeight
      ctx?.drawImage(img, 0, 0, targetWidth, targetHeight)
      resolve(canvas.toDataURL('image/jpeg', quality))
    }
    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = URL.createObjectURL(file)
  })
}

function generateFestivalCanvas(
  template: FestivalTemplate,
  restaurantName: string,
): string {
  const canvas = document.createElement('canvas')
  canvas.width = 1200
  canvas.height = 675
  const ctx = canvas.getContext('2d')
  if (!ctx) return ''

  const gradients: Record<string, [string, string, string]> = {
    Diwali: ['#FF6B35', '#FF9F1C', '#FFD700'],
    Eid: ['#0D7C66', '#14A085', '#A8DADC'],
    'New Year': ['#1A1A2E', '#16213E', '#E94560'],
    Holi: ['#FF6B9D', '#C44DFF', '#FFD93D'],
    Christmas: ['#1B4332', '#2D6A4F', '#B7E4C7'],
    'Independence Day': ['#FF9933', '#FFFFFF', '#138808'],
    Valentine: ['#E63946', '#FF6B9D', '#FFB3C6'],
    Navratri: ['#6C3483', '#D4AC0D', '#F39C12'],
  }

  const colors = gradients[template.name] || ['#333', '#666', '#999']
  const gradient = ctx.createLinearGradient(0, 0, 1200, 675)
  gradient.addColorStop(0, colors[0])
  gradient.addColorStop(0.5, colors[1])
  gradient.addColorStop(1, colors[2])
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, 1200, 675)

  ctx.globalAlpha = 0.08
  for (let i = 0; i < 20; i++) {
    ctx.beginPath()
    ctx.arc(
      Math.random() * 1200,
      Math.random() * 675,
      30 + Math.random() * 80,
      0,
      Math.PI * 2,
    )
    ctx.fillStyle = '#FFFFFF'
    ctx.fill()
  }
  ctx.globalAlpha = 1

  ctx.fillStyle = template.textColor
  ctx.globalAlpha = 0.8
  ctx.font = '600 28px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText(restaurantName.toUpperCase(), 600, 80)
  ctx.globalAlpha = 1

  ctx.font = '80px serif'
  ctx.fillText(template.emoji, 600, 340)

  ctx.fillStyle = template.textColor
  ctx.font = '800 72px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  ctx.fillText(template.name, 600, 450)

  ctx.globalAlpha = 0.7
  ctx.font = '500 24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  ctx.fillText('Special Menu Available', 600, 520)
  ctx.globalAlpha = 1

  return canvas.toDataURL('image/jpeg', 0.9)
}

async function uploadDataUrl(dataUrl: string, folder: string): Promise<string> {
  const res = await fetch(dataUrl)
  const blob = await res.blob()
  const formData = new FormData()
  formData.append('file', blob, `banner-${Date.now()}.jpg`)
  formData.append('folder', folder)

  const uploadRes = await fetch('/api/upload', {
    method: 'POST',
    body: formData,
  })

  const json = await uploadRes.json()
  if (!uploadRes.ok || !json.success) {
    throw new Error('Upload failed')
  }
  return json.url
}

// ─── Sheet Types ───────────────────────────────────────────────

type SheetMode = 'add' | 'edit'

// ─── Dark Toggle Component ───────────────────────────────────

function DashToggle({ enabled, onToggle, disabled }: { enabled: boolean; onToggle: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={onToggle}
      disabled={disabled}
      className="min-h-[44px] min-w-[44px] flex items-center justify-center"
      aria-label="Toggle"
    >
      <div
        className={cn('dash-toggle-track', enabled && 'dash-toggle-track-on')}
        style={{ opacity: disabled ? 0.4 : 1 }}
      >
        <div className="dash-toggle-thumb" />
      </div>
    </button>
  )
}

// ─── Skeleton Loader ──────────────────────────────────────────

function SkeletonBanners() {
  return (
    <div style={{ padding: '32px 16px 16px' }}>
      <div className="space-y-4">
        <div className="dash-skeleton" style={{ height: 28, width: 120 }} />
        <div className="dash-skeleton" style={{ height: 14, width: 160 }} />
        <div className="space-y-3" style={{ marginTop: 16 }}>
          {[...Array(2)].map((_, i) => (
            <div key={i} style={{ borderRadius: 'var(--dash-radius-card)', overflow: 'hidden' }}>
              <div className="dash-skeleton" style={{ height: 160 }} />
              <div style={{ padding: 14, background: 'var(--dash-surface-2)' }}>
                <div className="dash-skeleton" style={{ height: 16, width: 120, marginBottom: 8 }} />
                <div className="dash-skeleton" style={{ height: 12, width: 160 }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// ─── Main Page ─────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════

export default function BannersPage() {
  const [data, setData] = useState<BannersData | null>(null)
  const [loading, setLoading] = useState(true)
  const [sheetMode, setSheetMode] = useState<SheetMode | null>(null)
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [sheetKey, setSheetKey] = useState(0)

  const isPro = data?.plan === 'PRO'
  const isLimitReached = (data?.activeCount || 0) >= (data?.maxBanners || 1)

  const fetchBanners = useCallback(async () => {
    try {
      const res = await fetch('/api/banners')
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to load')
      }
      const json = await res.json()
      setData(json)
    } catch {
      toast.error('Failed to load banners')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchBanners()
  }, [fetchBanners])

  // ─── Handlers ───────────────────────────────────────────────

  const openAddSheet = () => {
    setEditingBanner(null)
    setSheetMode('add')
    setSheetKey((k) => k + 1)
  }

  const openEditSheet = (banner: Banner) => {
    setEditingBanner(banner)
    setSheetMode('edit')
    setSheetKey((k) => k + 1)
  }

  const closeSheet = () => {
    setSheetMode(null)
    setEditingBanner(null)
  }

  const handleToggle = async (banner: Banner) => {
    const newActive = !banner.is_active
    setTogglingId(banner.id)
    try {
      const res = await fetch('/api/banners', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: banner.id, is_active: newActive }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to toggle')
      }
      toast.success(newActive ? 'Banner activated' : 'Banner deactivated')
      fetchBanners()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update'
      toast.error(msg)
    } finally {
      setTogglingId(null)
    }
  }

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    try {
      const res = await fetch(`/api/banners?id=${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Delete failed')
      }
      toast.success('Banner deleted')
      fetchBanners()
    } catch {
      toast.error('Failed to delete banner')
    } finally {
      setDeletingId(null)
    }
  }

  // ─── Skeleton ───────────────────────────────────────────────

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--dash-bg)' }}>
        <header className="dash-glass sticky top-0 z-40" style={{ height: 56 }} />
        <SkeletonBanners />
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--dash-bg)' }}>
      {/* ═══ HEADER ═══ */}
      <header
        className="dash-glass sticky top-0 z-40 animate-dash-section-enter animate-dash-section-1"
        style={{ padding: '20px 16px 0 16px' }}
      >
        <div className="flex items-center justify-between gap-2">
          <h1
            style={{
              fontSize: 28,
              fontWeight: 800,
              color: 'var(--dash-text)',
              fontFamily: 'var(--font-display)',
              lineHeight: 1.2,
              letterSpacing: '-0.02em',
            }}
          >
            Banners
          </h1>
          <span
            className="dash-badge"
            style={{
              background: 'rgba(255,255,255,0.06)',
              color: 'var(--dash-text-2)',
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            [{data?.activeCount || 0}/{data?.maxBanners || 1}]
          </span>
        </div>
      </header>

      <div style={{ paddingBottom: 100 }}>
        {/* ═══ ADD BUTTON ═══ */}
        <div className="animate-dash-section-enter animate-dash-section-2" style={{ padding: '16px 16px 0' }}>
          <button
            onClick={isLimitReached ? undefined : openAddSheet}
            disabled={isLimitReached}
            className={cn('dash-btn w-full animate-btn-press')}
            style={{
              height: 52,
              borderRadius: 'var(--dash-radius-card)',
              fontSize: 15,
              fontWeight: 700,
              background: isLimitReached
                ? 'rgba(255,255,255,0.04)'
                : 'var(--dash-gradient)',
              color: isLimitReached ? 'var(--dash-text-3)' : '#fff',
              boxShadow: isLimitReached ? 'none' : 'var(--dash-shadow-glow-green)',
              cursor: isLimitReached ? 'not-allowed' : 'pointer',
            }}
          >
            {isLimitReached ? (
              <span>Limit Reached</span>
            ) : (
              <>
                <Plus className="w-5 h-5" />
                <span>Add Banner</span>
              </>
            )}
          </button>
        </div>

        {/* ═══ PLAN LIMIT INFO ═══ */}
        {isLimitReached && !isPro && (
          <div
            className="animate-dash-section-enter animate-dash-section-3"
            style={{
              margin: '12px 16px 0',
              padding: '14px',
              borderRadius: 'var(--dash-radius-card)',
              background: 'rgba(245, 158, 11, 0.08)',
              border: '1px solid rgba(245, 158, 11, 0.15)',
              borderLeft: '3px solid var(--dash-warning)',
            }}
          >
            <div className="flex items-start gap-3">
              <Info className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: 'var(--dash-warning)' }} />
              <p className="text-[13px] leading-relaxed" style={{ color: 'var(--dash-warning)' }}>
                <span className="font-semibold">BASIC plan</span> allows only 1 active banner.
                Upgrade to <span className="font-semibold">PRO</span> for up to 5 banners
                with scheduling.
              </p>
            </div>
          </div>
        )}

        {/* ═══ BANNER LIST ═══ */}
        {data && data.banners.length === 0 ? (
          <div
            className="flex flex-col items-center animate-dash-section-enter animate-dash-section-3"
            style={{ padding: '64px 24px 0' }}
          >
            <div
              className="flex items-center justify-center"
              style={{
                width: 80,
                height: 80,
                borderRadius: 'var(--dash-radius-card-lg)',
                background: 'var(--dash-surface-2)',
                border: '1px solid var(--dash-border)',
                marginBottom: 20,
              }}
            >
              <Megaphone className="w-8 h-8" style={{ color: 'var(--dash-text-3)' }} />
            </div>
            <h3
              style={{
                fontSize: 18,
                fontWeight: 700,
                color: 'var(--dash-text)',
                fontFamily: 'var(--font-display)',
                marginBottom: 6,
              }}
            >
              No banners yet
            </h3>
            <p
              className="text-[13px] text-center leading-relaxed"
              style={{ color: 'var(--dash-text-2)', maxWidth: 280, marginBottom: 20 }}
            >
              Promote your specials, offers, and events with eye-catching banners on your
              customer menu page.
            </p>
            <button
              onClick={openAddSheet}
              className="dash-btn dash-btn-primary animate-btn-press"
              style={{ borderRadius: 'var(--dash-radius-pill)' }}
            >
              <Plus className="w-4 h-4" />
              Add Your First Banner
            </button>
          </div>
        ) : (
          <div style={{ padding: '12px 16px 0' }}>
            {data?.banners.map((banner, index) => {
              const status = getBannerStatus(banner)
              const isToggling = togglingId === banner.id
              const isDeleting = deletingId === banner.id

              return (
                <div
                  key={banner.id}
                  className="animate-dash-section-enter"
                  style={{
                    animationDelay: `${(index + 2) * 50}ms`,
                    marginBottom: 12,
                  }}
                >
                  <div
                    className="dash-card overflow-hidden"
                    style={{ borderRadius: 'var(--dash-radius-card-lg)' }}
                  >
                    {/* Image Section */}
                    <div className="relative" style={{ height: 160, background: 'var(--dash-surface-2)' }}>
                      {banner.image_url ? (
                        <img
                          src={banner.image_url}
                          alt={banner.title || 'Banner'}
                          className="w-full h-full object-cover"
                          style={{ borderRadius: '20px 20px 0 0' }}
                          onError={handleImgError}
                        />
                      ) : (
                        <div
                          className="w-full h-full flex items-center justify-center"
                          style={{
                            background: 'linear-gradient(135deg, var(--dash-surface-2), var(--dash-surface-3))',
                          }}
                        >
                          <ImageIcon className="w-8 h-8" style={{ color: 'var(--dash-text-3)' }} />
                        </div>
                      )}

                      {/* Status Badge */}
                      <div className="absolute top-3 left-3">
                        <span
                          className="inline-flex items-center gap-1.5"
                          style={{
                            background: 'rgba(0,0,0,0.65)',
                            backdropFilter: 'blur(8px)',
                            WebkitBackdropFilter: 'blur(8px)',
                            borderRadius: 'var(--dash-radius-pill)',
                            padding: '4px 10px',
                            fontSize: 11,
                            fontWeight: 700,
                            color: '#FFFFFF',
                          }}
                        >
                          <span
                            style={{
                              width: 6,
                              height: 6,
                              borderRadius: '50%',
                              background: status.dotColor,
                              display: 'inline-block',
                              boxShadow: `0 0 8px ${status.dotColor}`,
                            }}
                          />
                          {status.label}
                        </span>
                      </div>
                    </div>

                    {/* Info Section */}
                    <div style={{ padding: '14px 16px' }}>
                      {/* Row 1: Title + Toggle */}
                      <div className="flex items-center justify-between">
                        <span
                          className="font-bold truncate"
                          style={{ fontSize: 15, color: 'var(--dash-text)', maxWidth: '60%' }}
                        >
                          {banner.title || 'Banner'}
                        </span>
                        <DashToggle
                          enabled={banner.is_active}
                          onToggle={() => handleToggle(banner)}
                          disabled={isToggling}
                        />
                      </div>

                      {/* Row 2: Date range */}
                      <div style={{ marginTop: 6 }}>
                        {(banner.start_date || banner.end_date) ? (
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5" style={{ color: 'var(--dash-text-3)' }} />
                            <span style={{ fontSize: 12, color: 'var(--dash-text-2)' }}>
                              {banner.start_date && banner.end_date
                                ? `${formatDate(banner.start_date)} – ${formatDate(banner.end_date)}`
                                : banner.start_date
                                  ? `From ${formatDate(banner.start_date)}`
                                  : `Until ${formatDate(banner.end_date)}`}
                            </span>
                          </div>
                        ) : (
                          <span style={{ fontSize: 12, color: 'var(--dash-text-3)' }}>Always visible</span>
                        )}
                      </div>

                      {/* Row 3: Edit + Delete buttons */}
                      <div className="flex items-center" style={{ marginTop: 12, gap: 8 }}>
                        <button
                          onClick={() => openEditSheet(banner)}
                          className="dash-btn dash-btn-ghost animate-btn-press"
                          style={{
                            borderRadius: 'var(--dash-radius-pill)',
                            padding: '8px 16px',
                            fontSize: 13,
                            fontWeight: 600,
                          }}
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(banner.id)}
                          disabled={isDeleting}
                          className="dash-btn dash-btn-danger animate-btn-press"
                          style={{
                            borderRadius: 'var(--dash-radius-pill)',
                            padding: '8px 16px',
                            fontSize: 13,
                            fontWeight: 600,
                          }}
                        >
                          {isDeleting ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ═══ BANNER SHEET ═══ */}
      {sheetMode && (
        <BannerSheet
          key={sheetKey}
          mode={sheetMode}
          banner={editingBanner}
          plan={data?.plan || 'BASIC'}
          maxBanners={data?.maxBanners || 1}
          activeCount={data?.activeCount || 0}
          restaurantName=""
          onClose={closeSheet}
          onSave={() => {
            closeSheet()
            fetchBanners()
          }}
        />
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// ─── Banner Sheet (Add/Edit) ───────────────────────────────────
// ═══════════════════════════════════════════════════════════════

interface BannerSheetProps {
  mode: SheetMode
  banner: Banner | null
  plan: string
  maxBanners: number
  activeCount: number
  restaurantName: string
  onClose: () => void
  onSave: () => void
}

function BannerSheet({
  mode,
  banner,
  plan,
  maxBanners,
  activeCount,
  onClose,
  onSave,
}: BannerSheetProps) {
  const [image_url, setImageUrl] = useState(banner?.image_url || '')
  const [title, setTitle] = useState(banner?.title || '')
  const [start_date, setStartDate] = useState(
    banner?.start_date || '',
  )
  const [end_date, setEndDate] = useState(
    banner?.end_date || '',
  )
  const [is_active, setIsActive] = useState(banner ? banner.is_active : true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [generatingTemplate, setGeneratingTemplate] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const isPro = plan === 'PRO'

  // ─── File upload handler ────────────────────────────────────
  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.error('Only JPEG, PNG, and WebP images are allowed')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be under 5MB')
      return
    }

    setUploading(true)
    try {
      const compressedDataUrl = await compressImage(file, 1200, 0.9)
      const url = await uploadDataUrl(compressedDataUrl, 'banners')
      setImageUrl(url)
      toast.success('Image uploaded')
    } catch {
      toast.error('Upload failed, try again')
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }, [])

  // ─── Festival template generator ────────────────────────────
  const handleTemplateSelect = useCallback(
    async (template: FestivalTemplate) => {
      setGeneratingTemplate(template.name)
      try {
        const dataUrl = generateFestivalCanvas(template, 'Your Restaurant')
        const url = await uploadDataUrl(dataUrl, 'banners')
        setImageUrl(url)
        if (!title) setTitle(`${template.name} Special`)
        toast.success(`${template.name} banner created!`)
      } catch {
        toast.error('Failed to generate template')
      } finally {
        setGeneratingTemplate(null)
      }
    },
    [title],
  )

  // ─── Save handler ───────────────────────────────────────────
  const handleSave = async () => {
    if (!image_url) {
      toast.error('Please upload a banner image')
      return
    }

    setSaving(true)
    try {
      if (mode === 'add') {
        const res = await fetch('/api/banners', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            image_url,
            title: title || null,
            start_date: start_date || null,
            end_date: end_date || null,
            is_active,
          }),
        })

        if (!res.ok) {
          const err = await res.json()
          throw new Error(err.error || 'Failed to create banner')
        }
        toast.success('Banner created!')
      } else if (banner) {
        const res = await fetch('/api/banners', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: banner.id,
            image_url,
            title: title || null,
            start_date: start_date || null,
            end_date: end_date || null,
            is_active,
          }),
        })

        if (!res.ok) {
          const err = await res.json()
          throw new Error(err.error || 'Failed to update banner')
        }
        toast.success('Banner updated!')
      }
      onSave()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save'
      toast.error(msg)
    } finally {
      setSaving(false)
    }
  }

  const isLimitReached = activeCount >= maxBanners
  const wouldExceedLimit = is_active && mode === 'add' && isLimitReached
  const wouldExceedOnActivate =
    is_active && mode === 'edit' && !banner?.is_active && isLimitReached

  return (
    <div className="fixed inset-0 z-50">
      {/* Overlay */}
      <div className="bottom-sheet-backdrop" onClick={onClose} />

      {/* Sheet */}
      <div
        className="bottom-sheet max-h-[90vh] flex flex-col premium-scroll"
        style={{ background: 'var(--dash-surface)' }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div
            style={{
              width: 36,
              height: 4,
              borderRadius: 'var(--dash-radius-pill)',
              background: 'var(--dash-surface-3)',
              margin: '8px auto 16px auto',
            }}
          />
        </div>

        {/* Header with X button */}
        <div className="flex items-center justify-between px-4 sm:px-5 pb-3 pt-1 flex-shrink-0">
          <div className="flex items-center gap-3">
            {mode === 'edit' ? (
              <button
                onClick={onClose}
                className="dash-btn dash-btn-ghost animate-btn-press"
                style={{
                  width: 32,
                  height: 32,
                  minWidth: 44,
                  minHeight: 44,
                  borderRadius: 'var(--dash-radius-pill)',
                  padding: 0,
                }}
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            ) : null}
            <h3
              style={{
                fontSize: 20,
                fontWeight: 600,
                color: 'var(--dash-text)',
                fontFamily: 'var(--font-display)',
              }}
            >
              {mode === 'add' ? 'Add Banner' : 'Edit Banner'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="dash-btn dash-btn-ghost animate-btn-press"
            style={{
              width: 32,
              height: 32,
              minWidth: 44,
              minHeight: 44,
              borderRadius: 'var(--dash-radius-pill)',
              padding: 0,
            }}
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="dash-separator" />

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-5 pb-6 premium-scroll">
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />

          {/* Image Upload Area */}
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="w-full flex flex-col items-center justify-center gap-2 transition-all relative overflow-hidden animate-btn-press"
            style={{
              aspectRatio: '16/9',
              borderRadius: 'var(--dash-radius-card)',
              border: image_url
                ? '1px solid var(--dash-border)'
                : '2px dashed var(--dash-surface-3)',
              background: image_url ? 'transparent' : 'var(--dash-surface-2)',
              marginBottom: 16,
              marginTop: 16,
            }}
          >
            {image_url ? (
              <>
                <img
                  src={image_url}
                  alt="Banner preview"
                  className="absolute inset-0 w-full h-full object-cover"
                  style={{ borderRadius: 'var(--dash-radius-card)' }}
                  onError={handleImgError}
                />
                <div
                  className="absolute inset-0 flex items-center justify-center transition-colors"
                  style={{ borderRadius: 'var(--dash-radius-card)' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(0,0,0,0.3)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(0,0,0,0)' }}
                >
                  <div
                    style={{
                      background: 'rgba(255,255,255,0.9)',
                      borderRadius: 'var(--dash-radius-pill)',
                      padding: 10,
                      boxShadow: 'var(--dash-shadow-card)',
                    }}
                  >
                    <Camera className="w-5 h-5" style={{ color: 'var(--dash-text)' }} />
                  </div>
                </div>
              </>
            ) : (
              <>
                <Camera className="w-7 h-7" style={{ color: 'var(--dash-text-3)' }} />
                <span className="text-[13px] font-medium" style={{ color: 'var(--dash-text-3)' }}>
                  Upload banner image (16:9)
                </span>
              </>
            )}

            {uploading && (
              <div
                className="absolute inset-0 flex items-center justify-center"
                style={{
                  background: 'rgba(15, 17, 21, 0.8)',
                  borderRadius: 'var(--dash-radius-card)',
                }}
              >
                <Loader2 className="w-7 h-7 animate-spin" style={{ color: 'var(--dash-accent)' }} />
              </div>
            )}
          </button>

          {/* ═══ FESTIVAL TEMPLATES (PRO only) ═══ */}
          {isPro && (
            <div style={{ marginBottom: 20 }}>
              <div className="flex items-center gap-1.5" style={{ marginBottom: 10 }}>
                <Sparkles className="w-3.5 h-3.5" style={{ color: 'var(--dash-accent)' }} />
                <span className="dash-section-label" style={{ padding: 0 }}>
                  Quick Templates
                </span>
                <span className="dash-badge dash-badge-pro" style={{ fontSize: 9, padding: '2px 6px' }}>
                  PRO
                </span>
              </div>
              <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 -mx-5 px-5">
                {FESTIVAL_TEMPLATES.map((template) => (
                  <button
                    key={template.name}
                    onClick={() => handleTemplateSelect(template)}
                    disabled={generatingTemplate === template.name || uploading}
                    className={cn(
                      'flex-shrink-0 flex flex-col items-center justify-center overflow-hidden transition-all animate-btn-press',
                      generatingTemplate === template.name
                        ? 'ring-2 opacity-70'
                        : 'hover:scale-105 active:scale-95',
                    )}
                    style={{
                      width: 80,
                      height: 52,
                      borderRadius: 12,
                      background: template.gradient,
                      minWidth: 44,
                      minHeight: 44,
                      position: 'relative',
                    }}
                  >
                    <span className="text-[10px] leading-none">{template.emoji}</span>
                    <span
                      className="text-[9px] font-bold mt-0.5 leading-none"
                      style={{ color: template.textColor }}
                    >
                      {template.name}
                    </span>
                    {generatingTemplate === template.name && (
                      <div
                        className="absolute inset-0 flex items-center justify-center"
                        style={{ background: 'rgba(0,0,0,0.4)', borderRadius: 12 }}
                      >
                        <Loader2 className="w-4 h-4 animate-spin" style={{ color: '#fff' }} />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ═══ FORM FIELDS ═══ */}

          {/* Title */}
          <div style={{ marginBottom: 16 }}>
            <label className="block" style={{ fontSize: 13, fontWeight: 500, color: 'var(--dash-text-2)', marginBottom: 6 }}>
              Title <span style={{ color: 'var(--dash-text-3)' }}>(optional)</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Today's Special, Diwali Offer!"
              maxLength={60}
              className="dash-input"
              style={{ borderRadius: 'var(--dash-radius-card)' }}
            />
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-2 sm:gap-3" style={{ marginBottom: 16 }}>
            <div>
              <label className="block" style={{ fontSize: 13, fontWeight: 500, color: 'var(--dash-text-2)', marginBottom: 6 }}>
                Start Date <span style={{ color: 'var(--dash-text-3)' }}>(optional)</span>
              </label>
              <input
                type="date"
                value={start_date}
                onChange={(e) => setStartDate(e.target.value)}
                className="dash-input min-h-[44px]"
                style={{ borderRadius: 'var(--dash-radius-card)' }}
              />
            </div>
            <div>
              <label className="block" style={{ fontSize: 13, fontWeight: 500, color: 'var(--dash-text-2)', marginBottom: 6 }}>
                End Date <span style={{ color: 'var(--dash-text-3)' }}>(optional)</span>
              </label>
              <input
                type="date"
                value={end_date}
                onChange={(e) => setEndDate(e.target.value)}
                min={start_date || undefined}
                className="dash-input min-h-[44px]"
                style={{ borderRadius: 'var(--dash-radius-card)' }}
              />
            </div>
          </div>

          {/* Helper text */}
          <p style={{ fontSize: 11, marginBottom: 16, lineHeight: 1.6, color: 'var(--dash-text-3)' }}>
            Leave dates empty to always show this banner. Set a date range to schedule it
            for a specific period.
          </p>

          {/* Active Toggle */}
          <div className="flex items-center justify-between" style={{ padding: '12px 4px', marginBottom: 8 }}>
            <div>
              <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--dash-text)' }}>Active</p>
              <p className="mt-0.5" style={{ fontSize: 12, color: 'var(--dash-text-3)' }}>
                {is_active
                  ? 'This banner is visible to customers'
                  : 'This banner is hidden from customers'}
              </p>
            </div>
            <DashToggle enabled={is_active} onToggle={() => setIsActive(!is_active)} />
          </div>

          {/* Limit warning in sheet */}
          {(wouldExceedLimit || wouldExceedOnActivate) && (
            <div
              style={{
                borderRadius: 'var(--dash-radius-card)',
                padding: '12px 14px',
                marginBottom: 16,
                background: 'rgba(245, 158, 11, 0.08)',
                border: '1px solid rgba(245, 158, 11, 0.15)',
                borderLeft: '3px solid var(--dash-warning)',
              }}
            >
              <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--dash-warning)' }}>
                {plan === 'BASIC'
                  ? 'BASIC plan allows only 1 active banner.'
                  : 'Maximum active banners reached.'}
                {plan === 'BASIC' && (
                  <span className="font-normal"> Upgrade to PRO for more.</span>
                )}
              </p>
            </div>
          )}

          {/* Save button */}
          <button
            onClick={handleSave}
            disabled={saving || !image_url || wouldExceedLimit || wouldExceedOnActivate}
            className="dash-btn dash-btn-primary w-full animate-btn-press"
            style={{
              borderRadius: 'var(--dash-radius-pill)',
              fontSize: 14,
              fontWeight: 600,
              opacity: (saving || !image_url || wouldExceedLimit || wouldExceedOnActivate) ? 0.4 : 1,
              cursor: (saving || !image_url || wouldExceedLimit || wouldExceedOnActivate) ? 'not-allowed' : 'pointer',
            }}
          >
            {saving ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </span>
            ) : mode === 'add' ? (
              'Create Banner'
            ) : (
              'Save Changes'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
