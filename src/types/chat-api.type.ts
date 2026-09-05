import type { Message } from "@/core/domain/message.entity"
import type { AIGenerateOptions } from "@/core/domain/ai-generate-options.vo"

export interface PostChatMessageRequest {
  messages: Message[]
  options?: AIGenerateOptions
}

export interface PostChatMessageResponse {
  response: string
}
