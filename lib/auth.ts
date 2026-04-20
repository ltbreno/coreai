import type { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

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
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        // Re-fetch from DB so useSession().update() reflects subscription changes
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { isAdmin: true, isSubscribed: true, isApproved: true, plan: true },
        })
        session.user.id = token.id as string
        session.user.isAdmin = dbUser?.isAdmin ?? false
        session.user.isSubscribed = dbUser?.isSubscribed ?? false
        session.user.isApproved = dbUser?.isApproved ?? false
        session.user.plan = dbUser?.plan ?? "free"
      }
      return session
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
}
