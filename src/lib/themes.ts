// ═══════════════════════════════════════════════════════════════
// MENUMATE THEME SYSTEM — 4 Premium Dark Restaurant Themes
// Applied via inline styles for dynamic per-restaurant theming
// CSS variables set on root container for global effects
// ═══════════════════════════════════════════════════════════════

export type ThemeName = 'dark' | 'emerald' | 'sunset' | 'royal'

export interface MenuTheme {
  // Backgrounds
  bg: string
  surface: string
  card: string
  cardBorder: string
  cardShadow: string
  cardHoverShadow: string

  // Text hierarchy
  text: string
  textSub: string
  textMuted: string

  // Accent
  accent: string
  accentEnd: string
  accentHover: string
  accentSoft: string
  accentGlow: string
  accentText: string
  accentGradient: string

  // Structure
  border: string
  divider: string
  overlay: string
  sheetBg: string

  // Category pills
  pillBg: string
  pillText: string
  pillActiveBg: string
  pillActiveText: string
  pillActiveShadow: string

  // Hero
  heroOverlay: string
  heroTextShadow: string
  heroFallbackBg: string
  heroGlow: string
  heroCtaBg: string
  heroCtaText: string

  // Header glass
  headerBg: string
  headerBorder: string

  // Category bar glass
  barBg: string

  // Floating cart bar
  cartBarBg: string
  cartBarBorder: string
  cartBarShadow: string

  // Bottom nav
  bottomNavBg: string
  bottomNavBorder: string
  bottomNavActiveColor: string
  bottomNavInactiveColor: string
  bottomNavIndicatorColor: string

  // Add to cart
  addBtnBg: string
  addBtnText: string
  addBtnShadow: string
  addBtnHoverShadow: string

  // Quantity pill
  qtyBg: string
  qtyText: string

  // Food type dots
  vegColor: string
  nonvegColor: string
  eggColor: string

  // Open/Closed badge
  openBg: string
  openText: string
  closedBg: string
  closedText: string

  // Sold out
  soldOutOverlay: string
  soldOutText: string
  soldOutBg: string

  // Search
  searchBg: string
  searchBorder: string
  searchIcon: string
  searchClearBg: string

  // Footer
  footerText: string
  footerAccent: string

  // Misc
  imagePlaceholder: string
  emptyStateIcon: string
  bestsellerBg: string
  bestsellerText: string
  bestsellerGlow: string
  chefSpecialBg: string
  chefSpecialText: string

  // Card image overlay
  imageOverlayGradient: string

  // Skeleton / loading
  skeletonBase: string
  skeletonShine: string

  // Banner
  bannerOverlay: string
  bannerText: string

  // Stamps
  stampFilledBg: string
  stampFilledIcon: string
  stampEmptyBg: string
  stampEmptyBorder: string
  stampEmptyText: string
  stampCardBg: string
  stampCardBorder: string

  // Sheet internals
  sheetHeaderText: string
  sheetSubtext: string
  sheetItemBg: string
  sheetDivider: string
  sheetInputBg: string
  sheetInputFocusBorder: string
  sheetNoteText: string
  sheetTotalText: string
  sheetBtnText: string
  sheetErrorBg: string
  sheetErrorText: string
  sheetSuccessBg: string
  sheetSuccessIcon: string

  // FAB (Floating Action Button)
  fabBg: string
  fabShadow: string
  fabBadgeBg: string
}

