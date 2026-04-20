import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const ABACATE_BASE = "https://api.abacatepay.com/v1"

const PLAN_DETAILS: Record<string, { name: string; amountCents: number }> = {
  essencial:    { name: "ESSENCIAL",    amountCents: 2990 },
  profissional: { name: "PROFISSIONAL", amountCents: 5990 },
  premium:      { name: "PREMIUM",      amountCents: 8990 },
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  const { planId, userId: bodyUserId } = await request.json() as { planId: string; userId?: string }

  const resolvedUserId = session?.user?.id ?? bodyUserId
  if (!resolvedUserId) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
  }

  const plan = PLAN_DETAILS[planId]
  if (!plan) {
    return NextResponse.json({ error: "Plano inválido" }, { status: 400 })
  }

  const user = await prisma.user.findUnique({
    where: { id: resolvedUserId },
    select: { name: true, email: true },
  })
  if (!user) {
    return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 })
  }

  const apiKey = process.env.ABACATE_PAY_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: "Chave Abacate Pay não configurada" }, { status: 500 })
  }

  const payment = await prisma.payment.create({
    data: {
      userId: resolvedUserId,
      planId,
      amountCents: plan.amountCents,
      status: "pending",
      method: "PIX",
    },
  })

  const body = {
    amount: plan.amountCents,
    expiresIn: 3600,
    description: `CoreAI – Plano ${plan.name}`,
    metadata: {
      externalId: `${resolvedUserId}|${planId}|${payment.id}`,
    },
  }

  const res = await fetch(`${ABACATE_BASE}/pixQrCode/create`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const err = await res.text()
    console.error("Abacate Pay error:", err)
    await prisma.payment.delete({ where: { id: payment.id } })
    return NextResponse.json({ error: err }, { status: 502 })
  }

  const json = await res.json()
  const data = json.data

  await prisma.payment.update({
    where: { id: payment.id },
    data: { transparentId: data.id },
  })

  return NextResponse.json({
    paymentId: payment.id,
    transparentId: data.id,
    brCode: data.brCode,
    brCodeBase64: data.brCodeBase64 ?? null,
  })
}
