import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { z } from "zod"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { normalizeCouponCode } from "@/lib/coupons"

const createCouponSchema = z.object({
  code: z.string().min(3, "Cupom deve ter no mÃ­nimo 3 caracteres"),
  plan: z.enum(["essencial", "profissional", "premium"]).default("premium"),
  durationDays: z.number().int().min(1, "DuraÃ§Ã£o invÃ¡lida").max(365, "DuraÃ§Ã£o invÃ¡lida").default(30),
})

async function ensureAdmin() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "NÃ£o autorizado" }, { status: 403 })
  }

  return null
}

export async function GET() {
  const unauthorized = await ensureAdmin()
  if (unauthorized) return unauthorized

  const coupons = await prisma.coupon.findMany({
    select: {
      id: true,
      code: true,
      plan: true,
      durationDays: true,
      isActive: true,
      createdAt: true,
      _count: { select: { users: true } },
    },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json(coupons)
}

export async function POST(request: NextRequest) {
  const unauthorized = await ensureAdmin()
  if (unauthorized) return unauthorized

  const body = await request.json()
  const parsed = createCouponSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
  }

  const code = normalizeCouponCode(parsed.data.code)

  const existing = await prisma.coupon.findUnique({
    where: { code },
    select: { id: true },
  })

  if (existing) {
    return NextResponse.json({ error: "JÃ¡ existe um cupom com esse cÃ³digo" }, { status: 409 })
  }

  const coupon = await prisma.coupon.create({
    data: {
      code,
      plan: parsed.data.plan,
      durationDays: parsed.data.durationDays,
    },
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

  return NextResponse.json(coupon, { status: 201 })
}
