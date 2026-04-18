import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  const { id } = await params
  const chatSession = await prisma.chatSession.findFirst({
    where: { id, userId: session.user.id },
  })
  if (!chatSession) return NextResponse.json({ error: "Sessão não encontrada" }, { status: 404 })

  const { userContent, assistantContent, followUps } = await request.json()

  const [userMsg, assistantMsg] = await prisma.$transaction([
    prisma.message.create({
      data: { sessionId: id, role: "user", content: userContent, followUps: [] },
    }),
    prisma.message.create({
      data: {
        sessionId: id,
        role: "assistant",
        content: assistantContent,
        followUps: followUps ?? [],
      },
    }),
  ])

  if (!chatSession.title) {
    const title = (userContent as string).slice(0, 60) + (userContent.length > 60 ? "..." : "")
    await prisma.chatSession.update({ where: { id }, data: { title, updatedAt: new Date() } })
  } else {
    await prisma.chatSession.update({ where: { id }, data: { updatedAt: new Date() } })
  }

  return NextResponse.json({ userMsg, assistantMsg }, { status: 201 })
}
