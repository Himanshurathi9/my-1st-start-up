import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { generateRewardCode } from '@/lib/utils'
import { buildRewardMessage, buildOrderWhatsAppUrl, buildOwnerRewardNotification } from '@/lib/whatsapp'

// GET: Get customer stamp data
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const phone = searchParams.get('phone')
    const restaurantId = searchParams.get('restaurant_id')

    if (!phone || !restaurantId) {
      return NextResponse.json({ error: 'Phone and restaurant_id required' }, { status: 400 })
    }

    // Find customer by phone + restaurant
    const { data: customer, error: custError } = await supabaseAdmin.client
      .from('customers')
      .select('*')
      .eq('phone_number', phone)
      .eq('restaurant_id', restaurantId)
      .single()

    if (custError || !customer) {
      return NextResponse.json({ exists: false })
    }

    // Count valid stamps (not redeemed, not expired)
    const now = new Date().toISOString()
    const { count: currentCount } = await supabaseAdmin.client
      .from('stamps')
      .select('*', { count: 'exact', head: true })
      .eq('customer_id', customer.id)
      .eq('is_redeemed', false)
      .gt('expires_at', now)

    // Fetch stamp settings
    const { data: settings } = await supabaseAdmin.client
      .from('stamp_settings')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .single()

    // Check for active unused reward
    const { data: activeReward } = await supabaseAdmin.client
      .from('rewards')
      .select('*')
      .eq('customer_id', customer.id)
      .eq('is_used', false)
      .gt('expires_at', now)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    return NextResponse.json({
      exists: true,
      customer,
      current_count: currentCount || 0,
      stamps_required: settings?.stamps_required || 0,
      reward_item_name: settings?.reward_item_name || '',
      is_active: settings?.is_active || false,
      active_reward: activeReward || null,
    })
  } catch {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}

