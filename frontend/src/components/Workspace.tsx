import { useCallback, useEffect, useState } from 'react'
import { runPipeline } from '../api/pipeline'
import type { PipelineResult, PipelineStats, PreviewTab } from '../types/pipeline'
import { DataTable } from './DataTable'
import { ReportView } from './ReportView'

interface WorkspaceProps {
  onStatsChange: (stats: PipelineStats | null) => void
  onPipelineStepChange: (step: number | null) => void
}

const TABS: { id: PreviewTab; label: string; dotClass: string }[] = [
  { id: 'raw', label: 'Raw data', dotClass: 'preview-tab__dot--raw' },
  { id: 'clean', label: 'Clean data', dotClass: 'preview-tab__dot--clean' },
  { id: 'report', label: 'Report', dotClass: 'preview-tab__dot--report' },
  { id: 'walkthrough', label: 'Walkthrough', dotClass: 'preview-tab__dot--walkthrough' },
]

const WALKTHROUGH_EXAMPLES = [
  {
    title: 'Duplicate entry removed',
    before:
      'claim_id=CLM-100245 | employee=Jane Doe | injury_date=01/05/2026 | paid=$1,250.00',
    after:
      'kept one canonical record for CLM-100245 (duplicate row dropped during validation)',
    why: 'Prevents double counting in totals and reporting metrics.',
  },
  {
    title: 'Formatting normalized',
    before:
      'claim_id=" clm-20019 " | status="open " | injury_date="3-1-26" | paid="$950"',
    after:
      'claim_id="CLM-20019" | status="Open" | injury_date="2026-03-01" | paid=950.00',
    why: 'Makes fields consistent so filters, joins, and calculations work reliably.',
  },
  {
    title: 'Invalid ID removed',
    before:
      'claim_id="UNKNOWN" | employee=Mark Lee | injury_date=2026-02-14 | paid=$410.00',
    after: 'row excluded (failed claim_id validation rule)',
    why: 'Removes non-traceable records that cannot be audited or reconciled.',
  },
  {
    title: 'Empty fields handled safely',
    before:
      'claim_id=CLM-2026-091 | adjuster="" | report_date="" | medical_cost="N/A"',
    after:
      'adjuster=blank | report_date=blank | medical_cost=blank (stored as missing, not guessed)',
    why: 'Keeps data honest while avoiding invalid calculations and type errors.',
  },
] as const

