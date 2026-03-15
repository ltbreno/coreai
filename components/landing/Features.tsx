import { FileSearch, Brain, Lightbulb, Target } from "lucide-react"

const features = [
  {
    icon: FileSearch,
    title: "Análise de documentos",
    description: "Interprete artigos científicos e relatórios médicos rapidamente.",
  },
  {
    icon: Brain,
    title: "IA especializada",
    description: "Treinada para responder dúvidas clínicas e nutricionais.",
  },
  {
    icon: Lightbulb,
    title: "Follow-ups inteligentes",
    description: "A IA sugere novas perguntas relevantes.",
  },
  {
    icon: Target,
    title: "Respostas contextualizadas",
    description: "Baseadas diretamente no conteúdo do documento enviado.",
  },
]

export function Features() {
  return (
    <section id="beneficios" className="py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground text-balance">
            Benefícios
          </h2>
          <p className="mt-4 text-lg text-muted-foreground text-pretty">
            Ferramentas poderosas para profissionais da saúde que precisam de respostas rápidas e precisas.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group relative bg-background border border-border rounded-2xl p-6 hover:border-foreground/20 transition-all duration-300"
            >
              <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-muted text-foreground mb-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
                <feature.icon className="h-6 w-6" />
              </div>

              <h3 className="text-lg font-semibold text-foreground mb-2">
                {feature.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
