import { NextRequest, NextResponse } from "next/server"
import { createNotionRecordWriter } from "@/infrastructure/notion"
import { contactNotionConfig } from "@/infrastructure/notion/contact.config"
import { CreateNotionRecordUseCase } from "@/core/use-cases/create-notion-record.use-case"
import {
  assertValidContactSubmission,
  type ContactSubmission,
} from "@/core/domain/contact-submission.entity"
import { contactSubmissionSchema } from "@/lib/validators/notion.schema"
import { handleRouteError } from "@/lib/route-error"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const validatedInput = contactSubmissionSchema.parse(body)

    const writer =
      createNotionRecordWriter<ContactSubmission>(contactNotionConfig)
    const useCase = new CreateNotionRecordUseCase(
      writer,
      assertValidContactSubmission,
    )
    const result = await useCase.execute(validatedInput)

    return NextResponse.json({ success: true, page: result })
  } catch (error) {
    return handleRouteError(error, "/api/notion Route Handler")
  }
}
