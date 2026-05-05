import type { Order, OrderItem } from '@/types'

export function buildOrderMessage(
  order: Order,
  items: OrderItem[],
  restaurantName: string
): string {
  const itemLines = items
    .map((item) => `${item.item_name} x${item.quantity} — ₹${item.item_price * item.quantity}`)
    .join('\n')

  let message = `🔔 NEW ORDER\nRestaurant: ${restaurantName}\nTable: ${order.table_number || 'Takeaway'}\n─────────────────\n${itemLines}\n─────────────────\nTOTAL: ₹${order.total_amount}`

  if (order.note) {
    message += `\n📝 Note: ${order.note}`
  }

  const orderTime = new Date(order.created_at).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })
  message += `\nTime: ${orderTime}`

  return message
}

export function buildOrderWhatsAppUrl(
  phoneNumber: string,
  message: string
): string {
  // Remove +, spaces, dashes from phone number
  const cleanPhone = phoneNumber.replace(/[\+\s\-]/g, '')
  const encodedMessage = encodeURIComponent(message)
  return `https://wa.me/${cleanPhone}?text=${encodedMessage}`
}

export function buildRewardMessage(
  customerName: string,
  phone: string,
  rewardItem: string,
  stamps: number,
  rewardCode: string
): string {
  return `🎁 *REWARD UNLOCKED!*

Congratulations ${customerName}! 🎉

You've collected ${stamps} stamps and earned a *FREE ${rewardItem}*!

📋 *YOUR REWARD DETAILS:*
• Reward Code: *${rewardCode}*
• Reward: Free ${rewardItem}
• Status: ✅ Active

📍 *HOW TO CLAIM:*
Visit the café and show this Reward Code to the staff:
*${rewardCode}*

📌 Note: This reward can only be used once.

Thank you for being a loyal customer! 🙏`
}

export function buildOwnerRewardNotification(
  customerName: string,
  phone: string,
  rewardItem: string,
  rewardCode: string,
  stamps: number
): string {
  return `🔔 *REWARD UNLOCKED — ACTION NEEDED*

A customer has earned a reward:

👤 Customer: ${customerName}
📱 Phone: ${phone}
🎯 Stamps Collected: ${stamps}
🎁 Reward: Free ${rewardItem}
🔑 Reward Code: *${rewardCode}*

⚠️ When the customer visits, verify this code in your admin panel and mark it as redeemed.`
}
