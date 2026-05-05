import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { env } from './env'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Invalid email or password')
        }

        const { data: user, error } = await supabaseAdmin.client
          .from('users')
          .select('id, email, password_hash, role')
          .eq('email', credentials.email.toLowerCase().trim())
          .single()

        if (error || !user) {
          throw new Error('Invalid email or password')
        }

        // Detect obviously broken password hashes (e.g. placeholder text)
        if (!user.password_hash || user.password_hash.length < 20) {
          console.error(`[auth] Broken password_hash for ${user.email}: length=${user.password_hash?.length || 0}`)
          throw new Error('Account setup incomplete. Please contact support.')
        }

        const isValid = await bcrypt.compare(credentials.password, user.password_hash)
        if (!isValid) {
          throw new Error('Invalid email or password')
        }

        return {
          id: user.id,
          email: user.email,
          role: user.role,
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        // Validate role is a known value before storing in JWT
        const role = (user as { role: string }).role
        if (typeof role === 'string' && ['ADMIN', 'OWNER'].includes(role)) {
          token.role = role
        }
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { id: string }).id = token.id as string
        // Only set role if it's a known value
        const role = token.role as string | undefined
        if (typeof role === 'string' && ['ADMIN', 'OWNER'].includes(role)) {
          ;(session.user as { role: string }).role = role
        }
      }
      return session
    },
  },
  secret: env.NEXTAUTH_SECRET,
}
