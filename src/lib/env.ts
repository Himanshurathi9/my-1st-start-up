/**
 * env.ts — Single source of truth for ALL credentials.
 * Uses environment variables with safe fallbacks.
 * NEVER hardcode values in components — always import from here.
 */

export const env = {
  // Supabase
  SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || "https://mwkdloytzwejqpdfcgov.supabase.co",
  SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_gswDUDUULimLFcsMAQmhhA_LwzaYJWm",
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im13a2Rsb3l0endlanFwZGZjZ292Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzU1NTcyMCwiZXhwIjoyMDkzMTMxNzIwfQ.Zm9nq7Pl8tZx6ZFbHo4EKd0UFfDeIkSiLtaX4OUpKr0",

  // NextAuth
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET || "4928584932",
  NEXTAUTH_URL: process.env.NEXTAUTH_URL || "http://localhost:3000",

  // Cloudinary
  CLOUDINARY_CLOUD_NAME: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "dvgi1ztja",
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY || "193252457598983",
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET || "3Cbme0TeIoyc3QzNukW74cTzuxc",

  // App
  APP_URL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  ADMIN_EMAIL: process.env.ADMIN_EMAIL || "himanshurathi341@gmail.com",

  // MenuMate Business Contact (for landing page inquiries)
  WHATSAPP_CONTACT_NUMBER: process.env.NEXT_PUBLIC_WHATSAPP_CONTACT_NUMBER || "917425959111",
} as const
