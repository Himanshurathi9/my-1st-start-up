import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase-admin'

// PATCH: Toggle item availability (fast endpoint)
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as { id: string }).id
    const body = await request.json()
    const { id, is_available } = body

    if (!id || typeof is_available !== 'boolean') {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    // Get restaurant_id for ownership check
    const { data: restaurant } = await supabaseAdmin.client
      .from('restaurants')
      .select('id')
      .eq('owner_id', userId)
      .single()

    if (!restaurant) {
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 })
    }

    // Update only if item belongs to this restaurant
    const { data: item, error } = await supabaseAdmin.client
      .from('menu_items')
      .update({ is_available })
      .eq('id', id)
      .eq('restaurant_id', restaurant.id)
      .select('id, is_available')
      .single()

    if (error || !item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, is_available: item.is_available })
  } catch {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
