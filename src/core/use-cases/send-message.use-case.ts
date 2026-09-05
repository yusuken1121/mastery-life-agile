import type { IAIGateway } from "../ports/ai-gateway.port"
import { assertValidMessageHistory } from "../domain/message.validation"
import type { SendMessageInput, SendMessageOutput } from "./send-message.types"

export type { SendMessageInput, SendMessageOutput } from "./send-message.types"

export class SendMessageUseCase {
  constructor(private readonly aiGateway: IAIGateway) {}

  async execute(input: SendMessageInput): Promise<SendMessageOutput> {
    assertValidMessageHistory(input.messages)

    const stream = await this.aiGateway.generateStream(
      input.messages,
      input.options,
    )

    return { stream }
  }

  async executeNonStreaming(input: SendMessageInput): Promise<string> {
    assertValidMessageHistory(input.messages)

    return this.aiGateway.generate(input.messages, input.options)
  }
}
