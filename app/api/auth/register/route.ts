import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { z } from "zod"

const schema = z.object({
  email:          z.string().email("Email inválido"),
  password:       z.string().min(8, "Senha deve ter no mínimo 8 caracteres"),
  name:           z.string().min(2, "Nome deve ter no mínimo 2 caracteres"),
  profession:     z.enum(["MEDICO", "NUTRICIONISTA", "FISIOTERAPEUTA", "FARMACEUTICO", "OUTRO"]),
  credentialType: z.enum(["CRM", "CRN", "CRO", "CREFITO", "OUTRO"]),
  credential:     z.string().min(1, "Número do conselho obrigatório"),
  avatarUrl:      z.string().optional(),
})

export async function POST(request: NextRequest) {
  const body = await request.json()
  const parsed = schema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
  }

  const { email, password, name, profession, credentialType, credential, avatarUrl } = parsed.data

  const existing = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    select: { id: true },
  })

  if (existing) {
    return NextResponse.json({ error: "Este email já está em uso" }, { status: 409 })
  }

  const hashed = await bcrypt.hash(password, 12)
  const user = await prisma.user.create({
    data: {
      email: email.toLowerCase(),
      password: hashed,
      name,
      profession,
      credentialType,
      credential,
      avatarUrl: avatarUrl ?? null,
      isApproved: false,
      plan: "free",
    },
    select: { id: true, email: true, name: true, createdAt: true },
  })

  return NextResponse.json(user, { status: 201 })
}
