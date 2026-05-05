'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import {
  UtensilsCrossed, Plus, Tag, Loader2, Trash2, Camera,
  IndianRupee, X, ExternalLink,
} from 'lucide-react'
import toast from 'react-hot-toast'
import type { Category, MenuItem, FoodType, Restaurant } from '@/types'
import { formatPrice, handleImgError } from '@/lib/utils'
import ImageUpload from '@/components/ui/ImageUpload'

const SUGGESTIONS = ['Starters', 'Mains', 'Drinks', 'Desserts', 'Snacks']

// ─── Types ───────────────────────────────────────────────────────
interface MenuItemWithCategory extends MenuItem {
  category_name: string | null
}

type SheetMode = 'closed' | 'add' | 'edit'

// ─── Food Type Colors (dark theme) ──────────────────────────────
const FOOD_DOT_COLORS: Record<FoodType, string> = {
  VEG: '#22c55e',
  NONVEG: '#ef4444',
  EGG: '#f59e0b',
}

const FOOD_TYPE_LABELS: Record<FoodType, string> = {
  VEG: 'VEG',
  NONVEG: 'NONVEG',
  EGG: 'EGG',
}

const FOOD_TOGGLE_STYLES: Record<FoodType, { active: { bg: string; color: string; border: string }; inactive: { bg: string; color: string; border: string } }> = {
  VEG: { active: { bg: 'rgba(34,197,94,0.12)', color: '#22c55e', border: '#22c55e' }, inactive: { bg: 'var(--dash-surface-2)', color: 'var(--dash-text-3)', border: 'var(--dash-border)' } },
  NONVEG: { active: { bg: 'rgba(239,68,68,0.12)', color: '#ef4444', border: '#ef4444' }, inactive: { bg: 'var(--dash-surface-2)', color: 'var(--dash-text-3)', border: 'var(--dash-border)' } },
  EGG: { active: { bg: 'rgba(245,158,11,0.12)', color: '#f59e0b', border: '#f59e0b' }, inactive: { bg: 'var(--dash-surface-2)', color: 'var(--dash-text-3)', border: 'var(--dash-border)' } },
}

// ─── Skeleton Loaders ────────────────────────────────────────────
function SkeletonChips() {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className={`dash-skeleton h-9 rounded-full flex-shrink-0 ${i === 0 ? 'w-14' : 'w-20'}`}
        />
      ))}
    </div>
  )
}

