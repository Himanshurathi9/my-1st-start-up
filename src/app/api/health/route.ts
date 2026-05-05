import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { cloudinary } from '@/lib/cloudinary'

export async function GET() {
  const results: { supabase: string; cloudinary: string; message: string } = {
    supabase: 'ok',
    cloudinary: 'ok',
    message: 'All services connected',
  }

  // Check Supabase
  try {
    const { error } = await supabaseAdmin.client.from('users').select('id').limit(1)
    if (error) throw error
  } catch {
    results.supabase = 'error'
    results.message = 'Supabase connection failed'
  }

  // Check Cloudinary
  try {
    await cloudinary.api.ping()
  } catch {
    results.cloudinary = 'error'
    if (results.message === 'All services connected') {
      results.message = 'Cloudinary connection failed'
    } else {
      results.message = 'Both Supabase and Cloudinary connection failed'
    }
  }

  return NextResponse.json(results)
}
