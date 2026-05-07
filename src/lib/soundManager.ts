/**
 * MenuMate Sound Manager
 * ─────────────────────────────────────────────────────────────────
 * Centralized audio controller for the entire platform.
 *
 * Rules enforced:
 * - Lazy init: only after first user gesture (browser autoplay policy)
 * - Queue-based playback: sounds never overlap, second sound waits
 * - Volume: 20–35% of device volume (never above 0.35 master)
 * - Silent mode: respects device audio (AudioContext stays suspended
 *   if device is in silent mode — we do NOT force-resume on silent)
 * - Global toggle: customer-menu and dashboard both have separate on/off
 * - Session-once sounds (e.g. menu open) tracked in sessionStorage
 * - No background music. No loops. Event-triggered only.
 */

import {
  getAudioContext,
  getMasterGain,
  synthMenuOpen,
  synthCategorySwitch,
  synthAddToCart,
  synthRemoveFromCart,
  synthCartOpen,
  synthOrderPlaced,
  synthPreparingStart,
  synthOrderServed,
  synthStampEarned,
  synthHalfwayMilestone,
  synthRewardUnlocked,
  synthNewOrder,
  synthRestaurantOpen,
  synthRestaurantClose,
  synthCardSlide,
  synthPhotoUploaded,
  synthOutOfStock,
  synthRestoreAvailable,
} from './soundSynth'

// ─── Storage keys ──────────────────────────────────────────────────────────────
const CUSTOMER_SOUND_KEY = 'menumate_sound_enabled'
const DASHBOARD_SOUND_KEY = 'menumate_dash_sound_enabled'
const MENU_OPEN_SESSION_KEY = 'menumate_menu_opened'

// ─── Volume levels (as fraction of device volume) ─────────────────────────────
const VOL = {
  menuOpen: 0.28,
  categorySwitch: 0.20,
  addToCart: 0.30,
  removeFromCart: 0.15,
  cartOpen: 0.25,
  orderPlaced: 0.32,
  preparingStart: 0.28,
  orderServed: 0.30,
  stampEarned: 0.30,
  halfwayMilestone: 0.25,
  rewardUnlocked: 0.32,
  newOrder: 0.30,
  restaurantOpen: 0.28,
  restaurantClose: 0.22,
  cardSlide: 0.25,
  photoUploaded: 0.25,
  outOfStock: 0.18,
  restoreAvailable: 0.18,
} as const

// ─── State ─────────────────────────────────────────────────────────────────────
let _initialized = false
let _unlocked = false
let _queueBusy = false
let _queueTimer: ReturnType<typeof setTimeout> | null = null

// Sound queue for sequential playback (no layering)
const _queue: Array<() => void> = []

// New order alert repeat tracking
let _newOrderAlertCount = 0
let _newOrderAlertTimer: ReturnType<typeof setTimeout> | null = null
let _newOrderAcknowledged = false

// ─── Read preferences from localStorage ───────────────────────────────────────
function isCustomerSoundOn(): boolean {
  if (typeof window === 'undefined') return true
  const v = localStorage.getItem(CUSTOMER_SOUND_KEY)
  return v === null ? true : v === 'true'
}

function isDashSoundOn(): boolean {
  if (typeof window === 'undefined') return true
  const v = localStorage.getItem(DASHBOARD_SOUND_KEY)
  return v === null ? true : v === 'true'
}

function wasMenuOpenedThisSession(): boolean {
  if (typeof window === 'undefined') return false
  return sessionStorage.getItem(MENU_OPEN_SESSION_KEY) === '1'
}

function markMenuOpenedThisSession() {
  if (typeof window !== 'undefined') {
    sessionStorage.setItem(MENU_OPEN_SESSION_KEY, '1')
  }
}

// ─── Unlock AudioContext after first user gesture ──────────────────────────────
function ensureUnlocked(): boolean {
  if (_unlocked) return true
  const ctx = getAudioContext()
  if (!ctx) return false
  // If context is running, we're good
  if (ctx.state === 'running') {
    _unlocked = true
    return true
  }
  // If suspended — try to resume. This only works during a user gesture.
  if (ctx.state === 'suspended') {
    ctx.resume().then(() => {
      _unlocked = (ctx.state as string) === 'running'
    }).catch(() => {})
  }
  return (ctx.state as string) === 'running'
}

