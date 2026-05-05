import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase-admin'
import type { OrderStatus } from '@/types'

// GET: Fetch today's orders for the owner's restaurant
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as { id: string }).id

    // Get owner's restaurant
    const { data: restaurant, error: restError } = await supabaseAdmin.client
      .from('restaurants')
      .select('id')
      .eq('owner_id', userId)
      .single()

    if (restError || !restaurant) {
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 })
    }

    // Start of today in IST (UTC+5:30)
    const istOffset = 5.5 * 60 * 60 * 1000
    const now = new Date()
    const istNow = new Date(now.getTime() + istOffset)
    const istMidnight = new Date(istNow.getFullYear(), istNow.getMonth(), istNow.getDate())
    const utcMidnight = new Date(istMidnight.getTime() - istOffset)
    const todayStart = utcMidnight.toISOString()

    // Fetch today's orders with items
    const { data: orders, error: ordersError } = await supabaseAdmin.client
      .from('orders')
      .select('*, order_items(*)')
      .eq('restaurant_id', restaurant.id)
      .gte('created_at', todayStart)
      .order('created_at', { ascending: false })

    if (ordersError) {
      return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 })
    }

    // Group by status
    const grouped: Record<OrderStatus, typeof orders> = {
      NEW: [],
      PREPARING: [],
      SERVED: [],
    }

    for (const order of orders || []) {
      const status = order.status as OrderStatus
      if (grouped[status]) {
        grouped[status].push(order)
      }
    }

    // Count totals
    const totalToday = (orders || []).length
    const newCount = grouped.NEW.length

    return NextResponse.json({
      NEW: grouped.NEW,
      PREPARING: grouped.PREPARING,
      SERVED: grouped.SERVED,
      totalToday,
      newCount,
    })
  } catch {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
