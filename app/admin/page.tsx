"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Shield, Loader2, Search, Users, Clock, CreditCard, Activity } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PLAN_LIMITS } from "@/lib/plans"

interface Payment {
  id: string
  status: string
  planId: string
  amountCents: number
  createdAt: string
}

interface UserRow {
  id: string
  name: string | null
  email: string
  isAdmin: boolean
  isSubscribed: boolean
  isApproved: boolean
  isStudent: boolean
  plan: string
  planStartDate: string | null
  planEndDate: string | null
  profession: string | null
  credentialType: string | null
  credential: string | null
  chatRequestsUsed: number
  createdAt: string
  payments: Payment[]
  _count: { patients: number; chatSessions: number }
}

interface Stats {
  pendingApprovals: number
  totalUsers: number
  subscribedUsers: number
  totalRequests: number
}

function Toggle({ checked, onChange, disabled }: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed ${checked ? "bg-foreground" : "bg-border"}`}
    >
      <span className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-background shadow ring-0 transition-transform ${checked ? "translate-x-4" : "translate-x-0"}`} />
    </button>
  )
}

function PaymentBadge({ status }: { status?: string }) {
  if (!status) return <span className="text-xs text-muted-foreground">—</span>
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${status === "completed" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"}`}>
      {status === "completed" ? "Pago" : "Pendente"}
    </span>
  )
}

function ApprovalBadge({ isApproved }: { isApproved: boolean }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${isApproved ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"}`}>
      {isApproved ? "Aprovado" : "Pendente"}
    </span>
  )
}

function fmt(date: string | null) {
  if (!date) return "—"
  return new Date(date).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })
}

const PROFESSION_LABELS: Record<string, string> = {
  MEDICO: "Médico(a)", NUTRICIONISTA: "Nutricionista",
  FISIOTERAPEUTA: "Fisioterapeuta", FARMACEUTICO: "Farmacêutico(a)", OUTRO: "Outro",
}

