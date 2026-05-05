import { supabaseAdmin } from '@/lib/supabase-admin'
import { isPlanExpired } from '@/lib/utils'
import PublicMenuClient from '@/components/menu/PublicMenuClient'
import type { Restaurant, Category, MenuItem, Banner } from '@/types'
import { UtensilsCrossed, AlertCircle } from 'lucide-react'

// ─── Types ─────────────────────────────────────────────────────
interface MenuItemWithCategory extends MenuItem {
  category_name: string | null
}

// ─── Metadata ──────────────────────────────────────────────────
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  const { data: restaurant } = await supabaseAdmin.client
    .from('restaurants')
    .select('name, cover_photo_url')
    .eq('slug', slug)
    .single()

  if (!restaurant) {
    return { title: 'Restaurant Not Found — MenuMate' }
  }

  return {
    title: `${restaurant.name} — Digital Menu`,
    description: `Browse the menu at ${restaurant.name}. Order directly from your table.`,
    openGraph: {
      title: `${restaurant.name} — Digital Menu`,
      description: `Browse the menu at ${restaurant.name}`,
      ...(restaurant.cover_photo_url && { images: [restaurant.cover_photo_url] }),
    },
  }
}

// ─── Edge Case Pages ───────────────────────────────────────────
function NotFoundPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6" style={{ background: '#FAFAF8' }}>
      <div className="flex items-center justify-center mb-5" style={{ width: 80, height: 80, borderRadius: '50%', background: '#F5F5F3' }}>
        <UtensilsCrossed className="w-9 h-9" style={{ color: '#ABABAB' }} />
      </div>
      <h1 className="font-bold mb-2 text-center" style={{ fontSize: 18, color: '#1C1C1E' }}>Restaurant Not Found</h1>
      <p className="text-center leading-relaxed" style={{ fontSize: 14, color: '#6B6B6B', maxWidth: 280 }}>
        We couldn&apos;t find this restaurant. Check the link and try again.
      </p>
      <footer className="absolute bottom-6 left-0 right-0 text-center">
        <p style={{ color: '#ABABAB', fontSize: 12 }}>
          Powered by <span style={{ color: '#E63946', fontWeight: 700 }}>MenuMate</span>
        </p>
      </footer>
    </div>
  )
}

function ClosedPage({ name }: { name: string }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6" style={{ background: '#FAFAF8' }}>
      <div style={{ fontSize: 64, lineHeight: 1 }}>🌙</div>
      <h1 className="font-bold text-center" style={{ fontSize: 24, fontWeight: 800, color: '#1C1C1E', marginTop: 16 }}>{name}</h1>
      <p className="text-center" style={{ fontSize: 20, fontWeight: 700, marginTop: 16, color: '#1C1C1E' }}>We&apos;re closed right now</p>
      <p className="text-center leading-relaxed" style={{ fontSize: 14, color: '#6B6B6B', marginTop: 8, maxWidth: 300 }}>
        Come back soon and we&apos;ll be ready to serve you
      </p>
      <footer className="absolute bottom-6 left-0 right-0 text-center">
        <p style={{ color: '#ABABAB', fontSize: 12 }}>
          Powered by <span style={{ color: '#E63946', fontWeight: 700 }}>MenuMate</span>
        </p>
      </footer>
    </div>
  )
}

function UnavailablePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6" style={{ background: '#FAFAF8' }}>
      <div className="flex items-center justify-center mb-5" style={{ width: 80, height: 80, borderRadius: '50%', background: '#F5F5F3' }}>
        <AlertCircle className="w-9 h-9" style={{ color: '#ABABAB' }} />
      </div>
      <h1 className="font-bold mb-2 text-center" style={{ fontSize: 18, color: '#1C1C1E' }}>Menu Temporarily Unavailable</h1>
      <p className="text-center leading-relaxed" style={{ fontSize: 14, color: '#6B6B6B', maxWidth: 280 }}>
        This menu is currently being updated. Please check back in a little while.
      </p>
      <footer className="absolute bottom-6 left-0 right-0 text-center">
        <p style={{ color: '#ABABAB', fontSize: 12 }}>
          Powered by <span style={{ color: '#E63946', fontWeight: 700 }}>MenuMate</span>
        </p>
      </footer>
    </div>
  )
}

// ─── Server Component ──────────────────────────────────────────
export default async function PublicMenuPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ table?: string }>
}) {
  const { slug } = await params
  const { table } = await searchParams

  // 1. Fetch restaurant
  const { data: restaurant, error: restError } = await supabaseAdmin.client
    .from('restaurants')
    .select('*')
    .eq('slug', slug)
    .single()

  if (restError || !restaurant) {
    return <NotFoundPage />
  }

  // 2. Closed?
  if (!restaurant.is_open) {
    return <ClosedPage name={restaurant.name} />
  }

  // 3. Plan expired?
  if (isPlanExpired(restaurant.plan_expiry_date)) {
    return <UnavailablePage />
  }

  // 4. Fetch categories (sorted)
  const { data: categories } = await supabaseAdmin.client
    .from('categories')
    .select('*')
    .eq('restaurant_id', restaurant.id)
    .order('sort_order', { ascending: true })

  // 5. Fetch available menu items with category join
  const { data: menuItems } = await supabaseAdmin.client
    .from('menu_items')
    .select('*, categories(name)')
    .eq('restaurant_id', restaurant.id)
    .eq('is_available', true)
    .order('sort_order', { ascending: true })

  // 6. Flatten category join
  const items: MenuItemWithCategory[] = (menuItems || []).map(
    (item: Record<string, unknown>) => ({
      ...item,
      category_name: (item.categories as { name: string } | null)?.name || null,
    }),
  )

  // 7. Fetch active banners
  const { data: bannerData } = await supabaseAdmin.client
    .from('banners')
    .select('*')
    .eq('restaurant_id', restaurant.id)
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  // Filter banners by date range
  const now = new Date().toISOString()
  const activeBanners = (bannerData || []).filter(
    (b: Banner) =>
      (!b.start_date || b.start_date <= now) &&
      (!b.end_date || b.end_date >= now),
  )

  // 8. Parse table number
  const tableNumber = table ? parseInt(table, 10) : null

  return (
    <PublicMenuClient
      restaurant={restaurant as Restaurant}
      categories={(categories || []) as Category[]}
      items={items}
      tableNumber={isNaN(tableNumber as number) ? null : tableNumber}
      banners={activeBanners as Banner[]}
      defaultTheme={restaurant.theme as string | undefined}
    />
  )
}
