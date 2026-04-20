import { NextRequest, NextResponse } from "next/server"
import crypto from "node:crypto"
import { prisma } from "@/lib/prisma"

const WEBHOOK_SECRET = process.env.ABACATE_PAY_WEBHOOK_SECRET ?? ""

function verifySignature(rawBody: string, signatureHeader: string | null): boolean {
  if (!signatureHeader || !WEBHOOK_SECRET) return false
  const expected = crypto
    .createHmac("sha256", WEBHOOK_SECRET)
    .update(Buffer.from(rawBody, "utf8"))
    .digest("base64")
  const a = Buffer.from(expected)
  const b = Buffer.from(signatureHeader)
  return a.length === b.length && crypto.timingSafeEqual(a, b)
}

export async function POST(request: NextRequest) {
  const urlSecret = request.nextUrl.searchParams.get("webhookSecret")
  if (urlSecret !== process.env.ABACATE_PAY_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  const rawBody = await request.text()

  const signature = request.headers.get("x-webhook-signature")
  if (!verifySignature(rawBody, signature)) {
    return NextResponse.json({ error: "Assinatura inválida" }, { status: 401 })
  }

  let payload: { event?: string; data?: Record<string, unknown> }
  try {
    payload = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: "Payload inválido" }, { status: 400 })
  }

  if (payload.event !== "pixQrCode.paid") {
    return NextResponse.json({ ok: true })
  }

  const externalId = (payload.data as { metadata?: { externalId?: string } })
    ?.metadata?.externalId

  if (!externalId || !externalId.includes("|")) {
    return NextResponse.json({ error: "Metadados ausentes" }, { status: 400 })
  }

  const parts = externalId.split("|")
  const userId = parts[0]
  const planId = parts[1]
  const paymentId = parts[2]

  const now = new Date()
  const planEndDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

  const updates: Promise<unknown>[] = [
    prisma.user.update({
      where: { id: userId },
      data: {
        isSubscribed: true,
        plan: planId,
        planStartDate: now,
        planEndDate,
        chatRequestsResetAt: planEndDate,
      },
    }),
  ]

  if (paymentId) {
    updates.push(
      prisma.payment.update({
        where: { id: paymentId },
        data: { status: "completed" },
      })
    )
  }

  await Promise.all(updates)

  return NextResponse.json({ ok: true })
}
