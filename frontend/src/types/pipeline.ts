export type PreviewTab = 'raw' | 'clean' | 'report'

export interface PipelineStats {
  rawRows: number
  cleanRows: number
  removedRows: number
  columnCount: number
  totalPaid: number
  totalPaidFormatted: string
}

export interface DataPreview {
  columns: string[]
  rows: Record<string, string>[]
}

export interface PipelineResult {
  stats: PipelineStats
  rawPreview: DataPreview
  cleanPreview: DataPreview
  report: string
  outputs: {
    csv: string
    report: string
  }
}
