import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { env } from './env'

let adminClient: SupabaseClient | null = null

export function getSupabaseAdmin(): SupabaseClient {
  if (adminClient) return adminClient

  adminClient = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

  return adminClient
}

// Alias for easy use — consumers use: supabaseAdmin.client.from(...)
export const supabaseAdmin = {
  get client() { return getSupabaseAdmin() }
}
