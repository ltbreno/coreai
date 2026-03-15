import { Upload, MessageSquare, Sparkles } from "lucide-react"

const steps = [
  {
    step: "01",
    icon: Upload,
    title: "Envie seu documento",
    description: "Faça upload de artigos científicos ou PDFs médicos.",
  },
  {
    step: "02",
    icon: MessageSquare,
    title: "Faça perguntas",
    description: "Pergunte qualquer coisa sobre o conteúdo.",
  },
  {
    step: "03",
    icon: Sparkles,
    title: "Receba respostas inteligentes",
    description: "A IA analisa o documento e responde com contexto e follow-ups.",
  },
]

export function HowItWorks() {
  return (
    <section id="como-funciona" className="py-24 lg:py-32 bg-muted/30">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground text-balance">
            Como funciona
          </h2>
          <p className="mt-4 text-lg text-muted-foreground text-pretty">
            Três passos simples para transformar documentos médicos em conhecimento acessível.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
          {steps.map((item, index) => (
            <div key={index} className="relative group">
              {/* Connector line */}
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-12 left-[60%] w-[80%] h-px bg-border" />
              )}

              <div className="relative bg-background border border-border rounded-2xl p-8 hover:shadow-lg transition-shadow duration-300">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-primary text-primary-foreground">
                    <item.icon className="h-6 w-6" />
                  </div>
                  <span className="text-5xl font-bold text-muted-foreground/20">
                    {item.step}
                  </span>
                </div>

                <h3 className="text-xl font-semibold text-foreground mb-2">
                  {item.title}
                </h3>
                <p className="text-muted-foreground">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
