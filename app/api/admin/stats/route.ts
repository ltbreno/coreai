import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 })
  }

  const [pendingApprovals, totalUsers, subscribedUsers, usageAgg] = await Promise.all([
    prisma.user.count({ where: { isApproved: false, isAdmin: false } }),
    prisma.user.count({ where: { isAdmin: false } }),
    prisma.user.count({ where: { isSubscribed: true } }),
    prisma.user.aggregate({ _sum: { chatRequestsUsed: true } }),
  ])

  return NextResponse.json({
    pendingApprovals,
    totalUsers,
    subscribedUsers,
    totalRequests: usageAgg._sum.chatRequestsUsed ?? 0,
  })
}
