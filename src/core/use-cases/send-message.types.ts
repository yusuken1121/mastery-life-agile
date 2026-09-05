import type { Message } from "../domain/message.entity"
import type { AIGenerateOptions } from "../domain/ai-generate-options.vo"

/** Application-layer input for SendMessageUseCase */
export interface SendMessageInput {
  messages: Message[]
  options?: AIGenerateOptions
}

/** Application-layer output for streaming SendMessageUseCase */
export interface SendMessageOutput {
  stream: ReadableStream<string>
}