// ─── DARK LUXURY (Default — Apple-level dark) ────────────────────
const dark: MenuTheme = {
  bg: '#09090B',
  surface: '#111113',
  card: '#131316',
  cardBorder: 'rgba(255,255,255,0.04)',
  cardShadow: '0 2px 8px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.03)',
  cardHoverShadow: '0 16px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.06)',
  text: '#FAFAFA',
  textSub: '#A1A1AA',
  textMuted: '#52525B',
  // Warm amber accent
  accent: '#F59E0B',
  accentEnd: '#D97706',
  accentHover: '#EAB308',
  accentSoft: 'rgba(245,158,11,0.08)',
  accentGlow: '0 0 20px rgba(245,158,11,0.25)',
  accentText: '#FFFFFF',
  accentGradient: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
  border: 'rgba(255,255,255,0.06)',
  divider: 'rgba(255,255,255,0.06)',
  overlay: 'rgba(0,0,0,0.75)',
  sheetBg: '#131316',
  pillBg: 'rgba(255,255,255,0.05)',
  pillText: '#A1A1AA',
  pillActiveBg: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
  pillActiveText: '#FFFFFF',
  pillActiveShadow: '0 4px 16px rgba(245,158,11,0.35)',
  heroOverlay: 'linear-gradient(to bottom, rgba(9,9,11,0.05) 0%, rgba(9,9,11,0.4) 50%, rgba(9,9,11,0.97) 100%)',
  heroTextShadow: '0 2px 32px rgba(0,0,0,1)',
  heroFallbackBg: 'linear-gradient(135deg, #131316 0%, #09090B 100%)',
  heroGlow: 'radial-gradient(ellipse at 50% 80%, rgba(245,158,11,0.06) 0%, transparent 60%)',
  heroCtaBg: '#FFFFFF',
  heroCtaText: '#09090B',
  headerBg: 'rgba(9,9,11,0.82)',
  headerBorder: 'rgba(255,255,255,0.04)',
  barBg: 'rgba(9,9,11,0.82)',
  cartBarBg: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
  cartBarBorder: 'rgba(255,255,255,0.08)',
  cartBarShadow: '0 -4px 24px rgba(245,158,11,0.25), 0 0 0 1px rgba(255,255,255,0.06)',
  bottomNavBg: 'rgba(9,9,11,0.94)',
  bottomNavBorder: 'rgba(255,255,255,0.04)',
  bottomNavActiveColor: '#F59E0B',
  bottomNavInactiveColor: '#3F3F46',
  bottomNavIndicatorColor: 'linear-gradient(90deg, #F59E0B, #D97706)',
  addBtnBg: '#F59E0B',
  addBtnText: '#FFFFFF',
  addBtnShadow: '0 2px 10px rgba(245,158,11,0.35)',
  addBtnHoverShadow: '0 4px 20px rgba(245,158,11,0.5)',
  qtyBg: '#F59E0B',
  qtyText: '#FFFFFF',
  vegColor: '#22C55E',
  nonvegColor: '#EF4444',
  eggColor: '#FBBF24',
  openBg: 'rgba(34,197,94,0.1)',
  openText: '#22C55E',
  closedBg: 'rgba(239,68,68,0.1)',
  closedText: '#EF4444',
  soldOutOverlay: 'rgba(9,9,11,0.88)',
  soldOutText: '#52525B',
  soldOutBg: 'rgba(255,255,255,0.05)',
  searchBg: 'rgba(255,255,255,0.04)',
  searchBorder: 'rgba(255,255,255,0.06)',
  searchIcon: '#52525B',
  searchClearBg: 'rgba(255,255,255,0.06)',
  footerText: '#3F3F46',
  footerAccent: '#F59E0B',
  imagePlaceholder: 'linear-gradient(145deg, #18181B, #131316)',
  emptyStateIcon: '#27272A',
  bestsellerBg: 'rgba(245,158,11,0.15)',
  bestsellerText: '#FBBF24',
  bestsellerGlow: '0 0 12px rgba(251,191,36,0.2)',
  chefSpecialBg: 'rgba(168,85,247,0.15)',
  chefSpecialText: '#C4B5FD',
  imageOverlayGradient: 'linear-gradient(to bottom, transparent 50%, rgba(9,9,11,0.6) 100%)',
  skeletonBase: '#18181B',
  skeletonShine: '#27272A',
  bannerOverlay: 'linear-gradient(to bottom, transparent 20%, rgba(9,9,11,0.65) 100%)',
  bannerText: '#FFFFFF',
  stampFilledBg: 'linear-gradient(135deg, #F59E0B, #D97706)',
  stampFilledIcon: '#FFFFFF',
  stampEmptyBg: 'rgba(255,255,255,0.02)',
  stampEmptyBorder: 'rgba(255,255,255,0.06)',
  stampEmptyText: '#3F3F46',
  stampCardBg: '#131316',
  stampCardBorder: 'rgba(255,255,255,0.06)',
  sheetHeaderText: '#FAFAFA',
  sheetSubtext: '#A1A1AA',
  sheetItemBg: 'rgba(255,255,255,0.03)',
  sheetDivider: 'rgba(255,255,255,0.06)',
  sheetInputBg: 'rgba(255,255,255,0.03)',
  sheetInputFocusBorder: 'rgba(245,158,11,0.35)',
  sheetNoteText: '#A1A1AA',
  sheetTotalText: '#FAFAFA',
  sheetBtnText: '#FFFFFF',
  sheetErrorBg: 'rgba(239,68,68,0.08)',
  sheetErrorText: '#FCA5A5',
  sheetSuccessBg: 'rgba(34,197,94,0.08)',
  sheetSuccessIcon: '#22C55E',
  fabBg: '#F59E0B',
  fabShadow: '0 4px 24px rgba(245,158,11,0.35), 0 0 0 1px rgba(245,158,11,0.1)',
  fabBadgeBg: '#EF4444',
}

