"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { FileText, Send, Upload, X, Loader2, Paperclip, ArrowLeft, LayoutDashboard, ChevronDown, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useSession } from "next-auth/react"
import {
  sendChatMessage,
  generateSessionId,
  generateUserId,
  fileToBase64,
  type ChatResponse,
} from "@/lib/api"
import { PatientModal, type PatientData } from "@/components/landing/PatientModal"
import type { ReportData } from "@/types/report"

interface Message {
  role: "user" | "assistant"
  content: string
  followUps?: string[]
}

interface PatientOption {
  id: string
  name: string
}

function renderInlineMarkdown(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g)
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i} className="font-semibold">{part.slice(2, -2)}</strong>
    }
    return <span key={i}>{part}</span>
  })
}

function formatResponse(text: string): React.ReactNode {
  const cleaned = text
    .replace(/\[\d+\]/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim()

  const lines = cleaned.split("\n")
  const elements: React.ReactNode[] = []
  let listItems: string[] = []
  let listKey = 0

  const flushList = () => {
    if (listItems.length > 0) {
      elements.push(
        <ul key={`list-${listKey++}`} className="space-y-1.5 pl-1">
          {listItems.map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-sm leading-relaxed">
              <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary/60 shrink-0" />
              <span>{renderInlineMarkdown(item)}</span>
            </li>
          ))}
        </ul>
      )
      listItems = []
    }
  }

  lines.forEach((line, idx) => {
    const trimmed = line.trim()
    if (!trimmed) {
      flushList()
      return
    }

    const headingMatch = trimmed.match(/^(#{1,6})\s+(.+)/)
    if (headingMatch) {
      flushList()
      const level = headingMatch[1].length
      const headingText = headingMatch[2]
      const sizeClass =
        level === 1
          ? "text-base font-bold text-foreground mt-4 mb-1 border-b border-border pb-1"
          : level === 2
          ? "text-sm font-bold text-foreground mt-3 mb-0.5 uppercase tracking-wide text-primary"
          : "text-sm font-semibold text-foreground mt-2"
      elements.push(
        <p key={`h-${idx}`} className={sizeClass}>
          {renderInlineMarkdown(headingText)}
        </p>
      )
      return
    }

    const listMatch = trimmed.match(/^[-*•]\s+(.+)/) || trimmed.match(/^\d+\.\s+(.+)/)
    if (listMatch) {
      listItems.push(listMatch[1])
      return
    }

    flushList()
    elements.push(
      <p key={`p-${idx}`} className="text-sm leading-relaxed">
        {renderInlineMarkdown(trimmed)}
      </p>
    )
  })

  flushList()
  return <div className="space-y-2">{elements}</div>
}

export default function ChatPage() {
  const { data: authSession } = useSession()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [pdfProcessed, setPdfProcessed] = useState(false)
  const [patientData, setPatientData] = useState<PatientData | null>(null)
  const [showPatientModal, setShowPatientModal] = useState(false)
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [sessionId] = useState(() => generateSessionId())
  const [userId] = useState(() => generateUserId())
  const [dbSessionId, setDbSessionId] = useState<string | null>(null)
  const [patients, setPatients] = useState<PatientOption[]>([])
  const [selectedPatientId, setSelectedPatientId] = useState<string>("")
  const [showPatientSelect, setShowPatientSelect] = useState(false)
  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [isGeneratingReport, setIsGeneratingReport] = useState(false)
  const [reportReady, setReportReady] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const sessionCreationRef = useRef<Promise<string | null> | null>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Load patients when authenticated
  useEffect(() => {
    if (!authSession) return
    fetch("/api/patients")
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setPatients(data) })
      .catch(() => {})
  }, [authSession])

  // Create DB session lazily on first message
  const getOrCreateDbSession = async (): Promise<string | null> => {
    if (dbSessionId) return dbSessionId
    if (!authSession) return null

    if (!sessionCreationRef.current) {
      sessionCreationRef.current = fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patientId: selectedPatientId || undefined }),
      })
        .then((r) => r.json())
        .then((data) => {
          if (data?.id) {
            setDbSessionId(data.id)
            return data.id as string
          }
          return null
        })
        .catch(() => null)
    }

    return sessionCreationRef.current
  }

  // Update session with selected patient (only if session already exists)
  useEffect(() => {
    if (!dbSessionId || !selectedPatientId) return
    fetch(`/api/sessions/${dbSessionId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ patientId: selectedPatientId }),
    }).catch(() => {})
  }, [selectedPatientId, dbSessionId])

  // Reset session creation ref when patient changes (before first message)
  useEffect(() => {
    if (!dbSessionId) sessionCreationRef.current = null
  }, [selectedPatientId, dbSessionId])

  const handleFileUpload = async (file: File) => {
    if (file.type !== "application/pdf") {
      alert("Por favor, envie apenas arquivos PDF.")
      return
    }
    setPendingFile(file)
    setShowPatientModal(true)
  }

  const handlePatientDataSubmit = async (data: PatientData) => {
    if (!pendingFile) return

    setPatientData(data)
    setPdfFile(pendingFile)
    setShowPatientModal(false)
    setIsLoading(true)

    try {
      const [base64, sessionId_db] = await Promise.all([
        fileToBase64(pendingFile),
        getOrCreateDbSession(),
      ])

      const response: ChatResponse = await sendChatMessage({
        chat_input: "",
        metadata: {},
        session_id: sessionId,
        user_id: userId,
        dbSessionId: sessionId_db ?? undefined,
        pdfFilename: pendingFile.name,
        pdf_base64: base64,
        idade: data.idade,
        sexo: data.sexo,
        alergias: data.alergias,
        remedios: data.remedios,
      })

      setPdfProcessed(true)
      setMessages([
        {
          role: "assistant",
          content: response.response,
          followUps: response.followUpQuestions,
        },
      ])

      // Pre-fetch structured report data in the background
      setReportReady(false)
      setReportData(null)
      fetch("/api/generate-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, userId }),
      })
        .then((r) => r.ok ? r.json() : null)
        .then((rd: ReportData | null) => {
          if (rd) {
            if (data.idade) rd.patient = { ...rd.patient, age: data.idade }
            setReportData(rd)
            setReportReady(true)
          }
        })
        .catch(() => {})
    } catch {
      setMessages([
        {
          role: "assistant",
          content: "Desculpe, ocorreu um erro ao processar o documento. Tente novamente.",
        },
      ])
    } finally {
      setPendingFile(null)
      setIsLoading(false)
    }
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleFileUpload(file)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
  }, [])

  const removePdf = () => {
    setPdfFile(null)
    setPdfProcessed(false)
    setPatientData(null)
    setMessages([])
    setReportData(null)
    setReportReady(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage = input.trim()
    setInput("")
    setMessages((prev) => [...prev, { role: "user", content: userMessage }])
    setIsLoading(true)

    try {
      const sessionId_db = await getOrCreateDbSession()

      const response: ChatResponse = await sendChatMessage({
        chat_input: userMessage,
        metadata: {},
        session_id: sessionId,
        user_id: userId,
        dbSessionId: sessionId_db ?? undefined,
      })

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: response.response,
          followUps: response.followUpQuestions,
        },
      ])
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Desculpe, ocorreu um erro ao processar sua mensagem. Tente novamente.",
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const handleGenerateReport = async () => {
    let rd = reportData

    // If background pre-fetch hasn't finished yet, fetch now
    if (!reportReady || !rd) {
      setIsGeneratingReport(true)
      try {
        const res = await fetch("/api/generate-report", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId, userId }),
        })
        if (!res.ok) throw new Error()
        rd = await res.json() as ReportData
        if (patientData && rd) rd.patient = { ...rd.patient, age: patientData.idade }
        setReportData(rd)
        setReportReady(true)
      } catch {
        alert("Não foi possível gerar o relatório. Tente novamente.")
        setIsGeneratingReport(false)
        return
      }
    }

    if (!rd) return
    setIsGeneratingReport(true)

    try {
      // Dynamic import keeps react-pdf out of the initial bundle
      const { pdf } = await import("@react-pdf/renderer")
      const { ReportPDF } = await import("@/components/pdf/ReportPDF")
      const blob = await pdf(<ReportPDF data={rd} />).toBlob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = "relatorio-core-ai.pdf"
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      alert("Erro ao exportar o PDF. Tente novamente.")
    } finally {
      setIsGeneratingReport(false)
    }
  }

  const handleFollowUp = (question: string) => {
    setInput(question)
  }

  const selectedPatient = patients.find((p) => p.id === selectedPatientId)

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <PatientModal
        open={showPatientModal}
        onOpenChange={(open) => {
          setShowPatientModal(open)
          if (!open) setPendingFile(null)
        }}
        onSubmit={handlePatientDataSubmit}
        fileName={pendingFile?.name || ""}
      />


      {/* Header */}
      <header className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="mx-auto max-w-4xl px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="text-sm">Voltar</span>
            </Link>
            <div className="h-4 w-px bg-border" />
            <h1 className="font-semibold text-foreground">CoreAI</h1>
          </div>

          <div className="flex items-center gap-3">
            {/* Patient selector */}
            {authSession && patients.length > 0 && (
              <div className="relative">
                <button
                  onClick={() => setShowPatientSelect((v) => !v)}
                  className="flex items-center gap-1.5 text-sm border border-border rounded-lg px-3 py-1.5 hover:bg-muted transition-colors"
                >
                  <span className="text-muted-foreground">
                    {selectedPatient ? selectedPatient.name : "Selecionar paciente"}
                  </span>
                  <ChevronDown className="h-3 w-3 text-muted-foreground" />
                </button>
                {showPatientSelect && (
                  <div className="absolute right-0 top-full mt-1 w-52 bg-background border border-border rounded-lg shadow-lg z-50 py-1">
                    <button
                      onClick={() => { setSelectedPatientId(""); setShowPatientSelect(false) }}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors text-muted-foreground"
                    >
                      Nenhum paciente
                    </button>
                    {patients.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => { setSelectedPatientId(p.id); setShowPatientSelect(false) }}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors"
                      >
                        {p.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {authSession && (
              <Link href="/dashboard">
                <Button variant="outline" size="sm" className="gap-1.5">
                  <LayoutDashboard className="h-3.5 w-3.5" />
                  <span className="text-xs">Painel</span>
                </Button>
              </Link>
            )}

            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-green-500" />
              <span className="text-xs text-muted-foreground">Online</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main chat area */}
      <main className="flex-1 flex flex-col max-w-4xl mx-auto w-full">
        {pdfFile && (
          <div className="px-4 py-3 border-b border-border bg-muted/30">
            <div className="flex items-center gap-2 text-sm">
              <FileText className="h-4 w-4 text-primary" />
              <span className="font-medium text-foreground truncate max-w-[300px]">
                {pdfFile.name}
              </span>
              <button
                onClick={removePdf}
                className="p-1 hover:bg-muted rounded-full transition-colors"
                aria-label="Remover PDF"
              >
                <X className="h-3 w-3 text-muted-foreground" />
              </button>
            </div>
          </div>
        )}

        <div
          className="flex-1 p-4 space-y-4 overflow-y-auto"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
        >
          {messages.length === 0 && !isLoading ? (
            <div className="flex flex-col items-center justify-center h-full min-h-[500px] text-center">
              <label htmlFor="pdf-upload" className="cursor-pointer group">
                <div className="flex flex-col items-center gap-4 p-12 border-2 border-dashed border-border rounded-2xl hover:border-primary/50 hover:bg-muted/50 transition-colors">
                  <div className="p-6 bg-muted rounded-full group-hover:bg-primary/10 transition-colors">
                    <Upload className="h-10 w-10 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <div>
                    <p className="text-lg font-medium text-foreground">
                      Arraste um PDF ou clique para fazer upload
                    </p>
                    <p className="text-muted-foreground mt-2">
                      Artigos cientificos, exames, estudos clinicos
                    </p>
                  </div>
                </div>
                <input
                  id="pdf-upload"
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleFileUpload(file)
                  }}
                />
              </label>
            </div>
          ) : messages.length === 0 && isLoading ? (
            <div className="flex flex-col items-center justify-center h-full min-h-[500px] text-center">
              <div className="flex flex-col items-center gap-6">
                <div className="p-6 bg-primary/10 rounded-full">
                  <Loader2 className="h-10 w-10 text-primary animate-spin" />
                </div>
                <div>
                  <p className="text-lg font-medium text-foreground">Processando documento...</p>
                  <p className="text-muted-foreground mt-2">
                    Analisando o PDF e extraindo informacoes relevantes.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <>
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted/70 text-foreground"
                    }`}
                  >
                    {message.role === "user" ? (
                      <p className="text-sm">{message.content}</p>
                    ) : (
                      formatResponse(message.content)
                    )}
                  </div>
                </div>
              ))}

              {messages.length > 0 &&
                messages[messages.length - 1].role === "assistant" &&
                messages[messages.length - 1].followUps && (
                  <div className="space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <p className="text-xs text-muted-foreground font-medium">Perguntas sugeridas</p>
                    <div className="flex flex-wrap gap-2">
                      {messages[messages.length - 1].followUps?.map((followUp, index) => (
                        <button
                          key={index}
                          onClick={() => handleFollowUp(followUp)}
                          className="text-sm px-3 py-1.5 rounded-full border border-border bg-background hover:bg-muted transition-colors text-foreground"
                        >
                          {followUp}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

              {pdfProcessed && !isLoading && messages.length > 0 && messages[messages.length - 1].role === "assistant" && (
                <div className="flex justify-start animate-in fade-in slide-in-from-bottom-2 duration-500">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={handleGenerateReport}
                    disabled={isGeneratingReport}
                  >
                    {isGeneratingReport ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Download className="h-3.5 w-3.5" />
                    )}
                    {isGeneratingReport ? "Gerando relatório..." : "Gerar Relatório PDF"}
                  </Button>
                </div>
              )}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-2xl px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Analisando...</span>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div className="border-t border-border bg-background sticky bottom-0">
          <form onSubmit={handleSubmit} className="p-4">
            <div className="flex items-center gap-3 bg-muted/50 border border-border rounded-xl px-4 py-3">
              <label htmlFor="pdf-upload-input" className="cursor-pointer">
                <Paperclip className="h-5 w-5 text-muted-foreground hover:text-foreground transition-colors" />
                <input
                  id="pdf-upload-input"
                  type="file"
                  accept=".pdf"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleFileUpload(file)
                  }}
                />
              </label>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={
                  pdfFile
                    ? "Faca uma pergunta sobre o documento..."
                    : "Envie um PDF primeiro ou faca uma pergunta geral..."
                }
                className="flex-1 text-sm bg-transparent outline-none text-foreground placeholder:text-muted-foreground"
                disabled={isLoading}
              />
              <Button
                type="submit"
                size="icon"
                className="h-9 w-9 rounded-lg shrink-0"
                disabled={!input.trim() || isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground text-center mt-2">
              CoreAI pode cometer erros. Verifique informacoes importantes.
            </p>
          </form>
        </div>
      </main>
    </div>
  )
}