function SkeletonItems() {
  return (
    <div className="flex flex-col gap-3 px-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="dash-skeleton p-3.5" style={{ borderRadius: '16px' }}>
          <div className="flex items-center gap-3.5">
            <div className="dash-skeleton w-[72px] h-[72px] flex-shrink-0" style={{ borderRadius: '16px' }} />
            <div className="flex-1 space-y-2.5">
              <div className="dash-skeleton h-4 rounded w-3/4" />
              <div className="dash-skeleton h-3 rounded w-1/2" />
              <div className="dash-skeleton h-5 rounded w-1/3" />
            </div>
            <div className="dash-skeleton w-[52px] h-7 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Item Card (Horizontal layout) ──────────────────────────────
function ItemCard({
  item,
  index,
  onToggle,
  onEdit,
}: {
  item: MenuItemWithCategory
  index: number
  onToggle: (id: string, available: boolean) => void
  onEdit: (item: MenuItemWithCategory) => void
}) {
  const [toggling, setToggling] = useState(false)

  const handleToggle = async (e: React.MouseEvent) => {
    e.stopPropagation()
    const newVal = !item.is_available
    setToggling(true)
    try {
      const res = await fetch('/api/menu-items/availability', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: item.id, is_available: newVal }),
      })
      if (res.ok) {
        onToggle(item.id, newVal)
      } else {
        toast.error('Could not update availability')
      }
    } catch {
      toast.error('Something went wrong')
    } finally {
      setToggling(false)
    }
  }

  return (
    <div
      style={{
        animationDelay: `${Math.min(index, 8) * 60}ms`,
        opacity: 0,
        transform: 'translateY(12px)',
        animation: `menuCardIn 300ms ease-out ${Math.min(index, 8) * 60}ms forwards`,
      }}
    >
      <div
        className="dash-card flex items-center gap-3.5 cursor-pointer overflow-hidden"
        style={{
          borderRadius: '16px',
          padding: '14px',
          marginBottom: '10px',
          opacity: item.is_available ? 1 : 0.5,
        }}
        onClick={() => onEdit(item)}
      >
        {/* LEFT: Food Photo 72×72 */}
        <div className="w-[72px] h-[72px] overflow-hidden flex-shrink-0" style={{ borderRadius: '16px' }}>
          {item.image_url ? (
            <img
              src={item.image_url}
              alt={item.name}
              className="w-full h-full object-cover"
              onError={handleImgError}
            />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center"
              style={{ background: 'var(--dash-surface-3)' }}
            >
              <UtensilsCrossed className="w-6 h-6" style={{ color: 'var(--dash-text-3)' }} />
            </div>
          )}
        </div>

        {/* MIDDLE: Item Info */}
        <div className="flex-1 min-w-0">
          {/* Food type dot + Name */}
          <div className="flex items-center gap-1.5">
            <span
              className="flex-shrink-0"
              style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                background: FOOD_DOT_COLORS[item.food_type],
                boxShadow: `0 0 6px ${FOOD_DOT_COLORS[item.food_type]}40`,
              }}
            />
            <h3
              className="truncate"
              style={{
                fontSize: '15px',
                fontWeight: 700,
                color: 'var(--dash-text)',
                fontFamily: "var(--font-body)",
              }}
            >
              {item.name}
            </h3>
          </div>

          {/* Category */}
          {item.category_name && (
            <p
              className="truncate mt-0.5"
              style={{
                fontSize: '12px',
                color: 'var(--dash-text-3)',
                fontFamily: "var(--font-body)",
              }}
            >
              {item.category_name}
            </p>
          )}

          {/* Price */}
          <span
            className="block mt-1"
            style={{
              fontSize: '15px',
              fontWeight: 800,
              color: 'var(--dash-text)',
              fontFamily: "var(--font-mono)",
            }}
          >
            {formatPrice(item.price)}
          </span>

          {/* PRO Badges */}
          <div className="flex flex-wrap gap-1.5 mt-1.5">
            {item.is_best_seller && (
              <span
                className="inline-flex items-center gap-1"
                style={{
                  background: 'rgba(245,158,11,0.12)',
                  color: '#fbbf24',
                  fontSize: '11px',
                  fontWeight: 600,
                  padding: '2px 8px',
                  borderRadius: '100px',
                }}
              >
                ⭐ Best Seller
              </span>
            )}
            {item.is_chefs_special && (
              <span
                className="inline-flex items-center gap-1"
                style={{
                  background: 'rgba(168,85,247,0.12)',
                  color: '#c084fc',
                  fontSize: '11px',
                  fontWeight: 600,
                  padding: '2px 8px',
                  borderRadius: '100px',
                }}
              >
                👨‍🍳 Chef&apos;s Special
              </span>
            )}
          </div>
        </div>

        {/* RIGHT: Availability Toggle */}
        <button
          onClick={handleToggle}
          disabled={toggling}
          className="min-w-[44px] min-h-[44px] flex items-center justify-center flex-shrink-0"
        >
          <div
            className={`dash-toggle-track ${item.is_available ? 'dash-toggle-track-on' : ''}`}
            style={{ width: '44px', height: '24px', borderRadius: '12px' }}
          >
            <div
              className="dash-toggle-thumb"
              style={{ width: '20px', height: '20px', top: '2px', left: '2px', transform: item.is_available ? 'translateX(20px)' : 'translateX(0)' }}
            />
          </div>
        </button>
      </div>
    </div>
  )
}

