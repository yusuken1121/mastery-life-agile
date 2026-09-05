import type { NotionPageRef } from "../domain/notion-page-ref"

export interface INotionRecordWriter<TRecord> {
  create(record: TRecord): Promise<NotionPageRef>
}
