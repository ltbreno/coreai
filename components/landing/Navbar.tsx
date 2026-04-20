"use client"

import { useState } from "react"
import Link from "next/link"
import { Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useSession, signOut } from "next-auth/react"

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const { data: session } = useSession()

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-xl font-semibold tracking-tight text-foreground">
                CoreAI
              </span>
            </Link>

            <div className="hidden md:flex items-center gap-6">
              <Link
                href="#como-funciona"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Como funciona
              </Link>
              <Link
                href="#beneficios"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Benefícios
              </Link>
              <Link
                href="#planos"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Planos
              </Link>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-2">
            {session ? (
              <>
                {session.user.isAdmin && (
                  <Link href="/admin">
                    <Button variant="ghost" size="sm" className="text-muted-foreground">Admin</Button>
                  </Link>
                )}
                <Link href="/dashboard">
                  <Button variant="outline" size="sm">Meu painel</Button>
                </Link>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-muted-foreground"
                  onClick={() => signOut({ callbackUrl: "/" })}
                >
                  Sair
                </Button>
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="outline" size="sm">Entrar</Button>
                </Link>
                <Link href="/registro">
                  <Button size="sm" className="font-medium">Começar agora</Button>
                </Link>
              </>
            )}
          </div>

          <button
            className="md:hidden p-2 text-foreground"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle menu"
          >
            {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {isOpen && (
          <div className="md:hidden py-4 border-t border-border">
            <div className="flex flex-col gap-4">
              <Link
                href="#como-funciona"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => setIsOpen(false)}
              >
                Como funciona
              </Link>
              <Link
                href="#beneficios"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => setIsOpen(false)}
              >
                Benefícios
              </Link>
              <Link
                href="#testar"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => setIsOpen(false)}
              >
                Testar
              </Link>
              {session ? (
                <div className="flex flex-col gap-2">
                  <Link href="/dashboard" onClick={() => setIsOpen(false)}>
                    <Button variant="outline" size="sm" className="w-fit">Meu painel</Button>
                  </Link>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="w-fit text-muted-foreground"
                    onClick={() => signOut({ callbackUrl: "/" })}
                  >
                    Sair
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <Link href="/login" onClick={() => setIsOpen(false)}>
                    <Button variant="outline" size="sm" className="w-fit">Entrar</Button>
                  </Link>
                  <Link href="/registro" onClick={() => setIsOpen(false)}>
                    <Button size="sm" className="font-medium w-fit">Começar agora</Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
