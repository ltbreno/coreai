import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const ABACATE_BASE_V2 = "https://api.abacatepay.com/v2"

const PLAN_PRODUCTS: Record<string, string> = {
  essencial:    "prod_UsRYUWNRH5NSw13gedn4gSkD",
  profissional: "prod_C5DwkznXLEJFGQ0tcZppMFbh",
  premium:      "prod_YWTE2Z2C0MmBH3eHZTtDm6MK",
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
  }

  const { planId, taxId } = await request.json() as { planId: string; taxId: string }

  const productId = PLAN_PRODUCTS[planId]
  if (!productId) {
    return NextResponse.json({ error: "Plano inválido" }, { status: 400 })
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, email: true, abacateCustomerId: true },
  })
  if (!user) {
    return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 })
  }

  const apiKey = process.env.ABACATE_PAY_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: "Chave não configurada" }, { status: 500 })
  }

  let customerId = user.abacateCustomerId

  if (!customerId) {
    const custRes = await fetch(`${ABACATE_BASE_V2}/customers/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        email: user.email,
        name: user.name ?? user.email,
        taxId,
      }),
    })

    if (!custRes.ok) {
      const err = await custRes.text()
      console.error("Abacate Pay customer error:", err)
      return NextResponse.json({ error: err }, { status: 502 })
    }

    const custJson = await custRes.json()
    customerId = custJson.data.id as string

    await prisma.user.update({
      where: { id: session.user.id },
      data: { abacateCustomerId: customerId },
    })
  }

  const subRes = await fetch(`${ABACATE_BASE_V2}/subscriptions/create`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      items: [{ id: productId, quantity: 1 }],
      customerId,
      methods: ["CARD"],
    }),
  })

  if (!subRes.ok) {
    const err = await subRes.text()
    console.error("Abacate Pay subscription error:", err)
    return NextResponse.json({ error: err }, { status: 502 })
  }

  const subJson = await subRes.json()
  const url: string = subJson.data?.url

  return NextResponse.json({ url })
}
