'use client'

import { useState, useEffect } from 'react'
import AdminNotificationListener from '@/components/menu/AdminNotificationListener'

export default function DashboardNotificationWrapper() {
  const [restaurantId, setRestaurantId] = useState<string | null>(null)

  useEffect(() => {
    const fetchRestaurant = async () => {
      try {
        const res = await fetch('/api/restaurant')
        if (res.ok) {
          const data = await res.json()
          if (data.restaurant?.id) {
            setRestaurantId(data.restaurant.id)
          }
        }
      } catch {
        // Silently fail — notifications are non-critical
      }
    }
    fetchRestaurant()
  }, [])

  if (!restaurantId) return null

  return <AdminNotificationListener restaurantId={restaurantId} />
}
