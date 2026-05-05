import { NextRequest, NextResponse } from 'next/server'

// ─── In-memory notification store ─────────────────────────────
// Notifications are stored here for admin polling fallback.
// WebSocket is the primary real-time delivery mechanism.

interface Notification {
  id: string
  type: 'waiter' | 'bill'
  restaurant_id: string
  table_number: number | null
  restaurant_name: string
  timestamp: string
  created_at: Date
}

// Simple in-memory store (resets on server restart — acceptable for a fallback)
const notifications: Notification[] = []

// Deduplication: track recently seen IDs to prevent double-creation
const recentIds = new Set<string>()
const RECENT_ID_MAX = 500
const RECENT_ID_TTL = 60_000 // 1 minute

// Clean old IDs periodically
let lastCleanup = Date.now()
function cleanupRecentIds() {
  if (Date.now() - lastCleanup < RECENT_ID_TTL) return
  lastCleanup = Date.now()
  // Just clear all — simple and effective
  if (recentIds.size > RECENT_ID_MAX) {
    recentIds.clear()
  }
}

// ─── POST: Create notification (fallback for WebSocket) ──────
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, type, restaurant_id, table_number, restaurant_name, timestamp } = body as {
      id?: string
      type: 'waiter' | 'bill'
      restaurant_id: string
      table_number: number | null
      restaurant_name: string
      timestamp?: string
    }

    // Validate
    if (!type || !restaurant_id) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }
    if (type !== 'waiter' && type !== 'bill') {
      return NextResponse.json({ error: 'Type must be "waiter" or "bill"' }, { status: 400 })
    }

    // Deduplication: if client provided an ID, check for duplicates
    const notificationId = id || `srv_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`

    cleanupRecentIds()
    if (id && recentIds.has(id)) {
      console.log(`[notifications] Duplicate POST ignored: ${id}`)
      return NextResponse.json({
        success: true,
        notification: { id: notificationId, type, message: 'Duplicate request', duplicate: true },
      })
    }
    recentIds.add(notificationId)

    const notification: Notification = {
      id: notificationId,
      type,
      restaurant_id,
      table_number: table_number || null,
      restaurant_name: restaurant_name || 'Unknown',
      timestamp: timestamp || new Date().toISOString(),
      created_at: new Date(),
    }

    notifications.push(notification)

    // Keep only last 100 notifications to prevent memory leak
    if (notifications.length > 100) {
      notifications.splice(0, notifications.length - 100)
    }

    console.log(`[notifications] ${type} request from ${restaurant_name} (table ${table_number || 'N/A'}) id: ${notificationId}`)

    return NextResponse.json({
      success: true,
      notification: {
        id: notification.id,
        type: notification.type,
        message: type === 'waiter'
          ? `Table ${table_number || 'N/A'} is calling a waiter`
          : `Table ${table_number || 'N/A'} is asking for the bill`,
        sound: type === 'waiter' ? 1 : 3,
      },
    }, { status: 201 })
  } catch (error) {
    console.error('[notifications] POST error:', error)
    return NextResponse.json({ error: 'Failed to send notification' }, { status: 500 })
  }
}

// ─── GET: Fetch recent notifications for admin polling ───────
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const restaurantId = searchParams.get('restaurant_id')
    const since = searchParams.get('since') // ISO timestamp

    let result = notifications

    // Filter by restaurant
    if (restaurantId) {
      result = result.filter(n => n.restaurant_id === restaurantId)
    }

    // Filter by timestamp (get new ones since last poll)
    if (since) {
      const sinceDate = new Date(since)
      result = result.filter(n => n.created_at > sinceDate)
    }

    // Return last 50
    result = result.slice(-50).reverse()

    return NextResponse.json({
      notifications: result.map(n => ({
        id: n.id,
        type: n.type,
        restaurant_id: n.restaurant_id,
        table_number: n.table_number,
        restaurant_name: n.restaurant_name,
        timestamp: n.timestamp,
        sound: n.type === 'waiter' ? 1 : 3,
      })),
    })
  } catch (error) {
    console.error('[notifications] GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 })
  }
}