// POST: Collect a stamp
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { phone_number, name, restaurant_id, order_id } = body

    if (!phone_number || !restaurant_id || !order_id) {
      return NextResponse.json(
        { error: 'Phone number, restaurant ID, and order ID are required' },
        { status: 400 },
      )
    }

    // a) Verify restaurant is PRO plan
    const { data: restaurant, error: restError } = await supabaseAdmin.client
      .from('restaurants')
      .select('id, plan, name, whatsapp_number')
      .eq('id', restaurant_id)
      .single()

    if (restError || !restaurant) {
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 })
    }

    if (restaurant.plan !== 'PRO') {
      return NextResponse.json(
        { error: 'Loyalty stamps are only available on the PRO plan' },
        { status: 400 },
      )
    }

    // b) Verify stamp_settings.is_active = true
    const { data: settings, error: settingsError } = await supabaseAdmin.client
      .from('stamp_settings')
      .select('*')
      .eq('restaurant_id', restaurant_id)
      .single()

    if (settingsError || !settings || !settings.is_active) {
      return NextResponse.json(
        { error: 'Loyalty program is not active' },
        { status: 400 },
      )
    }

    // c) Verify order exists, belongs to restaurant, and status is PREPARING or SERVED
    const { data: order, error: orderError } = await supabaseAdmin.client
      .from('orders')
      .select('id, restaurant_id, status, total_amount')
      .eq('id', order_id)
      .single()

    if (orderError || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    if (order.restaurant_id !== restaurant_id) {
      return NextResponse.json({ error: 'Order does not belong to this restaurant' }, { status: 400 })
    }

    if (!['PREPARING', 'SERVED'].includes(order.status)) {
      return NextResponse.json({ error: 'Order must be confirmed (Preparing or Served) before collecting a stamp' }, { status: 400 })
    }

    // d) Check no stamp already exists for this order_id (anti-abuse: 1 order = max 1 stamp)
    const { count: existingStampCount } = await supabaseAdmin.client
      .from('stamps')
      .select('*', { count: 'exact', head: true })
      .eq('order_id', order_id)

    if ((existingStampCount || 0) > 0) {
      return NextResponse.json({ error: 'Stamp already collected for this order' }, { status: 400 })
    }

    // d2) Anti-abuse: same phone number cannot receive multiple stamps within 45 minutes
    // Efficient check: find customer by phone first, then check their recent stamps
    const cooldownMinutesAgo = new Date(Date.now() - 45 * 60 * 1000).toISOString()
    const { data: existingCustomer } = await supabaseAdmin.client
      .from('customers')
      .select('id')
      .eq('phone_number', phone_number)
      .eq('restaurant_id', restaurant_id)
      .single()

    if (existingCustomer) {
      // Check for recent stamps from this specific customer
      const { data: recentStamp, error: recentError } = await supabaseAdmin.client
        .from('stamps')
        .select('earned_at')
      .eq('customer_id', existingCustomer.id)
      .gte('earned_at', cooldownMinutesAgo)
      .order('earned_at', { ascending: false })
      .limit(1)
      .maybeSingle()

      if (recentStamp && !recentError) {
        // Calculate remaining cooldown
        const stampTime = new Date(recentStamp.earned_at).getTime()
        const cooldownEnd = stampTime + 45 * 60 * 1000
        const remaining = Math.ceil((cooldownEnd - Date.now()) / 60000)

        return NextResponse.json(
          {
            error: `Please wait ${remaining} minute${remaining !== 1 ? 's' : ''} before collecting another stamp`,
            cooldown: true,
            cooldown_remaining_minutes: remaining,
          },
          { status: 429 },
        )
      }
    }

    // e) Find or create customer (reuse existingCustomer from cooldown check if available)
    let customerId: string

    // Re-fetch customer with all needed fields if found during cooldown check
    const customerForStamp = existingCustomer
      ? await supabaseAdmin.client
          .from('customers')
          .select('id, total_orders')
          .eq('id', existingCustomer.id)
          .single()
      : await supabaseAdmin.client
          .from('customers')
          .select('id, total_orders')
          .eq('phone_number', phone_number)
          .eq('restaurant_id', restaurant_id)
          .maybeSingle()

    if (customerForStamp.data) {
      customerId = customerForStamp.data.id
      // f) Update customer: last_visit_date = today, total_orders += 1
      await supabaseAdmin.client
        .from('customers')
        .update({
          name: name || customerForStamp.data.name || null,
          last_visit_date: new Date().toISOString().split('T')[0],
          total_orders: (customerForStamp.data.total_orders || 0) + 1,
        })
        .eq('id', customerId)
    } else {
      // Create new customer
      const { data: newCustomer, error: custError } = await supabaseAdmin.client
        .from('customers')
        .insert({
          phone_number: phone_number,
          name: name || null,
          restaurant_id: restaurant_id,
          total_orders: 1,
          last_visit_date: new Date().toISOString().split('T')[0],
        })
        .select('id')
        .single()

      if (custError || !newCustomer) {
        return NextResponse.json({ error: 'Failed to create customer' }, { status: 500 })
      }
      customerId = newCustomer.id
    }

    // g) Insert stamp with expires_at = NOW() + 6 months
    const sixMonthsLater = new Date()
    sixMonthsLater.setMonth(sixMonthsLater.getMonth() + 6)

    const { error: stampError } = await supabaseAdmin.client
      .from('stamps')
      .insert({
        customer_id: customerId,
        restaurant_id: restaurant_id,
        order_id: order_id,
        earned_at: new Date().toISOString(),
        expires_at: sixMonthsLater.toISOString(),
        is_redeemed: false,
      })

    if (stampError) {
      return NextResponse.json({ error: 'Failed to collect stamp' }, { status: 500 })
    }

    // h) Count valid stamps
    const now = new Date().toISOString()
    const { count: currentCount } = await supabaseAdmin.client
      .from('stamps')
      .select('*', { count: 'exact', head: true })
      .eq('customer_id', customerId)
      .eq('is_redeemed', false)
      .gt('expires_at', now)

    const stamps = currentCount || 0
    const required = settings.stamps_required

    // i) Check if reward earned
    if (stamps === required) {
      // Generate reward code
      const rewardCode = generateRewardCode()

      // Insert reward
      const thirtyDaysLater = new Date()
      thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30)

      const { data: reward, error: rewardError } = await supabaseAdmin.client
        .from('rewards')
        .insert({
          customer_id: customerId,
          restaurant_id: restaurant_id,
          reward_code: rewardCode,
          is_used: false,
          expires_at: thirtyDaysLater.toISOString(),
        })
        .select()
        .single()

      if (rewardError || !reward) {
        return NextResponse.json({ error: 'Failed to generate reward' }, { status: 500 })
      }

      // Mark all current stamps as redeemed
      await supabaseAdmin.client
        .from('stamps')
        .update({ is_redeemed: true })
        .eq('customer_id', customerId)
        .eq('is_redeemed', false)

      // Build WhatsApp notification URL
      const customerName = name || 'Customer'
      const rewardMessage = buildRewardMessage(
        customerName,
        phone_number,
        settings.reward_item_name,
        required,
        rewardCode,
      )
      const whatsappUrl = buildOrderWhatsAppUrl(restaurant.whatsapp_number, rewardMessage)

      // Also build owner notification WhatsApp URL
      const ownerMessage = buildOwnerRewardNotification(
        customerName,
        phone_number,
        settings.reward_item_name,
        rewardCode,
        required,
      )
      const ownerWhatsappUrl = buildOrderWhatsAppUrl(restaurant.whatsapp_number, ownerMessage)

      return NextResponse.json({
        success: true,
        stamp_collected: true,
        reward_earned: true,
        reward_code: rewardCode,
        reward_item_name: settings.reward_item_name,
        reward_expires_at: reward.expires_at,
        whatsapp_notification_url: whatsappUrl,
        owner_whatsapp_url: ownerWhatsappUrl,
      })
    }

    // j) Check halfway — return motivational data
    const halfway = Math.ceil(required / 2)
    if (stamps === halfway) {
      return NextResponse.json({
        success: true,
        stamp_collected: true,
        halfway: true,
        current_count: stamps,
        stamps_required: required,
        reward_item_name: settings.reward_item_name,
      })
    }

    // k) Normal stamp
    return NextResponse.json({
      success: true,
      stamp_collected: true,
      current_count: stamps,
      stamps_required: required,
      reward_item_name: settings.reward_item_name,
    })
  } catch {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
