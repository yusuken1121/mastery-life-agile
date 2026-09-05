import { createMessage } from "@/core/domain/message.entity"

/**
 * Helper function to create a new chat message
 * Exported for use in client components
 */
export function createChatMessage(
  role: "user" | "assistant" | "system",
  content: string,
  metadata?: Record<string, unknown>,
) {
  return createMessage(role, content, undefined, metadata)
}
