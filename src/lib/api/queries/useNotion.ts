import { useMutation, UseMutationOptions } from "@tanstack/react-query"
import { notionApi, NotionWriteResponse } from "../notion"
import type { ContactSubmission } from "@/core/domain/contact-submission.entity"

export const notionKeys = {
  all: ["notion"] as const,
}

type UseCreateNotionRecordOptions = UseMutationOptions<
  NotionWriteResponse,
  Error,
  ContactSubmission
>

/**
 * Notionデータベースにレコードを作成するカスタムフック
 */
export const useCreateNotionRecord = (
  options?: UseCreateNotionRecordOptions,
) => {
  return useMutation({
    mutationFn: notionApi.createContactRecord,
    ...options,
  })
}
