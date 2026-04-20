"use client"

import { useEffect, useRef, useState } from "react"
import { X, Copy, Check, Loader2, CheckCircle2, CreditCard, QrCode } from "lucide-react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import type { Plan } from "./Pricing"

type ModalState = "idle" | "method" | "card-form" | "loading" | "ready" | "success" | "error"

interface QRData {
  transparentId: string
  brCode: string
  brCodeBase64: string | null
}

interface PricingModalProps {
  plan: Plan
  onClose: () => void
}

export function PricingModal({ plan, onClose }: PricingModalProps) {
  const { data: session, update: updateSession } = useSession()
  const router = useRouter()
  const [state, setState] = useState<ModalState>("idle")
  const [qrData, setQrData] = useState<QRData | null>(null)
  const [copied, setCopied] = useState(false)
  const [errorMsg, setErrorMsg] = useState("")
  const [taxId, setTaxId] = useState("")
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (session?.user) setState("method")
    return () => stopPolling()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function stopPolling() {
    if (pollRef.current) {
      clearInterval(pollRef.current)
      pollRef.current = null
    }
  }

  async function createPixCharge() {
    setState("loading")
    setErrorMsg("")
    try {
      const res = await fetch("/api/payments/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId: plan.id }),
      })
      if (!res.ok) {
        const text = await res.text()
        const json = text ? JSON.parse(text) : {}
        throw new Error(json.error ?? "Falha ao criar cobrança")
      }
      const data: QRData = await res.json()
      setQrData(data)
      setState("ready")
      startPolling(data.transparentId)
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "Erro desconhecido")
      setState("error")
    }
  }

  async function createCardSubscription() {
    setState("loading")
    setErrorMsg("")
    try {
      const res = await fetch("/api/payments/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId: plan.id, taxId: taxId.replace(/\D/g, "") }),
      })
      if (!res.ok) {
        const text = await res.text()
        const json = text ? JSON.parse(text) : {}
        throw new Error(typeof json.error === "string" ? json.error : "Falha ao criar assinatura")
      }
      const { url } = await res.json()
      window.location.href = url
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "Erro desconhecido")
      setState("error")
    }
  }

  function startPolling(transparentId: string) {
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/payments/status?id=${transparentId}`)
        const { status } = await res.json()
        if (status === "completed") {
          stopPolling()
          await updateSession()
          setState("success")
        }
      } catch {
        // keep polling silently
      }
    }, 3000)
  }

  function handleCopy() {
    if (!qrData?.brCode) return
    navigator.clipboard.writeText(qrData.brCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function formatCPF(value: string) {
    const d = value.replace(/\D/g, "").slice(0, 11)
    return d
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2")
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 px-4"
      onClick={(e) => { if (e.target === e.currentTarget) { stopPolling(); onClose() } }}
    >
      <div className="bg-background rounded-2xl border border-border shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-border">
          <div>
            <h2 className="font-semibold text-foreground">
              {state === "success" ? "Assinatura ativada!" : `Assinar plano ${plan.name}`}
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              {state === "success"
                ? "Pagamento confirmado com sucesso"
                : `${plan.price}${plan.period}`}
            </p>
          </div>
          <button
            onClick={() => { stopPolling(); onClose() }}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-6">

          {/* ── Success ── */}
          {state === "success" && (
            <div className="flex flex-col items-center gap-5 py-4">
              <div className="p-4 rounded-full bg-green-500/10">
                <CheckCircle2 className="h-12 w-12 text-green-500" />
              </div>
              <div className="text-center">
                <p className="font-semibold text-foreground">Pagamento confirmado!</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Seu plano <strong>{plan.name}</strong> está ativo agora.
                </p>
              </div>
              <Button className="w-full" onClick={() => { onClose(); router.push("/dashboard") }}>
                Ir para o painel
              </Button>
            </div>
          )}

          {/* ── Loading ── */}
          {state === "loading" && (
            <div className="flex flex-col items-center gap-4 py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Processando...</p>
            </div>
          )}

          {/* ── Error ── */}
          {state === "error" && (
            <div className="flex flex-col items-center gap-4 py-4">
              <p className="text-sm text-destructive text-center">{errorMsg}</p>
              <Button variant="outline" className="w-full" onClick={() => setState("method")}>
                Tentar novamente
              </Button>
            </div>
          )}

          {/* ── Idle (not logged in) ── */}
          {state === "idle" && (
            <div className="flex flex-col items-center gap-4 py-4">
              <p className="text-sm text-muted-foreground text-center">
                Faça login para continuar com o pagamento.
              </p>
              <Button className="w-full" onClick={() => router.push("/login")}>
                Fazer login
              </Button>
            </div>
          )}

          {/* ── Method selection ── */}
          {state === "method" && (
            <div className="flex flex-col gap-3">
              <p className="text-sm text-muted-foreground text-center mb-1">
                Escolha a forma de pagamento
              </p>
              <Button className="w-full flex items-center gap-2" onClick={createPixCharge}>
                <QrCode className="h-4 w-4" />
                Pagar com PIX
              </Button>
              {/* Cartão de crédito — disponível em breve (requer API v2)
              <Button
                variant="outline"
                className="w-full flex items-center gap-2"
                onClick={() => setState("card-form")}
              >
                <CreditCard className="h-4 w-4" />
                Pagar com Cartão de Crédito
              </Button>
              */}
            </div>
          )}

          {/* ── Card form ── */}
          {state === "card-form" && (
            <div className="flex flex-col gap-4">
              <p className="text-sm text-muted-foreground text-center">
                Informe seu CPF para continuar
              </p>
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">CPF</label>
                <input
                  type="text"
                  value={taxId}
                  onChange={(e) => setTaxId(formatCPF(e.target.value))}
                  placeholder="000.000.000-00"
                  maxLength={14}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <Button
                className="w-full"
                disabled={taxId.replace(/\D/g, "").length < 11}
                onClick={createCardSubscription}
              >
                Continuar para pagamento
              </Button>
              <button
                className="text-xs text-muted-foreground hover:text-foreground text-center transition-colors"
                onClick={() => setState("method")}
              >
                Voltar
              </button>
            </div>
          )}

          {/* ── Ready (QR visible) ── */}
          {state === "ready" && qrData && (
            <div className="flex flex-col items-center gap-5">
              <p className="text-sm text-muted-foreground text-center">
                Escaneie o QR Code com o app do seu banco para pagar via PIX.
              </p>
              <div className="p-3 bg-white rounded-xl border border-border shadow-sm">
                {qrData.brCodeBase64 ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={qrData.brCodeBase64}
                    alt="QR Code PIX"
                    width={192}
                    height={192}
                    className="block"
                  />
                ) : (
                  <div className="w-48 h-48 flex items-center justify-center text-xs text-muted-foreground">
                    QR indisponível
                  </div>
                )}
              </div>
              <div className="w-full">
                <p className="text-xs text-muted-foreground mb-1.5">PIX Copia e Cola:</p>
                <div className="flex items-center gap-2 bg-muted/60 border border-border rounded-lg px-3 py-2">
                  <p className="text-xs font-mono flex-1 truncate text-foreground">
                    {qrData.brCode}
                  </p>
                  <button
                    onClick={handleCopy}
                    className="shrink-0 p-1 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                  >
                    {copied
                      ? <Check className="h-3.5 w-3.5 text-green-500" />
                      : <Copy className="h-3.5 w-3.5" />
                    }
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" />
                Aguardando confirmação do pagamento...
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        {state !== "success" && (
          <div className="px-6 pb-6">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => { stopPolling(); onClose() }}
            >
              Fechar
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
