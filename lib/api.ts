export interface ChatMessage {
  chat_input: string
  metadata: Record<string, unknown>
  session_id: string
  user_id: string
  dbSessionId?: string
  pdfFilename?: string
  pdf_base64?: string
  idade?: number
  sexo?: "M" | "F"
  alergias?: string[]
  remedios?: string[]
}

export interface ChatResponse {
  response: string
  followUpQuestions?: string[]
  session_id?: string
}

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message)
    this.name = "ApiError"
  }
}

export async function sendChatMessage(message: ChatMessage): Promise<ChatResponse> {
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(message),
  })

  if (!response.ok) {
    const data = await response.json().catch(() => ({}))
    throw new ApiError(response.status, data.error ?? "Falha ao enviar mensagem")
  }

  return response.json()
}

export function generateSessionId(): string {
  return crypto.randomUUID()
}

export function generateUserId(): string {
  return crypto.randomUUID()
}

export async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => {
      const result = reader.result as string
      // Remove the data URL prefix (e.g., "data:application/pdf;base64,")
      const base64 = result.split(",")[1]
      resolve(base64)
    }
    reader.onerror = (error) => reject(error)
  })
}
