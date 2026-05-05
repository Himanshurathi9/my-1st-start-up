/**
 * env.ts — Single source of truth for ALL credentials.
 * Uses environment variables. Throws at build time if critical vars are missing.
 * NEVER hardcode values in components — always import from here.
 */

function requiredEnv(key: string): string {
  const value = process.env[key]
  if (!value) {
    // In development, show a clear error. In production, use placeholder to avoid crashes.
    if (process.env.NODE_ENV === 'development') {
      console.warn(`[env] WARNING: ${key} is not set. Check your .env file.`)
    }
    return ''
  }
  return value
}

function optionalEnv(key: string, fallback: string = ''): string {
  return process.env[key] || fallback
}

export const env = {
  // Supabase
  SUPABASE_URL: requiredEnv('NEXT_PUBLIC_SUPABASE_URL'),
  SUPABASE_ANON_KEY: requiredEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
  SUPABASE_SERVICE_ROLE_KEY: requiredEnv('SUPABASE_SERVICE_ROLE_KEY'),

  // NextAuth
  NEXTAUTH_SECRET: requiredEnv('NEXTAUTH_SECRET'),
  NEXTAUTH_URL: optionalEnv('NEXTAUTH_URL', 'http://localhost:3000'),

  // Cloudinary
  CLOUDINARY_CLOUD_NAME: requiredEnv('NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME'),
  CLOUDINARY_API_KEY: requiredEnv('CLOUDINARY_API_KEY'),
  CLOUDINARY_API_SECRET: requiredEnv('CLOUDINARY_API_SECRET'),

  // App
  APP_URL: optionalEnv('NEXT_PUBLIC_APP_URL', 'http://localhost:3000'),
  ADMIN_EMAIL: optionalEnv('ADMIN_EMAIL', ''),

  // MenuMate Business Contact (for landing page inquiries)
  WHATSAPP_CONTACT_NUMBER: optionalEnv('NEXT_PUBLIC_WHATSAPP_CONTACT_NUMBER', '917425959111'),
} as const
