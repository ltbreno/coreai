"use client"

import { useEffect, useRef, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import Link from "next/link"
import { Check, CheckCircle2, Loader2, Copy, QrCode, Camera, GraduationCap, Stethoscope } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

async function resizeToBase64(file: File, maxSize = 200): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      const scale = Math.min(maxSize / img.width, maxSize / img.height, 1)
      const canvas = document.createElement("canvas")
      canvas.width = Math.round(img.width * scale)
      canvas.height = Math.round(img.height * scale)
      canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height)
      URL.revokeObjectURL(url)
      resolve(canvas.toDataURL("image/jpeg", 0.75))
    }
    img.src = url
  })
}

const PLANS = [
  { id: "free",         name: "FREE",         price: "Grátis",   period: "",     features: ["2 Análises"],                         amountCents: 0 },
  { id: "essencial",    name: "ESSENCIAL",     price: "R$ 29,90", period: "/mês", features: ["15 análises", "Histórico básico"],    amountCents: 2990 },
  { id: "profissional", name: "PROFISSIONAL",  price: "R$ 59,90", period: "/mês", features: ["35 análises", "Dashboard completo"],  amountCents: 5990 },
  { id: "premium",      name: "PREMIUM",       price: "R$ 89,90", period: "/mês", features: ["60 análises", "Chatbot Interativo"],  amountCents: 8990 },
]

const schema = z
  .object({
    name:            z.string().min(2, "Nome deve ter no mínimo 2 caracteres"),
    email:           z.string().email("Email inválido"),
    password:        z.string().min(8, "Senha deve ter no mínimo 8 caracteres"),
    confirmPassword: z.string(),
    userType:        z.enum(["professional", "student"]),
    profession:      z.enum(["MEDICO", "NUTRICIONISTA", "FISIOTERAPEUTA", "FARMACEUTICO", "OUTRO"]).optional(),
    credentialType:  z.enum(["CRM", "CRN", "CRO", "CREFITO", "OUTRO"]).optional(),
    credential:      z.string().optional(),
    couponCode:      z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.password !== data.confirmPassword) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "As senhas não coincidem", path: ["confirmPassword"] })
    }
    if (data.userType === "professional") {
      if (!data.profession) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Selecione sua profissão", path: ["profession"] })
      }
      if (!data.credentialType) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Selecione o tipo de conselho", path: ["credentialType"] })
      }
      if (!data.credential?.trim()) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Número do conselho obrigatório", path: ["credential"] })
      }
    }
  })

type FormData = z.infer<typeof schema>
type Step = "form" | "plan" | "payment" | "pending"

interface QRData {
  transparentId: string
  brCode: string
  brCodeBase64: string | null
}

