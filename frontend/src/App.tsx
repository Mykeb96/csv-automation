import { useCallback, useMemo, useState } from 'react'
import { Workspace } from './components/Workspace'
import type { PipelineStats } from './types/pipeline'
import './App.css'

const PIPELINE_STEPS = [
  {
    step: 1,
    title: 'Load CSV',
    description: 'Ingest raw employer claim exports',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
        <path d="M12 3v12m0 0l4-4m-4 4l-4-4" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    step: 2,
    title: 'Clean Data',
    description: 'Standardize dates, currency, and status',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
        <path d="M4 6h16M4 12h10M4 18h14" strokeLinecap="round" />
        <circle cx="19" cy="12" r="2" fill="currentColor" stroke="none" />
        <circle cx="19" cy="18" r="2" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    step: 3,
    title: 'Calculate',
    description: 'Derive days-to-report and metrics',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
        <rect x="4" y="3" width="16" height="18" rx="2" />
        <path d="M8 7h8M8 11h2M12 11h2M16 11h0M8 15h2M12 15h4" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    step: 4,
    title: 'Export CSV',
    description: 'Write normalized claims file',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
        <path d="M12 15V3m0 12l-4-4m4 4l4-4" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M4 19h16" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    step: 5,
    title: 'Summary Report',
    description: 'Generate executive overview',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
        <path d="M6 4h12v16H6z" />
        <path d="M9 8h6M9 12h6M9 16h4" strokeLinecap="round" />
      </svg>
    ),
  },
] as const

function formatCompactCurrency(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `$${Math.round(value / 1_000)}K`
  return `$${value.toFixed(0)}`
}

function App() {
  const [liveStats, setLiveStats] = useState<PipelineStats | null>(null)
  const [activePipelineStep, setActivePipelineStep] = useState<number | null>(null)

  const handleStatsChange = useCallback((stats: PipelineStats | null) => {
    setLiveStats(stats)
  }, [])

  const heroStats = useMemo(() => {
    if (!liveStats) {
      return [
        { value: '5', label: 'Pipeline stages', accent: true },
        { value: '16', label: 'Source columns' },
        { value: '—', label: 'Clean claim rows' },
        { value: '—', label: 'Total paid' },
      ]
    }
    return [
      { value: '5', label: 'Pipeline stages', accent: true },
      { value: String(liveStats.columnCount), label: 'Output columns' },
      { value: String(liveStats.cleanRows), label: 'Clean claim rows' },
      {
        value: formatCompactCurrency(liveStats.totalPaid),
        label: 'Total paid',
      },
    ]
  }, [liveStats])

  return (
    <div className="app">
      <header className="header">
        <div className="container header__inner">
          <a href="#workspace" className="brand">
            <div className="brand__mark" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L2 7v10l10 5 10-5V7L12 2zm0 2.18l6.9 3.45L12 11.08 5.1 7.63 12 4.18zM4 8.82l7 3.5v7.36l-7-3.5V8.82zm9 10.86v-7.36l7-3.5v7.36l-7 3.5z" />
              </svg>
            </div>
            <span className="brand__name">
              Claim<span>Flow</span>
            </span>
          </a>

          <nav className="nav" aria-label="Main">
            <a href="#" className="nav__link nav__link--active">
              Overview
            </a>
            <a href="#pipeline" className="nav__link">
              Pipeline
            </a>
            <a href="#workspace" className="nav__link">
              Output
            </a>
          </nav>

          <span className="header__badge">Demo</span>
        </div>
      </header>

      <main>
        <section className="hero">
          <div className="container">
            <p className="hero__eyebrow">Workers&apos; Comp Automation</p>
            <h1 className="hero__title">
              From messy exports to <em>clean claims</em>
            </h1>
            <p className="hero__subtitle">
              A visual demo of an end-to-end claims pipeline — ingest employer CSV
              data, standardize fields, calculate reporting metrics, and produce
              clean files plus a summary report.
            </p>

            <div className="hero__stats">
              {heroStats.map((stat) => (
                <div key={stat.label} className="stat-card">
                  <div
                    className={`stat-card__value${'accent' in stat && stat.accent ? ' stat-card__value--accent' : ''}`}
                  >
                    {stat.value}
                  </div>
                  <div className="stat-card__label">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="pipeline-section" id="pipeline">
          <div className="container">
            <div className="section-header">
              <h2 className="section-header__title">Processing pipeline</h2>
              <p className="section-header__desc">
                Five automated stages powered by Python — mirrored in VBA or Power
                Automate Desktop for production workflows.
              </p>
            </div>

            <div className="pipeline">
              {PIPELINE_STEPS.map((item) => {
                const isActive = activePipelineStep === item.step
                const isDone =
                  activePipelineStep !== null && item.step < activePipelineStep
                return (
                  <div
                    key={item.step}
                    className={`pipeline-step${isActive ? ' pipeline-step--active' : ''}${isDone ? ' pipeline-step--done' : ''}`}
                  >
                    <span className="pipeline-step__connector" aria-hidden="true" />
                    <div className="pipeline-step__icon" aria-hidden="true">
                      {item.icon}
                    </div>
                    <span className="pipeline-step__number">Step {item.step}</span>
                    <h3 className="pipeline-step__title">{item.title}</h3>
                    <p className="pipeline-step__desc">{item.description}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        <section className="workspace-section" id="workspace">
          <div className="container">
            <div className="section-header">
              <h2 className="section-header__title">Live workspace</h2>
              <p className="section-header__desc">
                Run the pipeline against the sample file and explore raw data, cleaned
                output, and the generated summary report.
              </p>
            </div>

            <Workspace
              onStatsChange={handleStatsChange}
              onPipelineStepChange={setActivePipelineStep}
            />
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="container footer__inner">
          <p className="footer__text">
            ClaimFlow — portfolio demo for workers&apos; compensation claims automation
          </p>
          <p className="footer__stack">Python · FastAPI · pandas · React · Vite</p>
        </div>
      </footer>
    </div>
  )
}

export default App