// ─── Queue-based playback ─────────────────────────────────────────────────────
function processQueue() {
  if (_queueBusy || _queue.length === 0) return
  _queueBusy = true
  const fn = _queue.shift()!
  fn()
}

function scheduleNext(durationMs: number) {
  if (_queueTimer) clearTimeout(_queueTimer)
  _queueTimer = setTimeout(() => {
    _queueBusy = false
    processQueue()
  }, durationMs)
}

function enqueueSound(fn: () => void, durationMs: number) {
  if (!ensureUnlocked()) return
  _queue.push(() => {
    fn()
    scheduleNext(durationMs)
  })
  processQueue()
}

// ─── Get AudioContext + destination safely ────────────────────────────────────
function ctx(): AudioContext | null { return getAudioContext() }
function dest(): AudioNode | null { return getMasterGain() }

// ─── Public initialization (call after first user gesture) ───────────────────
export function initSoundManager() {
  if (_initialized) return
  _initialized = true
  ensureUnlocked()
}

// ─── Public: touch unlock (call from any user interaction) ───────────────────
export function touchUnlock() {
  ensureUnlocked()
}

// ─── Toggle controls ──────────────────────────────────────────────────────────
export function setCustomerSound(enabled: boolean) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(CUSTOMER_SOUND_KEY, enabled ? 'true' : 'false')
  }
}

export function setDashSound(enabled: boolean) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(DASHBOARD_SOUND_KEY, enabled ? 'true' : 'false')
  }
}

export function getCustomerSoundEnabled(): boolean {
  return isCustomerSoundOn()
}

