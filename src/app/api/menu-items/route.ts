import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase-admin'

interface RestaurantInfo {
  id: string
  plan: string
}

type AuthResult =
  | { error: NextResponse }
  | { data: RestaurantInfo }

async function getOwnerRestaurant(): Promise<AuthResult> {
  const session = await getServerSession(authOptions)
  if (!session) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }

  const userId = (session.user as { id: string }).id

  const { data: restaurant, error } = await supabaseAdmin.client
    .from('restaurants')
    .select('id, plan')
    .eq('owner_id', userId)
    .single()

  if (error || !restaurant) {
    return { error: NextResponse.json({ error: 'Restaurant not found' }, { status: 404 }) }
  }

  return { data: restaurant }
}

// GET: Fetch menu items for owner's restaurant
export async function GET(request: NextRequest) {
  try {
    const result = await getOwnerRestaurant()
    if ('error' in result) return result.error
    const restaurant = result.data

    const { searchParams } = new URL(request.url)
    const categoryId = searchParams.get('category_id')

    let query = supabaseAdmin.client
      .from('menu_items')
      .select('*, categories(name)')
      .eq('restaurant_id', restaurant.id)

    if (categoryId) {
      query = query.eq('category_id', categoryId)
    }

    const { data: items, error } = await query.order('sort_order', { ascending: true })

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch items' }, { status: 500 })
    }

    const flattened = (items || []).map((item: Record<string, unknown>) => ({
      ...item,
      category_name: (item.categories as { name: string } | null)?.name || null,
    }))

    return NextResponse.json({ items: flattened })
  } catch {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}

// POST: Create new menu item
export async function POST(request: NextRequest) {
  try {
    const result = await getOwnerRestaurant()
    if ('error' in result) return result.error
    const restaurant = result.data

    const body = await request.json()
    const { name, description, price, category_id, food_type, image_url, is_best_seller, is_chefs_special } = body

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'Item name is required' }, { status: 400 })
    }

    if (!price || typeof price !== 'number' || price <= 0) {
      return NextResponse.json({ error: 'Price must be greater than 0' }, { status: 400 })
    }

    if (!food_type || !['VEG', 'NONVEG', 'EGG'].includes(food_type)) {
      return NextResponse.json({ error: 'Invalid food type' }, { status: 400 })
    }

    if (category_id) {
      const { data: cat } = await supabaseAdmin.client
        .from('categories')
        .select('id')
        .eq('id', category_id)
        .eq('restaurant_id', restaurant.id)
        .single()

      if (!cat) {
        return NextResponse.json({ error: 'Category not found' }, { status: 400 })
      }
    }

    // Plan limits
    if (restaurant.plan === 'BASIC') {
      const { count } = await supabaseAdmin.client
        .from('menu_items')
        .select('*', { count: 'exact', head: true })
        .eq('restaurant_id', restaurant.id)

      if ((count || 0) >= 40) {
        return NextResponse.json({ error: 'Upgrade to PRO for unlimited items' }, { status: 400 })
      }

      if (is_best_seller || is_chefs_special) {
        return NextResponse.json({ error: "Best Seller and Chef's Special are PRO features" }, { status: 400 })
      }
    }

    const { data: maxResult } = await supabaseAdmin.client
      .from('menu_items')
      .select('sort_order')
      .eq('restaurant_id', restaurant.id)
      .order('sort_order', { ascending: false })
      .limit(1)

    const nextSortOrder = maxResult && maxResult.length > 0 ? maxResult[0].sort_order + 1 : 1

    const { data: item, error } = await supabaseAdmin.client
      .from('menu_items')
      .insert({
        restaurant_id: restaurant.id,
        name: name.trim(),
        description: description?.trim() || null,
        price,
        category_id: category_id || null,
        food_type,
        image_url: image_url || null,
        is_best_seller: is_best_seller || false,
        is_chefs_special: is_chefs_special || false,
        is_available: true,
        sort_order: nextSortOrder,
      })
      .select()
      .single()

    if (error || !item) {
      return NextResponse.json({ error: 'Failed to create item' }, { status: 500 })
    }

    return NextResponse.json({ item }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}

// PATCH: Update menu item
export async function PATCH(request: NextRequest) {
  try {
    const result = await getOwnerRestaurant()
    if ('error' in result) return result.error
    const restaurant = result.data

    const body = await request.json()
    const { id, ...fields } = body

    if (!id) {
      return NextResponse.json({ error: 'Item ID is required' }, { status: 400 })
    }

    const { data: existing } = await supabaseAdmin.client
      .from('menu_items')
      .select('id')
      .eq('id', id)
      .eq('restaurant_id', restaurant.id)
      .single()

    if (!existing) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 })
    }

    if (restaurant.plan === 'BASIC' && (fields.is_best_seller || fields.is_chefs_special)) {
      return NextResponse.json({ error: "Best Seller and Chef's Special are PRO features" }, { status: 400 })
    }

    if (fields.price !== undefined && (typeof fields.price !== 'number' || fields.price <= 0)) {
      return NextResponse.json({ error: 'Price must be greater than 0' }, { status: 400 })
    }

    if (fields.name) fields.name = fields.name.trim()
    if (fields.description) fields.description = fields.description.trim()

    const { data: item, error } = await supabaseAdmin.client
      .from('menu_items')
      .update(fields)
      .eq('id', id)
      .select()
      .single()

    if (error || !item) {
      return NextResponse.json({ error: 'Failed to update item' }, { status: 500 })
    }

    return NextResponse.json({ item })
  } catch {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}

// DELETE: Delete menu item
export async function DELETE(request: NextRequest) {
  try {
    const result = await getOwnerRestaurant()
    if ('error' in result) return result.error
    const restaurant = result.data

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Item ID is required' }, { status: 400 })
    }

    const { data: existing } = await supabaseAdmin.client
      .from('menu_items')
      .select('id')
      .eq('id', id)
      .eq('restaurant_id', restaurant.id)
      .single()

    if (!existing) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 })
    }

    const { error } = await supabaseAdmin.client
      .from('menu_items')
      .delete()
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: 'Failed to delete item' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
