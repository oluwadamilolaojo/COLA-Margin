import React, { useState, useMemo } from 'react'
import { ChevronDown, ChevronRight, AlertTriangle, Target, Table2 } from 'lucide-react'
import { getCola } from '../data/cola'
import {
  calcPath, calcBaseline, computePaths, solveForTarget,
  DEFAULT_LEVER, HEAD_STEP_EXPORT as STEP,
  recommendation, marginColor,
} from '../marginPathEngine'
import { usePersistedState } from '../hooks/usePersistedState'

// ── Formatters ───────────────────────────────────────────────────────
const fp  = v => (v * 100).toFixed(1) + '%'
const fr  = v => '$' + v.toFixed(2)
const fm  = v => {
  if (Math.abs(v) >= 1_000_000) return '$' + (v / 1_000_000).toFixed(2) + 'M'
  if (Math.abs(v) >= 1_000)     return '$' + (v / 1_000).toFixed(1) + 'k'
  return '$' + Math.round(v).toLocaleString()
}
const fdelta = (v, base) => {
  const d = v - base
  const sign = d >= 0 ? '+' : ''
  return sign + '$' + Math.abs(Math.round(d)).toLocaleString()
}

// ── Margin badge ──────────────────────────────────────────────────────
function MarginBadge({ value, target = 0.85, size = 'sm' }) {
  const c = marginColor(value, target)
  const colorMap = {
    green: 'bg-green-100 text-green-700 border-green-200',
    amber: 'bg-amber-100 text-amber-hugo border-amber-200',
    red:   'bg-red-100   text-red-700   border-red-200',
  }
  const sizeMap = {
    sm: 'text-xs  px-2   py-0.5',
    md: 'text-sm  px-2.5 py-1   font-semibold',
  }
  return (
    <span className={`inline-block rounded-full border font-medium ${colorMap[c]} ${sizeMap[size]}`}>
      {fp(value)}
    </span>
  )
}

