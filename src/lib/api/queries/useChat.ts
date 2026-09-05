import { useMutation, UseMutationOptions } from "@tanstack/react-query"
import { chatApi } from "../chat"
import type {
  PostChatMessageRequest,
  PostChatMessageResponse,
} from "@/types/chat-api.type"

export const chatKeys = {
  all: ["chat"] as const,
}

type UseSendMessageCompleteOptions = UseMutationOptions<
  PostChatMessageResponse,
  Error,
  PostChatMessageRequest
>

/**
 * AIアシスタントにメッセージを送信するカスタムフック（非ストリーミング）
 */
export const useSendMessageComplete = (
  options?: UseSendMessageCompleteOptions,
) => {
  return useMutation({
    mutationFn: chatApi.sendMessageComplete,
    ...options,
  })
}

type UseSendMessageStreamOptions = UseMutationOptions<
  Response,
  Error,
  PostChatMessageRequest
>

/**
 * AIアシスタントにメッセージを送信するカスタムフック（ストリーミング）
 * mutationFnはResponseオブジェクト（ストリームを含む）を返します。
 */
export const useSendMessageStream = (options?: UseSendMessageStreamOptions) => {
  return useMutation({
    mutationFn: chatApi.sendMessageStream,
    ...options,
  })
}
