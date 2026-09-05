import { beforeEach, describe, expect, it, vi } from "vitest"
import { CreateNotionRecordUseCase } from "./create-notion-record.use-case"
import type { INotionRecordWriter } from "../ports/notion-record-writer.port"
import type { ContactSubmission } from "../domain/contact-submission.entity"
import {
  CONTACT_MESSAGE_MIN_LENGTH,
  InvalidContactSubmissionError,
  assertValidContactSubmission,
} from "../domain/contact-submission.entity"

describe("assertValidContactSubmission", () => {
  it("accepts valid submission", () => {
    expect(() =>
      assertValidContactSubmission({
        name: "Alice",
        email: "alice@example.com",
        message: "Hello world!",
      }),
    ).not.toThrow()
  })

  it("rejects short message", () => {
    expect(() =>
      assertValidContactSubmission({
        name: "Alice",
        email: "alice@example.com",
        message: "short",
      }),
    ).toThrow(InvalidContactSubmissionError)
  })

  it(`rejects message shorter than ${CONTACT_MESSAGE_MIN_LENGTH} characters`, () => {
    expect(() =>
      assertValidContactSubmission({
        name: "Alice",
        email: "alice@example.com",
        message: "a".repeat(CONTACT_MESSAGE_MIN_LENGTH - 1),
      }),
    ).toThrow(
      `Message must be at least ${CONTACT_MESSAGE_MIN_LENGTH} characters`,
    )
  })
})

describe("CreateNotionRecordUseCase", () => {
  const pageRef = { id: "page-1", url: "https://notion.so/page-1" }
  let mockWriter: INotionRecordWriter<ContactSubmission>

  beforeEach(() => {
    mockWriter = {
      create: vi.fn().mockResolvedValue(pageRef),
    }
  })

  it("writes record via port", async () => {
    const useCase = new CreateNotionRecordUseCase(mockWriter)
    const record: ContactSubmission = {
      name: "Alice",
      email: "alice@example.com",
      message: "Hello from contact form",
    }

    const result = await useCase.execute(record)

    expect(result).toEqual(pageRef)
    expect(mockWriter.create).toHaveBeenCalledWith(record)
  })

  it("runs domain validator before writing", async () => {
    const validate = vi.fn(assertValidContactSubmission)
    const useCase = new CreateNotionRecordUseCase(mockWriter, validate)

    const record: ContactSubmission = {
      name: "Alice",
      email: "alice@example.com",
      message: "Hello from contact form",
    }

    await useCase.execute(record)

    expect(validate).toHaveBeenCalledWith(record)
  })

  it("does not write when domain validation fails", async () => {
    const useCase = new CreateNotionRecordUseCase(
      mockWriter,
      assertValidContactSubmission,
    )

    await expect(
      useCase.execute({
        name: "Alice",
        email: "alice@example.com",
        message: "short",
      }),
    ).rejects.toThrow(InvalidContactSubmissionError)

    expect(mockWriter.create).not.toHaveBeenCalled()
  })
})
