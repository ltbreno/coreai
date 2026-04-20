import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { addMonths } from "date-fns";
import { getPlanLimit, isPaidPlan } from "@/lib/plans";

interface ChatRequestBody {
  chat_input: string;
  metadata: Record<string, unknown>;
  session_id: string;
  user_id: string;
  dbSessionId?: string;
  pdfFilename?: string;
  pdf_base64?: string;
  idade?: number;
  sexo?: "M" | "F";
  alergias?: string[];
  remedios?: string[];
}

async function persistMessages(
  dbSessionId: string,
  userId: string,
  userContent: string,
  assistantContent: string,
  followUps: string[],
) {
  const chatSession = await prisma.chatSession.findFirst({
    where: { id: dbSessionId, userId },
  });
  if (!chatSession) return;

  await prisma.$transaction([
    prisma.message.create({
      data: {
        sessionId: dbSessionId,
        role: "user",
        content: userContent,
        followUps: [],
      },
    }),
    prisma.message.create({
      data: {
        sessionId: dbSessionId,
        role: "assistant",
        content: assistantContent,
        followUps,
      },
    }),
  ]);

  if (!chatSession.title) {
    const title =
      userContent.slice(0, 60) + (userContent.length > 60 ? "..." : "");
    await prisma.chatSession.update({
      where: { id: dbSessionId },
      data: { title, updatedAt: new Date() },
    });
  } else {
    await prisma.chatSession.update({
      where: { id: dbSessionId },
      data: { updatedAt: new Date() },
    });
  }
}

export async function POST(request: NextRequest) {
  const authSession = await getServerSession(authOptions);
  if (!authSession?.user?.id) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: authSession.user.id },
    select: { plan: true, isApproved: true, chatRequestsUsed: true, chatRequestsResetAt: true },
  });

  if (!dbUser) {
    return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
  }

  if (!dbUser.isApproved) {
    return NextResponse.json(
      { error: "Sua conta está aguardando aprovação do administrador." },
      { status: 403 }
    );
  }

  const now = new Date();
  let requestsUsed = dbUser.chatRequestsUsed;

  if (isPaidPlan(dbUser.plan) && dbUser.chatRequestsResetAt && dbUser.chatRequestsResetAt < now) {
    await prisma.user.update({
      where: { id: authSession.user.id },
      data: { chatRequestsUsed: 0, chatRequestsResetAt: addMonths(now, 1) },
    });
    requestsUsed = 0;
  }

  const limit = getPlanLimit(dbUser.plan);
  if (requestsUsed >= limit) {
    return NextResponse.json(
      { error: `Você atingiu o limite de ${limit} análises do plano ${dbUser.plan}. Faça upgrade para continuar.` },
      { status: 403 }
    );
  }

  let body: ChatRequestBody;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({
      response: generateMockResponse("", undefined),
      followUpQuestions: generateFollowUps(""),
    });
  }

  const {
    chat_input,
    session_id,
    user_id,
    dbSessionId,
    pdfFilename,
    pdf_base64,
    idade,
    sexo,
    alergias,
    remedios,
  } = body;

  try {
    const apiUrl = "https://core-ai-production-c3aa.up.railway.app/api/v1/chat";
    let payload: Record<string, unknown>;

    if (pdf_base64 && pdf_base64.length > 0) {
      payload = {
        pdf_base64,
        session_id,
        user_id,
        sexo,
        idade,
        alergias: alergias || [],
        remedios: remedios || [],
      };
    } else if (chat_input && chat_input.trim().length > 0) {
      payload = { chat_input, session_id, user_id };
    } else {
      return NextResponse.json({
        response: "Por favor, envie um PDF ou uma pergunta.",
        followUpQuestions: [],
      });
    }

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = response.ok
      ? await response.json()
      : {
          response: generateMockResponse(chat_input, pdf_base64),
          followUpQuestions: generateFollowUps(chat_input),
        };

    if (dbSessionId) {
      const userContent = pdf_base64
        ? `[PDF enviado${pdfFilename ? `: ${pdfFilename}` : ""}]`
        : chat_input;
      await persistMessages(
        dbSessionId,
        authSession.user.id,
        userContent,
        data.response ?? "",
        data.followUpQuestions ?? [],
      ).catch(() => {});
    }

    await prisma.user.update({
      where: { id: authSession.user.id },
      data: { chatRequestsUsed: { increment: 1 } },
    }).catch(() => {});

    return NextResponse.json(data);
  } catch {
    return NextResponse.json({
      response: generateMockResponse(chat_input, pdf_base64),
      followUpQuestions: generateFollowUps(chat_input),
    });
  }
}

