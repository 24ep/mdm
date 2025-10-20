import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google"
import { query } from "@/lib/db"
import bcrypt from "bcryptjs"

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  // Remove adapter for now - we'll handle user creation manually
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        name: { label: "Name", type: "text" }
      },
      async authorize(credentials) {
        console.log('🔐 NextAuth authorize called with:', { email: credentials?.email, hasPassword: !!credentials?.password })
        
        if (!credentials?.email || !credentials?.password) {
          console.log('❌ Missing credentials')
          return null
        }

        try {
          // Query user via Postgres
          console.log('🔍 Querying user from database...')
          const { rows } = await query<any>(
            'SELECT id, email, name, password, role FROM public.users WHERE email = $1 LIMIT 1',
            [credentials.email]
          )

          const user = rows[0]
          console.log('👤 User found:', user ? { id: user.id, email: user.email, name: user.name, role: user.role, hasPassword: !!user.password } : 'No user found')

          if (!user || !user.password) {
            console.log('❌ No user or password found')
            return null
          }

          console.log('🔐 Verifying password...')
          const isPasswordValid = await bcrypt.compare(credentials.password, user.password)
          console.log('🔐 Password valid:', isPasswordValid)

          if (!isPasswordValid) {
            console.log('❌ Invalid password')
            return null
          }

          console.log('✅ Authentication successful!')
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          }
        } catch (error) {
          console.error('❌ Authorization error:', error)
          return null
        }
      }
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    })
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub!
        session.user.role = token.role as string
      }
      return session
    },
  },
  pages: {
    signIn: "/auth/signin",
  },
}
