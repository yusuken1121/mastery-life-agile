import { NextRequest, NextResponse } from "next/server"
import { createGeminiGateway } from "@/infrastructure/gemini"
import { SendMessageUseCase } from "@/core/use-cases/send-message.use-case"
import { sendMessageRequestSchema } from "@/lib/validators/chat.schema"
import { handleRouteError } from "@/lib/route-error"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { stream, messages, options } = sendMessageRequestSchema.parse(body)

    const useCase = new SendMessageUseCase(createGeminiGateway())

    if (stream) {
      const { stream: responseStream } = await useCase.execute({
        messages,
        options,
      })

      return new Response(responseStream, {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Transfer-Encoding": "chunked",
        },
      })
    }

    const text = await useCase.executeNonStreaming({ messages, options })
    return NextResponse.json({ response: text })
  } catch (error) {
    return handleRouteError(error, "/api/chat Route Handler")
  }
}