export function getDashSoundEnabled(): boolean {
  return isDashSoundOn()
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── CUSTOMER SOUNDS ──────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

/** Sound 1 — Menu Open (once per session) */
export function playMenuOpen() {
  if (!isCustomerSoundOn()) return
  if (wasMenuOpenedThisSession()) return
  markMenuOpenedThisSession()
  const c = ctx(); const d = dest()
  if (!c || !d) return
  enqueueSound(() => synthMenuOpen(c, d, VOL.menuOpen), 900)
}

/** Sound 2 — Category Tab Switch */
export function playCategorySwitch() {
  if (!isCustomerSoundOn()) return
  const c = ctx(); const d = dest()
  if (!c || !d) return
  enqueueSound(() => synthCategorySwitch(c, d, VOL.categorySwitch), 200)
}

/** Sound 3 — Add To Cart */
export function playAddToCart() {
  if (!isCustomerSoundOn()) return
  const c = ctx(); const d = dest()
  if (!c || !d) return
  enqueueSound(() => synthAddToCart(c, d, VOL.addToCart), 300)
}

/** Sound 4 — Remove From Cart */
export function playRemoveFromCart() {
  if (!isCustomerSoundOn()) return
  const c = ctx(); const d = dest()
  if (!c || !d) return
  enqueueSound(() => synthRemoveFromCart(c, d, VOL.removeFromCart), 250)
}

/** Sound 5 — Cart Open */
export function playCartOpen() {
  if (!isCustomerSoundOn()) return
  const c = ctx(); const d = dest()
  if (!c || !d) return
  enqueueSound(() => synthCartOpen(c, d, VOL.cartOpen), 350)
}

/** Sound 6 — Order Placed Successfully */
export function playOrderPlaced() {
  if (!isCustomerSoundOn()) return
  const c = ctx(); const d = dest()
  if (!c || !d) return
  enqueueSound(() => synthOrderPlaced(c, d, VOL.orderPlaced), 1400)
}

/** Sound 7a — Status: New → Preparing */
export function playPreparingStart() {
  if (!isCustomerSoundOn()) return
  const c = ctx(); const d = dest()
  if (!c || !d) return
  enqueueSound(() => synthPreparingStart(c, d, VOL.preparingStart), 500)
}

/** Sound 7b — Status: Preparing → Served */
export function playOrderServed() {
  if (!isCustomerSoundOn()) return
  const c = ctx(); const d = dest()
  if (!c || !d) return
  enqueueSound(() => synthOrderServed(c, d, VOL.orderServed), 600)
}

/** Sound 8 — Stamp Earned (PRO) */
export function playStampEarned() {
  if (!isCustomerSoundOn()) return
  const c = ctx(); const d = dest()
  if (!c || !d) return
  enqueueSound(() => synthStampEarned(c, d, VOL.stampEarned), 400)
}

/** Sound 9 — Halfway Milestone 5/9 (PRO) */
export function playHalfwayMilestone() {
  if (!isCustomerSoundOn()) return
  const c = ctx(); const d = dest()
  if (!c || !d) return
  enqueueSound(() => synthHalfwayMilestone(c, d, VOL.halfwayMilestone), 1000)
}

/** Sound 10 — Reward Unlocked 9/9 (PRO) */
export function playRewardUnlocked() {
  if (!isCustomerSoundOn()) return
  const c = ctx(); const d = dest()
  if (!c || !d) return
  enqueueSound(() => synthRewardUnlocked(c, d, VOL.rewardUnlocked), 2800)
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── DASHBOARD SOUNDS ─────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

/** Sound 11 — New Order Arrives (repeats up to 3x if unacknowledged) */
export function playNewOrder() {
  if (!isDashSoundOn()) return
  const c = ctx(); const d = dest()
  if (!c || !d) return

  // Reset ack state
  _newOrderAcknowledged = false
  _newOrderAlertCount = 0

  if (_newOrderAlertTimer) clearTimeout(_newOrderAlertTimer)

  function ringOnce(vol: number, delayMs: number) {
    _newOrderAlertTimer = setTimeout(() => {
      if (_newOrderAcknowledged) return
      const cv = ctx(); const dv = dest()
      if (!cv || !dv) return
      enqueueSound(() => synthNewOrder(cv, dv, vol), 700)
      _newOrderAlertCount++
      if (_newOrderAlertCount < 3) {
        ringOnce(vol * 0.7, 3000)
      }
    }, delayMs)
  }

  enqueueSound(() => synthNewOrder(c, d, VOL.newOrder), 700)
  _newOrderAlertCount = 1
  ringOnce(VOL.newOrder * 0.7, 3000)
}

/** Acknowledge new order alert (stops repeating) */
export function acknowledgeNewOrder() {
  _newOrderAcknowledged = true
  if (_newOrderAlertTimer) {
    clearTimeout(_newOrderAlertTimer)
    _newOrderAlertTimer = null
  }
}

/** Sound 12a — Restaurant Open */
export function playRestaurantOpen() {
  if (!isDashSoundOn()) return
  const c = ctx(); const d = dest()
  if (!c || !d) return
  enqueueSound(() => synthRestaurantOpen(c, d, VOL.restaurantOpen), 250)
}

/** Sound 12b — Restaurant Close */
export function playRestaurantClose() {
  if (!isDashSoundOn()) return
  const c = ctx(); const d = dest()
  if (!c || !d) return
  enqueueSound(() => synthRestaurantClose(c, d, VOL.restaurantClose), 250)
}

/** Sound 13 — Card Slide (New→Preparing = lower, Preparing→Served = higher) */
export function playCardSlide(stage: 'to-preparing' | 'to-served') {
  if (!isDashSoundOn()) return
  const c = ctx(); const d = dest()
  if (!c || !d) return
  const pitch = stage === 'to-served' ? 1.6 : 1.0
  enqueueSound(() => synthCardSlide(c, d, VOL.cardSlide, pitch), 250)
}

/** Sound 14 — Photo Upload Complete */
export function playPhotoUploaded() {
  if (!isDashSoundOn()) return
  const c = ctx(); const d = dest()
  if (!c || !d) return
  enqueueSound(() => synthPhotoUploaded(c, d, VOL.photoUploaded), 450)
}

/** Sound 15a — Out Of Stock */
export function playOutOfStock() {
  if (!isDashSoundOn()) return
  const c = ctx(); const d = dest()
  if (!c || !d) return
  enqueueSound(() => synthOutOfStock(c, d, VOL.outOfStock), 200)
}

/** Sound 15b — Restore Available */
export function playRestoreAvailable() {
  if (!isDashSoundOn()) return
  const c = ctx(); const d = dest()
  if (!c || !d) return
  enqueueSound(() => synthRestoreAvailable(c, d, VOL.restoreAvailable), 250)
}
