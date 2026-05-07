/**
 * MenuMate ASMR Sound Synthesizer
 * ─────────────────────────────────────────────────────────────────
 * Procedurally generates all 15 branded sounds from 6 sonic primitives
 * using the Web Audio API. Zero external audio files.
 *
 * Sonic palette:
 *   1. Warm wood tap       — filtered impulse + pitched decay
 *   2. Paper slide/turn    — shaped noise burst
 *   3. Soft bell/chime     — sine + harmonic series + long decay
 *   4. Rubber stamp        — sharp attack impulse + paper resonance
 *   5. Glass clink         — high sine + metallic ring
 *   6. Mechanical click    — short click + low thud
 */

// ─── AudioContext singleton ────────────────────────────────────────────────────
let _ctx: AudioContext | null = null

export function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (!_ctx) {
    try {
      _ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
    } catch {
      return null
    }
  }
  // Resume if suspended (browser autoplay policy)
  if (_ctx.state === 'suspended') {
    _ctx.resume().catch(() => {})
  }
  return _ctx
}

// ─── Master gain for global volume ────────────────────────────────────────────
let _masterGain: GainNode | null = null
export function getMasterGain(): GainNode | null {
  const ctx = getAudioContext()
  if (!ctx) return null
  if (!_masterGain) {
    _masterGain = ctx.createGain()
    _masterGain.gain.value = 1.0
    _masterGain.connect(ctx.destination)
  }
  return _masterGain
}

// ─── Helper: connect node chain to master ─────────────────────────────────────
function toMaster(node: AudioNode, volume: number, when: number, duration: number) {
  const ctx = getAudioContext()
  const master = getMasterGain()
  if (!ctx || !master) return

  const finalGain = ctx.createGain()
  finalGain.gain.setValueAtTime(volume, when)
  finalGain.gain.linearRampToValueAtTime(0, when + duration)
  node.connect(finalGain)
  finalGain.connect(master)
}

// ─── Helper: white noise buffer ───────────────────────────────────────────────
function makeNoiseBuffer(ctx: AudioContext, duration: number): AudioBuffer {
  const bufLen = Math.floor(ctx.sampleRate * duration)
  const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate)
  const data = buf.getChannelData(0)
  for (let i = 0; i < bufLen; i++) {
    data[i] = Math.random() * 2 - 1
  }
  return buf
}

// ─── Helper: oscillator with ADSR gain ────────────────────────────────────────
function playOscillator(
  ctx: AudioContext,
  dest: AudioNode,
  type: OscillatorType,
  freq: number,
  volume: number,
  attack: number,
  decay: number,
  startTime: number,
) {
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()

  osc.type = type
  osc.frequency.setValueAtTime(freq, startTime)
  gain.gain.setValueAtTime(0, startTime)
  gain.gain.linearRampToValueAtTime(volume, startTime + attack)
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + attack + decay)

  osc.connect(gain)
  gain.connect(dest)
  osc.start(startTime)
  osc.stop(startTime + attack + decay + 0.01)
}

// ─── Helper: shaped noise burst ───────────────────────────────────────────────
function playNoiseBurst(
  ctx: AudioContext,
  dest: AudioNode,
  lowFreq: number,
  highFreq: number,
  volume: number,
  attack: number,
  decay: number,
  startTime: number,
) {
  const buf = makeNoiseBuffer(ctx, attack + decay + 0.05)
  const src = ctx.createBufferSource()
  src.buffer = buf

  const filter = ctx.createBiquadFilter()
  filter.type = 'bandpass'
  filter.frequency.setValueAtTime((lowFreq + highFreq) / 2, startTime)
  filter.Q.setValueAtTime(0.8, startTime)

  const gain = ctx.createGain()
  gain.gain.setValueAtTime(0, startTime)
  gain.gain.linearRampToValueAtTime(volume, startTime + attack)
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + attack + decay)

  src.connect(filter)
  filter.connect(gain)
  gain.connect(dest)
  src.start(startTime)
  src.stop(startTime + attack + decay + 0.06)
}

