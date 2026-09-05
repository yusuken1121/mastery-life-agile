import { apiClient } from "./apiClient"
import type { NotionPageRef } from "@/core/domain/notion-page-ref"
import type { ContactSubmission } from "@/core/domain/contact-submission.entity"

export interface NotionWriteResponse {
  success: boolean
  page: NotionPageRef
}

export const notionApi = {
  createContactRecord: async (
    data: ContactSubmission,
  ): Promise<NotionWriteResponse> => {
    return apiClient.post("/api/notion", data)
  },
}
