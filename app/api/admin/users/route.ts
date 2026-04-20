import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import type { Prisma } from "@/lib/generated/prisma"

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 })
  }

  const { searchParams } = request.nextUrl
  const search   = searchParams.get("search") ?? ""
  const plan     = searchParams.get("plan") ?? "all"
  const approval = searchParams.get("approval") ?? "all"
  const payment  = searchParams.get("payment") ?? "all"

  const where: Prisma.UserWhereInput = {
    isAdmin: false,
    ...(search ? {
      OR: [
        { name:  { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ],
    } : {}),
    ...(plan !== "all" ? { plan } : {}),
    ...(approval === "pending"  ? { isApproved: false } : {}),
    ...(approval === "approved" ? { isApproved: true }  : {}),
  }

  const users = await prisma.user.findMany({
    where,
    select: {
      id: true,
      name: true,
      email: true,
      isAdmin: true,
      isSubscribed: true,
      isApproved: true,
      plan: true,
      planStartDate: true,
      planEndDate: true,
      profession: true,
      credentialType: true,
      credential: true,
      chatRequestsUsed: true,
      createdAt: true,
      payments: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { id: true, status: true, planId: true, amountCents: true, createdAt: true },
      },
      _count: { select: { patients: true, chatSessions: true } },
    },
    orderBy: { createdAt: "desc" },
  })

  const filtered = payment === "all"
    ? users
    : users.filter((u) => (u.payments[0]?.status ?? "none") === payment)

  return NextResponse.json(filtered)
}
