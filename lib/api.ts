export interface ChatMessage {
  chat_input: string
  metadata: {
    pdf_base64?: string
  }
  session_id: string
  user_id: string
}

export interface ChatResponse {
  response: string
  follow_ups?: string[]
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
    throw new Error("Failed to send message")
  }

  return response.json()
}

export function generateSessionId(): string {
  return `sess-${crypto.randomUUID()}`
}

export function generateUserId(): string {
  return `user-${crypto.randomUUID()}`
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
