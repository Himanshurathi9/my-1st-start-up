import { Server } from 'socket.io'

const PORT = 3004

const io = new Server(PORT, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
  transports: ['websocket', 'polling'],
})

console.log(`[Notifications] WebSocket server running on port ${PORT}`)

// Track connected admin clients by restaurant_id
const adminClients = new Map<string, Set<string>>()

// Deduplication: track recently forwarded notification IDs
const forwardedIds = new Set<string>()
const FORWARDED_MAX = 500

io.on('connection', (socket) => {
  console.log(`[Notifications] Client connected: ${socket.id}`)

  // ── Admin registers for their restaurant ──
  socket.on('admin-register', (restaurantId: string) => {
    socket.join(`admin-${restaurantId}`)
    const existing = adminClients.get(restaurantId) || new Set()
    existing.add(socket.id)
    adminClients.set(restaurantId, existing)
    console.log(`[Notifications] Admin registered for restaurant: ${restaurantId}`)
  })

  // ── Admin disconnects ──
  socket.on('admin-unregister', (restaurantId: string) => {
    socket.leave(`admin-${restaurantId}`)
    const existing = adminClients.get(restaurantId)
    if (existing) {
      existing.delete(socket.id)
      if (existing.size === 0) adminClients.delete(restaurantId)
    }
  })

  // ── Customer sends a request (waiter / bill) ──
  socket.on('customer-request', (data: {
    id?: string
    type: 'waiter' | 'bill'
    restaurant_id: string
    table_number: number | null
    restaurant_name: string
    timestamp: string
  }) => {
    const { id, type, restaurant_id, table_number, restaurant_name, timestamp } = data

    // Deduplication: skip if this ID was already forwarded
    if (id && forwardedIds.has(id)) {
      console.log(`[Notifications] Duplicate WebSocket event ignored: ${id}`)
      return
    }

    // Track this ID
    const eventId = id || `ws_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    forwardedIds.add(eventId)

    // Prevent memory leak
    if (forwardedIds.size > FORWARDED_MAX) {
      const iter = forwardedIds.values()
      for (let i = 0; i < FORWARDED_MAX / 2; i++) {
        forwardedIds.delete(iter.next().value as string)
      }
    }

    console.log(`[Notifications] ${type} request for ${restaurant_name} (table ${table_number || 'N/A'}) id: ${eventId}`)

    // Forward to all admins for this restaurant (exactly once)
    io.to(`admin-${restaurant_id}`).emit('customer-notification', {
      id: eventId,
      type,
      restaurant_id,
      table_number,
      restaurant_name,
      timestamp,
      sound: type === 'waiter' ? 1 : 3, // 1 bell for waiter, 3 for bill
    })
  })

  socket.on('disconnect', () => {
    console.log(`[Notifications] Client disconnected: ${socket.id}`)
    // Clean up any admin registrations
    for (const [restaurantId, clients] of adminClients) {
      clients.delete(socket.id)
      if (clients.size === 0) adminClients.delete(restaurantId)
    }
  })
})
