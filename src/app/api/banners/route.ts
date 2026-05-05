import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { deleteFromCloudinary } from '@/lib/cloudinary'

const BANNER_LIMITS: Record<string, number> = {
  BASIC: 1,
  PRO: 5,
}

// GET: Fetch all banners for restaurant
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as { id: string }).id

    const { data: restaurant, error: restError } = await supabaseAdmin.client
      .from('restaurants')
      .select('id, plan')
      .eq('owner_id', userId)
      .single()

    if (restError || !restaurant) {
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 })
    }

    const { data: banners, error: bannersError } = await supabaseAdmin.client
      .from('banners')
      .select('*')
      .eq('restaurant_id', restaurant.id)
      .order('sort_order', { ascending: true })

    if (bannersError) {
      return NextResponse.json({ error: 'Failed to fetch banners' }, { status: 500 })
    }

    const maxBanners = BANNER_LIMITS[restaurant.plan] || 1
    const activeCount = (banners || []).filter((b: { is_active: boolean }) => b.is_active).length

    return NextResponse.json({
      banners: banners || [],
      plan: restaurant.plan,
      maxBanners,
      activeCount,
    })
  } catch {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}

// POST: Create banner
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as { id: string }).id
    const body = await request.json()
    const { image_url, title, start_date, end_date, is_active = true } = body

    if (!image_url) {
      return NextResponse.json({ error: 'Banner image is required' }, { status: 400 })
    }

    // Fetch restaurant
    const { data: restaurant, error: restError } = await supabaseAdmin.client
      .from('restaurants')
      .select('id, plan')
      .eq('owner_id', userId)
      .single()

    if (restError || !restaurant) {
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 })
    }

    // Check plan limit
    const maxBanners = BANNER_LIMITS[restaurant.plan] || 1

    if (is_active) {
      const { count, error: countError } = await supabaseAdmin.client
        .from('banners')
        .select('*', { count: 'exact', head: true })
        .eq('restaurant_id', restaurant.id)
        .eq('is_active', true)

      if (countError) {
        return NextResponse.json({ error: 'Failed to check banner count' }, { status: 500 })
      }

      if ((count || 0) >= maxBanners) {
        return NextResponse.json(
          {
            error:
              restaurant.plan === 'BASIC'
                ? `BASIC plan allows only ${maxBanners} active banner. Upgrade to PRO for up to 5 banners.`
                : `PRO plan allows up to ${maxBanners} active banners.`,
          },
          { status: 400 }
        )
      }
    }

    // Get next sort_order
    const { data: maxSort } = await supabaseAdmin.client
      .from('banners')
      .select('sort_order')
      .eq('restaurant_id', restaurant.id)
      .order('sort_order', { ascending: false })
      .limit(1)

    const nextSort = (maxSort && maxSort.length > 0 ? maxSort[0].sort_order : 0) + 1

    const { data: banner, error: insertError } = await supabaseAdmin.client
      .from('banners')
      .insert({
        restaurant_id: restaurant.id,
        image_url,
        title: title || null,
        start_date: start_date || null,
        end_date: end_date || null,
        is_active,
        sort_order: nextSort,
      })
      .select()
      .single()

    if (insertError || !banner) {
      return NextResponse.json({ error: 'Failed to create banner' }, { status: 500 })
    }

    return NextResponse.json({ banner, success: true })
  } catch {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}

// PATCH: Update banner
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as { id: string }).id
    const body = await request.json()
    const { id, is_active, title, start_date, end_date, image_url, sort_order } = body

    if (!id) {
      return NextResponse.json({ error: 'Banner ID is required' }, { status: 400 })
    }

    // Fetch restaurant
    const { data: restaurant, error: restError } = await supabaseAdmin.client
      .from('restaurants')
      .select('id, plan')
      .eq('owner_id', userId)
      .single()

    if (restError || !restaurant) {
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 })
    }

    // Verify banner belongs to this restaurant
    const { data: existing, error: fetchError } = await supabaseAdmin.client
      .from('banners')
      .select('*')
      .eq('id', id)
      .eq('restaurant_id', restaurant.id)
      .single()

    if (fetchError || !existing) {
      return NextResponse.json({ error: 'Banner not found' }, { status: 404 })
    }

    // If activating, check plan limit
    if (is_active === true && !existing.is_active) {
      const maxBanners = BANNER_LIMITS[restaurant.plan] || 1
      const { count, error: countError } = await supabaseAdmin.client
        .from('banners')
        .select('*', { count: 'exact', head: true })
        .eq('restaurant_id', restaurant.id)
        .eq('is_active', true)

      if (countError) {
        return NextResponse.json({ error: 'Failed to check banner count' }, { status: 500 })
      }

      if ((count || 0) >= maxBanners) {
        return NextResponse.json(
          {
            error:
              restaurant.plan === 'BASIC'
                ? `BASIC plan allows only ${maxBanners} active banner. Upgrade to PRO for up to 5 banners.`
                : `PRO plan allows up to ${maxBanners} active banners.`,
          },
          { status: 400 }
        )
      }
    }

    // Build update object
    const updates: Record<string, unknown> = {}
    if (typeof is_active === 'boolean') updates.is_active = is_active
    if (typeof title === 'string') updates.title = title || null
    if (typeof start_date === 'string') updates.start_date = start_date || null
    if (typeof end_date === 'string') updates.end_date = end_date || null
    if (typeof image_url === 'string') updates.image_url = image_url
    if (typeof sort_order === 'number') updates.sort_order = sort_order

    const { data: banner, error: updateError } = await supabaseAdmin.client
      .from('banners')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (updateError || !banner) {
      return NextResponse.json({ error: 'Failed to update banner' }, { status: 500 })
    }

    return NextResponse.json({ banner, success: true })
  } catch {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}

// DELETE: Delete banner by id in query
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as { id: string }).id
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Banner ID is required' }, { status: 400 })
    }

    // Fetch restaurant
    const { data: restaurant, error: restError } = await supabaseAdmin.client
      .from('restaurants')
      .select('id')
      .eq('owner_id', userId)
      .single()

    if (restError || !restaurant) {
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 })
    }

    // Verify banner belongs to restaurant
    const { data: banner, error: fetchError } = await supabaseAdmin.client
      .from('banners')
      .select('image_url')
      .eq('id', id)
      .eq('restaurant_id', restaurant.id)
      .single()

    if (fetchError || !banner) {
      return NextResponse.json({ error: 'Banner not found' }, { status: 404 })
    }

    // Delete from Cloudinary
    if (banner.image_url) {
      try {
        // Extract public_id from URL
        const urlParts = banner.image_url.split('/')
        const filename = urlParts[urlParts.length - 1]
        const publicId = `menumate/banners/${filename.split('.')[0]}`
        await deleteFromCloudinary(publicId)
      } catch {
        // Ignore Cloudinary errors — DB deletion will still proceed
      }
    }

    // Delete from DB
    const { error: deleteError } = await supabaseAdmin.client
      .from('banners')
      .delete()
      .eq('id', id)

    if (deleteError) {
      return NextResponse.json({ error: 'Failed to delete banner' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