export default function RegistroPage() {
  const [step, setStep] = useState<Step>("form")
  const [userId, setUserId] = useState("")
  const [selectedPlan, setSelectedPlan] = useState("")
  const [isStudentReg, setIsStudentReg] = useState(false)
  const [formError, setFormError] = useState("")
  const [formLoading, setFormLoading] = useState(false)
  const [couponApplied, setCouponApplied] = useState(false)
  const [couponPlan, setCouponPlan] = useState<string | null>(null)
  const [qrData, setQrData] = useState<QRData | null>(null)
  const [qrLoading, setQrLoading] = useState(false)
  const [qrError, setQrError] = useState("")
  const [copied, setCopied] = useState(false)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [avatarBase64, setAvatarBase64] = useState<string | null>(null)
  const avatarInputRef = useRef<HTMLInputElement>(null)

  const { register, handleSubmit, setValue, watch, formState: { errors }, clearErrors } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { userType: "professional" },
  })
  const watchedName = watch("name", "")
  const userType = watch("userType")

  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current) }, [])

  function switchUserType(type: "professional" | "student") {
    setValue("userType", type)
    clearErrors(["profession", "credentialType", "credential"])
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const base64 = await resizeToBase64(file)
    setAvatarPreview(base64)
    setAvatarBase64(base64)
  }

  async function onSubmitForm(data: FormData) {
    setFormLoading(true)
    setFormError("")
    const isStudent = data.userType === "student"
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name:           data.name,
        email:          data.email,
        password:       data.password,
        isStudent,
        profession:     isStudent ? undefined : data.profession,
        credentialType: isStudent ? undefined : data.credentialType,
        credential:     isStudent ? undefined : data.credential,
        couponCode:     data.couponCode?.trim() || undefined,
        avatarUrl:      avatarBase64 ?? undefined,
      }),
    })
    if (!res.ok) {
      const json = await res.json()
      setFormError(json.error ?? "Erro ao criar conta")
      setFormLoading(false)
      return
    }
    const json = await res.json()
    setUserId(json.id)
    setIsStudentReg(isStudent)
    setCouponApplied(Boolean(json.couponApplied))
    setCouponPlan(json.couponPlan ?? null)
    setFormLoading(false)
    setStep(json.couponApplied ? "pending" : "plan")
  }

  async function selectPlan(planId: string) {
    setSelectedPlan(planId)
    if (planId === "free") {
      setStep("pending")
      return
    }
    setStep("payment")
    setQrLoading(true)
    setQrError("")
    try {
      const res = await fetch("/api/payments/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId, userId }),
      })
      if (!res.ok) {
        const text = await res.text()
        const json = text ? JSON.parse(text) : {}
        throw new Error(json.error ?? "Falha ao gerar QR Code")
      }
      const data: QRData = await res.json()
      setQrData(data)
      pollRef.current = setInterval(async () => {
        try {
          const r = await fetch(`/api/payments/status?id=${data.transparentId}`)
          const { status } = await r.json()
          if (status === "completed") {
            clearInterval(pollRef.current!)
            setStep("pending")
          }
        } catch { /* keep polling */ }
      }, 3000)
    } catch (e) {
      setQrError(e instanceof Error ? e.message : "Erro desconhecido")
    } finally {
      setQrLoading(false)
    }
  }

  function handleCopy() {
    if (!qrData?.brCode) return
    navigator.clipboard.writeText(qrData.brCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-8">
      <Card className="w-full max-w-lg">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-2">
            <span className="text-2xl font-bold tracking-tight">CoreAI</span>
          </div>

          {step === "form" && (
            <>
              <CardTitle className="text-xl">Criar sua conta</CardTitle>
              <CardDescription>
                {userType === "student"
                  ? "Preencha seus dados para criar sua conta de estudante"
                  : "Preencha seus dados e credencial profissional"}
              </CardDescription>
            </>
          )}
          {step === "plan" && (
            <>
              <CardTitle className="text-xl">Escolha seu plano</CardTitle>
              <CardDescription>Você pode fazer upgrade a qualquer momento</CardDescription>
            </>
          )}
          {step === "payment" && (
            <>
              <CardTitle className="text-xl">Pagamento via PIX</CardTitle>
              <CardDescription>Escaneie o QR Code para concluir</CardDescription>
            </>
          )}
          {step === "pending" && (
            <>
              <CardTitle className="text-xl">Conta criada!</CardTitle>
              <CardDescription>Aguardando aprovação do administrador</CardDescription>
            </>
          )}
        </CardHeader>

        <CardContent>

          {/* ── Step 1: Form ── */}
          {step === "form" && (
            <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-4">

              {/* User type toggle */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-muted rounded-lg">
                <button
                  type="button"
                  onClick={() => switchUserType("professional")}
                  className={`flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                    userType === "professional"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Stethoscope className="h-4 w-4" />
                  Profissional
                </button>
                <button
                  type="button"
                  onClick={() => switchUserType("student")}
                  className={`flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                    userType === "student"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <GraduationCap className="h-4 w-4" />
                  Estudante
                </button>
              </div>

              {/* Avatar picker */}
              <div className="flex flex-col items-center gap-2 pb-2">
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  className="relative group"
                >
                  <div className="h-20 w-20 rounded-full overflow-hidden ring-2 ring-border bg-muted flex items-center justify-center">
                    {avatarPreview ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={avatarPreview} alt="Avatar" className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-2xl font-semibold text-muted-foreground">
                        {watchedName?.[0]?.toUpperCase() || <Camera className="h-7 w-7 text-muted-foreground" />}
                      </span>
                    )}
                  </div>
                  <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Camera className="h-5 w-5 text-white" />
                  </div>
                </button>
                <p className="text-xs text-muted-foreground">Foto de perfil (opcional)</p>
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
              </div>

              <div className="space-y-2">
                <Label>Nome completo</Label>
                <Input placeholder="Seu nome" {...register("name")} />
                {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" placeholder="seu@email.com" {...register("email")} />
                {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Cupom de acesso</Label>
                <Input placeholder="Opcional" {...register("couponCode")} />
                <p className="text-xs text-muted-foreground">
                  Se vocÃª recebeu um cupom, ele libera acesso sem pagamento.
                </p>
                {errors.couponCode && <p className="text-sm text-destructive">{errors.couponCode.message}</p>}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Senha</Label>
                  <Input type="password" placeholder="Mínimo 8 caracteres" {...register("password")} />
                  {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Confirmar senha</Label>
                  <Input type="password" placeholder="••••••••" {...register("confirmPassword")} />
                  {errors.confirmPassword && <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>}
                </div>
              </div>

              {/* Professional credential section — hidden for students */}
              {userType === "professional" && (
                <div className="pt-1 border-t border-border">
                  <p className="text-xs text-muted-foreground mb-3 mt-2">Credencial profissional</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Profissão</Label>
                      <Select onValueChange={(v) => setValue("profession", v as FormData["profession"])}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="MEDICO">Médico(a)</SelectItem>
                          <SelectItem value="NUTRICIONISTA">Nutricionista</SelectItem>
                          <SelectItem value="FISIOTERAPEUTA">Fisioterapeuta</SelectItem>
                          <SelectItem value="FARMACEUTICO">Farmacêutico(a)</SelectItem>
                          <SelectItem value="OUTRO">Outro</SelectItem>
                        </SelectContent>
                      </Select>
                      {errors.profession && <p className="text-sm text-destructive">{errors.profession.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label>Conselho</Label>
                      <Select onValueChange={(v) => setValue("credentialType", v as FormData["credentialType"])}>
                        <SelectTrigger>
                          <SelectValue placeholder="Tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="CRM">CRM</SelectItem>
                          <SelectItem value="CRN">CRN</SelectItem>
                          <SelectItem value="CRO">CRO</SelectItem>
                          <SelectItem value="CREFITO">CREFITO</SelectItem>
                          <SelectItem value="OUTRO">Outro</SelectItem>
                        </SelectContent>
                      </Select>
                      {errors.credentialType && <p className="text-sm text-destructive">{errors.credentialType.message}</p>}
                    </div>
                  </div>
                  <div className="space-y-2 mt-3">
                    <Label>Número do conselho</Label>
                    <Input placeholder="ex: 123456/SP" {...register("credential")} />
                    {errors.credential && <p className="text-sm text-destructive">{errors.credential.message}</p>}
                  </div>
                </div>
              )}

              {formError && <p className="text-sm text-destructive text-center">{formError}</p>}
              <Button type="submit" className="w-full" disabled={formLoading}>
                {formLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Continuar"}
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                Já tem uma conta?{" "}
                <Link href="/login" className="underline underline-offset-4 hover:text-primary">
                  Entrar
                </Link>
              </p>
            </form>
          )}

          {/* ── Step 2: Plan ── */}
          {step === "plan" && (
            <div className="grid grid-cols-2 gap-3">
              {PLANS.map((plan) => (
                <button
                  key={plan.id}
                  onClick={() => selectPlan(plan.id)}
                  className="rounded-xl border border-border p-4 text-left hover:border-foreground hover:shadow-md transition-all flex flex-col gap-2"
                >
                  <p className="text-xs font-bold tracking-widest uppercase text-muted-foreground">{plan.name}</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-xl font-bold text-foreground">{plan.price}</span>
                    {plan.period && <span className="text-xs text-muted-foreground">{plan.period}</span>}
                  </div>
                  <ul className="flex flex-col gap-1">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-center gap-1.5 text-xs text-foreground/80">
                        <Check className="h-3 w-3 shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </button>
              ))}
            </div>
          )}

          {/* ── Step 3: Payment ── */}
          {step === "payment" && (
            <div className="flex flex-col items-center gap-4">
              {qrLoading && (
                <div className="flex flex-col items-center gap-3 py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Gerando QR Code...</p>
                </div>
              )}
              {qrError && (
                <div className="flex flex-col items-center gap-3 py-4">
                  <p className="text-sm text-destructive text-center">{qrError}</p>
                  <Button variant="outline" onClick={() => setStep("plan")}>Voltar</Button>
                </div>
              )}
              {!qrLoading && !qrError && qrData && (
                <>
                  <div className="p-3 bg-white rounded-xl border border-border shadow-sm">
                    {qrData.brCodeBase64 ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={qrData.brCodeBase64} alt="QR Code PIX" width={192} height={192} className="block" />
                    ) : (
                      <div className="w-48 h-48 flex items-center justify-center">
                        <QrCode className="h-16 w-16 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="w-full">
                    <p className="text-xs text-muted-foreground mb-1.5">PIX Copia e Cola:</p>
                    <div className="flex items-center gap-2 bg-muted/60 border border-border rounded-lg px-3 py-2">
                      <p className="text-xs font-mono flex-1 truncate text-foreground">{qrData.brCode}</p>
                      <button onClick={handleCopy} className="shrink-0 p-1 rounded hover:bg-muted transition-colors text-muted-foreground">
                        {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Aguardando confirmação do pagamento...
                  </div>
                </>
              )}
            </div>
          )}

          {/* ── Step 4: Pending ── */}
          {step === "pending" && (
            <div className="flex flex-col items-center gap-5 py-4">
              <div className="p-4 rounded-full bg-green-500/10">
                <CheckCircle2 className="h-12 w-12 text-green-500" />
              </div>
              <div className="text-center space-y-2">
                <p className="font-semibold text-foreground">Conta criada com sucesso!</p>
                {couponApplied && (
                  <p className="text-sm text-green-600">
                    Cupom aplicado com sucesso{couponPlan ? ` no plano ${couponPlan.toUpperCase()}` : ""}.
                  </p>
                )}
                <p className="text-sm text-muted-foreground">
                  {isStudentReg
                    ? "Seu cadastro está sendo verificado. Você receberá acesso assim que o administrador aprovar sua conta."
                    : "Sua credencial profissional está sendo verificada. Você receberá acesso assim que o administrador aprovar sua conta."}
                </p>
              </div>
              <Link href="/login" className="w-full">
                <Button variant="outline" className="w-full">Ir para o login</Button>
              </Link>
            </div>
          )}

        </CardContent>
      </Card>
    </div>
  )
}
