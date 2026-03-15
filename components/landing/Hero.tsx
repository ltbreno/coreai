import { Button } from "@/components/ui/button"
import { ChatPreview } from "./ChatPreview"
import { ArrowRight, Play } from "lucide-react"
import Link from "next/link"

export function Hero() {
  return (
    <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-32 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.1),transparent)]" />
      </div>

      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Content */}
          <div className="text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-muted/50 mb-6">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
              <span className="text-xs font-medium text-muted-foreground">
                IA para profissionais da saúde
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground text-balance">
              CoreAI
            </h1>

            <p className="mt-4 text-xl sm:text-2xl font-medium text-foreground/80 text-balance">
              A IA que analisa documentos médicos e responde suas dúvidas clínicas.
            </p>

            <p className="mt-6 text-base sm:text-lg text-muted-foreground max-w-xl mx-auto lg:mx-0 text-pretty">
              Envie artigos científicos, exames ou estudos e converse com uma inteligência artificial treinada para responder perguntas médicas com contexto.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
              <Button size="lg" className="font-medium w-full sm:w-auto gap-2" asChild>
                <Link href="/chat">
                  Comece agora
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="font-medium w-full sm:w-auto gap-2"
              >
                <Play className="h-4 w-4" />
                Ver demonstracao
              </Button>
            </div>

            <div className="mt-12 flex items-center gap-6 justify-center lg:justify-start text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <svg className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Sem configuração</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Dados seguros</span>
              </div>
            </div>
          </div>

          {/* Chat Preview */}
          <div className="flex justify-center lg:justify-end">
            <ChatPreview />
          </div>
        </div>
      </div>
    </section>
  )
}
