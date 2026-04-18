"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, MessageSquare, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface ChatSession {
  id: string
  title: string | null
  createdAt: string
  updatedAt: string
}

interface Patient {
  id: string
  name: string
  idade: number
  sexo: string
  alergias: string[]
  remedios: string[]
  createdAt: string
  updatedAt: string
  chatSessions: ChatSession[]
}

export default function FichaPacientePage() {
  const params = useParams()
  const router = useRouter()
  const [patient, setPatient] = useState<Patient | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/patients/${params.id}`)
      .then((r) => {
        if (!r.ok) throw new Error()
        return r.json()
      })
      .then(setPatient)
      .catch(() => router.push("/pacientes"))
      .finally(() => setLoading(false))
  }, [params.id, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!patient) return null

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="mx-auto max-w-4xl px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/pacientes"
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="text-sm">Pacientes</span>
            </Link>
            <div className="h-4 w-px bg-border" />
            <h1 className="font-semibold truncate">{patient.name}</h1>
          </div>
          <Link href={`/chat`}>
            <Button size="sm" className="gap-1.5">
              <MessageSquare className="h-4 w-4" />
              Nova consulta
            </Button>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8 space-y-6">
        {/* Dados do paciente */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Dados do paciente</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Nome</p>
              <p className="font-medium">{patient.name}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Idade</p>
              <p className="font-medium">{patient.idade} anos</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Sexo</p>
              <p className="font-medium">{patient.sexo === "M" ? "Masculino" : "Feminino"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Cadastrado em</p>
              <p className="font-medium text-sm">
                {format(new Date(patient.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Atualizado em</p>
              <p className="font-medium text-sm">
                {format(new Date(patient.updatedAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Alergias */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Alergias</CardTitle>
          </CardHeader>
          <CardContent>
            {patient.alergias.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma alergia registrada</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {patient.alergias.map((a) => (
                  <span key={a} className="bg-destructive/10 text-destructive rounded-full px-3 py-1 text-sm font-medium">
                    {a}
                  </span>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Medicamentos */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Medicamentos em uso</CardTitle>
          </CardHeader>
          <CardContent>
            {patient.remedios.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum medicamento registrado</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {patient.remedios.map((r) => (
                  <span key={r} className="bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-full px-3 py-1 text-sm font-medium">
                    {r}
                  </span>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Histórico de consultas */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Histórico de consultas</CardTitle>
          </CardHeader>
          <CardContent>
            {patient.chatSessions.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-sm text-muted-foreground mb-3">
                  Nenhuma consulta registrada para este paciente
                </p>
                <Link href="/chat">
                  <Button size="sm" variant="outline" className="gap-1.5">
                    <MessageSquare className="h-3.5 w-3.5" />
                    Iniciar consulta
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {patient.chatSessions.map((s) => (
                  <div key={s.id} className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <MessageSquare className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="text-sm truncate">{s.title ?? "Consulta sem título"}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(s.createdAt), "dd/MM/yyyy", { locale: ptBR })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
