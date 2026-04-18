"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { X, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

const schema = z.object({
  name: z.string().min(2, "Nome deve ter no mínimo 2 caracteres"),
  idade: z.coerce.number().int().min(0).max(150),
  sexo: z.enum(["M", "F"]),
})

type FormData = z.infer<typeof schema>

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreatePatientModal({ open, onOpenChange }: Props) {
  const router = useRouter()
  const [alergias, setAlergias] = useState<string[]>([])
  const [remedios, setRemedios] = useState<string[]>([])
  const [alergia, setAlergia] = useState("")
  const [remedio, setRemedio] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  function addAlergia() {
    const v = alergia.trim()
    if (v && !alergias.includes(v)) setAlergias((prev) => [...prev, v])
    setAlergia("")
  }

  function addRemedio() {
    const v = remedio.trim()
    if (v && !remedios.includes(v)) setRemedios((prev) => [...prev, v])
    setRemedio("")
  }

  function handleClose() {
    reset()
    setAlergias([])
    setRemedios([])
    setAlergia("")
    setRemedio("")
    setError("")
    onOpenChange(false)
  }

  async function onSubmit(data: FormData) {
    setLoading(true)
    setError("")

    const res = await fetch("/api/patients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, alergias, remedios }),
    })

    setLoading(false)

    if (!res.ok) {
      const json = await res.json()
      setError(json.error ?? "Erro ao cadastrar paciente")
      return
    }

    handleClose()
    router.refresh()
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo paciente</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="name">Nome completo</Label>
            <Input id="name" placeholder="Nome do paciente" {...register("name")} />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="idade">Idade</Label>
              <Input id="idade" type="number" min={0} max={150} placeholder="Ex: 35" {...register("idade")} />
              {errors.idade && <p className="text-sm text-destructive">{errors.idade.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Sexo</Label>
              <div className="flex gap-2">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input type="radio" value="M" {...register("sexo")} className="accent-primary" />
                  <span className="text-sm">Masculino</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input type="radio" value="F" {...register("sexo")} className="accent-primary" />
                  <span className="text-sm">Feminino</span>
                </label>
              </div>
              {errors.sexo && <p className="text-sm text-destructive">{errors.sexo.message}</p>}
            </div>
          </div>

          {/* Alergias */}
          <div className="space-y-2">
            <Label>Alergias</Label>
            <div className="flex gap-2">
              <Input
                value={alergia}
                onChange={(e) => setAlergia(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addAlergia() } }}
                placeholder="Ex: Penicilina"
              />
              <Button type="button" variant="outline" size="icon" onClick={addAlergia}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {alergias.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {alergias.map((a) => (
                  <span key={a} className="flex items-center gap-1 bg-destructive/10 text-destructive rounded-full px-2.5 py-0.5 text-xs">
                    {a}
                    <button type="button" onClick={() => setAlergias((prev) => prev.filter((x) => x !== a))}>
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Remédios */}
          <div className="space-y-2">
            <Label>Medicamentos em uso</Label>
            <div className="flex gap-2">
              <Input
                value={remedio}
                onChange={(e) => setRemedio(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addRemedio() } }}
                placeholder="Ex: Losartana 50mg"
              />
              <Button type="button" variant="outline" size="icon" onClick={addRemedio}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {remedios.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {remedios.map((r) => (
                  <span key={r} className="flex items-center gap-1 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-full px-2.5 py-0.5 text-xs">
                    {r}
                    <button type="button" onClick={() => setRemedios((prev) => prev.filter((x) => x !== r))}>
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={handleClose}>
              Cancelar
            </Button>
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? "Salvando..." : "Cadastrar paciente"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
