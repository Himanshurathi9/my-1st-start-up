import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { Toaster } from 'react-hot-toast'
import BottomNav from '@/components/dashboard/BottomNav'
import DashboardNotificationWrapper from '@/components/dashboard/DashboardNotificationWrapper'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/login')
  }

  const userRole = (session.user as { role: string }).role
  if (userRole === 'ADMIN') {
    redirect('/admin')
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--dash-bg)' }}>
      <main style={{ paddingBottom: '100px' }}>
        {children}
      </main>
      <DashboardNotificationWrapper />
      <BottomNav />
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: '#1a1a1a',
            color: '#ffffff',
            borderRadius: '12px',
            fontSize: '14px',
            border: '1px solid rgba(255,255,255,0.08)',
          },
        }}
      />
    </div>
  )
}