// ─── EMERALD GREEN (Fresh Organic) ───────────────────────────────
const emerald: MenuTheme = {
  bg: '#060D09',
  surface: '#0A1510',
  card: '#0D1A14',
  cardBorder: 'rgba(16,185,129,0.06)',
  cardShadow: '0 2px 8px rgba(0,0,0,0.4), 0 0 0 1px rgba(16,185,129,0.03)',
  cardHoverShadow: '0 16px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(16,185,129,0.08)',
  text: '#F0FDF4',
  textSub: '#86EFAC',
  textMuted: '#4ADE80',
  accent: '#10B981',
  accentEnd: '#059669',
  accentHover: '#34D399',
  accentSoft: 'rgba(16,185,129,0.08)',
  accentGlow: '0 0 20px rgba(16,185,129,0.25)',
  accentText: '#FFFFFF',
  accentGradient: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
  border: 'rgba(16,185,129,0.08)',
  divider: 'rgba(16,185,129,0.06)',
  overlay: 'rgba(6,13,9,0.8)',
  sheetBg: '#0D1A14',
  pillBg: 'rgba(16,185,129,0.06)',
  pillText: '#6EE7B7',
  pillActiveBg: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
  pillActiveText: '#FFFFFF',
  pillActiveShadow: '0 4px 16px rgba(16,185,129,0.3)',
  heroOverlay: 'linear-gradient(to bottom, rgba(6,13,9,0.05) 0%, rgba(6,13,9,0.4) 50%, rgba(6,13,9,0.97) 100%)',
  heroTextShadow: '0 2px 32px rgba(0,0,0,1)',
  heroFallbackBg: 'linear-gradient(135deg, #0D1A14 0%, #060D09 100%)',
  heroGlow: 'radial-gradient(ellipse at 50% 80%, rgba(16,185,129,0.06) 0%, transparent 60%)',
  heroCtaBg: '#FFFFFF',
  heroCtaText: '#060D09',
  headerBg: 'rgba(6,13,9,0.82)',
  headerBorder: 'rgba(16,185,129,0.06)',
  barBg: 'rgba(6,13,9,0.82)',
  cartBarBg: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
  cartBarBorder: 'rgba(16,185,129,0.1)',
  cartBarShadow: '0 -4px 24px rgba(16,185,129,0.2)',
  bottomNavBg: 'rgba(6,13,9,0.94)',
  bottomNavBorder: 'rgba(16,185,129,0.06)',
  bottomNavActiveColor: '#10B981',
  bottomNavInactiveColor: '#14532D',
  bottomNavIndicatorColor: 'linear-gradient(90deg, #10B981, #059669)',
  addBtnBg: '#10B981',
  addBtnText: '#FFFFFF',
  addBtnShadow: '0 2px 10px rgba(16,185,129,0.3)',
  addBtnHoverShadow: '0 4px 20px rgba(16,185,129,0.45)',
  qtyBg: '#10B981',
  qtyText: '#FFFFFF',
  vegColor: '#34D399',
  nonvegColor: '#F87171',
  eggColor: '#FBBF24',
  openBg: 'rgba(16,185,129,0.1)',
  openText: '#34D399',
  closedBg: 'rgba(248,113,113,0.08)',
  closedText: '#F87171',
  soldOutOverlay: 'rgba(6,13,9,0.88)',
  soldOutText: '#4ADE80',
  soldOutBg: 'rgba(16,185,129,0.04)',
  searchBg: 'rgba(16,185,129,0.04)',
  searchBorder: 'rgba(16,185,129,0.06)',
  searchIcon: '#4ADE80',
  searchClearBg: 'rgba(16,185,129,0.08)',
  footerText: '#14532D',
  footerAccent: '#10B981',
  imagePlaceholder: 'linear-gradient(145deg, #0D1A14, #0A1510)',
  emptyStateIcon: '#14532D',
  bestsellerBg: 'rgba(251,191,36,0.12)',
  bestsellerText: '#FDE68A',
  bestsellerGlow: '0 0 10px rgba(251,191,36,0.15)',
  chefSpecialBg: 'rgba(168,85,247,0.12)',
  chefSpecialText: '#C4B5FD',
  imageOverlayGradient: 'linear-gradient(to bottom, transparent 50%, rgba(6,13,9,0.6) 100%)',
  skeletonBase: '#0D1A14',
  skeletonShine: '#14532D',
  bannerOverlay: 'linear-gradient(to bottom, transparent 20%, rgba(6,13,9,0.65) 100%)',
  bannerText: '#FFFFFF',
  stampFilledBg: 'linear-gradient(135deg, #10B981, #059669)',
  stampFilledIcon: '#FFFFFF',
  stampEmptyBg: 'rgba(16,185,129,0.02)',
  stampEmptyBorder: 'rgba(16,185,129,0.08)',
  stampEmptyText: '#14532D',
  stampCardBg: '#0D1A14',
  stampCardBorder: 'rgba(16,185,129,0.08)',
  sheetHeaderText: '#F0FDF4',
  sheetSubtext: '#86EFAC',
  sheetItemBg: 'rgba(16,185,129,0.03)',
  sheetDivider: 'rgba(16,185,129,0.06)',
  sheetInputBg: 'rgba(16,185,129,0.03)',
  sheetInputFocusBorder: 'rgba(16,185,129,0.3)',
  sheetNoteText: '#86EFAC',
  sheetTotalText: '#F0FDF4',
  sheetBtnText: '#FFFFFF',
  sheetErrorBg: 'rgba(248,113,113,0.08)',
  sheetErrorText: '#FCA5A5',
  sheetSuccessBg: 'rgba(16,185,129,0.08)',
  sheetSuccessIcon: '#34D399',
  fabBg: '#10B981',
  fabShadow: '0 4px 24px rgba(16,185,129,0.35), 0 0 0 1px rgba(16,185,129,0.1)',
  fabBadgeBg: '#F87171',
}

