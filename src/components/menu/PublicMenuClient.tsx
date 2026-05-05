'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import {
  ShoppingBag, Search, X,
  Bell, Receipt, ChefHat, Gift, UtensilsCrossed,
} from 'lucide-react'
import CartSheet from './CartSheet'
import MenuItemCard from './MenuItemCard'
import BannerSlider from './BannerSlider'
import StampsTab from './StampsTab'
import { useMenuTheme } from '@/hooks/useMenuTheme'
import { getTheme } from '@/lib/themes'
import { formatPrice } from '@/lib/utils'
import type { Restaurant, Category, MenuItem, FoodType, Banner, StampSettings } from '@/types'
import '@/styles/menu-themes.css'

// ─── Types ────────────────────────────────────────────────────
interface MenuItemWithCategory extends MenuItem {
  category_name: string | null
}

interface CartItem {
  menuItemId: string
  name: string
  price: number
  quantity: number
  foodType: FoodType
}

interface PublicMenuClientProps {
  restaurant: Restaurant
  categories: Category[]
  items: MenuItemWithCategory[]
  tableNumber: number | null
  banners?: Banner[]
  defaultTheme?: string
}

// ─── Theme mapping: CSS theme id → themes.ts ThemeName ───────
const cssThemeToLibTheme: Record<string, string> = {
  dark: 'dark',
  light: 'sunset',
  green: 'emerald',
  gold: 'royal',
}

// ─── Helpers ──────────────────────────────────────────────────
const CART_KEY = (slug: string) => `menumate_cart_${slug}`

function loadCart(slug: string): CartItem[] {
  if (typeof window === 'undefined') return []
  try {
    const s = localStorage.getItem(CART_KEY(slug))
    return s ? JSON.parse(s) : []
  } catch { return [] }
}

function saveCart(slug: string, cart: CartItem[]) {
  try {
    if (cart.length > 0) localStorage.setItem(CART_KEY(slug), JSON.stringify(cart))
    else localStorage.removeItem(CART_KEY(slug))
  } catch { /* ignore */ }
}

