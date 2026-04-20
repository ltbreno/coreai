import "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      email: string
      name?: string | null
      avatarUrl?: string | null
      isAdmin: boolean
      isSubscribed: boolean
      isApproved: boolean
      plan: string
    }
  }

  interface User {
    id: string
    isAdmin?: boolean
    isSubscribed?: boolean
    isApproved?: boolean
    plan?: string
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    isAdmin: boolean
    isSubscribed: boolean
    isApproved: boolean
    plan: string
  }
}
