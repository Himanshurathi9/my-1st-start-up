import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase-admin'
import bcrypt from 'bcryptjs'
import { generateSlug } from '@/lib/utils'

// All routes: verify ADMIN role
async function verifyAdmin() {
  const session = await getServerSession(authOptions)
  if (!session) {
    return { error: NextResponse.json({ message: 'Unauthorized' }, { status: 401 }), session: null }
  }
  const role = (session.user as { role: string }).role
  if (role !== 'ADMIN') {
    return { error: NextResponse.json({ message: 'Forbidden' }, { status: 403 }), session: null }
  }
  return { error: null, session }
}

// GET: Fetch all restaurants with owner info
export async function GET() {
  const { error } = await verifyAdmin()
  if (error) return error

  const { data: restaurants, error: dbError } = await supabaseAdmin.client
    .from('restaurants')
    .select(`
      id,
      owner_id,
      name,
      slug,
      logo_url,
      cover_photo_url,
      whatsapp_number,
      is_open,
      plan,
      plan_start_date,
      plan_expiry_date,
      setup_fee_paid,
      created_at
    `)
    .order('plan_expiry_date', { ascending: true, nullsFirst: false })

  if (dbError) {
    return NextResponse.json({ message: 'Failed to fetch restaurants' }, { status: 500 })
  }

  // Get owner emails for all restaurants
  const ownerIds = restaurants.map((r) => r.owner_id)
  const { data: owners } = await supabaseAdmin.client
    .from('users')
    .select('id, email')
    .in('id', ownerIds)

  const ownerMap = new Map(owners?.map((o) => [o.id, o.email]) ?? [])

  // Get counts per restaurant
  const { data: categoryCounts } = await supabaseAdmin.client
    .from('categories')
    .select('restaurant_id')
  const { data: menuItemCount } = await supabaseAdmin.client
    .from('menu_items')
    .select('restaurant_id')
  const { data: tableCounts } = await supabaseAdmin.client
    .from('restaurant_tables')
    .select('restaurant_id')
  const { data: bannerCounts } = await supabaseAdmin.client
    .from('banners')
    .select('restaurant_id, is_active')

  const catMap = new Map<string, number>()
  categoryCounts?.forEach((c) => {
    catMap.set(c.restaurant_id, (catMap.get(c.restaurant_id) ?? 0) + 1)
  })
  const itemMap = new Map<string, number>()
  menuItemCount?.forEach((i) => {
    itemMap.set(i.restaurant_id, (itemMap.get(i.restaurant_id) ?? 0) + 1)
  })
  const tableMap = new Map<string, number>()
  tableCounts?.forEach((t) => {
    tableMap.set(t.restaurant_id, (tableMap.get(t.restaurant_id) ?? 0) + 1)
  })
  const bannerMap = new Map<string, number>()
  const activeBannerMap = new Map<string, number>()
  bannerCounts?.forEach((b) => {
    bannerMap.set(b.restaurant_id, (bannerMap.get(b.restaurant_id) ?? 0) + 1)
    if (b.is_active) {
      activeBannerMap.set(b.restaurant_id, (activeBannerMap.get(b.restaurant_id) ?? 0) + 1)
    }
  })

  const enriched = restaurants.map((r) => ({
    ...r,
    owner_email: ownerMap.get(r.owner_id) ?? '',
    categories_count: catMap.get(r.id) ?? 0,
    menu_items_count: itemMap.get(r.id) ?? 0,
    tables_count: tableMap.get(r.id) ?? 0,
    banners_count: activeBannerMap.get(r.id) ?? 0,
  }))

  return NextResponse.json({ restaurants: enriched })
}

