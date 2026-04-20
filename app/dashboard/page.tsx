import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import Link from "next/link"
import { MessageSquare, Users, Plus, ArrowRight, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { DashboardSignOut } from "@/components/DashboardSignOut"

interface RecentSession {
  id: string
  title: string | null
  createdAt: Date
  updatedAt: Date
  patient: { id: string; name: string } | null
}

function ApprovalPendingScreen({ name, email }: { name?: string | null; email: string }) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="text-center max-w-md space-y-4">
        <div className="mx-auto w-16 h-16 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
          <svg className="h-8 w-8 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h1 className="text-xl font-semibold text-foreground">Aguardando aprovação</h1>
        <p className="text-sm text-muted-foreground">
          Olá{name ? `, ${name}` : ""}! Sua conta ({email}) está sendo verificada. Você receberá acesso assim que o administrador aprovar suas credenciais profissionais.
        </p>
      </div>
    </div>
  )
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect("/login")

  if (!session.user.isApproved && !session.user.isAdmin) {
    return <ApprovalPendingScreen name={session.user.name} email={session.user.email} />
  }

  const [patientCount, recentSessions] = await Promise.all([
    prisma.patient.count({ where: { userId: session.user.id } }),
    prisma.chatSession.findMany({
      where: { userId: session.user.id },
      orderBy: { updatedAt: "desc" },
      take: 10,
      select: {
        id: true,
        title: true,
        createdAt: true,
        updatedAt: true,
        patient: { select: { id: true, name: true } },
      },
    }),
  ])

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="mx-auto max-w-5xl px-4 py-4 flex items-center justify-between">
          <Link href="/" className="font-semibold text-lg">CoreAI</Link>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground hidden sm:block">
              {session.user.name ?? session.user.email}
            </span>
            <DashboardSignOut />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8 space-y-8">
        <div>
          <h1 className="text-2xl font-bold">
            Olá, {session.user.name ?? "doutor(a)"}
          </h1>
          <p className="text-muted-foreground mt-1">Bem-vindo ao seu painel de controle</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-full">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{patientCount}</p>
                <p className="text-sm text-muted-foreground">Pacientes cadastrados</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-full">
                <MessageSquare className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{recentSessions.length}</p>
                <p className="text-sm text-muted-foreground">Consultas recentes</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick actions */}
        <div className="flex flex-wrap gap-3">
          <Link href="/chat">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Nova consulta
            </Button>
          </Link>
          <Link href="/pacientes">
            <Button variant="outline" className="gap-2">
              <Users className="h-4 w-4" />
              Ver pacientes
            </Button>
          </Link>
          <Link href="/pacientes">
            <Button variant="outline" className="gap-2">
              <Plus className="h-4 w-4" />
              Novo paciente
            </Button>
          </Link>
        </div>

        {/* Recent sessions */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Consultas recentes</CardTitle>
            <Link href="/chat" className="text-sm text-primary hover:underline flex items-center gap-1">
              Nova consulta <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </CardHeader>
          <CardContent>
            {recentSessions.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground mb-4">
                  Nenhuma consulta realizada ainda
                </p>
                <Link href="/chat">
                  <Button size="sm" className="gap-1.5">
                    <MessageSquare className="h-4 w-4" />
                    Iniciar primeira consulta
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {(recentSessions as RecentSession[]).map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <MessageSquare className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">
                          {s.title ?? "Consulta sem título"}
                        </p>
                        {s.patient && (
                          <p className="text-xs text-muted-foreground truncate">
                            Paciente: {s.patient.name}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0 ml-2">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(s.updatedAt), "dd/MM/yyyy", { locale: ptBR })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
