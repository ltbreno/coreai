import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  const { id } = await params
  const patient = await prisma.patient.findFirst({
    where: { id, userId: session.user.id },
    include: {
      chatSessions: {
        orderBy: { createdAt: "desc" },
        select: { id: true, title: true, createdAt: true, updatedAt: true },
      },
    },
  })
  if (!patient) return NextResponse.json({ error: "Paciente não encontrado" }, { status: 404 })

  return NextResponse.json(patient)
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  const { id } = await params
  const existing = await prisma.patient.findFirst({
    where: { id, userId: session.user.id },
  })
  if (!existing) return NextResponse.json({ error: "Paciente não encontrado" }, { status: 404 })

  const body = await request.json()
  const updated = await prisma.patient.update({ where: { id }, data: body })
  return NextResponse.json(updated)
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  const { id } = await params
  const existing = await prisma.patient.findFirst({
    where: { id, userId: session.user.id },
  })
  if (!existing) return NextResponse.json({ error: "Paciente não encontrado" }, { status: 404 })

  await prisma.patient.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
