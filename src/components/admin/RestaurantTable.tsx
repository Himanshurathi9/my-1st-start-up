// RestaurantTable — Premium iOS-level admin table component
// Used in admin panel for restaurant management views
// All colors follow the MenuMate Design System v2

interface RestaurantTableProps {
  restaurants: Array<{
    id: string
    name: string
    slug: string
    owner_email: string
    plan: 'BASIC' | 'PRO'
    plan_expiry_date: string | null
    is_open: boolean
    menu_items_count: number
    tables_count: number
  }>
  onExtend: (restaurant: { id: string; name: string; plan: string; plan_expiry_date: string | null }) => void
  onChangePlan: (restaurant: { id: string; name: string; plan: string }) => void
}

export default function RestaurantTable({ restaurants, onExtend, onChangePlan }: RestaurantTableProps) {
  if (restaurants.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-6">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
          style={{ background: '#F4F2EE' }}
        >
          <span className="text-lg" style={{ color: '#9E9E94' }}>🍽️</span>
        </div>
        <p className="text-sm" style={{ color: '#6B6B63' }}>No restaurants to display</p>
      </div>
    )
  }

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr
            className="border-b"
            style={{ borderColor: '#E5E3DF' }}
          >
            <th
              className="text-[11px] font-semibold uppercase pb-3 pr-4"
              style={{ letterSpacing: '0.08em', color: '#9E9E94' }}
            >
              Restaurant
            </th>
            <th
              className="text-[11px] font-semibold uppercase pb-3 pr-4"
              style={{ letterSpacing: '0.08em', color: '#9E9E94' }}
            >
              Plan
            </th>
            <th
              className="text-[11px] font-semibold uppercase pb-3 pr-4 hidden sm:table-cell"
              style={{ letterSpacing: '0.08em', color: '#9E9E94' }}
            >
              Status
            </th>
            <th
              className="text-[11px] font-semibold uppercase pb-3 pr-4 hidden md:table-cell"
              style={{ letterSpacing: '0.08em', color: '#9E9E94' }}
            >
              Expiry
            </th>
            <th
              className="text-[11px] font-semibold uppercase pb-3 text-right"
              style={{ letterSpacing: '0.08em', color: '#9E9E94' }}
            >
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {restaurants.map((r) => {
            const isExpired = r.plan_expiry_date && new Date(r.plan_expiry_date) < new Date()
            const isExpiring = r.plan_expiry_date && !isExpired && (() => {
              const days = Math.ceil((new Date(r.plan_expiry_date!).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
              return days <= 7
            })()

            let statusColor = '#22C55E'
            let statusBg = '#F0FFF4'
            let statusLabel = 'Active'

            if (isExpired) {
              statusColor = '#EF4444'
              statusBg = '#FEF2F2'
              statusLabel = 'Expired'
            } else if (isExpiring) {
              statusColor = '#F59E0B'
              statusBg = '#FFFBEB'
              statusLabel = 'Expiring'
            }

            return (
              <tr
                key={r.id}
                className="border-b transition-colors duration-150"
                style={{ borderColor: '#F0EEEA' }}
              >
                <td className="py-3.5 pr-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ background: '#F4F2EE' }}
                    >
                      <span className="text-[13px] font-bold" style={{ color: '#9E9E94' }}>
                        {r.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-[14px] font-semibold tracking-tight truncate" style={{ color: '#1A1A18' }}>
                        {r.name}
                      </p>
                      <p className="text-[12px] truncate" style={{ color: '#6B6B63' }}>
                        {r.owner_email}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="py-3.5 pr-4">
                  <span
                    className="badge"
                    style={r.plan === 'PRO'
                      ? { background: 'linear-gradient(135deg, #1A1A18, #2A2A28)', color: '#FFFFFF' }
                      : { background: '#F4F2EE', color: '#6B6B63' }
                    }
                  >
                    {r.plan}
                  </span>
                </td>
                <td className="py-3.5 pr-4 hidden sm:table-cell">
                  <span className="badge" style={{ background: statusBg, color: statusColor }}>
                    {statusLabel}
                  </span>
                </td>
                <td className="py-3.5 pr-4 hidden md:table-cell">
                  <span className="text-[13px]" style={{ fontFamily: 'var(--font-mono)', color: '#6B6B63' }}>
                    {r.plan_expiry_date
                      ? new Date(r.plan_expiry_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                      : '—'
                    }
                  </span>
                </td>
                <td className="py-3.5 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      onClick={() => onExtend(r)}
                      className="text-[12px] font-semibold px-3 py-1.5 rounded-[9999px] min-h-[36px] transition-all animate-btn-press"
                      style={{ background: '#FF6B2B', color: '#FFFFFF' }}
                    >
                      Extend
                    </button>
                    <button
                      onClick={() => onChangePlan(r)}
                      className="text-[12px] font-semibold px-3 py-1.5 rounded-[10px] min-h-[36px] transition-all animate-btn-press"
                      style={{ background: '#F4F2EE', color: '#1A1A18' }}
                    >
                      Plan
                    </button>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
