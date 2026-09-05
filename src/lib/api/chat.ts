import { apiClient } from "./apiClient"
import type {
  PostChatMessageRequest,
  PostChatMessageResponse,
} from "@/types/chat-api.type"

export const chatApi = {
  /**
   * AIアシスタントにメッセージを送信（非ストリーミング）
   */
  sendMessageComplete: async (
    data: PostChatMessageRequest,
  ): Promise<PostChatMessageResponse> => {
    return apiClient.post("/api/chat", { ...data, stream: false })
  },

  /**
   * AIアシスタントにメッセージを送信（ストリーミング用のレスポンスを取得）
   */
  sendMessageStream: async (
    data: PostChatMessageRequest,
  ): Promise<Response> => {
    const baseUrl = apiClient.defaults.baseURL ?? ""
    const url = `${baseUrl}/api/chat`
    return fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ ...data, stream: true }),
    })
  },
}
