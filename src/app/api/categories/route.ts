import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase-admin'

async function getOwnerRestaurantId(): Promise<{ restaurantId: string } | NextResponse> {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = (session.user as { id: string }).id

  const { data: restaurant, error } = await supabaseAdmin.client
    .from('restaurants')
    .select('id')
    .eq('owner_id', userId)
    .single()

  if (error || !restaurant) {
    return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 })
  }

  return { restaurantId: restaurant.id }
}

// GET: Return all categories for owner's restaurant ordered by sort_order
export async function GET() {
  try {
    const result = await getOwnerRestaurantId()
    if (result instanceof NextResponse) return result

    const { data: categories, error } = await supabaseAdmin.client
      .from('categories')
      .select('*')
      .eq('restaurant_id', result.restaurantId)
      .order('sort_order', { ascending: true })

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 })
    }

    return NextResponse.json({ categories: categories || [] })
  } catch {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}

// POST: Create new category
export async function POST(request: NextRequest) {
  try {
    const result = await getOwnerRestaurantId()
    if (result instanceof NextResponse) return result

    const body = await request.json()
    const { name } = body

    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'Category name is required' }, { status: 400 })
    }

    const trimmed = name.trim()

    if (trimmed.length === 0) {
      return NextResponse.json({ error: 'Category name cannot be empty' }, { status: 400 })
    }

    if (trimmed.length > 30) {
      return NextResponse.json({ error: 'Category name must be under 30 characters' }, { status: 400 })
    }

    // Check for duplicate
    const { data: existing } = await supabaseAdmin.client
      .from('categories')
      .select('id')
      .eq('restaurant_id', result.restaurantId)
      .ilike('name', trimmed)
      .limit(1)

    if (existing && existing.length > 0) {
      return NextResponse.json({ error: 'A category with this name already exists' }, { status: 400 })
    }

    // Get max sort_order
    const { data: maxResult } = await supabaseAdmin.client
      .from('categories')
      .select('sort_order')
      .eq('restaurant_id', result.restaurantId)
      .order('sort_order', { ascending: false })
      .limit(1)

    const nextSortOrder = maxResult && maxResult.length > 0 ? maxResult[0].sort_order + 1 : 1

    const { data: category, error } = await supabaseAdmin.client
      .from('categories')
      .insert({
        restaurant_id: result.restaurantId,
        name: trimmed,
        sort_order: nextSortOrder,
      })
      .select()
      .single()

    if (error || !category) {
      return NextResponse.json({ error: 'Failed to create category' }, { status: 500 })
    }

    return NextResponse.json({ category }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}

// DELETE: Delete a category
export async function DELETE(request: NextRequest) {
  try {
    const result = await getOwnerRestaurantId()
    if (result instanceof NextResponse) return result

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Category ID is required' }, { status: 400 })
    }

    // Verify category belongs to this restaurant
    const { data: category, error: catError } = await supabaseAdmin.client
      .from('categories')
      .select('id, name')
      .eq('id', id)
      .eq('restaurant_id', result.restaurantId)
      .single()

    if (catError || !category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 })
    }

    // Check if any menu_items have this category_id
    const { data: itemsWithCategory, error: itemsError } = await supabaseAdmin.client
      .from('menu_items')
      .select('id')
      .eq('category_id', id)
      .eq('restaurant_id', result.restaurantId)
      .limit(1)

    if (itemsError) {
      return NextResponse.json({ error: 'Failed to check category items' }, { status: 500 })
    }

    if (itemsWithCategory && itemsWithCategory.length > 0) {
      return NextResponse.json(
        { error: 'Move or delete items in this category first' },
        { status: 400 }
      )
    }

    // Delete the category
    const { error: deleteError } = await supabaseAdmin.client
      .from('categories')
      .delete()
      .eq('id', id)

    if (deleteError) {
      return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