// ── Summary table ─────────────────────────────────────────────────────
function SummaryTable({ rows, leverState, setLeverFor, salaries, config, target }) {
  return (
    <div className="bg-card rounded-xl border border-warm overflow-x-auto">
      <table className="w-full text-xs min-w-[800px]">
        <thead>
          <tr className="bg-cream border-b border-warm">
            {['Account','Now','B / A','Buffer','COLA','TL','− Heads','Path C'].map((h, i) => (
              <th key={h} className={`px-4 py-2.5 text-[10px] uppercase tracking-wider font-semibold
                ${i === 7 ? 'text-gold text-right' : i >= 4 ? 'text-ink/40 text-center' : i >= 2 ? 'text-ink/40 text-right' : 'text-ink/40 text-left'}`}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(({ project, colaInfo, baseline }) => {
            const lever    = leverState[project.id] || DEFAULT_LEVER
            const pathC    = calcPath(project, colaInfo.cap, lever, salaries, config)
            const bTotal   = project.billableAgents + project.billableQA + project.billableTL + project.billablePC
            const aTotal   = project.actualAgents + project.actualQA + project.actualTL + project.actualPC
            const bufPct   = bTotal > 0 ? (aTotal - bTotal) / bTotal : 0
            const hasABuf  = (project.actualAgents - project.billableAgents) >= 1
            const maxExc   = Math.max(0, aTotal - bTotal)
            const maxSteps = Math.floor(maxExc / STEP)
            const curSteps = Math.round(lever.headsToRemove / STEP)
            const maxCola  = colaInfo.cap * 100

            function upd(key, val) { setLeverFor(project.id, { ...lever, [key]: val }) }

            return (
              <tr key={project.id} className="border-b border-warm/50 last:border-0 hover:bg-cream/40 transition-colors">
                <td className="px-4 py-2.5">
                  <div className="font-medium text-ink">{project.name}</div>
                  {colaInfo.dnsy && <div className="text-[9px] text-amber-hugo font-semibold">DO NOT SEND</div>}
                </td>
                <td className="px-4 py-2.5 text-right">
                  <MarginBadge value={baseline.marginPct} target={target} size="sm" />
                </td>
                <td className="px-4 py-2.5 text-right font-mono text-ink/60">
                  {bTotal} / {aTotal.toFixed(1)}
                </td>
                <td className="px-4 py-2.5 text-right font-mono text-ink/60">
                  {fp(bufPct)}
                </td>
                {/* COLA input */}
                <td className="px-4 py-2.5">
                  <div className="flex items-center justify-center gap-1">
                    <input
                      type="number" min="0" max={maxCola.toFixed(2)} step="0.1"
                      value={(colaInfo.cap * lever.colaApplied).toFixed(2) === 'NaN' ? '0.00' : (lever.colaApplied).toFixed(2)}
                      onChange={e => upd('colaApplied', Math.min(maxCola, Math.max(0, Number(e.target.value))))}
                      disabled={colaInfo.dnsy || colaInfo.cap === 0}
                      className="w-14 text-center border border-warm rounded text-xs py-0.5 bg-card text-ink font-mono disabled:opacity-30"
                    />
                    <span className="text-ink/30 text-[9px]">%</span>
                  </div>
                </td>
                {/* TL toggle */}
                <td className="px-4 py-2.5 text-center">
                  <button
                    onClick={() => upd('tlOn', !lever.tlOn)}
                    disabled={!hasABuf && !lever.tlOn}
                    className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors
                      ${lever.tlOn ? 'bg-gold' : 'bg-ink/20'}
                      ${!hasABuf && !lever.tlOn ? 'opacity-30 cursor-not-allowed' : ''}`}
                  >
                    <span className={`inline-block h-3 w-3 rounded-full bg-card transition-transform ${lever.tlOn ? 'translate-x-3.5' : 'translate-x-0.5'}`} />
                  </button>
                </td>
                {/* Heads stepper */}
                <td className="px-4 py-2.5">
                  <div className="flex items-center justify-center gap-1">
                    <button onClick={() => upd('headsToRemove', Math.max(0, lever.headsToRemove - STEP))}
                      disabled={lever.headsToRemove <= 0}
                      className="w-5 h-5 border border-warm rounded text-ink/50 hover:bg-cream disabled:opacity-20 text-xs font-bold leading-none">−</button>
                    <span className="font-mono text-ink text-xs w-8 text-center">{lever.headsToRemove.toFixed(2)}</span>
                    <button onClick={() => upd('headsToRemove', Math.min(maxSteps * STEP, lever.headsToRemove + STEP))}
                      disabled={curSteps >= maxSteps}
                      className="w-5 h-5 border border-warm rounded text-ink/50 hover:bg-cream disabled:opacity-20 text-xs font-bold leading-none">+</button>
                  </div>
                </td>
                {/* Path C result */}
                <td className="px-4 py-2.5 text-right">
                  <MarginBadge value={pathC.marginPct} target={target} size="sm" />
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// ── Account card ──────────────────────────────────────────────────────
function AccountCard({ project, colaInfo, lever, setLever, salaries, config, expanded, onToggle, target }) {
  const baseline = useMemo(() => calcBaseline(project, colaInfo.cap, salaries, config), [project, colaInfo, salaries, config])
  const results  = useMemo(() => computePaths(project, colaInfo.cap, lever, salaries, config), [project, colaInfo, lever, salaries, config])

  const bTotal    = project.billableAgents + project.billableQA + project.billableTL + project.billablePC
  const aTotal    = project.actualAgents + project.actualQA + project.actualTL + project.actualPC
  const maxExcess = Math.max(0, aTotal - bTotal)
  const maxSteps  = Math.floor(maxExcess / STEP)
  const curSteps  = Math.round(lever.headsToRemove / STEP)
  const hasABuf   = (project.actualAgents - project.billableAgents) >= 1
  const maxCola   = colaInfo.cap * 100

  function upd(key, val) { setLever({ ...lever, [key]: val }) }

  function handleSolve(e) {
    e.stopPropagation()
    if (colaInfo.dnsy) return
    setLever(solveForTarget(project, colaInfo.cap, salaries, config, target))
  }

  const rec     = recommendation(baseline, target)
  const margCls = marginColor(baseline.marginPct, target)
  const margTextCls = { green: 'text-green-700', amber: 'text-amber-hugo', red: 'text-red-700' }

  // Active lever indicators for collapsed row
  const activeLevers = [
    lever.colaApplied > 0 && `COLA ${lever.colaApplied.toFixed(2)}%`,
    lever.tlOn && 'TL ON',
    lever.headsToRemove > 0 && `-${lever.headsToRemove.toFixed(2)}h`,
  ].filter(Boolean)

  return (
    <div className={`rounded-xl border mb-2 overflow-hidden transition-shadow
      ${colaInfo.dnsy ? 'border-warm bg-amber-50/20' : 'border-warm bg-card'}
      ${expanded ? 'shadow-sm' : ''}`}>

      {/* ── Collapsed row ── */}
      <div onClick={onToggle} className="px-5 py-3.5 flex items-center gap-4 cursor-pointer hover:bg-cream/60 transition-colors">
        <span className="text-ink/25 flex-shrink-0">
          {expanded ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
        </span>
        <div className="flex-shrink-0 w-40">
          <div className="font-semibold text-ink text-sm leading-tight">{project.name}</div>
          <div className="text-[10px] text-ink/35 font-mono mt-0.5">
            ${project.rate}/hr · {bTotal}B / {aTotal.toFixed(1)}A
          </div>
        </div>
        <div className="flex-shrink-0">
          <MarginBadge value={baseline.marginPct} target={target} size="md" />
        </div>
        <div className="flex-1 text-xs text-ink/45 italic min-w-0 truncate">
          {colaInfo.dnsy
            ? <span className="text-amber-hugo not-italic font-medium flex items-center gap-1"><AlertTriangle size={11} />Do not send yet — {colaInfo.reason}</span>
            : rec
          }
        </div>
        <div className="flex-shrink-0 flex items-center gap-2">
          {activeLevers.map(l => (
            <span key={l} className="text-[9px] font-mono font-semibold text-gold bg-gold/10 px-1.5 py-0.5 rounded">{l}</span>
          ))}
          <span className="text-[10px] text-ink/30 font-mono">cap {fp(colaInfo.cap)}</span>
          {!colaInfo.dnsy && (
            <button onClick={handleSolve}
              className="text-[10px] px-2.5 py-1 bg-ink/5 hover:bg-gold hover:text-ink rounded transition-colors font-medium flex items-center gap-1">
              <Target size={9} /> Solve
            </button>
          )}
        </div>
      </div>

      {/* ── Expanded ── */}
      {expanded && (
        <div className="border-t border-warm">

          {/* LEVERS */}
          <div className="px-5 pt-4 pb-3 bg-cream/30 border-b border-warm">
            <p className="text-[9px] uppercase tracking-widest text-ink/30 font-semibold mb-3">Levers</p>
            <div className="grid grid-cols-3 gap-6">

              {/* COLA slider */}
              <div>
                <div className="flex justify-between mb-1.5">
                  <span className="text-xs text-ink/50">COLA rate increase</span>
                  <span className="text-xs font-semibold text-ink font-mono">
                    {lever.colaApplied.toFixed(2)}%
                    <span className="text-ink/25 font-normal"> / {maxCola.toFixed(2)}%</span>
                  </span>
                </div>
                <input type="range" min="0" max={maxCola} step="0.05" value={lever.colaApplied}
                  onChange={e => upd('colaApplied', Number(e.target.value))}
                  disabled={colaInfo.dnsy || colaInfo.cap === 0}
                  className={`w-full h-1.5 accent-gold ${(colaInfo.dnsy || colaInfo.cap === 0) ? 'opacity-25 cursor-not-allowed' : ''}`}
                />
                <div className="text-[10px] text-ink/40 mt-1.5 font-mono space-y-0.5">
                  <div>Agent rate: {fr(results.A.newAgentRate)}</div>
                  <div>TL rate: {fr(results.A.newTLRate)}</div>
                </div>
                <p className="text-[9px] text-ink/25 mt-1">Active in Paths A and C</p>
              </div>

              {/* TL toggle */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-ink/50">Convert buffer → TL</span>
                  <button onClick={() => upd('tlOn', !lever.tlOn)}
                    disabled={!hasABuf && !lever.tlOn}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors
                      ${lever.tlOn ? 'bg-gold' : 'bg-ink/20'}
                      ${!hasABuf && !lever.tlOn ? 'opacity-25 cursor-not-allowed' : ''}`}>
                    <span className={`inline-block h-3.5 w-3.5 rounded-full bg-card transition-transform ${lever.tlOn ? 'translate-x-4' : 'translate-x-0.5'}`} />
                  </button>
                </div>
                {lever.tlOn ? (
                  <div className="bg-gold/10 border border-gold/40 rounded-lg p-2.5 text-xs">
                    <p className="text-ink font-medium">1 buffer agent → TL</p>
                    <p className="text-ink/50 font-mono mt-0.5">
                      Billing at {fr(project.tlRate || project.rate * 1.5)}/hr
                      {project.tlRate ? ' (contract rate)' : ' (1.5× default)'}
                    </p>
                  </div>
                ) : (
                  <p className="text-[10px] text-ink/40 leading-relaxed">
                    {hasABuf
                      ? `1 buffer agent eligible — toggle ON to reclassify as TL`
                      : `No agent buffer available`}
                  </p>
                )}
                <p className="text-[9px] text-ink/25 mt-2">Active in Paths B and C</p>
              </div>

              {/* Buffer stepper */}
              <div>
                <div className="flex justify-between mb-1.5">
                  <span className="text-xs text-ink/50">Buffer reduction</span>
                  <span className="text-xs font-semibold text-ink font-mono">{lever.headsToRemove.toFixed(2)} heads</span>
                </div>
                <div className="flex items-center gap-2 mb-1.5">
                  <button onClick={() => upd('headsToRemove', Math.max(0, lever.headsToRemove - STEP))}
                    disabled={lever.headsToRemove <= 0}
                    className="w-8 h-8 rounded border border-warm flex items-center justify-center text-ink/50 hover:bg-cream hover:text-ink disabled:opacity-25 font-bold text-base transition-colors">−</button>
                  <div className="flex-1 text-center">
                    <div className="text-sm font-mono text-ink font-semibold">{lever.headsToRemove.toFixed(2)}</div>
                    <div className="text-[9px] text-ink/35">of {maxExcess.toFixed(2)} excess</div>
                  </div>
                  <button onClick={() => upd('headsToRemove', Math.min(maxSteps * STEP, lever.headsToRemove + STEP))}
                    disabled={curSteps >= maxSteps}
                    className="w-8 h-8 rounded border border-warm flex items-center justify-center text-ink/50 hover:bg-cream hover:text-ink disabled:opacity-25 font-bold text-base transition-colors">+</button>
                </div>
                <p className="text-[10px] text-ink/40 font-mono">
                  Buffer: {fp(baseline.bufferPct)} → {fp(results.B.bufferPct)}
                </p>
                <p className="text-[9px] text-ink/25 mt-1">Active in Paths B and C</p>
              </div>

            </div>
          </div>

          {/* OUTCOMES TABLE */}
          <div className="px-5 py-4">
            <p className="text-[9px] uppercase tracking-widest text-ink/30 font-semibold mb-3">Outcomes</p>
            <table className="w-full">
              <thead>
                <tr className="border-b border-warm">
                  <th className="text-left pb-2 text-[10px] uppercase tracking-wider text-ink/25 font-semibold w-28"></th>
                  <th className="text-right pb-2 pr-8 text-[10px] uppercase tracking-wider text-ink/40 font-semibold">
                    Path A <span className="text-ink/20 normal-case font-normal">· COLA only</span>
                  </th>
                  <th className="text-right pb-2 pr-8 text-[10px] uppercase tracking-wider text-ink/40 font-semibold">
                    Path B <span className="text-ink/20 normal-case font-normal">· Structure</span>
                  </th>
                  <th className="text-right pb-2 text-[10px] uppercase tracking-wider text-gold font-semibold">
                    Path C <span className="text-gold/50 normal-case font-normal">· Combined</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {[
                  {
                    label: 'Margin',
                    vals: ['A','B','C'].map(p => {
                      const m = results[p].marginPct
                      const cls = m >= target ? 'text-green-700' : m >= target - 0.10 ? 'text-amber-hugo' : 'text-red-700'
                      return <span className={`font-semibold ${cls}`}>{fp(m)}{m >= target ? ' ✓' : ''}</span>
                    }),
                  },
                  {
                    label: 'Revenue /mo',
                    vals: ['A','B','C'].map(p => {
                      const d = results[p].revenue - baseline.revenue
                      return <span className={`font-mono text-xs ${d > 0 ? 'text-green-700' : 'text-ink/35'}`}>{fdelta(results[p].revenue, baseline.revenue)}</span>
                    }),
                  },
                  {
                    label: 'Cost /mo',
                    vals: ['A','B','C'].map(p => {
                      const d = results[p].cost - baseline.cost
                      return <span className={`font-mono text-xs ${d < 0 ? 'text-green-700' : 'text-ink/35'}`}>{fdelta(results[p].cost, baseline.cost)}</span>
                    }),
                  },
                  {
                    label: 'Gross Δ',
                    vals: ['A','B','C'].map(p => {
                      const d = results[p].grossMargin - baseline.grossMargin
                      return <span className={`font-mono text-xs font-semibold ${d >= 0 ? 'text-green-700' : 'text-red-700'}`}>{fdelta(results[p].grossMargin, baseline.grossMargin)}</span>
                    }),
                  },
                ].map(row => (
                  <tr key={row.label} className="border-b border-warm/40 last:border-0">
                    <td className="py-2 text-xs text-ink/40">{row.label}</td>
                    <td className="py-2 text-right pr-8">{row.vals[0]}</td>
                    <td className="py-2 text-right pr-8">{row.vals[1]}</td>
                    <td className="py-2 text-right">{row.vals[2]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>
      )}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────
export default function MarginPath({ projects, salaries, config }) {
  const TARGET = 0.85

  const [leverState, setLeverState]     = usePersistedState('sp_margin_levers', {})
  const [expanded,   setExpanded]       = usePersistedState('sp_margin_expanded', null)
  const [showTable,  setShowTable]      = useState(false)

  // Sort worst-margin first; use same sort for defaults + cards
  const sorted = useMemo(() => {
    return projects.map(p => {
      const ci = getCola(p.name)
      const b  = calcBaseline(p, ci.cap, salaries, config)
      return { project: p, colaInfo: ci, baseline: b }
    }).sort((a, b) => a.baseline.marginPct - b.baseline.marginPct)
  }, [projects, salaries, config])

  // Default: top 5 worst expanded
  const defaultExpanded = useMemo(() => {
    const m = {}
    sorted.slice(0, 5).forEach(({ project }) => { m[project.id] = true })
    return m
  }, [sorted])

  const expandedMap = expanded ?? defaultExpanded

  function toggleAcc(id) {
    const cur  = expanded ?? defaultExpanded
    setExpanded({ ...cur, [id]: !cur[id] })
  }
  function getLever(id)       { return leverState[id] || DEFAULT_LEVER }
  function setLeverFor(id, l) { setLeverState({ ...leverState, [id]: l }) }

  // Master controls
  const [mCola, setMCola] = useState(0)
  const [mTL,   setMTL]   = useState(false)
  const [mBuf,  setMBuf]  = useState(0)

  function applyMaster(colaVal, tlVal, bufVal) {
    const next = { ...leverState }
    sorted.forEach(({ project: p, colaInfo: ci }) => {
      if (ci.dnsy) return
      const cur = next[p.id] || DEFAULT_LEVER
      next[p.id] = {
        colaApplied:   colaVal !== null ? Math.min(ci.cap * 100, colaVal) : cur.colaApplied,
        tlOn:          tlVal   !== null ? (tlVal && (p.actualAgents - p.billableAgents) >= 1) : cur.tlOn,
        headsToRemove: bufVal  !== null ? Math.min(Math.floor(Math.max(0, (p.actualAgents + p.actualQA + p.actualTL + p.actualPC) - (p.billableAgents + p.billableQA + p.billableTL + p.billablePC)) / STEP) * STEP * bufVal / 100, Math.floor(Math.max(0, (p.actualAgents + p.actualQA + p.actualTL + p.actualPC) - (p.billableAgents + p.billableQA + p.billableTL + p.billablePC)) / STEP) * STEP) : cur.headsToRemove,
      }
    })
    setLeverState(next)
  }

  function solveAll() {
    const next = { ...leverState }
    sorted.forEach(({ project: p, colaInfo: ci }) => {
      if (ci.dnsy) return
      next[p.id] = solveForTarget(p, ci.cap, salaries, config, TARGET)
    })
    setLeverState(next)
  }

  function resetAll() {
    setLeverState({})
    setMCola(0); setMTL(false); setMBuf(0)
    setExpanded(null)
  }

  // Portfolio rollup (Path C)
  const rollup = useMemo(() => {
    let bRev = 0, bCost = 0, pRev = 0, pCost = 0, atTarget = 0
    sorted.forEach(({ project: p, colaInfo: ci, baseline: b }) => {
      const l = getLever(p.id)
      const c = calcPath(p, ci.cap, l, salaries, config)
      bRev += b.revenue; bCost += b.cost
      pRev += c.revenue; pCost += c.cost
      if (c.marginPct >= TARGET) atTarget++
    })
    return {
      baseMargin: bRev > 0 ? (bRev - bCost) / bRev : 0,
      pathMargin: pRev > 0 ? (pRev - pCost) / pRev : 0,
      revLift:    pRev - bRev,
      atTarget,
      total:      sorted.length,
      dnsy:       sorted.filter(r => r.colaInfo.dnsy).length,
    }
  }, [leverState, sorted, salaries, config])

  const rollupCells = [
    { label: 'Baseline margin',    val: fp(rollup.baseMargin),               sub: 'Current run-rate',   accent: marginColor(rollup.baseMargin) === 'green' },
    { label: 'Path C margin',      val: fp(rollup.pathMargin),               sub: `Δ ${(rollup.pathMargin - rollup.baseMargin >= 0 ? '+' : '')}${((rollup.pathMargin - rollup.baseMargin)*100).toFixed(1)}pp`, accent: true },
    { label: 'Annual revenue lift', val: fm(rollup.revLift * 12),            sub: `+${fm(rollup.revLift)}/mo` },
    { label: 'Accounts ≥85%',      val: `${rollup.atTarget} / ${rollup.total}`, sub: 'Under Path C' },
    { label: 'DNSY flagged',        val: rollup.dnsy,                         sub: 'Excluded from COLA' },
  ]

  return (
    <div className="space-y-4">

      {/* Explainer */}
      <div className="bg-gold/10 border-l-4 border-gold rounded-r-lg px-4 py-3">
        <p className="text-sm text-ink">
          <strong>Three paths to 85% per account.</strong>{' '}
          <span className="text-ink/60">
            Set levers once — Path A applies COLA only · Path B uses TL conversion + buffer reduction only · Path C combines all three.
            Worst-margin accounts are expanded by default.
          </span>
        </p>
      </div>

      {/* Rollup */}
      <div className="grid grid-cols-5 gap-3">
        {rollupCells.map(c => (
          <div key={c.label} className="bg-card rounded-xl border border-warm p-4">
            <p className="text-[10px] uppercase tracking-wider text-ink/40 font-semibold mb-1.5">{c.label}</p>
            <p className={`text-2xl font-semibold leading-none ${c.accent ? 'text-gold-dark' : 'text-ink'}`}>{c.val}</p>
            <p className="text-[10px] text-ink/40 mt-1.5">{c.sub}</p>
          </div>
        ))}
      </div>

      {/* Master controls */}
      <div className="bg-panel rounded-xl p-4 border border-panel-bd">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[10px] uppercase tracking-widest text-ink/40 font-semibold">Master controls</p>
          <div className="flex gap-2">
            <button onClick={solveAll} className="text-xs px-3 py-1.5 bg-gold hover:bg-gold-dark text-ink rounded font-semibold flex items-center gap-1 transition-colors">
              <Target size={11} /> Solve all to 85%
            </button>
            <button onClick={resetAll} className="text-xs px-3 py-1.5 border border-panel-bd text-ink/50 hover:text-card hover:bg-ink/30 rounded transition-colors">
              Reset
            </button>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-5">
          <div>
            <div className="flex justify-between mb-1.5">
              <span className="text-xs text-ink/40">Master COLA <span className="text-ink/25 text-[10px]">(applies up to each account's cap)</span></span>
              <span className="text-sm font-semibold text-card font-mono">{mCola.toFixed(1)}%</span>
            </div>
            <input type="range" min="0" max="30" step="0.1" value={mCola}
              onChange={e => { setMCola(Number(e.target.value)); applyMaster(Number(e.target.value), null, null) }}
              className="w-full h-1.5 accent-gold" />
          </div>
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-xs text-ink/40">Master TL toggle</span>
              <span className="text-xs text-card font-mono">{mTL ? 'ON' : 'OFF'}</span>
            </div>
            <button onClick={() => { setMTL(!mTL); applyMaster(null, !mTL, null) }}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${mTL ? 'bg-gold' : 'bg-ink/30'}`}>
              <span className={`inline-block h-3.5 w-3.5 rounded-full bg-card transition-transform ${mTL ? 'translate-x-4' : 'translate-x-0.5'}`} />
            </button>
          </div>
          <div>
            <div className="flex justify-between mb-1.5">
              <span className="text-xs text-ink/40">Master buffer reduction</span>
              <span className="text-sm font-semibold text-card font-mono">{mBuf}%</span>
            </div>
            <input type="range" min="0" max="100" step="1" value={mBuf}
              onChange={e => { setMBuf(Number(e.target.value)); applyMaster(null, null, Number(e.target.value)) }}
              className="w-full h-1.5 accent-gold" />
          </div>
        </div>
      </div>

      {/* Summary table toggle */}
      <div className="flex items-center justify-between">
        <button onClick={() => setShowTable(v => !v)}
          className="flex items-center gap-2 text-xs text-ink/50 hover:text-ink border border-warm rounded-lg px-3 py-2 bg-card hover:bg-cream transition-colors">
          <Table2 size={13} />
          {showTable ? 'Hide summary table' : 'Show summary table'}
        </button>
        <div className="flex gap-2 text-xs">
          <button onClick={() => setExpanded({})} className="px-3 py-1.5 border border-warm rounded text-ink/50 hover:bg-cream bg-card transition-colors">Collapse all</button>
          <button onClick={() => setExpanded(defaultExpanded)} className="px-3 py-1.5 border border-warm rounded text-ink/50 hover:bg-cream bg-card transition-colors">Top 5</button>
          <button onClick={() => { const a = {}; sorted.forEach(({ project: p }) => a[p.id] = true); setExpanded(a) }}
            className="px-3 py-1.5 border border-warm rounded text-ink/50 hover:bg-cream bg-card transition-colors">Expand all</button>
        </div>
      </div>

      {showTable && (
        <SummaryTable
          rows={sorted}
          leverState={leverState}
          setLeverFor={setLeverFor}
          salaries={salaries}
          config={config}
          target={TARGET}
        />
      )}

      {/* Account cards */}
      <div>
        <p className="text-[10px] uppercase tracking-widest text-ink/30 font-semibold mb-3">
          Per-account paths · sorted worst margin first
        </p>
        {sorted.map(({ project, colaInfo }) => (
          <AccountCard
            key={project.id}
            project={project}
            colaInfo={colaInfo}
            lever={getLever(project.id)}
            setLever={l => setLeverFor(project.id, l)}
            salaries={salaries}
            config={config}
            expanded={!!expandedMap[project.id]}
            onToggle={() => toggleAcc(project.id)}
            target={TARGET}
          />
        ))}
      </div>

    </div>
  )
}