function generateMockResponse(question: string, hasPdf?: string): string {
  const lowerQuestion = question.toLowerCase();

  if (hasPdf) {
    if (lowerQuestion.includes("resumo") || lowerQuestion.includes("resumir")) {
      return `Com base no documento enviado, posso identificar os seguintes pontos principais:

**Tema Central:** O documento aborda aspectos relevantes da área médica relacionados à sua pergunta.

**Principais Achados:**
• Análise detalhada dos dados apresentados
• Correlação com literatura científica atual
• Implicações clínicas relevantes

**Conclusão:** O documento fornece informações importantes para a prática clínica. Posso detalhar qualquer seção específica se desejar.`;
    }

    return `Analisando o documento enviado em relação à sua pergunta sobre "${question}":

**Informações Encontradas:**
O documento contém dados relevantes que podem auxiliar na compreensão do tema. A análise sugere que existem evidências científicas que suportam diferentes abordagens terapêuticas.

**Recomendação:**
Para uma análise mais aprofundada, sugiro que faça perguntas específicas sobre seções ou tópicos do documento.

*Nota: Esta é uma resposta demonstrativa. Em produção, a IA analisará o conteúdo real do PDF.*`;
  }

  if (
    lowerQuestion.includes("vitamina") ||
    lowerQuestion.includes("nutriente")
  ) {
    return `**Sobre vitaminas e nutrientes:**

As vitaminas são micronutrientes essenciais para diversas funções metabólicas. Elas são classificadas em:

• **Lipossolúveis:** A, D, E, K - armazenadas no tecido adiposo
• **Hidrossolúveis:** Complexo B e C - excretadas na urina

A ingestão adequada depende de uma dieta balanceada. Em casos específicos, a suplementação pode ser indicada sob orientação médica.`;
  }

  if (
    lowerQuestion.includes("exame") ||
    lowerQuestion.includes("diagnóstico")
  ) {
    return `**Sobre exames diagnósticos:**

A interpretação de exames laboratoriais deve considerar:

• Valores de referência específicos do laboratório
• Contexto clínico do paciente
• Medicamentos em uso
• Condições pré-analíticas

Recomendo enviar o documento do exame para uma análise mais detalhada e contextualizada.`;
  }

  return `**Resposta sobre: ${question}**

Para fornecer uma resposta mais precisa e contextualizada, recomendo:

1. **Enviar um documento PDF** com artigos científicos, exames ou estudos relacionados
2. **Fazer perguntas específicas** sobre o conteúdo do documento

A CoreAI é especializada em analisar documentos médicos e fornecer respostas baseadas em evidências científicas.

*Esta é uma demonstração. Em produção, a IA fornecerá respostas completas baseadas nos documentos enviados.*`;
}

function generateFollowUps(question: string): string[] {
  const lowerQuestion = question.toLowerCase();

  if (lowerQuestion.includes("vitamina")) {
    return [
      "Qual a dosagem diária recomendada?",
      "Quais são os sinais de deficiência?",
      "Existem interações medicamentosas?",
    ];
  }

  if (lowerQuestion.includes("exame")) {
    return [
      "Como interpretar os valores alterados?",
      "Quando repetir o exame?",
      "Quais outros exames complementares?",
    ];
  }

  return [
    "Pode detalhar mais sobre este tema?",
    "Quais são as referências científicas?",
    "Existem contraindicações?",
  ];
}
