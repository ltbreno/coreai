export function normalizeCouponCode(code: string): string {
  return code.trim().toUpperCase()
}

export function getCouponPlanDates(durationDays: number) {
  const now = new Date()
  const planEndDate = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000)

  return {
    now,
    planEndDate,
  }
}
