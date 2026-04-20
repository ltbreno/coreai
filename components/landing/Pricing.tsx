"use client"

import { useState } from "react"
import { Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PricingModal } from "./PricingModal"
import Link from "next/link"

export interface Plan {
  id: string
  name: string
  originalPrice: string | null
  price: string
  period: string
  analyses: number
  features: string[]
  highlighted: boolean
  badge?: string
  amountCents: number
}

const PLANS: Plan[] = [
  {
    id: "free",
    name: "FREE",
    originalPrice: null,
    price: "Grátis",
    period: "",
    analyses: 2,
    features: ["2 Análises"],
    highlighted: false,
    amountCents: 0,
  },
  {
    id: "essencial",
    name: "ESSENCIAL",
    originalPrice: "R$ 49,90",
    price: "R$ 29,90",
    period: "/mês",
    analyses: 15,
    features: ["15 análises", "Histórico básico"],
    highlighted: false,
    badge: "-40%",
    amountCents: 2990,
  },
  {
    id: "profissional",
    name: "PROFISSIONAL",
    originalPrice: "R$ 79,90",
    price: "R$ 59,90",
    period: "/mês",
    analyses: 35,
    features: [
      "35 análises",
      "Dashboard completo",
      "Gestão de pacientes",
      "Relatório gráfico em PDF",
    ],
    highlighted: true,
    badge: "Mais popular",
    amountCents: 5990,
  },
  {
    id: "premium",
    name: "PREMIUM",
    originalPrice: "R$ 109,90",
    price: "R$ 89,90",
    period: "/mês",
    analyses: 60,
    features: [
      "60 análises",
      "Chatbot Interativo",
      "Gestão de pacientes",
      "Relatório gráfico em PDF",
    ],
    highlighted: false,
    badge: "-18%",
    amountCents: 8990,
  },
]

export function Pricing() {
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null)

  return (
    <section id="planos" className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center mb-16">
          <p className="text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-3">
            Planos Mensais
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
            Escolha o plano ideal
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Comece gratuitamente e escale conforme sua necessidade.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 items-start">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`relative rounded-2xl border p-7 flex flex-col gap-5 transition-shadow ${
                plan.highlighted
                  ? "border-foreground bg-foreground text-background shadow-2xl scale-[1.03]"
                  : "border-border bg-card hover:shadow-md"
              }`}
            >
              {/* Badge */}
              {plan.badge && (
                <span
                  className={`absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${
                    plan.highlighted
                      ? "bg-background text-foreground"
                      : "bg-foreground text-background"
                  }`}
                >
                  {plan.badge}
                </span>
              )}

              {/* Plan name */}
              <p
                className={`text-xs font-bold tracking-widest uppercase ${
                  plan.highlighted ? "text-background/70" : "text-muted-foreground"
                }`}
              >
                {plan.name}
              </p>

              {/* Pricing */}
              <div>
                {plan.originalPrice && (
                  <p
                    className={`text-sm line-through mb-0.5 ${
                      plan.highlighted ? "text-background/50" : "text-muted-foreground/60"
                    }`}
                  >
                    {plan.originalPrice}
                  </p>
                )}
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold">{plan.price}</span>
                  {plan.period && (
                    <span
                      className={`text-sm ${
                        plan.highlighted ? "text-background/70" : "text-muted-foreground"
                      }`}
                    >
                      {plan.period}
                    </span>
                  )}
                </div>
              </div>

              {/* Features */}
              <ul className="flex flex-col gap-2.5 flex-1">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <Check
                      className={`h-3.5 w-3.5 mt-0.5 shrink-0 ${
                        plan.highlighted ? "text-background" : "text-foreground"
                      }`}
                    />
                    <span
                      className={`text-sm ${
                        plan.highlighted ? "text-background/90" : "text-foreground/80"
                      }`}
                    >
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              {plan.id === "free" ? (
                <Button
                  asChild
                  variant={plan.highlighted ? "secondary" : "default"}
                  className={`w-full mt-1 ${
                    plan.highlighted ? "bg-background text-foreground hover:bg-background/90" : ""
                  }`}
                >
                  <Link href="/registro">Começar grátis</Link>
                </Button>
              ) : (
                <Button
                  variant={plan.highlighted ? "secondary" : "default"}
                  className={`w-full mt-1 ${
                    plan.highlighted ? "bg-background text-foreground hover:bg-background/90" : ""
                  }`}
                  onClick={() => setSelectedPlan(plan)}
                >
                  Assinar agora
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>

      {selectedPlan && (
        <PricingModal plan={selectedPlan} onClose={() => setSelectedPlan(null)} />
      )}
    </section>
  )
}