// ─── SUNSET ORANGE (Warm Vibrant) ───────────────────────────────
const sunset: MenuTheme = {
  bg: '#0C0806',
  surface: '#14100D',
  card: '#181310',
  cardBorder: 'rgba(249,115,22,0.06)',
  cardShadow: '0 2px 8px rgba(0,0,0,0.4), 0 0 0 1px rgba(249,115,22,0.03)',
  cardHoverShadow: '0 16px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(249,115,22,0.08)',
  text: '#FFF7ED',
  textSub: '#FDBA74',
  textMuted: '#C2410C',
  accent: '#F97316',
  accentEnd: '#EA580C',
  accentHover: '#FB923C',
  accentSoft: 'rgba(249,115,22,0.08)',
  accentGlow: '0 0 20px rgba(249,115,22,0.3)',
  accentText: '#FFFFFF',
  accentGradient: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)',
  border: 'rgba(249,115,22,0.08)',
  divider: 'rgba(249,115,22,0.06)',
  overlay: 'rgba(12,8,6,0.8)',
  sheetBg: '#181310',
  pillBg: 'rgba(249,115,22,0.06)',
  pillText: '#FDBA74',
  pillActiveBg: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)',
  pillActiveText: '#FFFFFF',
  pillActiveShadow: '0 4px 16px rgba(249,115,22,0.35)',
  heroOverlay: 'linear-gradient(to bottom, rgba(12,8,6,0.05) 0%, rgba(12,8,6,0.4) 50%, rgba(12,8,6,0.97) 100%)',
  heroTextShadow: '0 2px 32px rgba(0,0,0,1)',
  heroFallbackBg: 'linear-gradient(135deg, #181310 0%, #0C0806 100%)',
  heroGlow: 'radial-gradient(ellipse at 50% 80%, rgba(249,115,22,0.06) 0%, transparent 60%)',
  heroCtaBg: '#FFFFFF',
  heroCtaText: '#0C0806',
  headerBg: 'rgba(12,8,6,0.82)',
  headerBorder: 'rgba(249,115,22,0.06)',
  barBg: 'rgba(12,8,6,0.82)',
  cartBarBg: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)',
  cartBarBorder: 'rgba(249,115,22,0.1)',
  cartBarShadow: '0 -4px 24px rgba(249,115,22,0.25)',
  bottomNavBg: 'rgba(12,8,6,0.94)',
  bottomNavBorder: 'rgba(249,115,22,0.06)',
  bottomNavActiveColor: '#F97316',
  bottomNavInactiveColor: '#431407',
  bottomNavIndicatorColor: 'linear-gradient(90deg, #F97316, #EA580C)',
  addBtnBg: '#F97316',
  addBtnText: '#FFFFFF',
  addBtnShadow: '0 2px 10px rgba(249,115,22,0.35)',
  addBtnHoverShadow: '0 4px 20px rgba(249,115,22,0.5)',
  qtyBg: '#F97316',
  qtyText: '#FFFFFF',
  vegColor: '#22C55E',
  nonvegColor: '#EF4444',
  eggColor: '#FBBF24',
  openBg: 'rgba(249,115,22,0.1)',
  openText: '#FB923C',
  closedBg: 'rgba(239,68,68,0.08)',
  closedText: '#EF4444',
  soldOutOverlay: 'rgba(12,8,6,0.88)',
  soldOutText: '#9A3412',
  soldOutBg: 'rgba(249,115,22,0.04)',
  searchBg: 'rgba(249,115,22,0.04)',
  searchBorder: 'rgba(249,115,22,0.06)',
  searchIcon: '#9A3412',
  searchClearBg: 'rgba(249,115,22,0.08)',
  footerText: '#431407',
  footerAccent: '#F97316',
  imagePlaceholder: 'linear-gradient(145deg, #1C1510, #181310)',
  emptyStateIcon: '#431407',
  bestsellerBg: 'rgba(251,191,36,0.12)',
  bestsellerText: '#FDE68A',
  bestsellerGlow: '0 0 10px rgba(251,191,36,0.15)',
  chefSpecialBg: 'rgba(168,85,247,0.12)',
  chefSpecialText: '#C4B5FD',
  imageOverlayGradient: 'linear-gradient(to bottom, transparent 50%, rgba(12,8,6,0.6) 100%)',
  skeletonBase: '#1C1510',
  skeletonShine: '#292018',
  bannerOverlay: 'linear-gradient(to bottom, transparent 20%, rgba(12,8,6,0.65) 100%)',
  bannerText: '#FFFFFF',
  stampFilledBg: 'linear-gradient(135deg, #F97316, #EA580C)',
  stampFilledIcon: '#FFFFFF',
  stampEmptyBg: 'rgba(249,115,22,0.02)',
  stampEmptyBorder: 'rgba(249,115,22,0.08)',
  stampEmptyText: '#431407',
  stampCardBg: '#181310',
  stampCardBorder: 'rgba(249,115,22,0.08)',
  sheetHeaderText: '#FFF7ED',
  sheetSubtext: '#FDBA74',
  sheetItemBg: 'rgba(249,115,22,0.03)',
  sheetDivider: 'rgba(249,115,22,0.06)',
  sheetInputBg: 'rgba(249,115,22,0.03)',
  sheetInputFocusBorder: 'rgba(249,115,22,0.35)',
  sheetNoteText: '#FDBA74',
  sheetTotalText: '#FFF7ED',
  sheetBtnText: '#FFFFFF',
  sheetErrorBg: 'rgba(239,68,68,0.08)',
  sheetErrorText: '#FCA5A5',
  sheetSuccessBg: 'rgba(249,115,22,0.08)',
  sheetSuccessIcon: '#FB923C',
  fabBg: '#F97316',
  fabShadow: '0 4px 24px rgba(249,115,22,0.35), 0 0 0 1px rgba(249,115,22,0.1)',
  fabBadgeBg: '#EF4444',
}

