import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { normalizeCouponCode, getCouponPlanDates } from "@/lib/coupons"
import bcrypt from "bcryptjs"
import { z } from "zod"

const schema = z
  .object({
    email:          z.string().email("Email inválido"),
    password:       z.string().min(8, "Senha deve ter no mínimo 8 caracteres"),
    name:           z.string().min(2, "Nome deve ter no mínimo 2 caracteres"),
    avatarUrl:      z.string().optional(),
    isStudent:      z.boolean().default(false),
    profession:     z.enum(["MEDICO", "NUTRICIONISTA", "FISIOTERAPEUTA", "FARMACEUTICO", "OUTRO"]).optional(),
    credentialType: z.enum(["CRM", "CRN", "CRO", "CREFITO", "OUTRO"]).optional(),
    credential:     z.string().optional(),
    couponCode:     z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (!data.isStudent) {
      if (!data.profession) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Selecione sua profissão", path: ["profession"] })
      }
      if (!data.credentialType) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Selecione o tipo de conselho", path: ["credentialType"] })
      }
      if (!data.credential?.trim()) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Número do conselho obrigatório", path: ["credential"] })
      }
    }
  })

export async function POST(request: NextRequest) {
  const body = await request.json()
  const parsed = schema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
  }

  const { email, password, name, isStudent, profession, credentialType, credential, avatarUrl, couponCode } = parsed.data

  let coupon = null as null | { id: string; code: string; plan: string; durationDays: number }
  const normalizedCouponCode = couponCode?.trim() ? normalizeCouponCode(couponCode) : null

  if (normalizedCouponCode) {
    coupon = await prisma.coupon.findFirst({
      where: { code: normalizedCouponCode, isActive: true },
      select: { id: true, code: true, plan: true, durationDays: true },
    })

    if (!coupon) {
      return NextResponse.json({ error: "Cupom invÃ¡lido ou inativo" }, { status: 400 })
    }
  }

  const existing = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    select: { id: true },
  })

  if (existing) {
    return NextResponse.json({ error: "Este email já está em uso" }, { status: 409 })
  }

  const hashed = await bcrypt.hash(password, 12)
  const couponPlanDates = coupon ? getCouponPlanDates(coupon.durationDays) : null
  const user = await prisma.user.create({
    data: {
      email:          email.toLowerCase(),
      password:       hashed,
      name,
      isStudent,
      profession:     isStudent ? null : (profession ?? null),
      credentialType: isStudent ? null : (credentialType ?? null),
      credential:     isStudent ? null : (credential ?? null),
      avatarUrl:      avatarUrl ?? null,
      isApproved:     false,
      isSubscribed:   Boolean(coupon),
      plan:           coupon?.plan ?? "free",
      planStartDate:  couponPlanDates?.now ?? null,
      planEndDate:    couponPlanDates?.planEndDate ?? null,
      chatRequestsResetAt: couponPlanDates?.planEndDate ?? null,
      coupon:         coupon ? { connect: { id: coupon.id } } : undefined,
    },
    select: { id: true, email: true, name: true, createdAt: true },
  })

  return NextResponse.json({
    ...user,
    couponApplied: Boolean(coupon),
    couponPlan: coupon?.plan ?? null,
  }, { status: 201 })
}
