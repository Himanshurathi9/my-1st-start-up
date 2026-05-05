import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase-admin'

// GET: List rewards for restaurant (admin only)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as { id: string }).id
    const { searchParams } = new URL(request.url)
    const statusFilter = searchParams.get('status') // 'active', 'redeemed', 'expired', or null for all

    // Get restaurant
    const { data: restaurant, error: restError } = await supabaseAdmin.client
      .from('restaurants')
      .select('id, plan, name')
      .eq('owner_id', userId)
      .single()

    if (restError || !restaurant) {
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 })
    }

    // Build query
    let query = supabaseAdmin.client
      .from('rewards')
      .select('*, customers(phone_number, name)')
      .eq('restaurant_id', restaurant.id)
      .order('created_at', { ascending: false })

    const now = new Date().toISOString()

    if (statusFilter === 'active') {
      query = query.eq('is_used', false).gt('expires_at', now)
    } else if (statusFilter === 'redeemed') {
      query = query.eq('is_used', true)
    } else if (statusFilter === 'expired') {
      query = query.eq('is_used', false).lte('expires_at', now)
    }

    const { data: rewards, error: rewardsError } = await query

    if (rewardsError) {
      console.error('[Rewards API] Fetch error:', rewardsError)
      return NextResponse.json({ error: 'Failed to fetch rewards' }, { status: 500 })
    }

    // Get stamp settings for reward item name
    const { data: settings } = await supabaseAdmin.client
      .from('stamp_settings')
      .select('reward_item_name, stamps_required')
      .eq('restaurant_id', restaurant.id)
      .single()

    // Stats
    const { count: activeCount } = await supabaseAdmin.client
      .from('rewards')
      .select('*', { count: 'exact', head: true })
      .eq('restaurant_id', restaurant.id)
      .eq('is_used', false)
      .gt('expires_at', now)

    const { count: redeemedCount } = await supabaseAdmin.client
      .from('rewards')
      .select('*', { count: 'exact', head: true })
      .eq('restaurant_id', restaurant.id)
      .eq('is_used', true)

    return NextResponse.json({
      rewards: rewards || [],
      activeCount: activeCount || 0,
      redeemedCount: redeemedCount || 0,
      rewardItemName: settings?.reward_item_name || 'Free Item',
      stampsRequired: settings?.stamps_required || 9,
    })
  } catch (err) {
    console.error('[Rewards API] GET error:', err)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}

// PATCH: Redeem a reward (admin only)
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as { id: string }).id
    const body = await request.json()
    const { reward_id, action } = body

    if (!reward_id || !action) {
      return NextResponse.json({ error: 'Reward ID and action are required' }, { status: 400 })
    }

    if (action !== 'redeem') {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    // Get restaurant
    const { data: restaurant, error: restError } = await supabaseAdmin.client
      .from('restaurants')
      .select('id, plan, name')
      .eq('owner_id', userId)
      .single()

    if (restError || !restaurant) {
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 })
    }

    // Fetch reward with customer info
    const { data: reward, error: rewardError } = await supabaseAdmin.client
      .from('rewards')
      .select('*, customers(phone_number, name)')
      .eq('id', reward_id)
      .eq('restaurant_id', restaurant.id)
      .single()

    if (rewardError || !reward) {
      return NextResponse.json({ error: 'Reward not found' }, { status: 404 })
    }

    // Prevent reuse
    if (reward.is_used) {
      return NextResponse.json({ error: 'This reward has already been redeemed' }, { status: 400 })
    }

    // Check expiry
    if (new Date(reward.expires_at) < new Date()) {
      return NextResponse.json({ error: 'This reward has expired' }, { status: 400 })
    }

    // Mark reward as used
    const { error: updateError } = await supabaseAdmin.client
      .from('rewards')
      .update({ is_used: true })
      .eq('id', reward_id)

    if (updateError) {
      console.error('[Rewards API] Redeem error:', updateError)
      return NextResponse.json({ error: 'Failed to redeem reward' }, { status: 500 })
    }

    // Post-redemption: reset stamp count (mark all non-redeemed stamps as redeemed)
    const { error: stampResetError } = await supabaseAdmin.client
      .from('stamps')
      .update({ is_redeemed: true })
      .eq('customer_id', reward.customer_id)
      .eq('is_redeemed', false)

    if (stampResetError) {
      console.error('[Rewards API] Stamp reset error:', stampResetError)
      // Don't fail — reward is already marked as used
    }

    // Reset customer's progress (set total_orders back to allow new cycle)
    // This is handled implicitly since stamps are now all redeemed
    // Next time they collect stamps, a new cycle begins

    return NextResponse.json({
      success: true,
      reward: {
        ...reward,
        is_used: true,
      },
      message: 'Reward redeemed successfully! Customer can now start a new stamp collection.',
    })
  } catch (err) {
    console.error('[Rewards API] PATCH error:', err)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