// ─── Add/Edit Item Sheet ─────────────────────────────────────────
function ItemSheetInner({
  mode,
  item,
  categories,
  restaurant,
  onClose,
  onSave,
  onDelete,
  saving,
  deleting,
}: {
  mode: 'add' | 'edit'
  item: MenuItemWithCategory | null
  categories: Category[]
  restaurant: Restaurant | null
  onClose: () => void
  onSave: (data: Record<string, unknown>) => void
  onDelete: () => void
  saving: boolean
  deleting: boolean
}) {
  const [name, setName] = useState(item?.name || '')
  const [description, setDescription] = useState(item?.description || '')
  const [price, setPrice] = useState(item?.price?.toString() || '')
  const [categoryId, setCategoryId] = useState(item?.category_id || '')
  const [foodType, setFoodType] = useState<FoodType>(item?.food_type || 'VEG')
  const [bestSeller, setBestSeller] = useState(item?.is_best_seller || false)
  const [chefsSpecial, setChefsSpecial] = useState(item?.is_chefs_special || false)
  const [imageUrl, setImageUrl] = useState(item?.image_url || '')
  const scrollRef = useRef<HTMLDivElement>(null)

  const isPro = restaurant?.plan === 'PRO'

  const handleSubmit = () => {
    if (!name.trim() || !price || Number(price) <= 0) {
      toast.error('Name and price are required')
      return
    }
    onSave({
      id: item?.id,
      name: name.trim(),
      description: description.trim(),
      price: Number(price),
      category_id: categoryId || null,
      food_type: foodType,
      image_url: imageUrl || null,
      is_best_seller: bestSeller,
      is_chefs_special: chefsSpecial,
    })
  }

  const [focusedField, setFocusedField] = useState<string | null>(null)

  return (
    <div className="fixed inset-0 z-50">
      <div className="bottom-sheet-backdrop" onClick={onClose} />
      <div
        className="bottom-sheet max-h-[90vh] flex flex-col"
        style={{
          background: 'var(--dash-surface)',
          borderTop: '1px solid var(--dash-border)',
        }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div style={{ width: '36px', height: '4px', borderRadius: '100px', background: 'var(--dash-text-3)', margin: '8px auto' }} />
        </div>

        {/* Header with X button */}
        <div className="flex items-center justify-between px-4 sm:px-6 pt-2 pb-3 flex-shrink-0">
          <h3
            style={{ fontSize: '20px', fontWeight: 600, color: 'var(--dash-text)', fontFamily: "var(--font-display)" }}
          >
            {mode === 'add' ? 'Add Item' : 'Edit Item'}
          </h3>
          <button
            onClick={onClose}
            className="dash-btn dash-btn-ghost"
            style={{ width: '32px', height: '32px', padding: 0, borderRadius: '10px', minWidth: '32px', minHeight: '32px' }}
            aria-label="Close"
          >
            <X className="w-4 h-4" style={{ color: 'var(--dash-text-2)' }} />
          </button>
        </div>

        {/* Scrollable form */}
        <div ref={scrollRef} className="overflow-y-auto flex-1 px-4 sm:px-6 pb-4 premium-scroll">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* 1. Image */}
            <ImageUpload
              onUpload={setImageUrl}
              folder="menu-items"
              currentImage={imageUrl}
              label="Add food photo"
              aspectRatio="square"
            />

            {/* 2. Name */}
            <div>
              <label className="dash-section-label" style={{ display: 'block', marginBottom: '8px' }}>Item Name *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onFocus={() => setFocusedField('name')}
                onBlur={() => setFocusedField(null)}
                placeholder="e.g. Butter Chicken"
                maxLength={60}
                className="dash-input"
                style={{
                  boxShadow: focusedField === 'name' ? '0 0 0 4px rgba(34,197,94,0.08)' : 'none',
                  borderColor: focusedField === 'name' ? 'rgba(34,197,94,0.5)' : undefined,
                }}
              />
            </div>

            {/* 3. Description */}
            <div>
              <label className="dash-section-label" style={{ display: 'block', marginBottom: '8px' }}>
                Description
                <span style={{ color: 'var(--dash-text-3)', fontWeight: 400, textTransform: 'none', letterSpacing: 'normal', marginLeft: '8px', fontSize: '11px' }}>
                  {description.length}/100
                </span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value.slice(0, 100))}
                onFocus={() => setFocusedField('desc')}
                onBlur={() => setFocusedField(null)}
                placeholder="Short description of the dish"
                rows={2}
                className="dash-input resize-none"
                style={{
                  boxShadow: focusedField === 'desc' ? '0 0 0 4px rgba(34,197,94,0.08)' : 'none',
                  borderColor: focusedField === 'desc' ? 'rgba(34,197,94,0.5)' : undefined,
                }}
              />
            </div>

            {/* 4. Price */}
            <div>
              <label className="dash-section-label" style={{ display: 'block', marginBottom: '8px' }}>Price *</label>
              <div className="relative">
                <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--dash-text-3)' }} />
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  onFocus={() => setFocusedField('price')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="299"
                  min="1"
                  className="dash-input"
                  style={{
                    paddingLeft: '40px',
                    fontFamily: "var(--font-mono)",
                    boxShadow: focusedField === 'price' ? '0 0 0 4px rgba(34,197,94,0.08)' : 'none',
                    borderColor: focusedField === 'price' ? 'rgba(34,197,94,0.5)' : undefined,
                  }}
                />
              </div>
            </div>

            {/* 5. Category */}
            <div>
              <label className="dash-section-label" style={{ display: 'block', marginBottom: '8px' }}>Category</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="dash-input"
                style={{
                  appearance: 'none',
                  minHeight: '44px',
                  cursor: 'pointer',
                }}
              >
                <option value="">No category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            {/* 6. Food Type — 3 pill buttons */}
            <div>
              <label className="dash-section-label" style={{ display: 'block', marginBottom: '8px' }}>Food Type</label>
              <div className="grid grid-cols-3 gap-2">
                {(['VEG', 'NONVEG', 'EGG'] as FoodType[]).map((type) => {
                  const isActive = foodType === type
                  const styles = isActive ? FOOD_TOGGLE_STYLES[type].active : FOOD_TOGGLE_STYLES[type].inactive
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setFoodType(type)}
                      className="dash-btn"
                      style={{
                        flex: 1,
                        height: '44px',
                        borderRadius: '12px',
                        background: styles.bg,
                        color: styles.color,
                        border: `2px solid ${styles.border}`,
                      }}
                    >
                      <span
                        style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          background: isActive ? FOOD_DOT_COLORS[type] : 'var(--dash-text-3)',
                          flexShrink: 0,
                          display: 'inline-block',
                          marginRight: '6px',
                        }}
                      />
                      {FOOD_TYPE_LABELS[type]}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* 7. PRO features */}
            {isPro && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', paddingTop: '8px', borderTop: '1px solid var(--dash-border)' }}>
                <p className="dash-section-label">PRO Features</p>

                <div
                  className="flex items-center justify-between"
                  style={{ background: 'var(--dash-surface-2)', borderRadius: '12px', padding: '14px 16px', border: '1px solid var(--dash-border)' }}
                >
                  <div>
                    <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--dash-text)' }}>Best Seller</p>
                    <p style={{ fontSize: '12px', color: 'var(--dash-text-3)' }}>Highlight popular items</p>
                  </div>
                  <button
                    onClick={() => setBestSeller(!bestSeller)}
                    className="min-w-[44px] min-h-[44px] flex items-center justify-center"
                  >
                    <div
                      className={`dash-toggle-track ${bestSeller ? 'dash-toggle-track-on' : ''}`}
                      style={{ width: '44px', height: '24px', borderRadius: '12px', background: bestSeller ? '#f59e0b' : undefined, boxShadow: bestSeller ? '0 0 12px rgba(245,158,11,0.3)' : undefined }}
                    >
                      <div
                        className="dash-toggle-thumb"
                        style={{ width: '20px', height: '20px', top: '2px', left: '2px', transform: bestSeller ? 'translateX(20px)' : 'translateX(0)' }}
                      />
                    </div>
                  </button>
                </div>

                <div
                  className="flex items-center justify-between"
                  style={{ background: 'var(--dash-surface-2)', borderRadius: '12px', padding: '14px 16px', border: '1px solid var(--dash-border)' }}
                >
                  <div>
                    <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--dash-text)' }}>Chef&apos;s Special</p>
                    <p style={{ fontSize: '12px', color: 'var(--dash-text-3)' }}>Mark signature dishes</p>
                  </div>
                  <button
                    onClick={() => setChefsSpecial(!chefsSpecial)}
                    className="min-w-[44px] min-h-[44px] flex items-center justify-center"
                  >
                    <div
                      className={`dash-toggle-track ${chefsSpecial ? 'dash-toggle-track-on' : ''}`}
                      style={{ width: '44px', height: '24px', borderRadius: '12px', background: chefsSpecial ? '#a855f7' : undefined, boxShadow: chefsSpecial ? '0 0 12px rgba(168,85,247,0.3)' : undefined }}
                    >
                      <div
                        className="dash-toggle-thumb"
                        style={{ width: '20px', height: '20px', top: '2px', left: '2px', transform: chefsSpecial ? 'translateX(20px)' : 'translateX(0)' }}
                      />
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bottom buttons */}
        <div className="px-4 sm:px-6 pb-8 pt-3 flex-shrink-0" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {mode === 'edit' && (
            <button
              onClick={onDelete}
              disabled={deleting}
              className="dash-btn dash-btn-danger w-full"
              style={{ borderRadius: '14px' }}
            >
              {deleting ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Deleting...</>
              ) : (
                <><Trash2 className="w-4 h-4" /> Delete Item</>
              )}
            </button>
          )}
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="dash-btn dash-btn-primary w-full"
            style={{ borderRadius: '14px' }}
          >
            {saving ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> {mode === 'add' ? 'Adding...' : 'Saving...'}</>
            ) : (
              mode === 'add' ? 'Add to Menu' : 'Save Changes'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Add Category Sheet ─────────────────────────────────────────
function AddCategorySheetInner({
  onClose,
  onAdd,
  loading,
}: {
  onClose: () => void
  onAdd: (name: string) => void
  loading: boolean
}) {
  const [name, setName] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 300)
  }, [])

  const handleSubmit = () => {
    if (name.trim() && !loading) onAdd(name.trim())
  }

  return (
    <div className="fixed inset-0 z-50">
      <div className="bottom-sheet-backdrop" onClick={onClose} />
      <div
        className="bottom-sheet"
        style={{
          background: 'var(--dash-surface)',
          borderTop: '1px solid var(--dash-border)',
        }}
      >
        <div className="flex justify-center pt-3 pb-1">
          <div style={{ width: '36px', height: '4px', borderRadius: '100px', background: 'var(--dash-text-3)', margin: '8px auto' }} />
        </div>
        <div className="px-4 sm:px-6 pb-8 pt-2">
          <div className="flex items-center justify-between mb-5">
            <h3 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--dash-text)', fontFamily: "var(--font-display)" }}>New Category</h3>
            <button
              onClick={onClose}
              className="dash-btn dash-btn-ghost"
              style={{ width: '32px', height: '32px', padding: 0, borderRadius: '10px', minWidth: '32px', minHeight: '32px' }}
              aria-label="Close"
            >
              <X className="w-4 h-4" style={{ color: 'var(--dash-text-2)' }} />
            </button>
          </div>
          <input
            ref={inputRef}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            placeholder="Category name"
            maxLength={30}
            className="dash-input mb-4"
          />
          <div className="flex flex-wrap gap-2 mb-6">
            {SUGGESTIONS.map((s) => (
              <button key={s} type="button" onClick={() => setName(s)}
                className="dash-btn dash-btn-ghost"
                style={{ fontSize: '13px', padding: '6px 14px', borderRadius: '100px', height: '36px', minHeight: '36px' }}
              >{s}</button>
            ))}
          </div>
          <button onClick={handleSubmit} disabled={loading || !name.trim()}
            className="dash-btn dash-btn-primary w-full"
            style={{ borderRadius: '14px' }}
          >
            {loading ? (<><Loader2 className="w-4 h-4 animate-spin" /> Adding...</>) : 'Add Category'}
          </button>
        </div>
      </div>
    </div>
  )
}

