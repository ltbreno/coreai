import type { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

const authSecret = process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase() },
        })
        if (!user) return null

        const match = await bcrypt.compare(credentials.password, user.password)
        if (!match) return null

        return {
          id: user.id,
          email: user.email,
          name: user.name ?? null,
          isAdmin: user.isAdmin,
          isSubscribed: user.isSubscribed,
          isApproved: user.isApproved,
          plan: user.plan,
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.isAdmin = (user as { isAdmin?: boolean }).isAdmin ?? false
        token.isSubscribed = (user as { isSubscribed?: boolean }).isSubscribed ?? false
        token.isApproved = (user as { isApproved?: boolean }).isApproved ?? false
        token.plan = (user as { plan?: string }).plan ?? "free"
        token.avatarUrl = (user as { avatarUrl?: string | null }).avatarUrl ?? null
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
        session.user.isAdmin = (token.isAdmin as boolean) ?? false
        session.user.isSubscribed = (token.isSubscribed as boolean) ?? false
        session.user.isApproved = (token.isApproved as boolean) ?? false
        session.user.plan = (token.plan as string) ?? "free"
        session.user.avatarUrl = null

        // Re-fetch from DB to reflect latest subscription/approval changes
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.id as string },
            select: { isAdmin: true, isSubscribed: true, isApproved: true, plan: true, avatarUrl: true },
          })
          if (dbUser) {
            session.user.isAdmin = dbUser.isAdmin
            session.user.isSubscribed = dbUser.isSubscribed
            session.user.isApproved = dbUser.isApproved
            session.user.plan = dbUser.plan ?? "free"
            session.user.avatarUrl = dbUser.avatarUrl ?? null
          }
        } catch {
          // DB unavailable — keep values from JWT token
        }
      }
      return session
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  secret: authSecret,
}