export function Workspace({ onStatsChange, onPipelineStepChange }: WorkspaceProps) {
  const [activeTab, setActiveTab] = useState<PreviewTab>('raw')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<PipelineResult | null>(null)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)

  const handleReset = useCallback(() => {
    setResult(null)
    setError(null)
    setStatusMessage(null)
    setActiveTab('raw')
    onStatsChange(null)
    onPipelineStepChange(null)
  }, [onStatsChange, onPipelineStepChange])

  const handleRun = useCallback(async () => {
    setLoading(true)
    setError(null)
    setStatusMessage(null)
    let step = 1
    onPipelineStepChange(step)
    const stepTimer = window.setInterval(() => {
      step += 1
      if (step <= 5) {
        onPipelineStepChange(step)
      }
    }, 400)

    try {
      const data = await runPipeline()
      window.clearInterval(stepTimer)
      onPipelineStepChange(5)
      setResult(data)
      onStatsChange(data.stats)
      setStatusMessage(
        `Pipeline complete — ${data.stats.removedRows} row(s) removed, ${data.stats.cleanRows} claims exported.`,
      )
      setActiveTab('clean')
    } catch (err) {
      window.clearInterval(stepTimer)
      onPipelineStepChange(null)
      const message =
        err instanceof Error ? err.message : 'Failed to run pipeline. Is the API server running?'
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [onStatsChange, onPipelineStepChange])

  useEffect(() => {
    return () => onPipelineStepChange(null)
  }, [onPipelineStepChange])

  const hasResult = result !== null

  return (
    <div className="workspace">
      <aside className="workspace__sidebar">
        <div>
          <p className="workspace__label">Input</p>
          <div className={`upload-zone${hasResult ? ' upload-zone--ready' : ''}`}>
            <div className="upload-zone__icon" aria-hidden="true">
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
              >
                <path
                  d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z"
                  strokeLinejoin="round"
                />
                <path d="M14 2v6h6M12 18v-6M9 15l3-3 3 3" strokeLinecap="round" />
              </svg>
            </div>
            <p className="upload-zone__title">Sample input file</p>
            <p className="upload-zone__hint">data/raw_claims_messy.csv</p>
            <span className="upload-zone__file">raw_claims_messy.csv</span>
          </div>
        </div>

        {result && (
          <div className="run-summary">
            <p className="workspace__label">Last run</p>
            <ul className="run-summary__list">
              <li>
                <span>Raw rows</span>
                <strong>{result.stats.rawRows}</strong>
              </li>
              <li>
                <span>Clean rows</span>
                <strong>{result.stats.cleanRows}</strong>
              </li>
              <li>
                <span>Removed</span>
                <strong>{result.stats.removedRows}</strong>
              </li>
              <li>
                <span>Total paid</span>
                <strong>{result.stats.totalPaidFormatted}</strong>
              </li>
            </ul>
          </div>
        )}

        <div className="workspace__actions">
          <button
            type="button"
            className="btn btn--primary"
            onClick={handleRun}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="btn__spinner" aria-hidden="true" />
                Running…
              </>
            ) : (
              'Run pipeline'
            )}
          </button>
          <button
            type="button"
            className="btn btn--ghost"
            onClick={handleReset}
            disabled={loading || !hasResult}
          >
            Reset demo
          </button>
        </div>
      </aside>

      <div className="preview-panel">
        <div className="preview-tabs" role="tablist">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`preview-tab${activeTab === tab.id ? ' preview-tab--active' : ''}`}
              role="tab"
              aria-selected={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
              disabled={!hasResult && tab.id !== 'raw'}
            >
              <span className={`preview-tab__dot ${tab.dotClass}`} />
              {tab.label}
            </button>
          ))}
        </div>

        <div className={`preview-body${loading ? ' preview-body--loading' : ''}`}>
          {error && (
            <div className="alert alert--error" role="alert">
              <strong>Pipeline error</strong>
              <p>{error}</p>
              <p className="alert__hint">
                {import.meta.env.VITE_API_URL
                  ? 'Check that the API is running and CORS allows this site.'
                  : 'Local dev: run uvicorn api:app --reload --port 8000 in the project root.'}
              </p>
            </div>
          )}

          {statusMessage && !error && (
            <div className="alert alert--success" role="status">
              {statusMessage}
            </div>
          )}

          {loading && (
            <div className="preview-loading">
              <span className="btn__spinner btn__spinner--large" aria-hidden="true" />
              <p>Processing claims…</p>
            </div>
          )}

          {!loading && !hasResult && !error && (
            <div className="preview-placeholder">
              <div className="preview-placeholder__icon" aria-hidden="true">
                <svg
                  width="48"
                  height="48"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.25"
                >
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <path d="M3 9h18M9 21V9" />
                </svg>
              </div>
              <p className="preview-placeholder__title">No preview yet</p>
              <p className="preview-placeholder__text">
                Click Run pipeline to process the sample CSV and preview raw data,
                cleaned output, the summary report, and walkthrough examples.
              </p>
            </div>
          )}

          {!loading && hasResult && activeTab === 'raw' && (
            <DataTable preview={result.rawPreview} totalRows={result.stats.rawRows} />
          )}

          {!loading && hasResult && activeTab === 'clean' && (
            <DataTable preview={result.cleanPreview} totalRows={result.stats.cleanRows} />
          )}

          {!loading && hasResult && activeTab === 'report' && (
            <ReportView report={result.report} outputPath={result.outputs.report} />
          )}

          {!loading && activeTab === 'walkthrough' && (
            <div className="walkthrough-view">
              <p className="walkthrough-view__intro">
                Row-level examples of what the pipeline changed between messy input and
                clean output.
              </p>
              <div className="example-list">
                {WALKTHROUGH_EXAMPLES.map((item) => (
                  <article key={item.title} className="example-item">
                    <h4 className="example-item__title">{item.title}</h4>
                    <p className="example-item__label">Before</p>
                    <p className="example-item__value">{item.before}</p>
                    <p className="example-item__label">After</p>
                    <p className="example-item__value">{item.after}</p>
                    <p className="example-item__why">{item.why}</p>
                  </article>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
