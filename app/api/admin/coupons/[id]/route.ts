import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { z } from "zod"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const updateCouponSchema = z.object({
  isActive: z.boolean().optional(),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "NÃ£o autorizado" }, { status: 403 })
  }

  const body = await request.json()
  const parsed = updateCouponSchema.safeParse(body)

  if (!parsed.success || typeof parsed.data.isActive !== "boolean") {
    return NextResponse.json({ error: "Nenhum campo para atualizar" }, { status: 400 })
  }

  const { id } = await params

  const coupon = await prisma.coupon.update({
    where: { id },
    data: { isActive: parsed.data.isActive },
    select: {
      id: true,
      code: true,
      plan: true,
      durationDays: true,
      isActive: true,
      createdAt: true,
      _count: { select: { users: true } },
    },
  })

  return NextResponse.json(coupon)
}
