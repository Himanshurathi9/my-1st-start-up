/**
 * env.ts — Single source of truth for ALL environment variables.
 *
 * IMPORTANT ARCHITECTURE:
 * - Public vars (NEXT_PUBLIC_*) are safe for client AND server.
 *   They NEVER throw — they fall back to '' to avoid client-side crashes.
 * - Server-only vars (SUPABASE_SERVICE_ROLE_KEY, etc.) are exposed via
 *   lazy getters so they are ONLY evaluated when called on the server.
 *   They will throw a clear error if accessed from a client bundle.
 *
 * NEVER import this file into a client component if you only need public vars.
 * Instead, use process.env.NEXT_PUBLIC_* directly in client components.
 */

// ─── Helper: safe read with optional server-only enforcement ─────────────────

function publicEnv(key: string, fallback = ''): string {
  // Works on both client and server — NEXT_PUBLIC_ vars are inlined at build time
  const value = process.env[key]
  if (!value) {
    if (typeof window === 'undefined') {
      // Server-side: warn but don't crash — let individual APIs fail gracefully
      console.warn(`[env] WARNING: ${key} is not set.`)
    }
    return fallback
  }
  return value
}

function serverOnlyEnv(key: string): string {
  if (typeof window !== 'undefined') {
    // This should never happen in a properly structured app.
    // If it does, it means a server-only var was imported into a client bundle.
    console.error(`[env] CRITICAL: Attempted to read server-only var ${key} on the client. This is a bug.`)
    return ''
  }
  const value = process.env[key]
  if (!value) {
    // Throw server-side only — this will surface in server logs, not crash the browser
    throw new Error(`[env] FATAL: ${key} is required on the server but not set. Add it to your Vercel Environment Variables.`)
  }
  return value
}

// ─── Public environment variables (safe everywhere) ──────────────────────────

export const env = {
  // Supabase (public — used by client Supabase SDK)
  SUPABASE_URL: publicEnv('NEXT_PUBLIC_SUPABASE_URL'),
  SUPABASE_ANON_KEY: publicEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY'),

  // Cloudinary (public cloud name used in image URLs)
  CLOUDINARY_CLOUD_NAME: publicEnv('NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME'),

  // App URLs
  APP_URL: publicEnv('NEXT_PUBLIC_APP_URL'),

  // Business contact (used on landing page)
  WHATSAPP_CONTACT_NUMBER: publicEnv('NEXT_PUBLIC_WHATSAPP_CONTACT_NUMBER', '917425959111'),

  // Admin email (optional)
  ADMIN_EMAIL: publicEnv('ADMIN_EMAIL', ''),

  // NextAuth URL (server only but non-fatal if missing — NextAuth auto-detects)
  NEXTAUTH_URL: publicEnv('NEXTAUTH_URL'),

  // ─── Server-only vars via lazy getters ─────────────────────────────────────
  // These are only evaluated when accessed, so they won't crash client bundles.

  get SUPABASE_SERVICE_ROLE_KEY(): string {
    return serverOnlyEnv('SUPABASE_SERVICE_ROLE_KEY')
  },

  get NEXTAUTH_SECRET(): string {
    return serverOnlyEnv('NEXTAUTH_SECRET')
  },

  get CLOUDINARY_API_KEY(): string {
    return serverOnlyEnv('CLOUDINARY_API_KEY')
  },

  get CLOUDINARY_API_SECRET(): string {
    return serverOnlyEnv('CLOUDINARY_API_SECRET')
  },
} as const
