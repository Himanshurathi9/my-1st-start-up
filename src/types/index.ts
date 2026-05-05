export type UserRole = 'ADMIN' | 'OWNER'
export type Plan = 'BASIC' | 'PRO'
export type OrderStatus = 'NEW' | 'PREPARING' | 'SERVED'
export type FoodType = 'VEG' | 'NONVEG' | 'EGG'
export type PaymentType = 'SETUP' | 'SUBSCRIPTION'
export type PaymentMethod = 'UPI' | 'CASH'

export interface User {
  id: string
  email: string
  password_hash: string
  role: UserRole
  created_at: string
}

export type ThemeName = 'dark' | 'emerald' | 'sunset' | 'royal'

export interface Restaurant {
  id: string
  owner_id: string
  name: string
  slug: string
  logo_url: string | null
  cover_photo_url: string | null
  whatsapp_number: string
  is_open: boolean
  plan: Plan
  plan_start_date: string | null
  plan_expiry_date: string | null
  setup_fee_paid: boolean
  theme: ThemeName | null
  created_at: string
}

export interface Category {
  id: string
  restaurant_id: string
  name: string
  sort_order: number
  created_at: string
}

export interface MenuItem {
  id: string
  restaurant_id: string
  category_id: string | null
  name: string
  description: string | null
  price: number
  image_url: string | null
  food_type: FoodType
  is_available: boolean
  is_best_seller: boolean
  is_chefs_special: boolean
  sort_order: number
  created_at: string
}

export interface RestaurantTable {
  id: string
  restaurant_id: string
  table_number: number
  qr_code_url: string | null
  created_at: string
}

export interface Order {
  id: string
  restaurant_id: string
  table_id: string | null
  table_number: number | null
  status: OrderStatus
  note: string | null
  total_amount: number
  created_at: string
  updated_at: string
  order_items?: OrderItem[]
}

export interface OrderItem {
  id: string
  order_id: string
  menu_item_id: string | null
  item_name: string
  item_price: number
  quantity: number
}

export interface Banner {
  id: string
  restaurant_id: string
  image_url: string
  title: string | null
  start_date: string | null
  end_date: string | null
  is_active: boolean
  sort_order: number
  created_at: string
}

export interface Customer {
  id: string
  phone_number: string
  name: string | null
  restaurant_id: string
  total_orders: number
  last_visit_date: string | null
  created_at: string
}

export interface Stamp {
  id: string
  customer_id: string
  restaurant_id: string
  order_id: string | null
  earned_at: string
  expires_at: string
  is_redeemed: boolean
}

export interface Reward {
  id: string
  customer_id: string
  restaurant_id: string
  reward_code: string
  is_used: boolean
  expires_at: string
  created_at: string
}

export interface StampSettings {
  id: string
  restaurant_id: string
  stamps_required: number
  reward_item_name: string
  is_active: boolean
}

export interface Payment {
  id: string
  restaurant_id: string
  amount: number
  payment_type: PaymentType
  payment_method: PaymentMethod
  notes: string | null
  paid_at: string
  recorded_by: string | null
}
