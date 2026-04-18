"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Plus, User, ArrowLeft, Trash2, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { CreatePatientModal } from "@/components/patients/CreatePatientModal"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface Patient {
  id: string
  name: string
  idade: number
  sexo: string
  alergias: string[]
  remedios: string[]
  createdAt: string
}

export default function PacientesPage() {
  const router = useRouter()
  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  async function loadPatients() {
    const res = await fetch("/api/patients")
    if (res.ok) {
      const data = await res.json()
      setPatients(data)
    }
    setLoading(false)
  }

  useEffect(() => {
    loadPatients()
  }, [])

  async function deletePatient(id: string) {
    if (!confirm("Tem certeza que deseja excluir este paciente?")) return
    setDeleting(id)
    await fetch(`/api/patients/${id}`, { method: "DELETE" })
    setPatients((prev) => prev.filter((p) => p.id !== id))
    setDeleting(null)
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="mx-auto max-w-5xl px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="text-sm">Dashboard</span>
            </Link>
            <div className="h-4 w-px bg-border" />
            <h1 className="font-semibold">Pacientes</h1>
          </div>
          <Button onClick={() => setShowModal(true)} size="sm" className="gap-1.5">
            <Plus className="h-4 w-4" />
            Novo paciente
          </Button>
        </div>
      </header>

      <CreatePatientModal
        open={showModal}
        onOpenChange={(open) => {
          setShowModal(open)
          if (!open) loadPatients()
        }}
      />

      <main className="mx-auto max-w-5xl px-4 py-8">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : patients.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="p-5 bg-muted rounded-full mb-4">
              <User className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-lg font-medium">Nenhum paciente cadastrado</p>
            <p className="text-muted-foreground text-sm mt-1 mb-6">
              Cadastre um paciente para vincular consultas e histórico
            </p>
            <Button onClick={() => setShowModal(true)} className="gap-1.5">
              <Plus className="h-4 w-4" />
              Cadastrar primeiro paciente
            </Button>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {patients.map((p) => (
              <Card key={p.id} className="group hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium truncate">{p.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {p.idade} anos · {p.sexo === "M" ? "Masculino" : "Feminino"}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Link href={`/pacientes/${p.id}`}>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => deletePatient(p.id)}
                        disabled={deleting === p.id}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>

                  {(p.alergias.length > 0 || p.remedios.length > 0) && (
                    <div className="mt-3 space-y-1.5">
                      {p.alergias.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {p.alergias.slice(0, 2).map((a) => (
                            <span key={a} className="text-xs bg-destructive/10 text-destructive rounded-full px-2 py-0.5">
                              {a}
                            </span>
                          ))}
                          {p.alergias.length > 2 && (
                            <span className="text-xs text-muted-foreground">+{p.alergias.length - 2}</span>
                          )}
                        </div>
                      )}
                      {p.remedios.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {p.remedios.slice(0, 2).map((r) => (
                            <span key={r} className="text-xs bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-full px-2 py-0.5">
                              {r}
                            </span>
                          ))}
                          {p.remedios.length > 2 && (
                            <span className="text-xs text-muted-foreground">+{p.remedios.length - 2}</span>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="mt-3 flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(p.createdAt), "dd/MM/yyyy", { locale: ptBR })}
                    </p>
                    <Link href={`/pacientes/${p.id}`} className="text-xs text-primary hover:underline">
                      Ver ficha
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