// ─── ROYAL PURPLE (Luxury Elegant) ───────────────────────────────
const royal: MenuTheme = {
  bg: '#08060F',
  surface: '#0E0B18',
  card: '#120F1E',
  cardBorder: 'rgba(168,85,247,0.06)',
  cardShadow: '0 2px 8px rgba(0,0,0,0.4), 0 0 0 1px rgba(168,85,247,0.03)',
  cardHoverShadow: '0 16px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(168,85,247,0.08)',
  text: '#FAF5FF',
  textSub: '#C4B5FD',
  textMuted: '#7C3AED',
  accent: '#A855F7',
  accentEnd: '#7C3AED',
  accentHover: '#C084FC',
  accentSoft: 'rgba(168,85,247,0.08)',
  accentGlow: '0 0 20px rgba(168,85,247,0.25)',
  accentText: '#FFFFFF',
  accentGradient: 'linear-gradient(135deg, #A855F7 0%, #7C3AED 100%)',
  border: 'rgba(168,85,247,0.08)',
  divider: 'rgba(168,85,247,0.06)',
  overlay: 'rgba(8,6,15,0.8)',
  sheetBg: '#120F1E',
  pillBg: 'rgba(168,85,247,0.06)',
  pillText: '#C4B5FD',
  pillActiveBg: 'linear-gradient(135deg, #A855F7 0%, #7C3AED 100%)',
  pillActiveText: '#FFFFFF',
  pillActiveShadow: '0 4px 16px rgba(168,85,247,0.3)',
  heroOverlay: 'linear-gradient(to bottom, rgba(8,6,15,0.05) 0%, rgba(8,6,15,0.4) 50%, rgba(8,6,15,0.97) 100%)',
  heroTextShadow: '0 2px 32px rgba(0,0,0,1)',
  heroFallbackBg: 'linear-gradient(135deg, #120F1E 0%, #08060F 100%)',
  heroGlow: 'radial-gradient(ellipse at 50% 80%, rgba(168,85,247,0.06) 0%, transparent 60%)',
  heroCtaBg: '#FFFFFF',
  heroCtaText: '#08060F',
  headerBg: 'rgba(8,6,15,0.82)',
  headerBorder: 'rgba(168,85,247,0.06)',
  barBg: 'rgba(8,6,15,0.82)',
  cartBarBg: 'linear-gradient(135deg, #A855F7 0%, #7C3AED 100%)',
  cartBarBorder: 'rgba(168,85,247,0.1)',
  cartBarShadow: '0 -4px 24px rgba(168,85,247,0.2)',
  bottomNavBg: 'rgba(8,6,15,0.94)',
  bottomNavBorder: 'rgba(168,85,247,0.06)',
  bottomNavActiveColor: '#A855F7',
  bottomNavInactiveColor: '#3B0764',
  bottomNavIndicatorColor: 'linear-gradient(90deg, #A855F7, #7C3AED)',
  addBtnBg: '#A855F7',
  addBtnText: '#FFFFFF',
  addBtnShadow: '0 2px 10px rgba(168,85,247,0.3)',
  addBtnHoverShadow: '0 4px 20px rgba(168,85,247,0.45)',
  qtyBg: '#A855F7',
  qtyText: '#FFFFFF',
  vegColor: '#34D399',
  nonvegColor: '#F87171',
  eggColor: '#FBBF24',
  openBg: 'rgba(168,85,247,0.1)',
  openText: '#C084FC',
  closedBg: 'rgba(248,113,113,0.08)',
  closedText: '#F87171',
  soldOutOverlay: 'rgba(8,6,15,0.88)',
  soldOutText: '#581C87',
  soldOutBg: 'rgba(168,85,247,0.04)',
  searchBg: 'rgba(168,85,247,0.04)',
  searchBorder: 'rgba(168,85,247,0.06)',
  searchIcon: '#581C87',
  searchClearBg: 'rgba(168,85,247,0.08)',
  footerText: '#3B0764',
  footerAccent: '#A855F7',
  imagePlaceholder: 'linear-gradient(145deg, #1A1528, #120F1E)',
  emptyStateIcon: '#3B0764',
  bestsellerBg: 'rgba(251,191,36,0.12)',
  bestsellerText: '#FDE68A',
  bestsellerGlow: '0 0 10px rgba(251,191,36,0.15)',
  chefSpecialBg: 'rgba(236,72,153,0.12)',
  chefSpecialText: '#F9A8D4',
  imageOverlayGradient: 'linear-gradient(to bottom, transparent 50%, rgba(8,6,15,0.6) 100%)',
  skeletonBase: '#1A1528',
  skeletonShine: '#251D38',
  bannerOverlay: 'linear-gradient(to bottom, transparent 20%, rgba(8,6,15,0.65) 100%)',
  bannerText: '#FFFFFF',
  stampFilledBg: 'linear-gradient(135deg, #A855F7, #7C3AED)',
  stampFilledIcon: '#FFFFFF',
  stampEmptyBg: 'rgba(168,85,247,0.02)',
  stampEmptyBorder: 'rgba(168,85,247,0.08)',
  stampEmptyText: '#3B0764',
  stampCardBg: '#120F1E',
  stampCardBorder: 'rgba(168,85,247,0.08)',
  sheetHeaderText: '#FAF5FF',
  sheetSubtext: '#C4B5FD',
  sheetItemBg: 'rgba(168,85,247,0.03)',
  sheetDivider: 'rgba(168,85,247,0.06)',
  sheetInputBg: 'rgba(168,85,247,0.03)',
  sheetInputFocusBorder: 'rgba(168,85,247,0.3)',
  sheetNoteText: '#C4B5FD',
  sheetTotalText: '#FAF5FF',
  sheetBtnText: '#FFFFFF',
  sheetErrorBg: 'rgba(248,113,113,0.08)',
  sheetErrorText: '#FCA5A5',
  sheetSuccessBg: 'rgba(168,85,247,0.08)',
  sheetSuccessIcon: '#C084FC',
  fabBg: '#A855F7',
  fabShadow: '0 4px 24px rgba(168,85,247,0.35), 0 0 0 1px rgba(168,85,247,0.1)',
  fabBadgeBg: '#F87171',
}