// ─── Helper: bell/chime tone ──────────────────────────────────────────────────
function playChime(
  ctx: AudioContext,
  dest: AudioNode,
  freq: number,
  volume: number,
  startTime: number,
  decayTime: number,
) {
  // Fundamental + 2 harmonics for warmth
  const harmonics = [
    { ratio: 1, vol: volume },
    { ratio: 2.756, vol: volume * 0.4 },
    { ratio: 5.404, vol: volume * 0.15 },
  ]

  for (const h of harmonics) {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(freq * h.ratio, startTime)
    gain.gain.setValueAtTime(h.vol, startTime)
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + decayTime)
    osc.connect(gain)
    gain.connect(dest)
    osc.start(startTime)
    osc.stop(startTime + decayTime + 0.01)
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── SOUND SYNTHESIZERS ───────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * SOUND 1 — MENU OPEN
 * Warm wooden wind chime struck once. Mid-warm pitch, long gentle fade decay. 0.8s
 */
export function synthMenuOpen(ctx: AudioContext, dest: AudioNode, volume: number) {
  const t = ctx.currentTime + 0.01
  // Warm wooden resonance: low sine + filtered noise body
  playChime(ctx, dest, 280, volume * 0.9, t, 0.75)
  playNoiseBurst(ctx, dest, 200, 600, volume * 0.15, 0.005, 0.2, t)
}

/**
 * SOUND 2 — CATEGORY TAB SWITCH
 * Paper slide — dry, quick, no reverb. 0.15s
 */
export function synthCategorySwitch(ctx: AudioContext, dest: AudioNode, volume: number) {
  const t = ctx.currentTime + 0.005
  // Shaped narrow-band noise for paper texture
  playNoiseBurst(ctx, dest, 1200, 4000, volume, 0.003, 0.12, t)
  // Tiny pitch drop for "slide" feel
  const osc = ctx.createOscillator()
  const g = ctx.createGain()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(900, t)
  osc.frequency.exponentialRampToValueAtTime(300, t + 0.12)
  g.gain.setValueAtTime(volume * 0.3, t)
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.14)
  osc.connect(g)
  g.connect(dest)
  osc.start(t)
  osc.stop(t + 0.15)
}

/**
 * SOUND 3 — ADD TO CART
 * Woody "plonk" — warm wood bead on lacquered tray. 0.25s
 */
export function synthAddToCart(ctx: AudioContext, dest: AudioNode, volume: number) {
  const t = ctx.currentTime + 0.005
  // Low-mid wood tap: triangle wave with pitch fall + noise body
  const osc = ctx.createOscillator()
  const g = ctx.createGain()
  osc.type = 'triangle'
  osc.frequency.setValueAtTime(320, t)
  osc.frequency.exponentialRampToValueAtTime(120, t + 0.22)
  g.gain.setValueAtTime(volume, t)
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.25)
  osc.connect(g)
  g.connect(dest)
  osc.start(t)
  osc.stop(t + 0.26)
  // Woody noise body
  playNoiseBurst(ctx, dest, 180, 800, volume * 0.35, 0.002, 0.15, t)
}

/**
 * SOUND 4 — REMOVE FROM CART
 * Inverse of add — reversed envelope, slightly higher pitch. 0.2s
 */
export function synthRemoveFromCart(ctx: AudioContext, dest: AudioNode, volume: number) {
  const t = ctx.currentTime + 0.005
  // Higher pitch than add, faster decay
  const osc = ctx.createOscillator()
  const g = ctx.createGain()
  osc.type = 'triangle'
  osc.frequency.setValueAtTime(160, t)        // start low (reversed)
  osc.frequency.exponentialRampToValueAtTime(480, t + 0.08) // rise briefly
  osc.frequency.exponentialRampToValueAtTime(200, t + 0.18) // then fade
  // Inverted envelope: fade in from softer, quicker overall
  g.gain.setValueAtTime(0, t)
  g.gain.linearRampToValueAtTime(volume, t + 0.04)
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.2)
  osc.connect(g)
  g.connect(dest)
  osc.start(t)
  osc.stop(t + 0.21)
  // Lighter noise body
  playNoiseBurst(ctx, dest, 300, 1200, volume * 0.2, 0.002, 0.1, t)
}

/**
 * SOUND 5 — CART OPEN
 * Airy upward sweep — bottom sheet sliding up on glass. 0.3s
 */
export function synthCartOpen(ctx: AudioContext, dest: AudioNode, volume: number) {
  const t = ctx.currentTime + 0.005
  // Upward pitch sweep — airy sine
  const osc = ctx.createOscillator()
  const g = ctx.createGain()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(200, t)
  osc.frequency.exponentialRampToValueAtTime(1200, t + 0.28)
  g.gain.setValueAtTime(0, t)
  g.gain.linearRampToValueAtTime(volume * 0.8, t + 0.05)
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.3)
  osc.connect(g)
  g.connect(dest)
  osc.start(t)
  osc.stop(t + 0.31)
  // High-frequency air noise for "whoosh" texture
  playNoiseBurst(ctx, dest, 2000, 8000, volume * 0.25, 0.01, 0.25, t)
}

/**
 * SOUND 6 — ORDER PLACED SUCCESSFULLY
 * 3 ascending warm chimes. 1.2s
 */
