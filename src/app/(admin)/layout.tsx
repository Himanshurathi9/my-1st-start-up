import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import AdminTopNavClient from './AdminTopNavClient'
import AdminProviders from './AdminProviders'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/login')
  }

  const userRole = (session.user as { role: string }).role
  if (userRole !== 'ADMIN') {
    redirect('/dashboard')
  }

  return (
    <AdminProviders session={session}>
      <div className="min-h-screen" style={{ background: '#0A0A0A' }}>
        <AdminTopNavClient />
        <main className="px-4 md:px-8 pb-10 md:pb-10" style={{ paddingTop: '72px', maxWidth: '1200px', margin: '0 auto' }}>
          {children}
        </main>
      </div>
    </AdminProviders>
  )
}