// ─── THEME MAP ──────────────────────────────────────────────────
const themes: Record<ThemeName, MenuTheme> = { dark, emerald, sunset, royal }

/** Get theme config by name, fallback to dark */
export function getTheme(name: string | null | undefined): MenuTheme {
  if (!name) return themes.dark
  return themes[name as ThemeName] || themes.dark
}

/** Get all theme names */
export function getThemeNames(): ThemeName[] {
  return Object.keys(themes) as ThemeName[]
}

/** Get theme label */
export function getThemeLabel(name: ThemeName): string {
  const labels: Record<ThemeName, string> = {
    dark: 'Dark Luxury',
    emerald: 'Emerald Green',
    sunset: 'Sunset Orange',
    royal: 'Royal Purple',
  }
  return labels[name]
}

/** Get theme accent color for CSS variable export */
export function getThemeCSSVars(theme: MenuTheme): Record<string, string> {
  return {
    '--menu-bg': theme.bg,
    '--menu-card': theme.card,
    '--menu-accent': theme.accent,
    '--menu-text': theme.text,
    '--menu-text-sub': theme.textSub,
    '--menu-text-muted': theme.textMuted,
    '--menu-border': theme.border,
    '--menu-pill-active': theme.pillActiveBg,
  }
}

export { themes }
export default themes