export function synthOrderPlaced(ctx: AudioContext, dest: AudioNode, volume: number) {
  const t = ctx.currentTime + 0.05
  // Three ascending chimes: low → mid → high
  const chimes = [
    { freq: 523, delay: 0,    decay: 0.9 },  // C5
    { freq: 659, delay: 0.25, decay: 0.9 },  // E5
    { freq: 784, delay: 0.5,  decay: 1.1 },  // G5
  ]
  for (const c of chimes) {
    playChime(ctx, dest, c.freq, volume * 0.9, t + c.delay, c.decay)
  }
}

/**
 * SOUND 7a — ORDER STATUS: NEW → PREPARING
 * Soft sizzle-snap — pan on gentle flame. 0.4s
 */
export function synthPreparingStart(ctx: AudioContext, dest: AudioNode, volume: number) {
  const t = ctx.currentTime + 0.005
  // Sizzle: filtered noise
  playNoiseBurst(ctx, dest, 3000, 12000, volume * 0.6, 0.01, 0.35, t)
  // Snap: short low thud
  const osc = ctx.createOscillator()
  const g = ctx.createGain()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(200, t)
  osc.frequency.exponentialRampToValueAtTime(60, t + 0.08)
  g.gain.setValueAtTime(volume, t)
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.1)
  osc.connect(g)
  g.connect(dest)
  osc.start(t)
  osc.stop(t + 0.11)
}

/**
 * SOUND 7b — ORDER STATUS: PREPARING → SERVED
 * Single service bell ding. 0.5s
 */
export function synthOrderServed(ctx: AudioContext, dest: AudioNode, volume: number) {
  const t = ctx.currentTime + 0.01
  playChime(ctx, dest, 1047, volume * 0.85, t, 0.5)  // C6 — service bell register
}

/**
 * SOUND 8 — STAMP EARNED
 * Ink stamp: sharp thud + paper resonance. Signature sound. 0.3s
 */
export function synthStampEarned(ctx: AudioContext, dest: AudioNode, volume: number) {
  const t = ctx.currentTime + 0.005
  // Sharp attack: low thud
  const osc = ctx.createOscillator()
  const g = ctx.createGain()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(160, t)
  osc.frequency.exponentialRampToValueAtTime(55, t + 0.06)
  g.gain.setValueAtTime(volume, t)
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.08)
  osc.connect(g)
  g.connect(dest)
  osc.start(t)
  osc.stop(t + 0.09)
  // Paper resonance: mid-frequency ring
  playNoiseBurst(ctx, dest, 400, 2000, volume * 0.4, 0.002, 0.22, t + 0.01)
  // Short ring for "ink" texture
  playChime(ctx, dest, 1200, volume * 0.2, t + 0.02, 0.25)
}

/**
 * SOUND 9 — HALFWAY MILESTONE (5/9 stamps)
 * Two ascending warm chimes — glass clink toast. 0.8s
 */
export function synthHalfwayMilestone(ctx: AudioContext, dest: AudioNode, volume: number) {
  const t = ctx.currentTime + 0.05
  playChime(ctx, dest, 659, volume * 0.75, t, 0.65)       // E5
  playChime(ctx, dest, 880, volume * 0.75, t + 0.2, 0.65) // A5
}

/**
 * SOUND 10 — REWARD UNLOCKED (9/9 stamps)
 * Stamp anchor → 4-5 ascending chimes → sustained hold → long decay. 2.5s
 */
export function synthRewardUnlocked(ctx: AudioContext, dest: AudioNode, volume: number) {
  const t = ctx.currentTime + 0.01
  // Open with stamp sound as anchor
  const osc = ctx.createOscillator()
  const g = ctx.createGain()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(140, t)
  osc.frequency.exponentialRampToValueAtTime(50, t + 0.06)
  g.gain.setValueAtTime(volume * 0.9, t)
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.08)
  osc.connect(g)
  g.connect(dest)
  osc.start(t)
  osc.stop(t + 0.09)

  // Rising cascade of 5 chimes
  const celebChimes = [
    { freq: 523, delay: 0.1,  decay: 1.5 }, // C5
    { freq: 659, delay: 0.35, decay: 1.5 }, // E5
    { freq: 784, delay: 0.6,  decay: 1.5 }, // G5
    { freq: 988, delay: 0.85, decay: 1.8 }, // B5
    { freq: 1047, delay: 1.1, decay: 2.1 }, // C6 — sustained hold
  ]
  for (const c of celebChimes) {
    playChime(ctx, dest, c.freq, volume * 0.85, t + c.delay, c.decay)
  }
}

/**
 * SOUND 11 — NEW ORDER ARRIVES (owner dashboard)
 * Classic hotel service bell, two tones. 0.6s
 */
export function synthNewOrder(ctx: AudioContext, dest: AudioNode, volume: number) {
  const t = ctx.currentTime + 0.01
  playChime(ctx, dest, 880, volume * 0.85, t, 0.4)        // A5 — mid
  playChime(ctx, dest, 1047, volume * 0.85, t + 0.18, 0.5) // C6 — high
}

