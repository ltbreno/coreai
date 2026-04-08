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
      <DialogContent className="w-[calc(100%-2rem)] max-w-[500px] max-h-[90vh] flex flex-col p-4 sm:p-6">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-lg">Dados do Paciente</DialogTitle>
          <DialogDescription className="text-sm">
            Precisamos de algumas informacoes para analisar o documento.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 py-4 -mx-4 px-4 sm:-mx-6 sm:px-6">
          {/* Idade e Sexo */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="idade" className="text-sm">Idade *</Label>
              <Input
                id="idade"
                type="number"
                inputMode="numeric"
                min="0"
                max="150"
                placeholder="35"
                value={idade}
                onChange={(e) => setIdade(e.target.value)}
                className="h-10"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sexo" className="text-sm">Sexo *</Label>
              <Select value={sexo} onValueChange={(value) => setSexo(value as "M" | "F")}>
                <SelectTrigger id="sexo" className="h-10">
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
          <div className="space-y-1.5">
            <Label className="text-sm">Alergias (opcional)</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Ex: Penicilina"
                value={novaAlergia}
                onChange={(e) => setNovaAlergia(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    handleAddAlergia()
                  }
                }}
                className="h-10"
              />
              <Button type="button" variant="outline" size="icon" onClick={handleAddAlergia} className="h-10 w-10 flex-shrink-0">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {alergias.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {alergias.map((alergia) => (
                  <span
                    key={alergia}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-xs"
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
          <div className="space-y-1.5">
            <Label className="text-sm">Medicamentos em uso (opcional)</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Ex: Omeprazol 20mg"
                value={novoRemedio}
                onChange={(e) => setNovoRemedio(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    handleAddRemedio()
                  }
                }}
                className="h-10"
              />
              <Button type="button" variant="outline" size="icon" onClick={handleAddRemedio} className="h-10 w-10 flex-shrink-0">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {remedios.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {remedios.map((remedio) => (
                  <span
                    key={remedio}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs"
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

        <DialogFooter className="flex-shrink-0 flex-col sm:flex-row gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto order-2 sm:order-1">
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={!isValid} className="w-full sm:w-auto order-1 sm:order-2">
            Enviar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
