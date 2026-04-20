import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import type { Prisma } from "@/lib/generated/prisma"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 })
  }

  const { id } = await params
  const body = await request.json() as {
    isAdmin?: boolean
    isSubscribed?: boolean
    isApproved?: boolean
    plan?: string
    planStartDate?: string
    planEndDate?: string
  }

  const data: Prisma.UserUpdateInput = {}
  if (typeof body.isAdmin      === "boolean") data.isAdmin      = body.isAdmin
  if (typeof body.isSubscribed === "boolean") data.isSubscribed = body.isSubscribed
  if (typeof body.isApproved   === "boolean") data.isApproved   = body.isApproved
  if (typeof body.plan         === "string")  data.plan         = body.plan
  if (body.planStartDate) data.planStartDate = new Date(body.planStartDate)
  if (body.planEndDate)   data.planEndDate   = new Date(body.planEndDate)

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Nenhum campo para atualizar" }, { status: 400 })
  }

  const user = await prisma.user.update({
    where: { id },
    data,
    select: {
      id: true, name: true, email: true,
      isAdmin: true, isSubscribed: true, isApproved: true,
      plan: true, planStartDate: true, planEndDate: true,
      profession: true, credentialType: true, credential: true,
      chatRequestsUsed: true,
    },
  })

  return NextResponse.json(user)
}