/**
 * SOUND 12a — RESTAURANT OPEN
 * Mechanical click-thunk — heavy door latch. 0.2s
 */
export function synthRestaurantOpen(ctx: AudioContext, dest: AudioNode, volume: number) {
  const t = ctx.currentTime + 0.005
  // Click: sharp high click
  playNoiseBurst(ctx, dest, 3000, 12000, volume * 0.7, 0.001, 0.04, t)
  // Thunk: low resonant impact
  const osc = ctx.createOscillator()
  const g = ctx.createGain()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(180, t + 0.01)
  osc.frequency.exponentialRampToValueAtTime(70, t + 0.18)
  g.gain.setValueAtTime(volume, t + 0.01)
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.2)
  osc.connect(g)
  g.connect(dest)
  osc.start(t + 0.01)
  osc.stop(t + 0.21)
}

/**
 * SOUND 12b — RESTAURANT CLOSE
 * Lower, softer version of open click. 0.2s
 */
export function synthRestaurantClose(ctx: AudioContext, dest: AudioNode, volume: number) {
  const t = ctx.currentTime + 0.005
  playNoiseBurst(ctx, dest, 2000, 8000, volume * 0.5, 0.002, 0.05, t)
  const osc = ctx.createOscillator()
  const g = ctx.createGain()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(130, t + 0.01)
  osc.frequency.exponentialRampToValueAtTime(55, t + 0.18)
  g.gain.setValueAtTime(volume * 0.75, t + 0.01)
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.2)
  osc.connect(g)
  g.connect(dest)
  osc.start(t + 0.01)
  osc.stop(t + 0.21)
}

/**
 * SOUND 13 — ORDER STATUS MOVE (Kanban card slide)
 * Card slide on wood. Pitch rises per stage. 0.2s
 */
export function synthCardSlide(ctx: AudioContext, dest: AudioNode, volume: number, pitchMultiplier: number = 1) {
  const t = ctx.currentTime + 0.005
  // Paper-wood slide noise
  playNoiseBurst(ctx, dest, 800 * pitchMultiplier, 3000 * pitchMultiplier, volume * 0.6, 0.003, 0.15, t)
  const osc = ctx.createOscillator()
  const g = ctx.createGain()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(400 * pitchMultiplier, t)
  osc.frequency.exponentialRampToValueAtTime(200 * pitchMultiplier, t + 0.18)
  g.gain.setValueAtTime(volume * 0.5, t)
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.2)
  osc.connect(g)
  g.connect(dest)
  osc.start(t)
  osc.stop(t + 0.21)
}

/**
 * SOUND 14 — PHOTO UPLOAD COMPLETE
 * Soft fwhip + resolved tone. 0.35s
 */
export function synthPhotoUploaded(ctx: AudioContext, dest: AudioNode, volume: number) {
  const t = ctx.currentTime + 0.005
  // Fwhip: quick upward noise sweep
  playNoiseBurst(ctx, dest, 1000, 6000, volume * 0.5, 0.005, 0.12, t)
  // Resolve tone: gentle mid bell
  playChime(ctx, dest, 880, volume * 0.6, t + 0.12, 0.22)
}

/**
 * SOUND 15a — OUT OF STOCK (mark unavailable)
 * Dampened muted thud. 0.15s
 */
export function synthOutOfStock(ctx: AudioContext, dest: AudioNode, volume: number) {
  const t = ctx.currentTime + 0.005
  const osc = ctx.createOscillator()
  const g = ctx.createGain()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(120, t)
  osc.frequency.exponentialRampToValueAtTime(60, t + 0.12)
  g.gain.setValueAtTime(volume, t)
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.15)
  osc.connect(g)
  g.connect(dest)
  osc.start(t)
  osc.stop(t + 0.16)
  playNoiseBurst(ctx, dest, 200, 800, volume * 0.3, 0.002, 0.1, t)
}

/**
 * SOUND 15b — RESTORE TO AVAILABLE
 * Airy lift sound. 0.2s
 */
export function synthRestoreAvailable(ctx: AudioContext, dest: AudioNode, volume: number) {
  const t = ctx.currentTime + 0.005
  const osc = ctx.createOscillator()
  const g = ctx.createGain()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(300, t)
  osc.frequency.exponentialRampToValueAtTime(900, t + 0.18)
  g.gain.setValueAtTime(volume * 0.7, t)
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.2)
  osc.connect(g)
  g.connect(dest)
  osc.start(t)
  osc.stop(t + 0.21)
  playNoiseBurst(ctx, dest, 2000, 8000, volume * 0.3, 0.005, 0.15, t)
}
