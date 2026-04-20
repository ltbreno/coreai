import { NextRequest, NextResponse } from "next/server";
import type { ReportData } from "@/types/report";

const STRUCTURED_PROMPT = `Com base na análise dos exames laboratoriais que você acabou de realizar, retorne APENAS um objeto JSON válido (sem markdown, sem texto antes ou depois, sem blocos de código) com exatamente esta estrutura:

{
  "nutritionalStatus": [
    {
      "category": "Nome da categoria",
      "items": [
        { "name": "Nome do biomarcador", "value": "valor", "unit": "unidade", "status": "Adequado" }
      ]
    }
  ],
  "coreScore": {
    "overall": 76,
    "categories": [
      { "name": "Metabolismo", "score": 82 },
      { "name": "Inflamação", "score": 68 },
      { "name": "Micronutrientes", "score": 70 },
      { "name": "Hormonal", "score": 75 }
    ]
  },
  "interpretation": {
    "positives": ["ponto positivo 1", "ponto positivo 2"],
    "attentionPoints": ["ponto de atenção 1"]
  }
}

Status permitidos para cada item: "Adequado", "Baixo", "Muito baixo", "Alto", "Muito alto", "Baixo risco".
Use apenas os dados dos exames que foram analisados. Responda SOMENTE com o JSON.`;

export async function POST(request: NextRequest) {
  try {
    const { sessionId, userId } = await request.json();

    if (!sessionId || !userId) {
      return NextResponse.json(
        { error: "sessionId e userId são obrigatórios" },
        { status: 400 },
      );
    }

    const apiUrl = "https://core-ai-production-c3aa.up.railway.app/api/v1/chat";

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_input: STRUCTURED_PROMPT,
        session_id: sessionId,
        user_id: userId,
      }),
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Falha ao contatar a API" },
        { status: 502 },
      );
    }

    const data = await response.json();
    const text: string = data.response ?? "";

    // Extract JSON object from response text
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json(
        { error: "Não foi possível extrair dados estruturados" },
        { status: 422 },
      );
    }

    let reportData: ReportData;
    try {
      reportData = JSON.parse(jsonMatch[0]);
    } catch {
      return NextResponse.json(
        { error: "JSON inválido na resposta da API" },
        { status: 422 },
      );
    }

    return NextResponse.json(reportData);
  } catch {
    return NextResponse.json(
      { error: "Erro interno ao gerar relatório" },
      { status: 500 },
    );
  }
}
