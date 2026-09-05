import { CONTACT_MESSAGE_MIN_LENGTH } from "@/core/domain/contact-submission.entity"
import z from "zod"

/** HTTP boundary validation for POST /api/notion */
export const contactSubmissionSchema = z.object({
  name: z.string().min(1, "お名前を入力してください"),
  email: z.string().email("正しいメールアドレスを入力してください"),
  message: z.string().min(1, "メッセージを入力してください"),
})

/** Client form validation (includes domain rules for immediate UX feedback) */
export const contactFormSchema = z.object({
  name: z.string().min(1, "お名前を入力してください"),
  email: z.string().email("正しいメールアドレスを入力してください"),
  message: z
    .string()
    .min(
      CONTACT_MESSAGE_MIN_LENGTH,
      `メッセージは${CONTACT_MESSAGE_MIN_LENGTH}文字以上で入力してください`,
    ),
})

export type ContactSubmissionRequest = z.infer<typeof contactSubmissionSchema>
export type ContactFormValues = z.infer<typeof contactFormSchema>

/** @deprecated Use ContactSubmissionRequest */
export type ContactSubmissionInput = ContactSubmissionRequest
