import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { env } from './env'

let client: SupabaseClient | null = null

export function getSupabaseClient(): SupabaseClient {
  if (client) return client

  client = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY)
  return client
}

// Keep backwards-compatible export — consumers use: supabase.client.from(...)
export const supabase = {
  get client() { return getSupabaseClient() }
}
