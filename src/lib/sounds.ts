// ─── Web Audio API Sound Utility ──────────────────────────────
// Generates bell/chime sounds without needing external MP3 files
// Handles browser autoplay policy by requiring user interaction first

let audioCtx: AudioContext | null = null

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
  }
  // Resume if suspended (browser autoplay policy)
  if (audioCtx.state === 'suspended') {
    audioCtx.resume()
  }
  return audioCtx
}

// Enable audio context on user interaction (call this from a button click)
export function enableSounds(): void {
  try {
    const ctx = getAudioContext()
    if (ctx.state === 'suspended') {
      ctx.resume()
    }
  } catch {
    // Audio not supported
  }
}

// Check if audio is likely available
export function isAudioEnabled(): boolean {
  try {
    if (!audioCtx) return false
    return audioCtx.state !== 'suspended'
  } catch {
    return false
  }
}

// Play a single bell sound (for waiter requests)
export function playBellSound(): void {
  try {
    const ctx = getAudioContext()
    const now = ctx.currentTime

    // Bell-like tone: combination of harmonics
    const frequencies = [830, 1245, 1660] // E5, ~E6, ~G6
    const gains = [0.3, 0.15, 0.08]

    frequencies.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, now)
      // Slight pitch drop for realism
      osc.frequency.exponentialRampToValueAtTime(freq * 0.98, now + 0.8)

      gain.gain.setValueAtTime(gains[i], now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2)

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.start(now + i * 0.05)
      osc.stop(now + 1.5)
    })
  } catch {
    // Audio not supported — silent fail
  }
}

// Play triple bell sound (for bill requests — more urgent)
export function playBillSound(): void {
  try {
    const ctx = getAudioContext()

    // Play 3 bell sounds in quick succession
    for (let i = 0; i < 3; i++) {
      setTimeout(() => {
        try {
          const now = ctx.currentTime
          const frequencies = [830, 1245]
          const gains = [0.25, 0.12]

          frequencies.forEach((freq, j) => {
            const osc = ctx.createOscillator()
            const gain = ctx.createGain()

            osc.type = 'sine'
            osc.frequency.setValueAtTime(freq, now)
            osc.frequency.exponentialRampToValueAtTime(freq * 0.97, now + 0.5)

            gain.gain.setValueAtTime(gains[j], now)
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.7)

            osc.connect(gain)
            gain.connect(ctx.destination)

            osc.start(now)
            osc.stop(now + 0.8)
          })
        } catch {
          // ignore
        }
      }, i * 350)
    }
  } catch {
    // Audio not supported
  }
}

// Play sound based on notification type
export function playNotificationSound(type: 'waiter' | 'bill'): void {
  if (type === 'waiter') {
    playBellSound()
  } else {
    playBillSound()
  }
}
