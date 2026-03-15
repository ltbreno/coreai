"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { FileText, Send, Upload, X, Loader2, Paperclip } from "lucide-react"
import { Button } from "@/components/ui/button"
import { 
  sendChatMessage, 
  generateSessionId, 
  generateUserId, 
  fileToBase64,
  type ChatResponse 
} from "@/lib/api"

interface Message {
  role: "user" | "assistant"
  content: string
  followUps?: string[]
}

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [pdfBase64, setPdfBase64] = useState<string | null>(null)
  const [sessionId] = useState(() => generateSessionId())
  const [userId] = useState(() => generateUserId())
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleFileUpload = async (file: File) => {
    if (file.type !== "application/pdf") {
      alert("Por favor, envie apenas arquivos PDF.")
      return
    }
    
    setPdfFile(file)
    const base64 = await fileToBase64(file)
    setPdfBase64(base64)
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) {
      handleFileUpload(file)
    }
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
  }, [])

  const removePdf = () => {
    setPdfFile(null)
    setPdfBase64(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage = input.trim()
    setInput("")
    setMessages((prev) => [...prev, { role: "user", content: userMessage }])
    setIsLoading(true)

    try {
      const response: ChatResponse = await sendChatMessage({
        chat_input: userMessage,
        metadata: {
          pdf_base64: pdfBase64 || undefined,
        },
        session_id: sessionId,
        user_id: userId,
      })

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: response.response,
          followUps: response.follow_ups,
        },
      ])
    } catch (error) {
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

  const handleFollowUp = (question: string) => {
    setInput(question)
  }

  return (
    <section id="chat" className="py-20 lg:py-32 bg-muted/30">
      <div className="mx-auto max-w-4xl px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
            Converse com a CoreAI
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            Faça upload de um documento PDF e comece a fazer perguntas.
          </p>
        </div>

        <div className="bg-background border border-border rounded-2xl shadow-xl overflow-hidden">
          {/* Header with PDF status */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
            <div className="flex items-center gap-3">
              {pdfFile ? (
                <div className="flex items-center gap-2 text-sm">
                  <FileText className="h-4 w-4 text-primary" />
                  <span className="font-medium text-foreground truncate max-w-[200px]">
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
              ) : (
                <span className="text-sm text-muted-foreground">
                  Nenhum documento carregado
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-green-500" />
              <span className="text-xs text-muted-foreground">Online</span>
            </div>
          </div>

          {/* Messages area */}
          <div 
            className="p-4 space-y-4 min-h-[400px] max-h-[500px] overflow-y-auto"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          >
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[350px] text-center">
                {!pdfFile ? (
                  <label
                    htmlFor="pdf-upload"
                    className="cursor-pointer group"
                  >
                    <div className="flex flex-col items-center gap-4 p-8 border-2 border-dashed border-border rounded-xl hover:border-primary/50 hover:bg-muted/50 transition-colors">
                      <div className="p-4 bg-muted rounded-full group-hover:bg-primary/10 transition-colors">
                        <Upload className="h-8 w-8 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">
                          Arraste um PDF ou clique para fazer upload
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Artigos, exames, estudos clínicos
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
                ) : (
                  <div className="flex flex-col items-center gap-4">
                    <div className="p-4 bg-primary/10 rounded-full">
                      <FileText className="h-8 w-8 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">
                        Documento carregado!
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Faça sua primeira pergunta abaixo.
                      </p>
                    </div>
                  </div>
                )}
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
                          : "bg-muted text-foreground"
                      }`}
                    >
                      <p className="text-sm whitespace-pre-line">{message.content}</p>
                    </div>
                  </div>
                ))}

                {/* Follow-up suggestions */}
                {messages.length > 0 &&
                  messages[messages.length - 1].role === "assistant" &&
                  messages[messages.length - 1].followUps && (
                    <div className="space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-500">
                      <p className="text-xs text-muted-foreground font-medium">
                        Perguntas sugeridas
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {messages[messages.length - 1].followUps?.map((followUp, index) => (
                          <button
                            key={index}
                            onClick={() => handleFollowUp(followUp)}
                            className="text-xs px-3 py-1.5 rounded-full border border-border bg-background hover:bg-muted transition-colors text-foreground"
                          >
                            {followUp}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-muted rounded-2xl px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          Analisando...
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input area */}
          <form onSubmit={handleSubmit} className="px-4 py-3 border-t border-border bg-muted/20">
            <div className="flex items-center gap-2 bg-background border border-border rounded-xl px-4 py-2">
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
                placeholder={pdfFile ? "Faça uma pergunta sobre o documento..." : "Envie um PDF primeiro ou faça uma pergunta geral..."}
                className="flex-1 text-sm bg-transparent outline-none text-foreground placeholder:text-muted-foreground"
                disabled={isLoading}
              />
              <Button
                type="submit"
                size="icon"
                className="h-8 w-8 rounded-lg"
                disabled={!input.trim() || isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </section>
  )
}
