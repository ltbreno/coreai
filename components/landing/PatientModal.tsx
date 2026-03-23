"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { X, Plus } from "lucide-react"

export interface PatientData {
  idade: number
  sexo: "M" | "F"
  alergias: string[]
  remedios: string[]
}

interface PatientModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: PatientData) => void
  fileName: string
}

export function PatientModal({ open, onOpenChange, onSubmit, fileName }: PatientModalProps) {
  const [idade, setIdade] = useState<string>("")
  const [sexo, setSexo] = useState<"M" | "F" | "">("")
  const [alergias, setAlergias] = useState<string[]>([])
  const [remedios, setRemedios] = useState<string[]>([])
  const [novaAlergia, setNovaAlergia] = useState("")
  const [novoRemedio, setNovoRemedio] = useState("")

  const handleAddAlergia = () => {
    if (novaAlergia.trim() && !alergias.includes(novaAlergia.trim())) {
      setAlergias([...alergias, novaAlergia.trim()])
      setNovaAlergia("")
    }
  }

  const handleRemoveAlergia = (alergia: string) => {
    setAlergias(alergias.filter((a) => a !== alergia))
  }

  const handleAddRemedio = () => {
    if (novoRemedio.trim() && !remedios.includes(novoRemedio.trim())) {
      setRemedios([...remedios, novoRemedio.trim()])
      setNovoRemedio("")
    }
  }

  const handleRemoveRemedio = (remedio: string) => {
    setRemedios(remedios.filter((r) => r !== remedio))
  }

  const handleSubmit = () => {
    if (!idade || !sexo) return

    onSubmit({
      idade: parseInt(idade),
      sexo: sexo as "M" | "F",
      alergias,
      remedios,
    })

    // Reset form
    setIdade("")
    setSexo("")
    setAlergias([])
    setRemedios([])
    setNovaAlergia("")
    setNovoRemedio("")
  }

  const isValid = idade && parseInt(idade) > 0 && sexo

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Dados do Paciente</DialogTitle>
          <DialogDescription>
            Para analisar o documento <span className="font-medium">{fileName}</span>, precisamos de algumas informacoes do paciente.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Idade e Sexo */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="idade">Idade *</Label>
              <Input
                id="idade"
                type="number"
                min="0"
                max="150"
                placeholder="Ex: 35"
                value={idade}
                onChange={(e) => setIdade(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sexo">Sexo *</Label>
              <Select value={sexo} onValueChange={(value) => setSexo(value as "M" | "F")}>
                <SelectTrigger id="sexo">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="M">Masculino</SelectItem>
                  <SelectItem value="F">Feminino</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Alergias */}
          <div className="space-y-2">
            <Label>Alergias</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Ex: Lactose, Gluten, Penicilina"
                value={novaAlergia}
                onChange={(e) => setNovaAlergia(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    handleAddAlergia()
                  }
                }}
              />
              <Button type="button" variant="outline" size="icon" onClick={handleAddAlergia}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {alergias.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {alergias.map((alergia) => (
                  <span
                    key={alergia}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-red-100 text-red-700 text-sm"
                  >
                    {alergia}
                    <button
                      type="button"
                      onClick={() => handleRemoveAlergia(alergia)}
                      className="hover:bg-red-200 rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Remedios */}
          <div className="space-y-2">
            <Label>Medicamentos em uso</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Ex: Omeprazol 20mg, Losartana 50mg"
                value={novoRemedio}
                onChange={(e) => setNovoRemedio(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    handleAddRemedio()
                  }
                }}
              />
              <Button type="button" variant="outline" size="icon" onClick={handleAddRemedio}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {remedios.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {remedios.map((remedio) => (
                  <span
                    key={remedio}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-blue-100 text-blue-700 text-sm"
                  >
                    {remedio}
                    <button
                      type="button"
                      onClick={() => handleRemoveRemedio(remedio)}
                      className="hover:bg-blue-200 rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={!isValid}>
            Confirmar e Enviar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
