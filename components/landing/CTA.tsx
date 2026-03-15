import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"

export function CTA() {
  return (
    <section id="testar" className="py-24 lg:py-32 bg-muted/30">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-primary px-8 py-16 sm:px-16 sm:py-24 lg:px-24">
          {/* Background pattern */}
          <div className="absolute inset-0 -z-10">
            <svg
              className="absolute inset-0 h-full w-full stroke-primary-foreground/10"
              fill="none"
            >
              <defs>
                <pattern
                  id="cta-pattern"
                  width="40"
                  height="40"
                  patternUnits="userSpaceOnUse"
                >
                  <path d="M.5 40V.5H40" fill="none" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" strokeWidth="0" fill="url(#cta-pattern)" />
            </svg>
          </div>

          <div className="relative text-center max-w-2xl mx-auto">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-primary-foreground text-balance">
              Transforme documentos médicos em conhecimento instantâneo
            </h2>

            <p className="mt-6 text-lg text-primary-foreground/80 text-pretty">
              Comece a usar o CoreAI hoje e acelere sua análise de documentos clínicos.
            </p>

            <div className="mt-10">
              <Button
                size="lg"
                variant="secondary"
                className="font-medium gap-2"
              >
                Começar agora
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
