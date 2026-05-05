import { supabaseAdmin } from '@/lib/supabase-admin'
import OrderTrackClient, { SkeletonTrack } from '@/components/menu/OrderTrackClient'
import type { OrderStatus, OrderItem, Plan, StampSettings } from '@/types'
import { Receipt } from 'lucide-react'

// ─── Types ─────────────────────────────────────────────────────
interface OrderStatusData {
  status: OrderStatus
  order_number: string | number
  table_number: number | null
  total_amount: number
  items: OrderItem[]
  updated_at: string
  created_at: string
}

// ─── Not Found (static) ────────────────────────────────────────
function OrderNotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6" style={{ background: 'var(--background)' }}>
      <div
        className="flex items-center justify-center mb-5"
        style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--surface-subtle)' }}
      >
        <Receipt className="w-9 h-9" style={{ color: 'var(--text-tertiary)' }} />
      </div>
      <h1
        className="font-bold mb-2"
        style={{ fontSize: '22px', color: 'var(--text-primary)', letterSpacing: '-0.03em' }}
      >
        Order Not Found
      </h1>
      <p
        className="text-center leading-relaxed"
        style={{ fontSize: '14px', color: 'var(--text-secondary)', maxWidth: '280px' }}
      >
        We couldn&apos;t find this order. The link may be incorrect or the order may have expired.
      </p>
      <footer className="absolute bottom-6 left-0 right-0 text-center">
        <p style={{ color: 'var(--text-tertiary)', fontSize: '11px' }}>Powered by MenuMate</p>
      </footer>
    </div>
  )
}

// ─── Server Component ──────────────────────────────────────────
export default async function OrderTrackPage({
  params,
}: {
  params: Promise<{ slug: string; orderId: string }>
}) {
  const { slug, orderId } = await params

  // 1. Fetch restaurant by slug (for name, plan, and validation)
  const { data: restaurant, error: restError } = await supabaseAdmin.client
    .from('restaurants')
    .select('id, name, slug, plan, whatsapp_number')
    .eq('slug', slug)
    .single()

  if (restError || !restaurant) {
    return <OrderNotFound />
  }

  // 2. Fetch order with items (public — no auth)
  const { data: order, error: orderError } = await supabaseAdmin.client
    .from('orders')
    .select('*, order_items(*)')
    .eq('id', orderId)
    .single()

  if (orderError || !order) {
    return <OrderNotFound />
  }

  // 3. Verify order belongs to this restaurant
  if (order.restaurant_id !== restaurant.id) {
    return <OrderNotFound />
  }

  // 4. Fetch stamp settings (PRO only)
  let stampSettings: StampSettings | null = null
  if (restaurant.plan === 'PRO') {
    const { data: stamps } = await supabaseAdmin.client
      .from('stamp_settings')
      .select('*')
      .eq('restaurant_id', restaurant.id)
      .eq('is_active', true)
      .single()
    stampSettings = stamps as StampSettings | null
  }

  // 5. Build initial order data
  const orderData: OrderStatusData = {
    status: order.status as OrderStatus,
    order_number: (order as Record<string, unknown>).order_number || order.id.slice(0, 8).toUpperCase(),
    table_number: order.table_number,
    total_amount: order.total_amount,
    items: (order.order_items || []) as OrderItem[],
    updated_at: order.updated_at,
    created_at: order.created_at,
  }

  return (
    <OrderTrackClient
      orderId={orderId}
      restaurantId={restaurant.id}
      restaurantName={restaurant.name}
      slug={restaurant.slug}
      plan={restaurant.plan as Plan}
      initialOrder={orderData}
      stampSettings={stampSettings}
    />
  )
}

// ─── Export skeleton as loading fallback ────────────────────────
export function Loading() {
  return <SkeletonTrack />
}
