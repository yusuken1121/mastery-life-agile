/**
 * Message entity — a single chat message in a conversation.
 * Pure domain: no React, Next.js, or external SDK imports.
 */
export type MessageRole = "user" | "assistant" | "system"

export interface Message {
  id: string
  role: MessageRole
  content: string
  createdAt: Date
  metadata?: Record<string, unknown>
}

export function createMessage(
  role: MessageRole,
  content: string,
  id?: string,
  metadata?: Record<string, unknown>,
): Message {
  return {
    id: id ?? crypto.randomUUID(),
    role,
    content,
    createdAt: new Date(),
    metadata,
  }
}

export function isMessage(obj: unknown): obj is Message {
  if (typeof obj !== "object" || obj === null) {
    return false
  }

  const msg = obj as Partial<Message>

  return (
    typeof msg.id === "string" &&
    (msg.role === "user" ||
      msg.role === "assistant" ||
      msg.role === "system") &&
    typeof msg.content === "string" &&
    msg.createdAt instanceof Date
  )
}
