"use client"

import { useState, useEffect } from "react"
import { FileText, Send } from "lucide-react"

const mockMessages = [
  {
    role: "user" as const,
    content: "Quais alimentos são ricos em vitamina C?",
  },
  {
    role: "assistant" as const,
    content: `Principais alimentos ricos em vitamina C:

• **Acerola** — até 1.677mg por 100g
• **Laranja** — 53mg por 100g
• **Kiwi** — 93mg por 100g
• **Morango** — 59mg por 100g
• **Pimentão** — 128mg por 100g`,
    followUps: [
      "Qual a ingestão diária recomendada?",
      "Esses alimentos ajudam na imunidade?",
    ],
  },
]

export function ChatPreview() {
  const [displayedMessages, setDisplayedMessages] = useState<typeof mockMessages>([])
  const [showFollowUps, setShowFollowUps] = useState(false)

  useEffect(() => {
    const timer1 = setTimeout(() => {
      setDisplayedMessages([mockMessages[0]])
    }, 500)

    const timer2 = setTimeout(() => {
      setDisplayedMessages(mockMessages)
    }, 1500)

    const timer3 = setTimeout(() => {
      setShowFollowUps(true)
    }, 2500)

    return () => {
      clearTimeout(timer1)
      clearTimeout(timer2)
      clearTimeout(timer3)
    }
  }, [])

  return (
    <div className="relative w-full max-w-md mx-auto lg:mx-0">
      <div className="absolute inset-0 bg-gradient-to-br from-muted/50 to-muted rounded-2xl blur-xl" />
      <div className="relative bg-background border border-border rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-muted/30">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <FileText className="h-4 w-4" />
            <span className="font-medium">vitamina-c-estudo.pdf</span>
          </div>
          <div className="ml-auto flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-green-500" />
            <span className="text-xs text-muted-foreground">Conectado</span>
          </div>
        </div>

        {/* Chat Messages */}
        <div className="p-4 space-y-4 min-h-[300px] bg-background">
          {displayedMessages.map((message, index) => (
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

          {showFollowUps && displayedMessages[1]?.followUps && (
            <div className="space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-500">
              <p className="text-xs text-muted-foreground font-medium">
                Perguntas sugeridas
              </p>
              <div className="flex flex-wrap gap-2">
                {displayedMessages[1].followUps.map((followUp, index) => (
                  <button
                    key={index}
                    className="text-xs px-3 py-1.5 rounded-full border border-border bg-background hover:bg-muted transition-colors text-foreground"
                  >
                    {followUp}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="px-4 py-3 border-t border-border bg-muted/20">
          <div className="flex items-center gap-2 bg-background border border-border rounded-xl px-4 py-2">
            <input
              type="text"
              placeholder="Faça uma pergunta..."
              className="flex-1 text-sm bg-transparent outline-none text-foreground placeholder:text-muted-foreground"
              disabled
            />
            <button className="p-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
