import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  const sessions = await prisma.chatSession.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      title: true,
      createdAt: true,
      updatedAt: true,
      patient: { select: { id: true, name: true } },
    },
  })
  return NextResponse.json(sessions)
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  const body = await request.json().catch(() => ({}))
  const { patientId } = body

  if (patientId) {
    const patient = await prisma.patient.findFirst({
      where: { id: patientId, userId: session.user.id },
    })
    if (!patient) return NextResponse.json({ error: "Paciente não encontrado" }, { status: 404 })
  }

  const chatSession = await prisma.chatSession.create({
    data: { userId: session.user.id, patientId: patientId ?? null },
  })
  return NextResponse.json(chatSession, { status: 201 })
}
