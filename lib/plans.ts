export const PLAN_LIMITS: Record<string, number> = {
  free:         2,
  essencial:    15,
  profissional: 35,
  premium:      60,
}

export const PLAN_AMOUNTS_CENTS: Record<string, number> = {
  essencial:    2990,
  profissional: 5990,
  premium:      8990,
}

export function getPlanLimit(plan: string): number {
  return PLAN_LIMITS[plan] ?? 2
}

export function isPaidPlan(plan: string): boolean {
  return plan !== "free"
}
