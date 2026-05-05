import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { buildOrderMessage, buildOrderWhatsAppUrl } from '@/lib/whatsapp'

// ─── Types ─────────────────────────────────────────────────────
interface CartItemInput {
  menuItemId: string
  name: string
  price: number
  quantity: number
  foodType: string
}

// ─── Helper: Generate order number ────────────────────────────
async function generateOrderNumber(restaurantId: string): Promise<string> {
  // Get today's date in IST
  const istOffset = 5.5 * 60 * 60 * 1000
  const now = new Date()
  const istNow = new Date(now.getTime() + istOffset)
  const dateStr = istNow.toISOString().split('T')[0].replace(/-/g, '').slice(4) // MMDD

  // Count today's orders for this restaurant
  const { data: todayOrders, error } = await supabaseAdmin.client
    .from('orders')
    .select('id')
    .eq('restaurant_id', restaurantId)
    .gte('created_at', new Date(istNow.getFullYear(), istNow.getMonth(), istNow.getDate()).toISOString())
    .order('created_at', { ascending: false })

  const sequence = (todayOrders?.length || 0) + 1
  return `${dateStr}-${String(sequence).padStart(3, '0')}`
}

// ─── POST: Create a new order ─────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      restaurant_id,
      table_number,
      table_id,
      note,
      items,
      total_amount,
    } = body as {
      restaurant_id: string
      table_number: number | null
      table_id: string | null
      note: string | null
      items: CartItemInput[]
      total_amount: number
    }

    // ── Validation ──
    if (!restaurant_id) {
      return NextResponse.json({ error: 'Restaurant ID is required' }, { status: 400 })
    }

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'Order must have at least one item' }, { status: 400 })
    }

    if (!total_amount || total_amount <= 0) {
      return NextResponse.json({ error: 'Invalid total amount' }, { status: 400 })
    }

    // Verify restaurant exists
    const { data: restaurant, error: restError } = await supabaseAdmin.client
      .from('restaurants')
      .select('id, name, slug, whatsapp_number, is_open')
      .eq('id', restaurant_id)
      .single()

    if (restError || !restaurant) {
      console.error('[orders POST] Restaurant not found:', restaurant_id, restError?.message)
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 })
    }

    console.log('[orders POST] restaurantId:', restaurant_id, 'name:', restaurant.name, 'whatsapp:', restaurant.whatsapp_number || '(none)')

    if (!restaurant.is_open) {
      return NextResponse.json({ error: 'Restaurant is currently closed' }, { status: 400 })
    }

    // ── Generate order number ──
    const orderNumber = await generateOrderNumber(restaurant_id)

    // ── Create the order (try with order_number, fallback without) ──
    let order: Record<string, unknown> | null = null
    let orderError: { message: string } | null = null

    // Try inserting with order_number column
    const tryInsert = async (withOrderNumber: boolean) => {
      const payload: Record<string, unknown> = {
        restaurant_id,
        table_id: table_id || null,
        table_number: table_number || null,
        status: 'NEW',
        note: note || null,
        total_amount,
      }
      if (withOrderNumber) {
        payload.order_number = orderNumber
      }
      return supabaseAdmin.client
        .from('orders')
        .insert(payload)
        .select()
        .single()
    }

    const result = await tryInsert(true)
    if (result.error && result.error.message?.includes('order_number')) {
      // Column doesn't exist — retry without it
      console.warn('[orders POST] order_number column missing, retrying without')
      const fallback = await tryInsert(false)
      orderError = fallback.error
      order = fallback.data
    } else {
      orderError = result.error
      order = result.data
    }

    if (orderError || !order) {
      console.error('[orders POST] Failed to create order:', orderError)
      return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
    }

    // ── Create order items ──
    const orderItems = items.map((item) => ({
      order_id: order.id,
      menu_item_id: item.menuItemId,
      item_name: item.name,
      item_price: item.price,
      quantity: item.quantity,
    }))

    const { error: itemsError } = await supabaseAdmin.client
      .from('order_items')
      .insert(orderItems)

    if (itemsError) {
      console.error('[orders POST] Failed to create order items:', itemsError)
      // Cleanup: delete the order we just created
      await supabaseAdmin.client.from('orders').delete().eq('id', order.id)
      return NextResponse.json({ error: 'Failed to save order items' }, { status: 500 })
    }

    // ── Build WhatsApp URL ──
    let whatsappUrl: string | null = null
    if (restaurant.whatsapp_number) {
      // Validate and clean the phone number
      const cleanPhone = restaurant.whatsapp_number.replace(/[\+\s\-()]/g, '').trim()
      // Must be at least 10 digits and start with a digit
      if (cleanPhone.length >= 10 && /^\d+$/.test(cleanPhone)) {
        const orderMessage = buildOrderMessage(
          {
            id: order.id,
            table_number: order.table_number,
            note: order.note,
            total_amount: order.total_amount,
            created_at: order.created_at,
          },
          orderItems.map((item) => ({
            id: '',
            order_id: order.id,
            menu_item_id: item.menu_item_id,
            item_name: item.item_name,
            item_price: item.item_price,
            quantity: item.quantity,
          })),
          restaurant.name,
        )
        whatsappUrl = buildOrderWhatsAppUrl(cleanPhone, orderMessage)
      } else {
        console.warn(`[orders POST] Invalid WhatsApp number: "${restaurant.whatsapp_number}"`)
      }
    }

    // ── Return success ──
    return NextResponse.json(
      {
        success: true,
        order_id: order.id,
        order_number: orderNumber,
        table_number: order.table_number,
        total_amount: order.total_amount,
        status: order.status,
        whatsapp_url: whatsappUrl,
        track_url: `/menu/${restaurant.slug}/track/${order.id}`,
      },
      { status: 201 },
    )
  } catch (error) {
    console.error('[orders POST] Unexpected error:', error)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}

// ─── GET: Health check (for debugging) ────────────────────────
export async function GET() {
  return NextResponse.json({ message: 'Orders API is running', timestamp: new Date().toISOString() })
}