// Generate a unique notification ID
function generateNotifId(): string {
  return `notif_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

// Groups ALL items — including those with null or orphaned category_id
function groupByCategory(items: MenuItemWithCategory[], categories: Category[]) {
  const catMap = new Map(categories.map(c => [c.id, c.name]))
  const grouped: { categoryId: string; categoryName: string; items: MenuItemWithCategory[] }[] = []
  const assigned = new Set<string>()

  // 1. Assign items to known categories
  for (const cat of categories) {
    const catItems = items.filter((i) => i.category_id === cat.id)
    if (catItems.length > 0) {
      grouped.push({ categoryId: cat.id, categoryName: cat.name, items: catItems })
      catItems.forEach(i => assigned.add(i.id))
    }
  }

  // 2. Collect unassigned items (null category or orphaned)
  const unassigned = items.filter(i => !assigned.has(i.id))
  if (unassigned.length > 0) {
    grouped.push({ categoryId: '__other__', categoryName: 'More Items', items: unassigned })
  }

  return grouped
}

// ═══════════════════════════════════════════════════════════════
// ─── Skeleton Grid ────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════
function SkeletonGrid() {
  return (
    <div
      className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3"
      style={{ padding: '0 16px 120px', maxWidth: '1200px', margin: '0 auto' }}
    >
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="menu-skeleton">
          <div style={{ aspectRatio: '1' }} />
          <div style={{ padding: '8px 10px 10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div className="menu-skeleton" style={{ height: '10px', width: '70%', borderRadius: '6px' }} />
            <div className="menu-skeleton" style={{ height: '14px', width: '40%', borderRadius: '6px' }} />
          </div>
        </div>
      ))}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// ─── MAIN COMPONENT ───────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════
export default function PublicMenuClient({
  restaurant,
  categories,
  items,
  tableNumber,
  banners,
  defaultTheme,
}: PublicMenuClientProps) {
  const { cycleTheme, current, setTheme } = useMenuTheme()

  // Apply owner's default theme on first load — ALWAYS (customer can switch later)
  const themeAppliedRef = useRef(false)
  useEffect(() => {
    if (themeAppliedRef.current || !defaultTheme) return
    themeAppliedRef.current = true

    const themeMap: Record<string, string> = {
      dark: 'dark',
      emerald: 'green',
      sunset: 'light',
      royal: 'gold',
    }
    const mappedTheme = themeMap[defaultTheme] || 'dark'
    // Always apply admin's theme on first load (customer can still switch later)
    setTheme(mappedTheme as 'dark' | 'light' | 'green' | 'gold')
  }, [defaultTheme, setTheme])

  // ─── State ──────────────────────────────────────────────────
  const [cart, setCart] = useState<CartItem[]>(() => loadCart(restaurant.slug))
  const [activeCategory, setActiveCategory] = useState('all')
  const [cartOpen, setCartOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [fullscreenImg, setFullscreenImg] = useState<string | null>(null)
  const [waiterSent, setWaiterSent] = useState(false)
  const [billSent, setBillSent] = useState(false)
  const [isHydrated, setIsHydrated] = useState(false)
  const [activeTab, setActiveTab] = useState<'menu' | 'stamps'>('menu')
  const [stampSettings, setStampSettings] = useState<StampSettings | null>(null)
  const [foodTypeFilter, setFoodTypeFilter] = useState<'all' | 'VEG' | 'NONVEG'>('all')
  const [orderType, setOrderType] = useState<'dine-in' | 'takeaway'>('dine-in')

  // ─── Debounce guards (prevent double-click double-fire) ─────
  const waiterFiringRef = useRef(false)
  const billFiringRef = useRef(false)

  // ─── Fetch stamp settings ───────────────────────────────────
  useEffect(() => {
    fetch(`/api/stamp-settings?restaurant_id=${restaurant.id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.settings) {
          setStampSettings(data.settings)
        }
      })
      .catch(() => { /* ignore */ })
  }, [restaurant.id])

  // Hydration gate — prevent mismatch during SSR
  useEffect(() => { setIsHydrated(true) }, [])

  // Persist cart
  useEffect(() => { saveCart(restaurant.slug, cart) }, [cart, restaurant.slug])

  // ─── Get current MenuTheme for StampsTab ────────────────────
  const libTheme = useMemo(() => {
    const mapped = cssThemeToLibTheme[current.id] || 'dark'
    return getTheme(mapped)
  }, [current.id])

  // ─── Derived (memoized) ─────────────────────────────────────
  const grouped = useMemo(() => groupByCategory(items, categories), [items, categories])

  const allPills = useMemo(
    () => [{ id: 'all', name: 'All' }, ...categories.map((c) => ({ id: c.id, name: c.name }))],
    [categories],
  )

  // Detect whether menu has BOTH veg and non-veg items
  const hasMixedFoodTypes = useMemo(() => {
    const types = new Set(items.map((i) => i.food_type))
    return types.has('VEG') && types.has('NONVEG')
  }, [items])

  const q = searchQuery.trim().toLowerCase()

  // Filtered items — flat list (category + food type + search)
  const filtered = useMemo(() => {
    let result = items

    // Apply food type filter
    if (foodTypeFilter !== 'all') {
      result = result.filter((i) => i.food_type === foodTypeFilter)
    }

    // Apply search filter
    if (q.length > 0) {
      return result.filter(
        (i) =>
          i.name.toLowerCase().includes(q) ||
          (i.description && i.description.toLowerCase().includes(q)),
      )
    }

    // Apply category filter
    if (activeCategory === 'all') return result
    return result.filter((i) => i.category_id === activeCategory)
  }, [items, q, activeCategory, foodTypeFilter])

  // Group filtered items for display
  // NOTE: When food type filter is active, we must build groups from `filtered`
  // (not the original `grouped`) so that food type filtering applies within categories too.
  const displayGroups = useMemo(() => {
    // Search mode: flat list
    if (q.length > 0) {
      return filtered.length > 0
        ? [{ categoryId: 'search', categoryName: `Results (${filtered.length})`, items: filtered }]
        : []
    }

    // If food type filter is active, re-group the filtered items so category + food type both apply
    if (foodTypeFilter !== 'all') {
      const filteredGrouped = groupByCategory(filtered, categories)
      if (activeCategory === 'all') return filteredGrouped
      return filteredGrouped.filter((g) => g.categoryId === activeCategory)
    }

    // No food type filter — use pre-computed grouped (includes all items)
    if (activeCategory === 'all') return grouped
    return grouped.filter((g) => g.categoryId === activeCategory)
  }, [q, filtered, activeCategory, grouped, foodTypeFilter, categories])

  const cartCount = cart.reduce((s, i) => s + i.quantity, 0)
  const cartTotal = cart.reduce((s, i) => s + i.price * i.quantity, 0)

  // ─── Cart handlers ──────────────────────────────────────────
  const addToCart = useCallback((item: MenuItemWithCategory) => {
    setCart((prev) => {
      const ex = prev.find((c) => c.menuItemId === item.id)
      if (ex) return prev.map((c) => (c.menuItemId === item.id ? { ...c, quantity: c.quantity + 1 } : c))
      return [...prev, { menuItemId: item.id, name: item.name, price: item.price, quantity: 1, foodType: item.food_type }]
    })
  }, [])

  const removeFromCart = useCallback((menuItemId: string) => {
    setCart((prev) => {
      const ex = prev.find((c) => c.menuItemId === menuItemId)
      if (ex && ex.quantity > 1) return prev.map((c) => (c.menuItemId === menuItemId ? { ...c, quantity: c.quantity - 1 } : c))
      return prev.filter((c) => c.menuItemId !== menuItemId)
    })
  }, [])

  const handleCartAdd = useCallback(
    (menuItemId: string) => {
      const item = items.find((i) => i.id === menuItemId)
      if (item) addToCart(item)
    },
    [items, addToCart],
  )

  const getQty = useCallback((menuItemId: string) => cart.find((c) => c.menuItemId === menuItemId)?.quantity || 0, [cart])

  // ─── Waiter / Bill ──────────────────────────────────────────
  // Each click creates exactly ONE event with a unique ID
  const sendNotification = useCallback(
    async (type: 'waiter' | 'bill') => {
      // Debounce guard: prevent double-fire from rapid clicks
      if (type === 'waiter' && waiterFiringRef.current) return
      if (type === 'bill' && billFiringRef.current) return

      // Set firing guard immediately (synchronous — blocks re-entry)
      if (type === 'waiter') waiterFiringRef.current = true
      else billFiringRef.current = true

      // Generate unique event ID for deduplication
      const eventId = generateNotifId()
      const timestamp = new Date().toISOString()

      const payload = {
        id: eventId,
        type,
        restaurant_id: restaurant.id,
        table_number: tableNumber,
        restaurant_name: restaurant.name,
        timestamp,
      }

      // Send notification via REST API

      // Use REST API as the single source of truth (no WebSocket fallback duplication)
      try {
        const res = await fetch('/api/notifications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })

        if (!res.ok) {
          console.error(`[Notification] Failed to send ${type}:`, res.status)
        } else {
          // Event created successfully
        }
      } catch (err) {
        console.error(`[Notification] Error sending ${type}:`, err)
      }

      // Also emit via WebSocket for real-time delivery (no REST duplication since REST is fallback)
      try {
        const { io } = await import('socket.io-client')
        const socket = io('/?XTransformPort=3004', { transports: ['websocket'], timeout: 3000 })
        socket.on('connect', () => {
          socket.emit('customer-request', payload)
          socket.disconnect()
        })
        socket.on('connect_error', () => {
          socket.disconnect()
        })
        socket.connect()
      } catch {
        // WebSocket not available — REST already handled it
      }

      // Update UI state
      if (type === 'waiter') setWaiterSent(true)
      else setBillSent(true)
      setTimeout(() => {
        if (type === 'waiter') {
          setWaiterSent(false)
          waiterFiringRef.current = false
        } else {
          setBillSent(false)
          billFiringRef.current = false
        }
      }, 3000)
    },
    [restaurant.id, restaurant.name, tableNumber],
  )

  // ─── Search ─────────────────────────────────────────────────
  const searchRef = useRef<HTMLInputElement>(null)
  useEffect(() => { if (searchOpen && searchRef.current) searchRef.current.focus() }, [searchOpen])

  // ─── Category section refs for scroll ───────────────────────
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({})
  const scrollInProgress = useRef(false)

  // Set a ref for each category section
  const setSectionRef = useCallback((categoryId: string) => (el: HTMLDivElement | null) => {
    sectionRefs.current[categoryId] = el
  }, [])

  // ─── Scroll to category section on pill click ───────────────
  const handleCategoryClick = useCallback((categoryId: string) => {
    if (categoryId === 'all') {
      // Scroll to top of content
      window.scrollTo({ top: 0, behavior: 'smooth' })
      setActiveCategory('all')
      return
    }

    setActiveCategory(categoryId)
    scrollInProgress.current = true

    // Use scrollIntoView for the target section
    const section = sectionRefs.current[categoryId]
    if (section) {
      // Account for sticky header (56px) + sticky category bar (52px) = 108px
      const offset = 112
      const top = section.getBoundingClientRect().top + window.scrollY - offset
      window.scrollTo({ top, behavior: 'smooth' })
    }

    // Reset scroll lock after animation
    setTimeout(() => { scrollInProgress.current = false }, 800)
  }, [])

  // ─── Track active category on scroll via IntersectionObserver ──
  useEffect(() => {
    if (grouped.length === 0) return

    const observerCallback = (entries: IntersectionObserverEntry[]) => {
      if (scrollInProgress.current) return

      // Find the most visible intersecting section
      let bestEntry: IntersectionObserverEntry | null = null
      for (const entry of entries) {
        if (entry.isIntersecting) {
          if (!bestEntry || entry.intersectionRatio > bestEntry.intersectionRatio) {
            bestEntry = entry
          }
        }
      }

      if (bestEntry) {
        const categoryId = bestEntry.target.getAttribute('data-category-id')
        if (categoryId && categoryId !== '__other__' && categoryId !== 'search') {
          setActiveCategory(categoryId)
        }
      }
    }

    const observer = new IntersectionObserver(observerCallback, {
      rootMargin: '-120px 0px -60% 0px',
      threshold: [0, 0.25, 0.5],
    })

    // Observe all category sections
    for (const group of grouped) {
      const el = sectionRefs.current[group.categoryId]
      if (el) {
        observer.observe(el)
      }
    }

    return () => observer.disconnect()
  }, [grouped])

  // ─── Auto-scroll active pill ────────────────────────────────
  const pillRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!pillRef.current) return
    const container = pillRef.current
    const active = container.querySelector(`[data-pill="${activeCategory}"]`) as HTMLElement | null
    if (!active) return
    const cr = container.getBoundingClientRect()
    const pr = active.getBoundingClientRect()
    container.scrollTo({ left: container.scrollLeft + pr.left - cr.left - cr.width / 2 + pr.width / 2, behavior: 'smooth' })
  }, [activeCategory])

  // ─── Fullscreen escape ──────────────────────────────────────
  useEffect(() => {
    if (!fullscreenImg) return
    const fn = (e: KeyboardEvent) => { if (e.key === 'Escape') setFullscreenImg(null) }
    document.addEventListener('keydown', fn)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', fn); document.body.style.overflow = prev || '' }
  }, [fullscreenImg])

  // ─── Reset to All when search cleared ───────────────────────
  useEffect(() => {
    if (q.length === 0 && activeCategory !== 'all') {
      setActiveCategory('all')
    }
  }, [q, activeCategory])

  // ─── Item/category counts logged in dev only ──────────────────

  // ─── Show stamps tab? ───────────────────────────────────────
  const showStampsTab = !!stampSettings

  // ═══════════════════════════════════════════════════════════
  // ─── RENDER ────────────────────────────────────────────────
  // ═══════════════════════════════════════════════════════════
  if (!isHydrated) {
    return (
      <div style={{ background: 'var(--m-bg)', minHeight: '100vh' }}>
        {/* Header skeleton */}
        <div style={{ height: 56, background: 'var(--m-header-bg)', display: 'flex', alignItems: 'center', padding: '0 16px', gap: 12 }}>
          <div className="menu-skeleton" style={{ height: 18, width: 120, borderRadius: 8 }} />
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            <div className="menu-skeleton" style={{ width: 36, height: 36, borderRadius: 10 }} />
            <div className="menu-skeleton" style={{ width: 36, height: 36, borderRadius: 10 }} />
          </div>
        </div>
        {/* Category bar skeleton */}
        <div style={{ height: 52, background: 'var(--m-bar-bg)', display: 'flex', gap: 8, padding: '10px 16px', overflow: 'hidden' }}>
          {[1,2,3,4,5].map(i => <div key={i} className="menu-skeleton" style={{ height: 34, width: 64, borderRadius: 20, flexShrink: 0 }} />)}
        </div>
        <SkeletonGrid />
      </div>
    )
  }

  return (
    <div style={{ background: 'var(--m-bg)', minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>

      {/* ═══ 1. STICKY HEADER ═══ */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 50, height: 56,
        background: 'var(--m-header-bg)',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        borderBottom: '1px solid var(--m-header-border)',
        display: 'flex', alignItems: 'center', padding: '0 clamp(10px, 4vw, 16px)',
        maxWidth: 1200, width: '100%', margin: '0 auto',
        overflow: 'hidden',
      }}>
        {/* Restaurant name or tab toggle */}
        {!searchOpen && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, overflow: 'hidden' }}>
            {showStampsTab ? (
              <>
                <button
                  onClick={() => setActiveTab('menu')}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    padding: '6px 10px', borderRadius: 10,
                    background: activeTab === 'menu' ? 'var(--m-pill-active-bg)' : 'var(--m-pill-bg)',
                    color: activeTab === 'menu' ? 'var(--m-pill-active-text)' : 'var(--m-pill-text)',
                    border: 'none', cursor: 'pointer',
                    fontSize: 13, fontWeight: 600,
                    transition: 'all 150ms ease',
                    flexShrink: 1, minWidth: 0,
                  }}
                >
                  <UtensilsCrossed size={14} strokeWidth={2} style={{ flexShrink: 0 }} />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>
                    {restaurant.name}
                  </span>
                </button>
                <button
                  onClick={() => setActiveTab('stamps')}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    padding: '6px 10px', borderRadius: 10,
                    background: activeTab === 'stamps' ? 'var(--m-pill-active-bg)' : 'var(--m-pill-bg)',
                    color: activeTab === 'stamps' ? 'var(--m-pill-active-text)' : 'var(--m-pill-text)',
                    border: 'none', cursor: 'pointer',
                    fontSize: 13, fontWeight: 600,
                    transition: 'all 150ms ease',
                    flexShrink: 0,
                  }}
                >
                  <Gift size={14} strokeWidth={2} />
                  Rewards
                </button>
              </>
            ) : (
              <h1 style={{
                fontSize: 16, fontWeight: 700, color: 'var(--m-text)',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                flex: 1, letterSpacing: '-0.02em',
              }}>
                {restaurant.name}
              </h1>
            )}
          </div>
        )}

        {/* Search pill */}
        {searchOpen && (
          <div className="menu-search-pill">
            <Search size={15} style={{ color: 'var(--m-text-muted)', marginLeft: 12, flexShrink: 0 }} strokeWidth={2} />
            <input
              ref={searchRef}
              className="menu-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search menu..."
            />
            {searchQuery.length > 0 && (
              <button className="menu-search-clear" onClick={() => { setSearchQuery(''); searchRef.current?.focus() }} aria-label="Clear">
                <X size={12} strokeWidth={2.5} />
              </button>
            )}
          </div>
        )}

        {/* Right icons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0, marginLeft: searchOpen ? 8 : 'auto' }}>
          {!searchOpen && activeTab === 'menu' && (
            <button
              className="menu-theme-btn"
              onClick={() => setSearchOpen(true)}
              aria-label="Search"
            >
              <Search size={17} strokeWidth={2} />
            </button>
          )}

          {/* Theme switcher */}
          <button className="menu-theme-btn" onClick={cycleTheme} aria-label="Change theme" title={current.label}>
            {current.icon}
          </button>

          {/* Cart icon */}
          <button
            className="menu-theme-btn"
            onClick={() => setCartOpen(true)}
            aria-label="Cart"
            style={{ position: 'relative' }}
          >
            <ShoppingBag size={17} strokeWidth={2} />
            {cartCount > 0 && (
              <span style={{
                position: 'absolute', top: -3, right: -3,
                minWidth: 16, height: 16, borderRadius: '50%',
                background: 'var(--m-primary)', color: 'var(--m-primary-text)',
                fontSize: 10, fontWeight: 700, display: 'flex',
                alignItems: 'center', justifyContent: 'center', padding: '0 4px',
                lineHeight: 1,
              }}>
                {cartCount}
              </span>
            )}
          </button>

          {searchOpen && (
            <button className="menu-theme-btn" onClick={() => { setSearchOpen(false); setSearchQuery('') }} aria-label="Close search">
              <X size={17} strokeWidth={2} />
            </button>
          )}
        </div>
      </header>

      {/* ═══ STAMPS TAB ═══ */}
      {activeTab === 'stamps' && stampSettings ? (
        <main style={{ flex: 1 }}>
          <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            <StampsTab
              restaurantId={restaurant.id}
              restaurantName={restaurant.name}
              stampSettings={stampSettings}
              theme={libTheme}
            />
          </div>
        </main>
      ) : (
        <>
          {/* ═══ 1.5 BANNER SLIDER ═══ */}
          {banners && banners.length > 0 && (
            <BannerSlider banners={banners} />
          )}

          {/* ═══ 2. STICKY CATEGORY BAR ═══ */}
          {grouped.length > 0 && !searchOpen && (
            <div
              className="menu-category-bar"
              style={{
                position: 'sticky',
                top: 56,
                zIndex: 40,
                background: 'var(--m-bar-bg)',
                backdropFilter: 'blur(20px) saturate(180%)',
                WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                borderBottom: '1px solid var(--m-bar-border)',
                padding: '9px 0',
              }}
            >
              <div
                ref={pillRef}
                className="menu-scroll-hide"
                style={{
                  display: 'flex', gap: 6, overflowX: 'auto',
                  padding: '0 16px', maxWidth: 1200, margin: '0 auto',
                }}
              >
                {allPills.map((pill) => {
                  const isActive = activeCategory === pill.id
                  return (
                    <button
                      key={pill.id}
                      data-pill={pill.id}
                      onClick={() => handleCategoryClick(pill.id)}
                      className={`menu-pill ${isActive ? 'menu-pill-active' : 'menu-pill-inactive'}`}
                    >
                      {pill.name}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* ═══ 2.5 ORDER TYPE SELECTOR ═══ */}
          {!searchOpen && (
            <div className="order-type-bar">
              <button
                className={`order-type-btn${orderType === 'dine-in' ? ' order-type-btn--active' : ''}`}
                onClick={() => setOrderType('dine-in')}
              >
                <span>🍽️</span>
                <span>Dine-in</span>
                {tableNumber != null && (
                  <span className="order-type-table">Table {tableNumber}</span>
                )}
              </button>
              <button
                className={`order-type-btn${orderType === 'takeaway' ? ' order-type-btn--active' : ''}`}
                onClick={() => setOrderType('takeaway')}
              >
                <span>🥡</span>
                <span>Takeaway</span>
              </button>
            </div>
          )}
          {orderType === 'takeaway' && !searchOpen && (
            <p className="order-type-hint">Pickup available at restaurant</p>
          )}

          {/* ═══ 2.6 FOOD TYPE FILTER CHIPS ═══ */}
          {hasMixedFoodTypes && !searchOpen && (
            <div className="food-type-chips menu-scroll-hide">
              <button
                className={`food-type-chip ${foodTypeFilter === 'all' ? 'food-type-chip--active' : ''}`}
                onClick={() => setFoodTypeFilter('all')}
              >
                <span>🍽</span>
                <span>All</span>
              </button>
              <button
                className={`food-type-chip ${foodTypeFilter === 'VEG' ? 'food-type-chip--active' : ''}`}
                onClick={() => setFoodTypeFilter('VEG')}
              >
                <span className="food-type-chip--dot" style={{ background: 'var(--m-veg)' }} />
                <span>Veg</span>
              </button>
              <button
                className={`food-type-chip ${foodTypeFilter === 'NONVEG' ? 'food-type-chip--active' : ''}`}
                onClick={() => setFoodTypeFilter('NONVEG')}
              >
                <span className="food-type-chip--dot" style={{ background: 'var(--m-nonveg)' }} />
                <span>Non-Veg</span>
              </button>
            </div>
          )}

          {/* ═══ 3. CONTENT ═══ */}
          <main style={{ flex: 1 }}>
            {/* Search results empty state */}
            {q.length > 0 && filtered.length === 0 ? (
              <div className="menu-empty-state">
                <div className="menu-empty-icon">
                  <Search size={28} style={{ color: 'var(--m-text-muted)' }} strokeWidth={1.5} />
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--m-text)', marginBottom: 4 }}>
                  No results for &ldquo;{searchQuery.trim()}&rdquo;
                </h3>
                <p style={{ fontSize: 13, color: 'var(--m-text-muted)', maxWidth: 260 }}>
                  Try a different search or browse categories.
                </p>
              </div>
            ) : items.length === 0 ? (
              /* Empty menu state */
              <div className="menu-empty-state">
                <div className="menu-empty-icon">
                  <ChefHat size={28} style={{ color: 'var(--m-text-muted)' }} strokeWidth={1.5} />
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--m-text)', marginBottom: 4 }}>No items yet</h3>
                <p style={{ fontSize: 13, color: 'var(--m-text-muted)', maxWidth: 260 }}>
                  Menu is being prepared. Check back soon!
                </p>
              </div>
            ) : displayGroups.length === 0 ? (
              /* Category filter returns no results */
              <div className="menu-empty-state">
                <div className="menu-empty-icon">
                  <Search size={28} style={{ color: 'var(--m-text-muted)' }} strokeWidth={1.5} />
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--m-text)', marginBottom: 4 }}>No items found</h3>
                <p style={{ fontSize: 13, color: 'var(--m-text-muted)', maxWidth: 260 }}>
                  This category is empty. Try another one.
                </p>
              </div>
            ) : (
              /* ── Product Grid ── */
              <div style={{ padding: '16px 0 calc(100px + env(safe-area-inset-bottom, 0px))' }}>
                {displayGroups.map((group, gi) => (
                  <div
                    key={group.categoryId}
                    data-category-id={group.categoryId}
                    ref={setSectionRef(group.categoryId)}
                    style={{ maxWidth: 1200, margin: '0 auto' }}
                  >
                    {/* Category heading */}
                    <div style={{ padding: gi === 0 ? '4px 16px 10px' : '20px 16px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--m-text)', letterSpacing: '-0.01em' }}>
                        {group.categoryName}
                      </h2>
                      <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--m-text-muted)' }}>
                        {group.items.length} {group.items.length === 1 ? 'item' : 'items'}
                      </span>
                    </div>

                    {/* Grid: 2/3/4/5 columns */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3" style={{ padding: '0 16px' }}>
                      {group.items.map((item, ii) => (
                        <MenuItemCard
                          key={`${item.id}-${item.category_id || 'none'}`}
                          name={item.name}
                          price={item.price}
                          image_url={item.image_url}
                          food_type={item.food_type}
                          is_available={item.is_available}
                          is_best_seller={item.is_best_seller}
                          quantity={getQty(item.id)}
                          onAdd={() => addToCart(item)}
                          onRemove={() => removeFromCart(item.id)}
                          onImageTap={item.image_url ? () => setFullscreenImg(item.image_url!) : undefined}
                          index={gi * 20 + ii}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </main>
        </>
      )}

      {/* ═══ 4. FOOTER ═══ */}
      <footer style={{
        padding: '16px', textAlign: 'center',
        color: 'var(--m-footer-text)', fontSize: 11,
        borderTop: '1px solid var(--m-card-border)',
        marginTop: 'auto',
      }}>
        Powered by <span style={{ color: 'var(--m-footer-accent)', fontWeight: 700 }}>MenuMate</span>
      </footer>

      {/* ═══ 5. FLOATING CART FAB ═══ */}
      {cartCount > 0 && (
        <button
          className="menu-fab"
          onClick={() => setCartOpen(true)}
          aria-label="View cart"
          style={{ bottom: 'calc(24px + env(safe-area-inset-bottom, 0px))', right: 16 }}
        >
          <ShoppingBag size={22} strokeWidth={2.2} />
          <span className="menu-fab-badge">{cartCount}</span>
          <span className="menu-fab-total">{formatPrice(cartTotal)}</span>
        </button>
      )}

      {/* ═══ 6. SERVICE ACTION BAR (Call Waiter / Ask for Bill) ═══ */}
      {activeTab === 'menu' && (
        <div className="menu-service-bar" role="toolbar" aria-label="Service actions">
          <button
            className={`menu-service-btn menu-service-btn--primary${waiterSent ? ' menu-service-btn--sent' : ''}`}
            onClick={() => sendNotification('waiter')}
            disabled={waiterSent || waiterFiringRef.current}
            aria-label={waiterSent ? 'Waiter call sent' : 'Call Waiter'}
          >
            <span className="menu-service-btn__icon">
              {waiterSent ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
              ) : (
                <Bell size={16} strokeWidth={2.2} />
              )}
            </span>
            <span className="menu-service-btn__label">
              {waiterSent ? 'Sent' : 'Call Waiter'}
            </span>
          </button>
          <button
            className={`menu-service-btn menu-service-btn--secondary${billSent ? ' menu-service-btn--sent' : ''}`}
            onClick={() => sendNotification('bill')}
            disabled={billSent || billFiringRef.current}
            aria-label={billSent ? 'Bill request sent' : 'Ask for Bill'}
          >
            <span className="menu-service-btn__icon">
              {billSent ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
              ) : (
                <Receipt size={16} strokeWidth={2.2} />
              )}
            </span>
            <span className="menu-service-btn__label">
              {billSent ? 'Sent' : 'Ask for Bill'}
            </span>
          </button>
        </div>
      )}

      {/* ═══ 7. FULLSCREEN IMAGE ═══ */}
      {fullscreenImg && (
        <div className="menu-fullscreen" onClick={() => setFullscreenImg(null)}>
          <button className="menu-fullscreen-close" onClick={() => setFullscreenImg(null)} aria-label="Close">
            <X size={18} strokeWidth={2.5} />
          </button>
          <img src={fullscreenImg} alt="Preview" onClick={(e) => e.stopPropagation()} />
        </div>
      )}

      {/* ═══ 8. WHATSAPP FAB ═══ */}
      {restaurant.whatsapp_number && activeTab === 'menu' && (
        <a
          href={`https://wa.me/${restaurant.whatsapp_number}`}
          target="_blank"
          rel="noopener noreferrer"
          className="wa-fab wa-fab-pulse"
          aria-label="Chat with us on WhatsApp"
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="#FFFFFF"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
          <span className="wa-fab-tooltip">Chat with us</span>
        </a>
      )}

      {/* ═══ 9. CART SHEET ═══ */}
      {cartOpen && (
        <CartSheet
          cart={cart}
          tableNumber={tableNumber}
          restaurantName={restaurant.name}
          restaurantId={restaurant.id}
          slug={restaurant.slug}
          onClose={() => setCartOpen(false)}
          onAdd={handleCartAdd}
          onRemove={removeFromCart}
          onOrderPlaced={() => {
            setCart([])
          }}
        />
      )}

      {/* Bottom safe area spacer — extra padding for service bar */}
      <div style={{ height: 'calc(20px + env(safe-area-inset-bottom, 0px))', flexShrink: 0 }} />
    </div>
  )
}
