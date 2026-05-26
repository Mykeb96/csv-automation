import type { DataPreview } from '../types/pipeline'

interface DataTableProps {
  preview: DataPreview
  totalRows: number
}

function formatColumnLabel(column: string): string {
  return column.replace(/_/g, ' ')
}

export function DataTable({ preview, totalRows }: DataTableProps) {
  return (
    <div className="data-table-wrap">
      <p className="data-table__meta">
        Showing {preview.rows.length} of {totalRows} rows
      </p>
      <div className="data-table-scroll">
        <table className="data-table">
          <thead>
            <tr>
              {preview.columns.map((col) => (
                <th key={col}>{formatColumnLabel(col)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {preview.rows.map((row, index) => (
              <tr key={`${row.claim_id ?? index}-${index}`}>
                {preview.columns.map((col) => (
                  <td key={col}>{row[col] ?? '—'}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
