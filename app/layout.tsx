import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SessionProviderWrapper } from "@/components/SessionProviderWrapper";
import "./globals.css";

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "CoreAI — IA para Análise de Documentos Médicos",
  description:
    "Envie artigos científicos, exames ou estudos e converse com uma inteligência artificial treinada para responder perguntas médicas com contexto.",
  generator: "v0.app",
  icons: {
    icon: "/favicon-coreai.png",
    apple: "/favicon-coreai.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <SessionProviderWrapper>
          {children}
          <Analytics />
        </SessionProviderWrapper>
      </body>
    </html>
  );
}
