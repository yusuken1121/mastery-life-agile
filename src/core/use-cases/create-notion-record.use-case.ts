import type { NotionPageRef } from "../domain/notion-page-ref"
import type { INotionRecordWriter } from "../ports/notion-record-writer.port"

export type RecordValidator<TRecord> = (record: TRecord) => void

export class CreateNotionRecordUseCase<TRecord> {
  constructor(
    private readonly writer: INotionRecordWriter<TRecord>,
    private readonly validate?: RecordValidator<TRecord>,
  ) {}

  async execute(record: TRecord): Promise<NotionPageRef> {
    this.validate?.(record)
    return this.writer.create(record)
  }
}
