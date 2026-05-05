import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { cloudinary } from '@/lib/cloudinary'
import QRCode from 'qrcode'

// GET: Fetch all tables for owner's restaurant + master QR
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as { id: string }).id

    const { data: restaurant, error: restError } = await supabaseAdmin.client
      .from('restaurants')
      .select('id, name, slug, plan, whatsapp_number')
      .eq('owner_id', userId)
      .single()

    if (restError || !restaurant) {
      console.error('[GET /api/tables] Restaurant fetch error:', restError?.message)
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 })
    }

    console.log('[GET /api/tables] restaurantId:', restaurant.id, 'whatsapp:', restaurant.whatsapp_number || '(none)')

    const { data: tables, error: tablesError } = await supabaseAdmin.client
      .from('restaurant_tables')
      .select('*')
      .eq('restaurant_id', restaurant.id)
      .order('table_number', { ascending: true })

    if (tablesError) {
      return NextResponse.json({ error: 'Failed to fetch tables' }, { status: 500 })
    }

    // Generate master QR (walk-in / takeaway) as data URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const menuUrl = `${baseUrl}/menu/${restaurant.slug}`
    let masterQrUrl: string | null = null

    try {
      masterQrUrl = await QRCode.toDataURL(menuUrl, {
        width: 400,
        margin: 2,
        color: { dark: '#1A1A2E', light: '#FFFFFF' },
        errorCorrectionLevel: 'M',
      })
    } catch {
      // Master QR generation failed, continue without it
    }

    return NextResponse.json({
      restaurant,
      tables: tables || [],
      masterQrUrl,
    })
  } catch {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}

// POST: Generate QR codes for all tables
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as { id: string }).id
    const body = await request.json()
    const { count } = body

    if (!count || typeof count !== 'number' || count < 1 || count > 100) {
      return NextResponse.json(
        { error: 'Please enter a valid number of tables (1–100)' },
        { status: 400 }
      )
    }

    // Fetch restaurant
    const { data: restaurant, error: restError } = await supabaseAdmin.client
      .from('restaurants')
      .select('id, name, slug, plan')
      .eq('owner_id', userId)
      .single()

    if (restError || !restaurant) {
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 })
    }

    // Plan-based table limit
    const maxTables = restaurant.plan === 'BASIC' ? 10 : 30
    if (count > maxTables) {
      return NextResponse.json(
        { error: `${restaurant.plan} plan supports a maximum of ${maxTables} tables. Upgrade to PRO for up to 30.` },
        { status: 400 }
      )
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const menuUrl = `${baseUrl}/menu/${restaurant.slug}`

    // Delete existing tables and their QR images from Cloudinary
    const { data: existingTables } = await supabaseAdmin.client
      .from('restaurant_tables')
      .select('table_number, qr_code_url')
      .eq('restaurant_id', restaurant.id)

    if (existingTables && existingTables.length > 0) {
      for (const table of existingTables) {
        if (table.qr_code_url) {
          try {
            await cloudinary.uploader.destroy(
              `menumate/qrcodes/table-${table.table_number}-${restaurant.id}`
            )
          } catch {
            // Ignore Cloudinary delete errors — will be overwritten anyway
          }
        }
      }
      await supabaseAdmin.client
        .from('restaurant_tables')
        .delete()
        .eq('restaurant_id', restaurant.id)
    }

    // Also delete old master QR
    try {
      await cloudinary.uploader.destroy(`menumate/qrcodes/master-${restaurant.id}`)
    } catch {
      // Ignore
    }

    // Generate new tables
    const tables: any[] = []

    for (let i = 1; i <= count; i++) {
      const tableUrl = `${menuUrl}?table=${i}`

      // Generate QR code as data URL
      const qrDataUrl = await QRCode.toDataURL(tableUrl, {
        width: 400,
        margin: 2,
        color: { dark: '#1A1A2E', light: '#FFFFFF' },
        errorCorrectionLevel: 'M',
      })

      // Upload to Cloudinary
      const uploadResult = await cloudinary.uploader.upload(qrDataUrl, {
        folder: 'menumate/qrcodes',
        public_id: `table-${i}-${restaurant.id}`,
        overwrite: true,
      })

      // Insert into database
      const { data: table, error: insertError } = await supabaseAdmin.client
        .from('restaurant_tables')
        .insert({
          restaurant_id: restaurant.id,
          table_number: i,
          qr_code_url: uploadResult.secure_url,
        })
        .select()
        .single()

      if (insertError || !table) {
        return NextResponse.json(
          { error: `Failed to create table ${i}. Please try again.` },
          { status: 500 }
        )
      }

      tables.push(table)
    }

    // Generate master QR (walk-in / takeaway)
    let masterQrUrl: string | null = null
    try {
      const masterQrDataUrl = await QRCode.toDataURL(menuUrl, {
        width: 400,
        margin: 2,
        color: { dark: '#1A1A2E', light: '#FFFFFF' },
        errorCorrectionLevel: 'M',
      })

      const masterUpload = await cloudinary.uploader.upload(masterQrDataUrl, {
        folder: 'menumate/qrcodes',
        public_id: `master-${restaurant.id}`,
        overwrite: true,
      })

      masterQrUrl = masterUpload.secure_url
    } catch {
      // Master QR upload failed, generate client-side data URL as fallback
      try {
        masterQrUrl = await QRCode.toDataURL(menuUrl, {
          width: 400,
          margin: 2,
          color: { dark: '#1A1A2E', light: '#FFFFFF' },
          errorCorrectionLevel: 'M',
        })
      } catch {
        // Both failed, master QR won't be available
      }
    }

    return NextResponse.json({
      success: true,
      tables,
      masterQrUrl,
      message: `${count} table QR codes generated successfully`,
    })
  } catch {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}

// DELETE: Delete all tables and their QR codes
export async function DELETE() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as { id: string }).id

    const { data: restaurant, error: restError } = await supabaseAdmin.client
      .from('restaurants')
      .select('id')
      .eq('owner_id', userId)
      .single()

    if (restError || !restaurant) {
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 })
    }

    // Fetch tables for Cloudinary cleanup
    const { data: existingTables } = await supabaseAdmin.client
      .from('restaurant_tables')
      .select('table_number')
      .eq('restaurant_id', restaurant.id)

    // Delete QR images from Cloudinary
    if (existingTables) {
      for (const table of existingTables) {
        try {
          await cloudinary.uploader.destroy(
            `menumate/qrcodes/table-${table.table_number}-${restaurant.id}`
          )
        } catch {
          // Ignore
        }
      }
    }

    // Delete master QR
    try {
      await cloudinary.uploader.destroy(`menumate/qrcodes/master-${restaurant.id}`)
    } catch {
      // Ignore
    }

    // Delete from DB
    const { error: deleteError } = await supabaseAdmin.client
      .from('restaurant_tables')
      .delete()
      .eq('restaurant_id', restaurant.id)

    if (deleteError) {
      return NextResponse.json({ error: 'Failed to delete tables' }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'All tables deleted' })
  } catch {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