export default function AdminPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [users, setUsers]   = useState<UserRow[]>([])
  const [stats, setStats]   = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)

  const [search,    setSearch]    = useState("")
  const [planF,     setPlanF]     = useState("all")
  const [approvalF, setApprovalF] = useState("all")
  const [paymentF,  setPaymentF]  = useState("all")
  const [userTypeF, setUserTypeF] = useState("all")

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const fetchUsers = useCallback((s: string, p: string, a: string, pay: string, ut: string) => {
    const params = new URLSearchParams()
    if (s)           params.set("search",   s)
    if (p !== "all") params.set("plan",     p)
    if (a !== "all") params.set("approval", a)
    if (pay !== "all") params.set("payment", pay)
    if (ut !== "all") params.set("userType", ut)
    fetch(`/api/admin/users?${params}`)
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d)) setUsers(d) })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (status === "unauthenticated") { router.replace("/login"); return }
    if (status === "authenticated" && !session.user.isAdmin) { router.replace("/dashboard"); return }
    if (status === "authenticated" && session.user.isAdmin) {
      fetch("/api/admin/stats").then((r) => r.json()).then(setStats)
      fetchUsers(search, planF, approvalF, paymentF, userTypeF)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, session, router])

  function handleSearchChange(value: string) {
    setSearch(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => fetchUsers(value, planF, approvalF, paymentF, userTypeF), 300)
  }

  function handleFilterChange(key: "plan" | "approval" | "payment" | "userType", value: string) {
    const newPlan     = key === "plan"     ? value : planF
    const newApproval = key === "approval" ? value : approvalF
    const newPayment  = key === "payment"  ? value : paymentF
    const newUserType = key === "userType" ? value : userTypeF
    if (key === "plan")     setPlanF(value)
    if (key === "approval") setApprovalF(value)
    if (key === "payment")  setPaymentF(value)
    if (key === "userType") setUserTypeF(value)
    fetchUsers(search, newPlan, newApproval, newPayment, newUserType)
  }

  async function handlePatch(userId: string, field: string, payload: Record<string, unknown>) {
    setUpdating(userId + field)
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (res.ok) {
        const updated = await res.json()
        setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, ...updated } : u))
        if (field === "isApproved" && payload.isApproved) {
          setStats((s) => s ? { ...s, pendingApprovals: Math.max(0, s.pendingApprovals - 1) } : s)
        }
      }
    } finally {
      setUpdating(null)
    }
  }

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="mx-auto max-w-7xl px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-4 w-4" />
              <span className="text-sm">Painel</span>
            </Link>
            <div className="h-4 w-px bg-border" />
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-foreground" />
              <h1 className="font-semibold text-foreground">Admin</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 space-y-6">

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "Aprovações pendentes", value: stats.pendingApprovals, icon: Clock,     color: "text-orange-500" },
              { label: "Total de usuários",    value: stats.totalUsers,       icon: Users,     color: "text-blue-500" },
              { label: "Assinantes ativos",    value: stats.subscribedUsers,  icon: CreditCard,color: "text-green-500" },
              { label: "Análises realizadas",  value: stats.totalRequests,    icon: Activity,  color: "text-purple-500" },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="rounded-xl border border-border bg-card p-4 flex items-center gap-4">
                <div className={`p-2 rounded-lg bg-muted ${color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{value}</p>
                  <p className="text-xs text-muted-foreground">{label}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar por nome ou email..."
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          {([
            { key: "userType", label: "Tipo",      options: [["all","Todos os tipos"],["professional","Profissional"],["student","Estudante"]] },
            { key: "plan",     label: "Plano",     options: [["all","Todos os planos"],["free","FREE"],["essencial","ESSENCIAL"],["profissional","PROFISSIONAL"],["premium","PREMIUM"]] },
            { key: "approval", label: "Aprovação", options: [["all","Todos"],["pending","Pendente"],["approved","Aprovado"]] },
            { key: "payment",  label: "Pagamento", options: [["all","Todos"],["pending","Pendente"],["completed","Pago"]] },
          ] as const).map(({ key, options }) => (
            <select
              key={key}
              value={key === "plan" ? planF : key === "approval" ? approvalF : key === "payment" ? paymentF : userTypeF}
              onChange={(e) => handleFilterChange(key, e.target.value)}
              className="px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          ))}
        </div>

        {/* Table */}
        <div className="rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Usuário</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">Profissão</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Plano</th>
                  <th className="text-center px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Uso</th>
                  <th className="text-center px-4 py-3 font-medium text-muted-foreground">Pagamento</th>
                  <th className="text-center px-4 py-3 font-medium text-muted-foreground">Aprovação</th>
                  <th className="text-center px-4 py-3 font-medium text-muted-foreground">Admin</th>
                  <th className="text-center px-4 py-3 font-medium text-muted-foreground">Ações</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user, i) => (
                  <tr key={user.id} className={`border-b border-border last:border-0 hover:bg-muted/30 transition-colors ${i % 2 === 0 ? "" : "bg-muted/10"}`}>
                    <td className="px-4 py-3">
                      <div className="font-medium text-foreground">{user.name ?? "—"}</div>
                      <div className="text-xs text-muted-foreground">{user.email}</div>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      {user.isStudent ? (
                        <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                          Estudante
                        </span>
                      ) : (
                        <>
                          <div className="text-foreground">{PROFESSION_LABELS[user.profession ?? ""] ?? user.profession ?? "—"}</div>
                          {user.credential && (
                            <div className="text-xs text-muted-foreground">{user.credentialType} {user.credential}</div>
                          )}
                        </>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <div className="font-medium text-foreground capitalize">{user.plan}</div>
                      {user.planStartDate && (
                        <div className="text-xs text-muted-foreground">{fmt(user.planStartDate)} – {fmt(user.planEndDate)}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center hidden md:table-cell">
                      <span className="text-foreground">{user.chatRequestsUsed}</span>
                      <span className="text-muted-foreground">/{PLAN_LIMITS[user.plan] ?? 2}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <PaymentBadge status={user.payments[0]?.status} />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <ApprovalBadge isApproved={user.isApproved} />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex justify-center">
                        <Toggle
                          checked={user.isAdmin}
                          onChange={(v) => handlePatch(user.id, "isAdmin", { isAdmin: v })}
                          disabled={updating === user.id + "isAdmin" || user.id === session?.user.id}
                        />
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {!user.isApproved ? (
                        <Button
                          size="sm"
                          className="h-7 text-xs"
                          disabled={updating === user.id + "isApproved"}
                          onClick={() => handlePatch(user.id, "isApproved", { isApproved: true })}
                        >
                          {updating === user.id + "isApproved" ? <Loader2 className="h-3 w-3 animate-spin" /> : "Aprovar"}
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">
                      Nenhum usuário encontrado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  )
}
