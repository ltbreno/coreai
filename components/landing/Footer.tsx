import Link from "next/link"

const footerLinks = [
  { label: "Produto", href: "#" },
  { label: "Privacidade", href: "#" },
  { label: "Contato", href: "#" },
]

export function Footer() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto max-w-7xl px-6 lg:px-8 py-12">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <span className="text-lg font-semibold tracking-tight text-foreground">
              CoreAI
            </span>
          </div>

          <nav className="flex items-center gap-6">
            {footerLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} CoreAI. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  )
}
