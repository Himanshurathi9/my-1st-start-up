import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase-admin'
import type { OrderStatus } from '@/types'

const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus> = {
  NEW: 'PREPARING',
  PREPARING: 'SERVED',
}

// GET: Public order status — NO AUTH REQUIRED
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> },
) {
  try {
    const { orderId } = await params

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 })
    }

    // Fetch order with items
    const { data: order, error } = await supabaseAdmin.client
      .from('orders')
      .select('*, order_items(*)')
      .eq('id', orderId)
      .single()

    if (error || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    return NextResponse.json({
      status: order.status,
      order_number: (order as Record<string, unknown>).order_number || order.id.slice(0, 8).toUpperCase(),
      table_number: order.table_number,
      total_amount: order.total_amount,
      items: order.order_items || [],
      updated_at: order.updated_at,
      created_at: order.created_at,
      restaurant_id: order.restaurant_id,
    })
  } catch {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}

// PATCH: Update order status — owner only
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> },
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { orderId } = await params

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 })
    }

    const body = await request.json()
    const { status } = body as { status: OrderStatus }

    if (!status || !['PREPARING', 'SERVED'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    // Get owner's restaurant
    const userId = (session.user as { id: string }).id
    const { data: restaurant, error: restError } = await supabaseAdmin.client
      .from('restaurants')
      .select('id')
      .eq('owner_id', userId)
      .single()

    if (restError || !restaurant) {
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 })
    }

    // Fetch order
    const { data: order, error: orderError } = await supabaseAdmin.client
      .from('orders')
      .select('id, status, restaurant_id')
      .eq('id', orderId)
      .single()

    if (orderError || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Verify ownership
    if (order.restaurant_id !== restaurant.id) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Validate transition
    const currentStatus = order.status as OrderStatus
    const expectedCurrent = status === 'PREPARING' ? 'NEW' : 'PREPARING'
    if (currentStatus !== expectedCurrent) {
      return NextResponse.json(
        { error: `Cannot change status from ${currentStatus} to ${status}` },
        { status: 400 },
      )
    }

    // Update order
    const { data: updated, error: updateError } = await supabaseAdmin.client
      .from('orders')
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId)
      .select('*, order_items(*)')
      .single()

    if (updateError || !updated) {
      return NextResponse.json({ error: 'Failed to update order' }, { status: 500 })
    }

    return NextResponse.json({
      status: updated.status,
      order_number: (updated as Record<string, unknown>).order_number || updated.id.slice(0, 8).toUpperCase(),
      table_number: updated.table_number,
      total_amount: updated.total_amount,
      items: updated.order_items || [],
      updated_at: updated.updated_at,
      created_at: updated.created_at,
      restaurant_id: updated.restaurant_id,
    })
  } catch {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
