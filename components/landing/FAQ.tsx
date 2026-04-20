import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

const faqs = [
  {
    question: "Para quem a CoreAI foi criada?",
    answer: `A CoreAI foi desenvolvida especialmente para profissionais da área da saúde que precisam de agilidade, precisão e embasamento científico na prática clínica — como nutricionistas, médicos, farmacêuticos, biomédicos, enfermeiros, endocrinologistas e outros profissionais que trabalham com análise de exames, interpretação de laudos, condutas clínicas e tomada de decisão baseada em evidências.

Ela também é ideal para quem atua com leitura de exames laboratoriais, interação fármaco-nutriente, suplementação, metabolismo, inflamação, saúde hormonal e acompanhamento clínico individualizado.`,
  },
  {
    question: "Qual a diferença entre a CoreAI e uma inteligência artificial comum?",
    answer: `A principal diferença está na confiabilidade clínica e no embasamento científico.

Enquanto uma inteligência artificial comum pode gerar respostas genéricas, sem fontes claras e até com informações imprecisas, a CoreAI foi desenvolvida e alimentada com artigos científicos, guidelines, diretrizes atualizadas e literatura técnica confiável.

Além disso, você não precisa criar prompts complexos para obter respostas boas. A CoreAI já foi treinada para entender a lógica clínica e responder com profundidade, contexto e direcionamento profissional. Todas as respostas podem ser rastreadas com base científica, trazendo mais segurança para sua prática clínica e confiança na tomada de decisão.`,
  },
  {
    question: "Como a CoreAI facilita a rotina no consultório?",
    answer: `A CoreAI foi desenvolvida para facilitar e otimizar o tempo do profissional na prática clínica.

Ela permite uma análise mais rápida e estratégica de exames laboratoriais, interpretação de resultados, avaliação de interações fármaco-nutriente, suplementação, metabolismo, inflamação e saúde hormonal, sempre com embasamento científico.

Além disso, ela auxilia na pesquisa e interpretação de artigos científicos, guidelines e diretrizes atualizadas, tornando o acesso à informação mais prático, organizado e aplicável durante o atendimento.

Isso deixa a consulta mais dinâmica, mais segura e mais eficiente, permitindo que o profissional tenha mais clareza na conduta clínica e ofereça um atendimento mais completo e personalizado ao paciente.`,
  },
  {
    question: "A CoreAI gera laudos e materiais para entregar ao paciente?",
    answer: `Sim. Esse é um dos maiores diferenciais da CoreAI.

Além da análise clínica, a plataforma gera um laudo didático e visualmente mais compreensível para o paciente, facilitando a explicação de exames laboratoriais, scores metabólicos, inflamatórios, hormonais e outros indicadores importantes.

Isso melhora muito a experiência da consulta, aumenta a percepção de valor do atendimento e fortalece a adesão ao tratamento.

Quando o paciente entende o que está acontecendo com o próprio corpo, ele tende a seguir melhor o plano proposto e se comprometer mais com os resultados.`,
  },
  {
    question: "A CoreAI substitui o profissional da saúde?",
    answer: `Não. A CoreAI não substitui o profissional — ela potencializa sua atuação.

A decisão clínica continua sendo do profissional. A inteligência artificial funciona como uma ferramenta de apoio, oferecendo rapidez, organização de informações e embasamento técnico para tornar a conduta mais segura e eficiente.

Ela não tira autonomia; ela aumenta performance.

É como ter uma assistente clínica altamente especializada trabalhando junto com você.`,
  },
  {
    question: "Preciso saber tecnologia ou criar comandos complexos para usar?",
    answer: `Não. A CoreAI foi pensada para ser simples, intuitiva e prática.

Você não precisa entender de tecnologia avançada nem aprender prompts complicados para usar a plataforma. Basta enviar exames, artigos ou fazer perguntas da forma natural como você já faria no consultório.

A proposta da CoreAI é justamente eliminar barreiras e transformar conhecimento técnico em acesso rápido, inteligente e aplicável no dia a dia clínico — com envio de documentos, perguntas diretas e respostas contextualizadas sem necessidade de configuração complexa.`,
  },
]

export function FAQ() {
  return (
    <section id="faq" className="py-24 lg:py-32 bg-muted/30">
      <div className="mx-auto max-w-3xl px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground text-balance">
            Perguntas Frequentes
          </h2>
          <p className="mt-4 text-lg text-muted-foreground text-pretty">
            Tire suas dúvidas sobre a CoreAI.
          </p>
        </div>

        <Accordion type="single" collapsible className="space-y-3">
          {faqs.map((faq, i) => (
            <AccordionItem
              key={i}
              value={`item-${i}`}
              className="bg-background border border-border rounded-2xl px-6 data-[state=open]:border-foreground/20 transition-colors"
            >
              <AccordionTrigger className="text-left text-base font-semibold text-foreground hover:no-underline py-5">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="pb-5">
                <div className="space-y-3">
                  {faq.answer.split("\n\n").map((paragraph, j) => (
                    <p key={j} className="text-sm text-muted-foreground leading-relaxed">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  )
}
