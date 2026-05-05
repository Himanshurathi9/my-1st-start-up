/**
 * seed-demo.ts — Seeds Supabase with demo restaurant data for MenuMate testing.
 * Run with: bun run /home/z/my-project/seed-demo.ts
 */

import { createClient } from '@supabase/supabase-js'

// Supabase credentials (from src/lib/env.ts)
const SUPABASE_URL = 'https://qqfsdqjouokhaurrauso.supabase.co'
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFxZnNkcWpvdW9raGF1cnJhdXNvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzI5ODc4MCwiZXhwIjoyMDkyODc0NzgwfQ.ij-JaLs4QX6Wst1rqBYdYRha0NctFtIAIvzdPF-vij0'

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
})

// ─── Helper: generate a UUID-like id ───
function uid(): string {
  return crypto.randomUUID()
}

// ─── Helper: log with timestamp ───
function log(msg: string) {
  console.log(`[seed] ${new Date().toISOString().slice(11, 19)} | ${msg}`)
}

async function main() {
  log('🚀 Starting demo data seed…')

  // ─────────────────────────────────────────────
  // 0. Clean up any existing demo restaurant (by slug)
  // ─────────────────────────────────────────────
  const { data: existingRest, error: errFind } = await supabase
    .from('restaurants')
    .select('id')
    .eq('slug', 'brew-house-demo')
    .single()

  if (existingRest) {
    log(`Found existing demo restaurant (id=${existingRest.id}), cleaning up…`)
    // Delete dependent rows in order
    const rid = existingRest.id
    await supabase.from('order_items').delete().eq('order_id', rid) // may not match, fine
    const { data: orders } = await supabase.from('orders').select('id').eq('restaurant_id', rid)
    if (orders && orders.length > 0) {
      await supabase.from('order_items').delete().in('order_id', orders.map(o => o.id))
      await supabase.from('orders').delete().eq('restaurant_id', rid)
    }
    await supabase.from('stamps').delete().eq('restaurant_id', rid)
    await supabase.from('rewards').delete().eq('restaurant_id', rid)
    await supabase.from('stamp_settings').delete().eq('restaurant_id', rid)
    await supabase.from('menu_items').delete().eq('restaurant_id', rid)
    await supabase.from('categories').delete().eq('restaurant_id', rid)
    await supabase.from('restaurant_tables').delete().eq('restaurant_id', rid)
    await supabase.from('banners').delete().eq('restaurant_id', rid)
    await supabase.from('customers').delete().eq('restaurant_id', rid)
    await supabase.from('payments').delete().eq('restaurant_id', rid)
    await supabase.from('restaurants').delete().eq('id', rid)
    log('Cleaned up old demo data.')
  }

  // ─────────────────────────────────────────────
  // 1. Create the demo restaurant
  // ─────────────────────────────────────────────
  const restaurantId = uid()
  const demoOwnerId = uid()

  // Create a demo owner user first (if FK constraint exists)
  await supabase.from('users').upsert({
    id: demoOwnerId,
    email: 'demo-owner@brewhouse.com',
    password_hash: '$2a$10$placeholderhashfortestingonly0000000000000000000000000000000000',
    role: 'OWNER',
  }, { onConflict: 'id' })

  const { data: restaurant, error: errRest } = await supabase
    .from('restaurants')
    .insert({
      id: restaurantId,
      owner_id: demoOwnerId,
      name: 'Brew House Demo',
      slug: 'brew-house-demo',
      logo_url: 'https://picsum.photos/seed/brewhouse-logo/200/200',
      cover_photo_url: 'https://picsum.photos/seed/brewhouse-cover/1200/400',
      whatsapp_number: '917425959111',
      is_open: true,
      plan: 'PRO',
      plan_start_date: new Date().toISOString().split('T')[0],
      plan_expiry_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      setup_fee_paid: true,
    })
    .select()
    .single()

  if (errRest) {
    console.error('❌ Failed to create restaurant:', errRest)
    process.exit(1)
  }
  log(`✅ Restaurant created: "${restaurant.name}" (id=${restaurant.id})`)

  // ─────────────────────────────────────────────
  // 2. Create categories
  // ─────────────────────────────────────────────
  const categories = [
    { id: uid(), restaurant_id: restaurantId, name: 'Starters', sort_order: 1 },
    { id: uid(), restaurant_id: restaurantId, name: 'Mains', sort_order: 2 },
    { id: uid(), restaurant_id: restaurantId, name: 'Desserts', sort_order: 3 },
  ]

  const { data: insertedCategories, error: errCat } = await supabase
    .from('categories')
    .insert(categories)
    .select()

  if (errCat) {
    console.error('❌ Failed to create categories:', errCat)
    process.exit(1)
  }
  log(`✅ Categories created: ${insertedCategories.map((c: { name: string }) => c.name).join(', ')}`)

  const [startersCat, mainsCat, dessertsCat] = insertedCategories

  // ─────────────────────────────────────────────
  // 3. Create menu items (8+ items)
  // ─────────────────────────────────────────────
  const menuItems = [
    // Starters (3)
    {
      id: uid(), restaurant_id: restaurantId, category_id: startersCat.id,
      name: 'Crispy Corn Fritters',
      description: 'Golden fried corn kernels tossed with chilli garlic sauce and spring onions.',
      price: 199, image_url: 'https://picsum.photos/seed/corn-fritters/400/300',
      food_type: 'VEG', is_available: true, is_best_seller: false, is_chefs_special: false, sort_order: 1,
    },
    {
      id: uid(), restaurant_id: restaurantId, category_id: startersCat.id,
      name: 'Chicken Wings (8 pcs)',
      description: 'Smoky barbecue glazed wings served with ranch dip and celery sticks.',
      price: 349, image_url: 'https://picsum.photos/seed/chicken-wings/400/300',
      food_type: 'NONVEG', is_available: true, is_best_seller: true, is_chefs_special: false, sort_order: 2,
    },
    {
      id: uid(), restaurant_id: restaurantId, category_id: startersCat.id,
      name: 'Paneer Tikka Skewers',
      description: 'Chargrilled cottage cheese marinated in aromatic spices with mint chutney.',
      price: 269, image_url: 'https://picsum.photos/seed/paneer-tikka/400/300',
      food_type: 'VEG', is_available: true, is_best_seller: false, is_chefs_special: true, sort_order: 3,
    },

    // Mains (3)
    {
      id: uid(), restaurant_id: restaurantId, category_id: mainsCat.id,
      name: 'Butter Chicken Bowl',
      description: 'Tender chicken in rich tomato-butter gravy served with steamed basmati rice.',
      price: 399, image_url: 'https://picsum.photos/seed/butter-chicken/400/300',
      food_type: 'NONVEG', is_available: true, is_best_seller: true, is_chefs_special: false, sort_order: 1,
    },
    {
      id: uid(), restaurant_id: restaurantId, category_id: mainsCat.id,
      name: 'Farmhouse Veg Pizza',
      description: 'Wood-fired thin crust pizza loaded with bell peppers, mushrooms, olives, and mozzarella.',
      price: 449, image_url: 'https://picsum.photos/seed/farmhouse-pizza/400/300',
      food_type: 'VEG', is_available: true, is_best_seller: true, is_chefs_special: true, sort_order: 2,
    },
    {
      id: uid(), restaurant_id: restaurantId, category_id: mainsCat.id,
      name: 'Mutton Rogan Josh',
      description: 'Slow-cooked mutton in a fragrant Kashmiri spice gravy with naan bread.',
      price: 549, image_url: 'https://picsum.photos/seed/rogan-josh/400/300',
      food_type: 'NONVEG', is_available: true, is_best_seller: false, is_chefs_special: true, sort_order: 3,
    },

    // Desserts (3)
    {
      id: uid(), restaurant_id: restaurantId, category_id: dessertsCat.id,
      name: 'Chocolate Lava Cake',
      description: 'Warm molten chocolate cake with a gooey centre, served with vanilla ice cream.',
      price: 249, image_url: 'https://picsum.photos/seed/lava-cake/400/300',
      food_type: 'VEG', is_available: true, is_best_seller: true, is_chefs_special: false, sort_order: 1,
    },
    {
      id: uid(), restaurant_id: restaurantId, category_id: dessertsCat.id,
      name: 'Gulab Jamun (2 pcs)',
      description: 'Soft milk-solid dumplings soaked in rose-cardamom sugar syrup.',
      price: 149, image_url: 'https://picsum.photos/seed/gulab-jamun/400/300',
      food_type: 'VEG', is_available: true, is_best_seller: false, is_chefs_special: false, sort_order: 2,
    },
    {
      id: uid(), restaurant_id: restaurantId, category_id: dessertsCat.id,
      name: 'Tiramisu Glass',
      description: 'Classic Italian layered dessert with espresso-soaked ladyfingers and mascarpone cream.',
      price: 279, image_url: 'https://picsum.photos/seed/tiramisu-glass/400/300',
      food_type: 'VEG', is_available: true, is_best_seller: false, is_chefs_special: true, sort_order: 3,
    },
  ]

  const { data: insertedItems, error: errItems } = await supabase
    .from('menu_items')
    .insert(menuItems)
    .select()

  if (errItems) {
    console.error('❌ Failed to create menu items:', errItems)
    process.exit(1)
  }
  log(`✅ Menu items created: ${insertedItems.length} items`)

  // ─────────────────────────────────────────────
  // 4. Create a banner
  // ─────────────────────────────────────────────
  const { data: banner, error: errBanner } = await supabase
    .from('banners')
    .insert({
      id: uid(),
      restaurant_id: restaurantId,
      image_url: 'https://picsum.photos/seed/brew-house-promo/1200/500',
      title: '🎉 Grand Opening — 20% Off All Mains This Week!',
      start_date: new Date().toISOString(),
      end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      is_active: true,
      sort_order: 1,
    })
    .select()
    .single()

  if (errBanner) {
    console.error('❌ Failed to create banner:', errBanner)
    process.exit(1)
  }
  log(`✅ Banner created: "${banner.title}"`)

  // ─────────────────────────────────────────────
  // 5. Create stamp settings
  // ─────────────────────────────────────────────
  const { data: stampSettings, error: errStamp } = await supabase
    .from('stamp_settings')
    .insert({
      id: uid(),
      restaurant_id: restaurantId,
      stamps_required: 9,
      reward_item_name: 'Free Coffee',
      is_active: true,
    })
    .select()
    .single()

  if (errStamp) {
    console.error('❌ Failed to create stamp settings:', errStamp)
    process.exit(1)
  }
  log(`✅ Stamp settings created: ${stampSettings.stamps_required} stamps → "${stampSettings.reward_item_name}"`)

  // ─────────────────────────────────────────────
  // 6. Create tables (Table 1-5)
  // ─────────────────────────────────────────────
  const tables = Array.from({ length: 5 }, (_, i) => ({
    id: uid(),
    restaurant_id: restaurantId,
    table_number: i + 1,
    qr_code_url: null,
  }))

  const { data: insertedTables, error: errTables } = await supabase
    .from('restaurant_tables')
    .insert(tables)
    .select()

  if (errTables) {
    console.error('❌ Failed to create tables:', errTables)
    process.exit(1)
  }
  log(`✅ Tables created: ${insertedTables.map((t: { table_number: number }) => `T${t.table_number}`).join(', ')}`)

  // ─────────────────────────────────────────────
  // Summary
  // ─────────────────────────────────────────────
  console.log('\n' + '═'.repeat(50))
  console.log('  🎉 Demo data seeded successfully!')
  console.log('═'.repeat(50))
  console.log(`  Restaurant : ${restaurant.name} (slug: ${restaurant.slug})`)
  console.log(`  Categories : ${insertedCategories.length}`)
  console.log(`  Menu Items : ${insertedItems.length}`)
  console.log(`  Banners    : 1`)
  console.log(`  Stamp Prgm : ${stampSettings.stamps_required} stamps → ${stampSettings.reward_item_name}`)
  console.log(`  Tables     : ${insertedTables.length}`)
  console.log(`  Plan       : ${restaurant.plan}`)
  console.log(`  WhatsApp   : +${restaurant.whatsapp_number}`)
  console.log('═'.repeat(50) + '\n')
}

main().catch((err) => {
  console.error('❌ Seed script failed:', err)
  process.exit(1)
})
