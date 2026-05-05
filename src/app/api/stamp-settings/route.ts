import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase-admin'

// GET: Fetch stamp settings (public via restaurant_id query param, or owner via session)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const publicRestaurantId = searchParams.get('restaurant_id')

    // Public access: customer-facing menu page passes restaurant_id
    if (publicRestaurantId) {
      const { data: settings } = await supabaseAdmin.client
        .from('stamp_settings')
        .select('*')
        .eq('restaurant_id', publicRestaurantId)
        .eq('is_active', true)
        .single()

      // Only return settings if stamp card is active
      return NextResponse.json({ settings: settings || null })
    }

    // Owner access: full details with customer list
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as { id: string }).id

    const { data: restaurant, error: restError } = await supabaseAdmin.client
      .from('restaurants')
      .select('id, plan')
      .eq('owner_id', userId)
      .single()

    if (restError || !restaurant) {
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 })
    }

    if (restaurant.plan !== 'PRO') {
      return NextResponse.json({ error: 'PRO plan required', plan: restaurant.plan })
    }

    // Fetch settings
    const { data: settings } = await supabaseAdmin.client
      .from('stamp_settings')
      .select('*')
      .eq('restaurant_id', restaurant.id)
      .single()

    // Count loyal customers
    const { count: customerCount } = await supabaseAdmin.client
      .from('customers')
      .select('*', { count: 'exact', head: true })
      .eq('restaurant_id', restaurant.id)

    // Fetch customer list
    const { data: customers } = await supabaseAdmin.client
      .from('customers')
      .select('id, phone_number, name, total_orders, last_visit_date, created_at')
      .eq('restaurant_id', restaurant.id)
      .order('last_visit_date', { ascending: false })

    return NextResponse.json({
      settings: settings || null,
      customerCount: customerCount || 0,
      customers: customers || [],
    })
  } catch {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}

// PATCH: Update stamp settings
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as { id: string }).id
    const body = await request.json()
    const { is_active, reward_item_name, stamps_required } = body

    // Fetch restaurant
    const { data: restaurant, error: restError } = await supabaseAdmin.client
      .from('restaurants')
      .select('id, plan')
      .eq('owner_id', userId)
      .single()

    if (restError || !restaurant) {
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 })
    }

    if (restaurant.plan !== 'PRO') {
      return NextResponse.json({ error: 'PRO plan required' }, { status: 400 })
    }

    // Check if settings exist
    const { data: existing } = await supabaseAdmin.client
      .from('stamp_settings')
      .select('id')
      .eq('restaurant_id', restaurant.id)
      .single()

    const updates: Record<string, unknown> = {}
    if (typeof is_active === 'boolean') updates.is_active = is_active
    if (typeof reward_item_name === 'string') updates.reward_item_name = reward_item_name
    if (typeof stamps_required === 'number') {
      if (![6, 9, 12].includes(stamps_required)) {
        return NextResponse.json(
          { error: 'Stamps required must be 6, 9, or 12' },
          { status: 400 },
        )
      }
      updates.stamps_required = stamps_required
    }

    let result
    if (existing) {
      const { data, error } = await supabaseAdmin.client
        .from('stamp_settings')
        .update(updates)
        .eq('id', existing.id)
        .select()
        .single()
      if (error) throw new Error('Failed to update')
      result = data
    } else {
      // Create default settings
      const { data, error } = await supabaseAdmin.client
        .from('stamp_settings')
        .insert({
          restaurant_id: restaurant.id,
          stamps_required: stamps_required || 9,
          reward_item_name: reward_item_name || 'Free Item',
          is_active: typeof is_active === 'boolean' ? is_active : true,
        })
        .select()
        .single()
      if (error) throw new Error('Failed to create settings')
      result = data
    }

    return NextResponse.json({ settings: result, success: true })
  } catch {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
