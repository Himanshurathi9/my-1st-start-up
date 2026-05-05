import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase-admin'

// GET: Fetch owner's restaurant with today's stats
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as { id: string }).id

    // Fetch restaurant
    const { data: restaurant, error: restError } = await supabaseAdmin.client
      .from('restaurants')
      .select('*')
      .eq('owner_id', userId)
      .single()

    if (restError || !restaurant) {
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 })
    }

    // Fetch today's orders (orders created today with IST timezone)
    const today = new Date()
    const istOffset = 5.5 * 60 * 60 * 1000
    const istStart = new Date(today.getTime() + istOffset)
    istStart.setHours(0, 0, 0, 0)
    const istStartISO = new Date(istStart.getTime() - istOffset).toISOString()

    const { data: todayOrders, error: ordersError } = await supabaseAdmin.client
      .from('orders')
      .select('id, total_amount, status, created_at')
      .eq('restaurant_id', restaurant.id)
      .gte('created_at', istStartISO)
      .order('created_at', { ascending: false })

    const orders = todayOrders || []

    const todayOrderCount = orders.length
    const todayRevenue = orders.reduce((sum: number, o: { total_amount: number }) => sum + o.total_amount, 0)
    const newOrdersCount = orders.filter((o: { status: string }) => o.status === 'NEW').length

    return NextResponse.json({
      restaurant,
      todayOrders: todayOrderCount,
      todayRevenue,
      newOrdersCount,
    })
  } catch (error) {
    console.error('[GET /api/restaurant] Error:', error)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}

// PATCH: Update restaurant settings (is_open, whatsapp_number, theme, name)
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as { id: string }).id

    // Parse request body — CRITICAL: must happen before any body usage
    let body: Record<string, unknown>
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    console.log('[PATCH /api/restaurant] userId:', userId, 'body:', JSON.stringify(body))

    // Fetch restaurant to get ID for logging and validation
    const { data: restaurant, error: fetchError } = await supabaseAdmin.client
      .from('restaurants')
      .select('id, owner_id')
      .eq('owner_id', userId)
      .single()

    if (fetchError || !restaurant) {
      console.error('[PATCH /api/restaurant] Restaurant fetch failed:', fetchError?.message)
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 })
    }

    // Build update payload — only include provided fields
    const updates: Record<string, unknown> = {}

    if (typeof body.is_open === 'boolean') {
      updates.is_open = body.is_open
    }

    if (typeof body.whatsapp_number === 'string') {
      // Validate: remove spaces, dashes, parens; must be 10+ digits
      const clean = (body.whatsapp_number as string).replace(/[\+\s\-()]/g, '').trim()
      if (clean.length > 0 && !/^\d+$/.test(clean)) {
        return NextResponse.json({ error: 'Invalid phone number. Only digits allowed.' }, { status: 400 })
      }
      if (clean.length > 0 && clean.length < 10) {
        return NextResponse.json({ error: 'Phone number must be at least 10 digits.' }, { status: 400 })
      }
      updates.whatsapp_number = clean
    }

    if (typeof body.theme === 'string') {
      const validThemes = ['dark', 'emerald', 'sunset', 'royal']
      if (!validThemes.includes(body.theme)) {
        return NextResponse.json({ error: 'Invalid theme' }, { status: 400 })
      }
      // Note: theme column may not exist yet; include in updates
      // and let the final update handle it gracefully
      updates.theme = body.theme
    }

    if (typeof body.name === 'string' && (body.name as string).trim().length > 0) {
      updates.name = (body.name as string).trim()
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
    }

    console.log('[PATCH /api/restaurant] restaurantId:', restaurant.id, 'updates:', JSON.stringify(updates))

    // Try update — if theme column doesn't exist, retry without it
    let { data: updatedRestaurant, error } = await supabaseAdmin.client
      .from('restaurants')
      .update(updates)
      .eq('id', restaurant.id)
      .select()
      .single()

    if (error && 'theme' in updates && error.message?.includes('theme')) {
      // theme column doesn't exist yet — remove and retry
      console.log('[PATCH /api/restaurant] theme column missing, retrying without theme')
      const { theme: _theme, ...updatesWithoutTheme } = updates
      const retry = await supabaseAdmin.client
        .from('restaurants')
        .update(updatesWithoutTheme)
        .eq('id', restaurant.id)
        .select()
        .single()
      updatedRestaurant = retry.data
      error = retry.error
    }

    if (error || !updatedRestaurant) {
      console.error('[PATCH /api/restaurant] Update failed:', error?.message)
      return NextResponse.json({ error: 'Failed to update restaurant' }, { status: 500 })
    }

    console.log('[PATCH /api/restaurant] Update success:', updatedRestaurant.id)

    return NextResponse.json({ success: true, restaurant: updatedRestaurant })
  } catch (error) {
    console.error('[PATCH /api/restaurant] Unexpected error:', error)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