// POST: Create new restaurant + owner account
export async function POST(req: NextRequest) {
  const { error } = await verifyAdmin()
  if (error) return error

  const body = await req.json()
  const {
    owner_email,
    owner_password,
    restaurant_name,
    whatsapp_number,
    plan,
    plan_expiry_date,
  } = body

  // Validate required fields
  if (!owner_email || !owner_password || !restaurant_name || !whatsapp_number || !plan || !plan_expiry_date) {
    return NextResponse.json(
      { message: 'All fields are required: owner_email, owner_password, restaurant_name, whatsapp_number, plan, plan_expiry_date' },
      { status: 400 }
    )
  }

  if (!['BASIC', 'PRO'].includes(plan)) {
    return NextResponse.json({ message: 'Plan must be BASIC or PRO' }, { status: 400 })
  }

  // Check email not already used
  const { data: existingUser } = await supabaseAdmin.client
    .from('users')
    .select('id')
    .eq('email', owner_email.toLowerCase().trim())
    .single()

  if (existingUser) {
    return NextResponse.json({ message: 'Email already registered' }, { status: 409 })
  }

  // Hash password
  const passwordHash = await bcrypt.hash(owner_password, 10)

  // Create user
  const { data: user, error: userError } = await supabaseAdmin.client
    .from('users')
    .insert({
      email: owner_email.toLowerCase().trim(),
      password_hash: passwordHash,
      role: 'OWNER',
    })
    .select('id, email')
    .single()

  if (userError || !user) {
    return NextResponse.json({ message: 'Failed to create owner account' }, { status: 500 })
  }

  // Generate slug
  let slug = generateSlug(restaurant_name)
  let slugSuffix = 2

  // Check slug uniqueness
  const { data: slugCheck } = await supabaseAdmin.client
    .from('restaurants')
    .select('id')
    .eq('slug', slug)
    .single()

  while (slugCheck) {
    slug = `${generateSlug(restaurant_name)}-${slugSuffix}`
    const { data: nextCheck } = await supabaseAdmin.client
      .from('restaurants')
      .select('id')
      .eq('slug', slug)
      .single()
    if (!nextCheck) break
    slugSuffix++
  }

  // Create restaurant
  const { data: restaurant, error: restaurantError } = await supabaseAdmin.client
    .from('restaurants')
    .insert({
      owner_id: user.id,
      name: restaurant_name.trim(),
      slug,
      whatsapp_number,
      plan,
      plan_start_date: new Date().toISOString().split('T')[0],
      plan_expiry_date,
      is_open: false,
    })
    .select('id, name, slug, plan, plan_expiry_date')
    .single()

  if (restaurantError || !restaurant) {
    // Rollback user
    await supabaseAdmin.client.from('users').delete().eq('id', user.id)
    return NextResponse.json({ message: 'Failed to create restaurant' }, { status: 500 })
  }

  // If PRO plan, insert default stamp_settings
  if (plan === 'PRO') {
    await supabaseAdmin.client.from('stamp_settings').insert({
      restaurant_id: restaurant.id,
      is_active: false,
      stamps_required: 9,
      reward_item_name: 'Free Item',
    })
  }

  return NextResponse.json({
    restaurant,
    owner: { id: user.id, email: user.email },
    login_credentials: {
      email: user.email,
      password: owner_password,
    },
  })
}

// PATCH: Update plan + expiry
export async function PATCH(req: NextRequest) {
  const { error } = await verifyAdmin()
  if (error) return error

  const body = await req.json()
  const { restaurant_id, plan, plan_expiry_date } = body

  if (!restaurant_id) {
    return NextResponse.json({ message: 'restaurant_id is required' }, { status: 400 })
  }

  if (!plan && !plan_expiry_date) {
    return NextResponse.json({ message: 'At least one of plan or plan_expiry_date is required' }, { status: 400 })
  }

  // Validate restaurant exists
  const { data: existing, error: findError } = await supabaseAdmin.client
    .from('restaurants')
    .select('id, name, plan')
    .eq('id', restaurant_id)
    .single()

  if (findError || !existing) {
    return NextResponse.json({ message: 'Restaurant not found' }, { status: 404 })
  }

  // Build update object
  const updates: Record<string, unknown> = {}
  if (plan) {
    if (!['BASIC', 'PRO'].includes(plan)) {
      return NextResponse.json({ message: 'Plan must be BASIC or PRO' }, { status: 400 })
    }
    updates.plan = plan
  }
  if (plan_expiry_date) {
    updates.plan_expiry_date = plan_expiry_date
  }

  const { data: updated, error: updateError } = await supabaseAdmin.client
    .from('restaurants')
    .update(updates)
    .eq('id', restaurant_id)
    .select('id, name, slug, plan, plan_expiry_date, plan_start_date')
    .single()

  if (updateError || !updated) {
    return NextResponse.json({ message: 'Failed to update restaurant' }, { status: 500 })
  }

  // If upgraded to PRO and no stamp_settings exist, create default
  if (plan === 'PRO') {
    const { data: existingSettings } = await supabaseAdmin.client
      .from('stamp_settings')
      .select('id')
      .eq('restaurant_id', restaurant_id)
      .single()

    if (!existingSettings) {
      await supabaseAdmin.client.from('stamp_settings').insert({
        restaurant_id,
        is_active: false,
        stamps_required: 9,
        reward_item_name: 'Free Item',
      })
    }
  }

  return NextResponse.json({ restaurant: updated })
}