function AddCategorySheet({ open, onClose, onAdd, loading }: { open: boolean; onClose: () => void; onAdd: (n: string) => void; loading: boolean }) {
  if (!open) return null
  return <AddCategorySheetInner key={Date.now()} onClose={onClose} onAdd={onAdd} loading={loading} />
}

// ─── Delete Category Sheet ───────────────────────────────────────
function DeleteCategorySheet({ open, onClose, category, onConfirm, loading, hasItems }: {
  open: boolean; onClose: () => void; category: Category | null; onConfirm: () => void; loading: boolean; hasItems: boolean
}) {
  if (!open || !category) return null
  return (
    <div className="fixed inset-0 z-50">
      <div className="bottom-sheet-backdrop" onClick={onClose} />
      <div
        className="bottom-sheet"
        style={{
          background: 'var(--dash-surface)',
          borderTop: '1px solid var(--dash-border)',
        }}
      >
        <div className="flex justify-center pt-3 pb-1"><div style={{ width: '36px', height: '4px', borderRadius: '100px', background: 'var(--dash-text-3)', margin: '8px auto' }} /></div>
        <div className="px-4 sm:px-6 pb-8 pt-4">
          <div className="flex flex-col items-center mb-6">
            <div className="w-14 h-14 rounded-full flex items-center justify-center mb-3" style={{ background: 'rgba(239,68,68,0.12)' }}>
              <Trash2 className="w-6 h-6" style={{ color: '#f87171' }} />
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--dash-text)', fontFamily: "var(--font-display)" }}>Delete &ldquo;{category.name}&rdquo;?</h3>
            {hasItems
              ? <p className="text-[13px] mt-2 text-center" style={{ color: '#f87171' }}>This category has items. Move or delete them first.</p>
              : <p className="text-[13px] mt-2 text-center" style={{ color: 'var(--dash-text-2)' }}>This will remove the category from your menu.</p>
            }
          </div>
          {!hasItems && (
            <button onClick={onConfirm} disabled={loading}
              className="dash-btn w-full mb-3"
              style={{ borderRadius: '14px', background: '#ef4444', color: '#fff' }}
            >
              {loading ? (<><Loader2 className="w-4 h-4 animate-spin" /> Deleting...</>) : 'Delete'}
            </button>
          )}
          <button onClick={onClose} disabled={loading}
            className="dash-btn dash-btn-ghost w-full"
            style={{ borderRadius: '14px' }}
          >Cancel</button>
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ───────────────────────────────────────────────────
export default function MenuPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [items, setItems] = useState<MenuItemWithCategory[]>([])
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null)
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [itemsLoading, setItemsLoading] = useState(false)

  // Sheet states
  const [addCategoryOpen, setAddCategoryOpen] = useState(false)
  const [deleteCategoryOpen, setDeleteCategoryOpen] = useState(false)
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null)
  const [deleteHasItems, setDeleteHasItems] = useState(false)
  const [itemSheetMode, setItemSheetMode] = useState<SheetMode>('closed')
  const [editingItem, setEditingItem] = useState<MenuItemWithCategory | null>(null)
  const [adding, setAdding] = useState(false)
  const [deletingCat, setDeletingCat] = useState(false)
  const [savingItem, setSavingItem] = useState(false)
  const [deletingItem, setDeletingItem] = useState(false)

  // Long press refs
  const longPressTimer = useRef<NodeJS.Timeout | null>(null)
  const touchMoved = useRef(false)

  // Fetch restaurant data
  useEffect(() => {
    const fetchRestaurant = async () => {
      try {
        const res = await fetch('/api/restaurant')
        if (res.ok) {
          const json = await res.json()
          setRestaurant(json.restaurant)
        }
      } catch { /* ignore */ }
    }
    fetchRestaurant()
  }, [])

  // Fetch categories
  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch('/api/categories')
      if (res.status === 401) return
      if (!res.ok) { toast.error('Could not load categories'); return }
      const json = await res.json()
      setCategories(json.categories || [])
    } catch { toast.error('Something went wrong') }
    finally { setLoading(false) }
  }, [])

  // Fetch items
  const fetchItems = useCallback(async (categoryId?: string | null) => {
    setItemsLoading(true)
    try {
      const url = categoryId ? `/api/menu-items?category_id=${categoryId}` : '/api/menu-items'
      const res = await fetch(url)
      if (!res.ok) { toast.error('Could not load items'); return }
      const json = await res.json()
      setItems(json.items || [])
    } catch { toast.error('Something went wrong') }
    finally { setItemsLoading(false) }
  }, [])

  useEffect(() => { fetchCategories() }, [fetchCategories])
  useEffect(() => { fetchItems(activeCategory) }, [activeCategory, fetchItems])

  // ─── Category handlers ──────────────────────────────────────
  const handleAddCategory = async (name: string) => {
    setAdding(true)
    try {
      const res = await fetch('/api/categories', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name }),
      })
      if (!res.ok) { const j = await res.json(); toast.error(j.error || 'Could not add category'); return }
      const j = await res.json()
      setCategories((p) => [...p, j.category])
      setAddCategoryOpen(false)
      toast.success('Category added')
    } catch { toast.error('Something went wrong') }
    finally { setAdding(false) }
  }

  const handleLongPressStart = (cat: Category) => {
    touchMoved.current = false
    longPressTimer.current = setTimeout(() => {
      if (!touchMoved.current) { setCategoryToDelete(cat); setDeleteHasItems(false); setDeleteCategoryOpen(true) }
    }, 600)
  }
  const handleLongPressEnd = () => { if (longPressTimer.current) { clearTimeout(longPressTimer.current); longPressTimer.current = null } }
  const handleTouchMove = () => { touchMoved.current = true; handleLongPressEnd() }

  const handleDeleteCategory = async () => {
    if (!categoryToDelete || deletingCat) return
    setDeletingCat(true)
    try {
      const res = await fetch(`/api/categories?id=${categoryToDelete.id}`, { method: 'DELETE' })
      const j = await res.json()
      if (!res.ok) {
        if (j.error?.includes('Move or delete')) { setDeleteHasItems(true) }
        else { toast.error(j.error || 'Could not delete'); setDeleteCategoryOpen(false) }
        return
      }
      setCategories((p) => p.filter((c) => c.id !== categoryToDelete.id))
      if (activeCategory === categoryToDelete.id) setActiveCategory(null)
      setDeleteCategoryOpen(false)
      toast.success('Category deleted')
    } catch { toast.error('Something went wrong') }
    finally { setDeletingCat(false) }
  }

  // ─── Item handlers ──────────────────────────────────────────
  const handleSaveItem = async (data: Record<string, unknown>) => {
    setSavingItem(true)
    try {
      const isEdit = itemSheetMode === 'edit' && data.id
      const res = await fetch('/api/menu-items', {
        method: isEdit ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const j = await res.json()
      if (!res.ok) { toast.error(j.error || 'Could not save item'); return }
      setItemSheetMode('closed')
      setEditingItem(null)
      fetchItems(activeCategory)
      toast.success(isEdit ? 'Item updated' : 'Item added to menu')
    } catch { toast.error('Something went wrong') }
    finally { setSavingItem(false) }
  }

  const handleDeleteItem = async () => {
    if (!editingItem || deletingItem) return
    setDeletingItem(true)
    try {
      const res = await fetch(`/api/menu-items?id=${editingItem.id}`, { method: 'DELETE' })
      if (!res.ok) { toast.error('Could not delete item'); return }
      setItemSheetMode('closed')
      setEditingItem(null)
      fetchItems(activeCategory)
      toast.success('Item deleted')
    } catch { toast.error('Something went wrong') }
    finally { setDeletingItem(false) }
  }

  const handleToggleAvailability = (id: string, available: boolean) => {
    setItems((prev) => prev.map((item) => item.id === id ? { ...item, is_available: available } : item))
  }

  // ─── Filtered items ─────────────────────────────────────────
  const filteredItems = activeCategory
    ? items.filter((item) => item.category_id === activeCategory)
    : items

  const hasNoCategories = categories.length === 0
  const hasNoItems = filteredItems.length === 0
  const availableCount = filteredItems.filter(i => i.is_available).length
  const totalItemCount = items.length

  // Active chip style (gradient green fill)
  const activeChipStyle = {
    background: 'var(--dash-gradient)',
    color: '#fff',
    borderRadius: '100px',
    height: '36px',
    padding: '0 16px',
    boxShadow: '0 2px 12px rgba(34,197,94,0.25)',
    fontWeight: 700,
    transform: 'scale(1.02)',
    border: 'none',
    fontSize: '13px',
  }

  // Inactive chip style (dark glass)
  const inactiveChipStyle = {
    background: 'var(--dash-surface-2)',
    color: 'var(--dash-text-2)',
    borderRadius: '100px',
    height: '36px',
    padding: '0 16px',
    border: '1px solid var(--dash-border)',
    fontSize: '13px',
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--dash-bg)' }}>
      {/* ═══ STICKY HEADER — Dark Glass ═══ */}
      <header
        className="sticky top-0 z-40 dash-glass animate-dash-section-enter"
        style={{
          padding: '16px 20px 14px 20px',
          borderBottom: '1px solid var(--dash-border)',
        }}
      >
        <div className="flex items-center justify-between gap-2">
          <h1 style={{ fontSize: '28px', fontWeight: 800, color: 'var(--dash-text)', letterSpacing: '-0.02em', fontFamily: "var(--font-display)" }}>
            Menu
          </h1>
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Item count badge */}
            {totalItemCount > 0 && (
              <span className="dash-badge" style={{ background: 'var(--dash-surface-2)', color: 'var(--dash-text-2)', border: '1px solid var(--dash-border)', borderRadius: '100px', padding: '4px 12px', fontSize: '12px' }}>
                {totalItemCount} items
              </span>
            )}
            {/* Preview link */}
            {restaurant?.slug && (
              <button
                onClick={() => window.open(`/menu/${restaurant.slug}`, '_blank')}
                className="dash-btn dash-btn-ghost"
                style={{ fontSize: '13px', height: '32px', minHeight: '32px', padding: '0 12px', borderRadius: '10px', color: 'var(--dash-accent)', gap: '4px' }}
              >
                Preview
                <ExternalLink className="w-[13px] h-[13px]" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ═══ CATEGORY CHIPS ═══ */}
      <div style={{ marginTop: '4px', padding: '0 20px 14px 20px' }} className="animate-dash-section-enter animate-dash-section-1">
        {loading ? (
          <SkeletonChips />
        ) : hasNoCategories ? (
          <div className="flex flex-col items-center justify-center pt-12 pb-8 animate-dash-section-enter animate-dash-section-2">
            <div
              className="dash-card flex items-center justify-center mb-5"
              style={{
                width: '80px',
                height: '80px',
                borderRadius: '24px',
              }}
            >
              <Tag className="w-10 h-10" style={{ color: 'var(--dash-text-3)' }} />
            </div>
            <h3 style={{ fontSize: '17px', fontWeight: 600, color: 'var(--dash-text)' }}>
              No categories yet
            </h3>
            <p
              className="text-center max-w-[260px] leading-relaxed mt-1.5 mb-6"
              style={{ fontSize: '13px', color: 'var(--dash-text-2)' }}
            >
              Add your first category to start building your menu
            </p>
            <button
              onClick={() => setAddCategoryOpen(true)}
              className="dash-btn dash-btn-primary"
              style={{ borderRadius: '14px' }}
            >
              <Plus className="w-4 h-4" /> Add Category
            </button>
          </div>
        ) : (
          <div
            className="flex gap-2 overflow-x-auto scrollbar-hide"
            style={{ WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none' }}
          >
            {/* All chip */}
            <button onClick={() => setActiveCategory(null)}
              className="flex-shrink-0 flex items-center justify-center font-semibold transition-all"
              style={activeCategory === null ? activeChipStyle : inactiveChipStyle}
            >All</button>

            {/* Category chips */}
            {categories.map((cat) => (
              <button key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                onTouchStart={() => handleLongPressStart(cat)}
                onTouchEnd={handleLongPressEnd} onTouchCancel={handleLongPressEnd} onTouchMove={handleTouchMove}
                onMouseDown={() => handleLongPressStart(cat)} onMouseUp={handleLongPressEnd} onMouseLeave={handleLongPressEnd}
                className="flex-shrink-0 flex items-center justify-center font-semibold transition-all select-none"
                style={activeCategory === cat.id ? activeChipStyle : inactiveChipStyle}
              >{cat.name}</button>
            ))}

            {/* + Add chip */}
            <button onClick={() => setAddCategoryOpen(true)}
              className="flex-shrink-0 flex items-center justify-center gap-1 font-semibold transition-all"
              style={{
                ...inactiveChipStyle,
                color: 'var(--dash-accent)',
                border: '1.5px solid rgba(34,197,94,0.3)',
                background: 'rgba(34,197,94,0.06)',
              }}
            ><Plus className="w-3.5 h-3.5" /> Add</button>
          </div>
        )}
      </div>

      {/* ═══ ITEM CARDS ═══ */}
      <div style={{ padding: '0 0 84px 0' }}>
        {!hasNoCategories && (
          <>
            {itemsLoading ? (
              <SkeletonItems />
            ) : hasNoItems ? (
              <div className="flex flex-col items-center justify-center pt-12 pb-8 animate-dash-section-enter animate-dash-section-2">
                <div
                  className="dash-card flex items-center justify-center mb-5"
                  style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '24px',
                  }}
                >
                  <Camera className="w-10 h-10" style={{ color: 'var(--dash-text-3)' }} />
                </div>
                <h3 style={{ fontSize: '17px', fontWeight: 600, color: 'var(--dash-text)' }}>
                  No items yet
                </h3>
                <p
                  className="text-center max-w-[260px] leading-relaxed mt-1.5 mb-6"
                  style={{ fontSize: '13px', color: 'var(--dash-text-2)' }}
                >
                  Start adding dishes to this category — your customers will love it!
                </p>
                <button
                  onClick={() => { setEditingItem(null); setItemSheetMode('add') }}
                  className="dash-btn dash-btn-primary"
                  style={{ borderRadius: '14px' }}
                >
                  <Plus className="w-4 h-4" /> Add Your First Item
                </button>
              </div>
            ) : (
              <div>
                {filteredItems.map((item, index) => (
                  <ItemCard
                    key={item.id}
                    item={item}
                    index={index}
                    onToggle={handleToggleAvailability}
                    onEdit={(i) => { setEditingItem(i); setItemSheetMode('edit') }}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* ═══ FLOATING ADD BUTTON ═══ */}
      {!hasNoCategories && !hasNoItems && (
        <button
          onClick={() => { setEditingItem(null); setItemSheetMode('add') }}
          className="fixed z-30 flex items-center justify-center transition-all active:scale-90 animate-dash-fab-in"
          style={{
            bottom: 'calc(64px + 16px + env(safe-area-inset-bottom))',
            right: '20px',
            width: '56px',
            height: '56px',
            borderRadius: '28px',
            background: 'var(--dash-gradient)',
            boxShadow: '0 4px 20px rgba(34,197,94,0.3), 0 1px 6px rgba(0,0,0,0.3)',
          }}
        >
          <Plus className="w-[26px] h-[26px] text-white" style={{ strokeWidth: 2.5 }} />
        </button>
      )}

      {/* Sheets */}
      <AddCategorySheet open={addCategoryOpen} onClose={() => setAddCategoryOpen(false)} onAdd={handleAddCategory} loading={adding} />
      <DeleteCategorySheet open={deleteCategoryOpen} onClose={() => setDeleteCategoryOpen(false)} category={categoryToDelete} onConfirm={handleDeleteCategory} loading={deletingCat} hasItems={deleteHasItems} />

      {itemSheetMode !== 'closed' && (
        <ItemSheetInner
          key={editingItem?.id || 'new'}
          mode={itemSheetMode}
          item={editingItem}
          categories={categories}
          restaurant={restaurant}
          onClose={() => { setItemSheetMode('closed'); setEditingItem(null) }}
          onSave={handleSaveItem}
          onDelete={handleDeleteItem}
          saving={savingItem}
          deleting={deletingItem}
        />
      )}

      {/* Inline keyframes for stagger animation */}
      <style jsx global>{`
        @keyframes menuCardIn {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        select option {
          background: #161920;
          color: #f0f1f3;
        }
      `}</style>
    </div>
  )
}
