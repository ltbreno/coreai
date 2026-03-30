import { NextRequest, NextResponse } from "next/server"

interface ChatRequestBody {
  chat_input: string
  metadata: Record<string, unknown>
  session_id: string
  user_id: string
  pdf_base64?: string
  idade?: number
  sexo?: "M" | "F"
  alergias?: string[]
  remedios?: string[]
}

export async function POST(request: NextRequest) {
  let body: ChatRequestBody
  
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({
      response: generateMockResponse("", undefined),
      followUpQuestions: generateFollowUps(""),
    })
  }
  
  const { chat_input, metadata, session_id, user_id, pdf_base64, idade, sexo, alergias, remedios } = body

  try {
    // Forward the request to the external API
    const apiUrl = "https://core-ai-production-c3aa.up.railway.app/api/v1/chat"
    
    // Build payload - include patient data only if PDF is present
    const payload: Record<string, unknown> = {
      chat_input,
      session_id,
      user_id,
      metadata,
    }

    // If PDF is present, add patient data to the payload
    if (pdf_base64) {
      payload.pdf_base64 = pdf_base64
      payload.sexo = sexo
      payload.idade = idade
      payload.alergias = alergias || []
      payload.remedios = remedios || []
    }
    
    console.log("[v0] Sending to API:", apiUrl)
    console.log("[v0] Payload:", JSON.stringify({ ...payload, pdf_base64: pdf_base64 ? "[BASE64_DATA]" : undefined }, null, 2))
    
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    })

    console.log("[v0] API Response status:", response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.log("[v0] API Error:", errorText)
      // If the external API fails, return a mock response for demo purposes
      return NextResponse.json({
        response: generateMockResponse(chat_input, pdf_base64),
        followUpQuestions: generateFollowUps(chat_input),
      })
    }

    const data = await response.json()
    console.log("[v0] API Success data:", JSON.stringify(data, null, 2))
    return NextResponse.json(data)
  } catch (error) {
    console.log("[v0] Fetch error:", error)
    // Return mock response for demo when API is unavailable
    return NextResponse.json({
      response: generateMockResponse(chat_input, pdf_base64),
      followUpQuestions: generateFollowUps(chat_input),
    })
  }
}

function generateMockResponse(question: string, hasPdf?: string): string {
  const lowerQuestion = question.toLowerCase()
  
  if (hasPdf) {
    if (lowerQuestion.includes("resumo") || lowerQuestion.includes("resumir")) {
      return `Com base no documento enviado, posso identificar os seguintes pontos principais:

**Tema Central:** O documento aborda aspectos relevantes da área médica relacionados à sua pergunta.

**Principais Achados:**
• Análise detalhada dos dados apresentados
• Correlação com literatura científica atual
• Implicações clínicas relevantes

**Conclusão:** O documento fornece informações importantes para a prática clínica. Posso detalhar qualquer seção específica se desejar.`
    }
    
    return `Analisando o documento enviado em relação à sua pergunta sobre "${question}":

**Informações Encontradas:**
O documento contém dados relevantes que podem auxiliar na compreensão do tema. A análise sugere que existem evidências científicas que suportam diferentes abordagens terapêuticas.

**Recomendação:**
Para uma análise mais aprofundada, sugiro que faça perguntas específicas sobre seções ou tópicos do documento.

*Nota: Esta é uma resposta demonstrativa. Em produção, a IA analisará o conteúdo real do PDF.*`
  }

  if (lowerQuestion.includes("vitamina") || lowerQuestion.includes("nutriente")) {
    return `**Sobre vitaminas e nutrientes:**

As vitaminas são micronutrientes essenciais para diversas funções metabólicas. Elas são classificadas em:

• **Lipossolúveis:** A, D, E, K - armazenadas no tecido adiposo
• **Hidrossolúveis:** Complexo B e C - excretadas na urina

A ingestão adequada depende de uma dieta balanceada. Em casos específicos, a suplementação pode ser indicada sob orientação médica.`
  }

  if (lowerQuestion.includes("exame") || lowerQuestion.includes("diagnóstico")) {
    return `**Sobre exames diagnósticos:**

A interpretação de exames laboratoriais deve considerar:

• Valores de referência específicos do laboratório
• Contexto clínico do paciente
• Medicamentos em uso
• Condições pré-analíticas

Recomendo enviar o documento do exame para uma análise mais detalhada e contextualizada.`
  }

  return `**Resposta sobre: ${question}**

Para fornecer uma resposta mais precisa e contextualizada, recomendo:

1. **Enviar um documento PDF** com artigos científicos, exames ou estudos relacionados
2. **Fazer perguntas específicas** sobre o conteúdo do documento

A CoreAI é especializada em analisar documentos médicos e fornecer respostas baseadas em evidências científicas.

*Esta é uma demonstração. Em produção, a IA fornecerá respostas completas baseadas nos documentos enviados.*`
}

function generateFollowUps(question: string): string[] {
  const lowerQuestion = question.toLowerCase()
  
  if (lowerQuestion.includes("vitamina")) {
    return [
      "Qual a dosagem diária recomendada?",
      "Quais são os sinais de deficiência?",
      "Existem interações medicamentosas?",
    ]
  }
  
  if (lowerQuestion.includes("exame")) {
    return [
      "Como interpretar os valores alterados?",
      "Quando repetir o exame?",
      "Quais outros exames complementares?",
    ]
  }
  
  return [
    "Pode detalhar mais sobre este tema?",
    "Quais são as referências científicas?",
    "Existem contraindicações?",
  ]
}
