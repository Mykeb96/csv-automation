interface ReportViewProps {
  report: string
  outputPath: string
}

export function ReportView({ report, outputPath }: ReportViewProps) {
  return (
    <div className="report-view">
      <p className="data-table__meta">Saved to {outputPath}</p>
      <pre className="report-view__content">{report}</pre>
    </div>
  )
}
