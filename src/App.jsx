import React, { useMemo } from 'react'
import Sidebar from './components/Sidebar'
import ExecutiveSummary from './components/ExecutiveSummary'
import ProjectTable from './components/ProjectTable'
import ScenarioPanel from './components/ScenarioPanel'
import Charts from './components/Charts'
import BufferConcentration from './components/BufferConcentration'
import BreakEvenCalculator from './components/BreakEvenCalculator'
import MoMTracker from './components/MoMTracker'
import HealthAndBenchmark from './components/HealthAndBenchmark'
import PoolingSimulator from './components/PoolingSimulator'
import MarginPath from './components/MarginPath'
import { INITIAL_PROJECTS, SALARY_BANDS, DEFAULTS } from './data/projects'
import { calcPortfolio } from './engine'
import { usePersistedState, clearPersistedState } from './hooks/usePersistedState'

const TABS = [
  { id: 'overview',  label: 'Overview' },
  { id: 'projects',  label: 'Projects' },
  { id: 'scenarios', label: 'Scenarios' },
  { id: 'margin',    label: 'Margin Path' },
  { id: 'charts',    label: 'Charts' },
  { id: 'health',    label: 'Health' },
  { id: 'pooling',   label: 'Pooling' },
  { id: 'tracker',   label: 'MoM Tracker' },
]

const TAB_DESCRIPTIONS = {
  overview:  'Executive summary, buffer chart, and revenue breakdown',
  projects:  'Edit headcount, rates, and notes per project',
  scenarios: 'Simulate rate changes and headcount reductions',
  margin:    'Three paths to 85% margin per account: COLA, structure, or combined',
  charts:    'Visual breakdown of buffer and revenue across projects',
  health:    'Project health scores and client rate benchmarking',
  pooling:   'Simulate shared buffer pools across projects',
  tracker:   'Lock a baseline and track month-over-month changes',
}

const STORAGE_KEYS = ['sp_projects','sp_salaries','sp_config','sp_currency','sp_tab','sp_margin_levers','sp_margin_expanded']

export default function App() {
  const [projects,  setProjects]  = usePersistedState('sp_projects',  INITIAL_PROJECTS)
  const [salaries,  setSalaries]  = usePersistedState('sp_salaries',  SALARY_BANDS)
  const [config,    setConfig]    = usePersistedState('sp_config',     DEFAULTS)
  const [currency,  setCurrency]  = usePersistedState('sp_currency',  'USD')
  const [activeTab, setActiveTab] = usePersistedState('sp_tab',       'overview')

  const portfolio = useMemo(
    () => calcPortfolio(projects, salaries, config),
    [projects, salaries, config]
  )

  const now = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  function resetToDefaults() {
    if (window.confirm('Reset all data to defaults? This cannot be undone.')) {
      clearPersistedState(STORAGE_KEYS)
      window.location.reload()
    }
  }

  return (
    <div className="flex min-h-screen bg-cream">
      <Sidebar
        config={config} setConfig={setConfig}
        salaries={salaries} setSalaries={setSalaries}
        currency={currency} setCurrency={setCurrency}
        onReset={resetToDefaults}
      />
      <main className="flex-1 overflow-auto flex flex-col">

        {/* Header */}
        <div className="bg-card border-b border-warm px-6 py-3 flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="text-sm font-semibold text-ink">Small Projects · {now}</h2>
            <p className="text-xs text-ink/40 mt-0.5">{TAB_DESCRIPTIONS[activeTab]}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-ink/40">{projects.length} projects</span>
            <span className="w-1 h-1 rounded-full bg-warm"></span>
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
              portfolio.portfolioBuffer > 0.3  ? 'bg-red-100 text-red-700'       :
              portfolio.portfolioBuffer > 0.2  ? 'bg-amber-100 text-amber-hugo'  :
              'bg-green-100 text-green-700'
            }`}>
              {(portfolio.portfolioBuffer * 100).toFixed(1)}% buffer
            </span>
            <span className="text-xs text-ink/25">· auto-saved</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-card border-b border-warm px-6 flex items-center gap-0 overflow-x-auto flex-shrink-0">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`px-4 py-3 text-sm font-medium transition-all border-b-2 -mb-px whitespace-nowrap ${
                activeTab === t.id
                  ? 'border-gold text-ink'
                  : 'border-transparent text-ink/40 hover:text-ink/70'
              }`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="px-6 py-5 space-y-4 flex-1">
          {activeTab !== 'margin' && (
            <ExecutiveSummary portfolio={portfolio} currency={currency} fxRate={config.fxRate} />
          )}
          {activeTab === 'overview'  && <><Charts computed={portfolio.rows} /><BufferConcentration computed={portfolio.rows} /></>}
          {activeTab === 'projects'  && <ProjectTable projects={projects} setProjects={setProjects} computed={portfolio.rows} currency={currency} fxRate={config.fxRate} />}
          {activeTab === 'scenarios' && <ScenarioPanel portfolio={portfolio} salaries={salaries} config={config} currency={currency} fxRate={config.fxRate} />}
          {activeTab === 'margin'    && <MarginPath projects={projects} salaries={salaries} config={config} />}
          {activeTab === 'charts'    && <><Charts computed={portfolio.rows} /><BufferConcentration computed={portfolio.rows} /></>}
          {activeTab === 'health'    && <><HealthAndBenchmark computed={portfolio.rows} currency={currency} fxRate={config.fxRate} /><BreakEvenCalculator computed={portfolio.rows} currency={currency} fxRate={config.fxRate} /></>}
          {activeTab === 'pooling'   && <PoolingSimulator computed={portfolio.rows} />}
          {activeTab === 'tracker'   && <MoMTracker portfolio={portfolio} currency={currency} fxRate={config.fxRate} />}
        </div>
      </main>
    </div>
  )
}
