import { TL_RATES } from './data/cola'

const HEAD_STEP = 1 / 6  // 0.1667 — smallest buffer increment

/**
 * scenario = {
 *   colaApplied: number  — actual % to apply (0–colaCap*100, e.g. 2.5 = 2.5%)
 *   tlOn:        boolean — convert 1 buffer agent → TL and bill them
 *   headsToRemove: number — in HEAD_STEP increments
 * }
 */
export function calcPath(project, colaCap, scenario, salaries, config) {
  const { fxRate, hours, utilization, ctc, overhead } = config
  const colaApplied   = scenario.colaApplied   ?? 0
  const tlOn          = scenario.tlOn          ?? false
  const headsToRemove = scenario.headsToRemove ?? 0

  // ── COLA factor ──────────────────────────────────────────────
  const colaFactor = 1 + colaApplied / 100

  // ── TL conversion: 1 buffer agent → billable TL ──────────────
  const canConvertTL    = (project.actualAgents - project.billableAgents) >= 1
  const effectiveTLOn   = tlOn && canConvertTL
  const effActualAgents = project.actualAgents - (effectiveTLOn ? 1 : 0)
  const effActualTL     = project.actualTL     + (effectiveTLOn ? 1 : 0)
  const billableTL      = project.billableTL   + (effectiveTLOn ? 1 : 0)

  // ── Buffer reduction (per-head, from agent excess first) ─────
  const agentExcess  = Math.max(0, effActualAgents - project.billableAgents)
  const tlExcess     = Math.max(0, effActualTL     - billableTL)
  const totalExcess  = agentExcess + tlExcess
  const safeRemove   = Math.min(headsToRemove, totalExcess)
  const agentRemove  = Math.min(safeRemove, agentExcess)
  const tlRemove     = safeRemove - agentRemove

  const finalAgents  = effActualAgents - agentRemove
  const finalTL      = effActualTL     - tlRemove
  const finalQA      = project.actualQA
  const finalPC      = project.actualPC

  // ── Rates ───────────────────────────────────────────────────
  const newAgentRate = project.rate * colaFactor
  const tlBaseRate   = TL_RATES[project.name] || (project.rate * 1.5)
  const newTLRate    = tlBaseRate * colaFactor

  // ── Revenue (billable heads × hours × util × rate) ──────────
  const billableHrs = h => h * hours * (utilization / 100)
  const revenue =
    billableHrs(project.billableAgents) * newAgentRate +
    billableHrs(project.billableQA)     * newAgentRate + // QA billed at agent rate
    billableHrs(billableTL)             * newTLRate    +
    billableHrs(project.billablePC)     * newAgentRate   // PC billed at agent rate

  // ── Cost (actual effective heads × NGN salary ÷ FX) ─────────
  const salaryCost = (
    finalAgents * salaries.agent +
    finalQA     * salaries.qa   +
    finalTL     * salaries.tl   +
    finalPC     * salaries.pc
  ) / fxRate

  const ctcCost      = salaryCost * (ctc / 100)
  const overheadCost = revenue    * (overhead / 100)
  const totalCost    = salaryCost + ctcCost + overheadCost

  const marginPct    = revenue > 0 ? (revenue - totalCost) / revenue : 0

  // ── Buffer stats ─────────────────────────────────────────────
  const totalBillable = project.billableAgents + project.billableQA + billableTL + project.billablePC
  const totalActual   = finalAgents + finalQA + finalTL + finalPC
  const bufferPct     = totalBillable > 0 ? (totalActual - totalBillable) / totalBillable : 0

  return {
    revenue,
    cost:        totalCost,
    grossMargin: revenue - totalCost,
    marginPct,
    newAgentRate,
    newTLRate,
    headsRemoved:   safeRemove,
    effectiveHeads: totalActual,
    bufferPct,
    canConvertTL,
  }
}

/** Baseline = no levers applied */
export function calcBaseline(project, colaCap, salaries, config) {
  return calcPath(project, colaCap, { colaApplied: 0, tlOn: false, headsToRemove: 0 }, salaries, config)
}

/**
 * computePaths — enforces which levers each path uses
 *   Path A: COLA only
 *   Path B: TL toggle + buffer reduction (no COLA)
 *   Path C: all three
 */
export function computePaths(project, colaCap, lever, salaries, config) {
  const { colaApplied, tlOn, headsToRemove } = lever
  return {
    A: calcPath(project, colaCap, { colaApplied, tlOn: false, headsToRemove: 0 },    salaries, config),
    B: calcPath(project, colaCap, { colaApplied: 0, tlOn, headsToRemove },           salaries, config),
    C: calcPath(project, colaCap, { colaApplied, tlOn, headsToRemove },              salaries, config),
  }
}

/** Auto-solve: find minimum levers needed to hit target margin */
export function solveForTarget(project, colaCap, salaries, config, target = 0.85) {
  const hasAgentBuffer = (project.actualAgents - project.billableAgents) >= 1
  const tlOn = hasAgentBuffer

  // Max buffer cut after optional TL conversion
  const effActualAgents = project.actualAgents - (tlOn ? 1 : 0)
  const agentExcess     = Math.max(0, effActualAgents - project.billableAgents)
  const effTLBillable   = project.billableTL + (tlOn ? 1 : 0)
  const tlExcess        = Math.max(0, project.actualTL - effTLBillable)
  const maxRemove       = Math.floor((agentExcess + tlExcess) / HEAD_STEP) * HEAD_STEP

  // Try structure alone first
  const structureResult = calcPath(project, colaCap, { colaApplied: 0, tlOn, headsToRemove: maxRemove }, salaries, config)
  if (structureResult.marginPct >= target) {
    return { colaApplied: 0, tlOn, headsToRemove: maxRemove }
  }

  // Need COLA too — binary search for minimum colaApplied
  if (colaCap === 0) return { colaApplied: 0, tlOn, headsToRemove: maxRemove }

  const maxCola = colaCap * 100
  let lo = 0, hi = maxCola
  for (let i = 0; i < 30; i++) {
    const mid = (lo + hi) / 2
    const r   = calcPath(project, colaCap, { colaApplied: mid, tlOn, headsToRemove: maxRemove }, salaries, config)
    if (r.marginPct >= target) hi = mid; else lo = mid
  }
  return { colaApplied: Math.min(lo + 0.05, maxCola), tlOn, headsToRemove: maxRemove }
}

export const DEFAULT_LEVER = { colaApplied: 0, tlOn: false, headsToRemove: 0 }
export const HEAD_STEP_EXPORT = HEAD_STEP

export function recommendation(baseline, target = 0.85) {
  if (baseline.marginPct >= target) return 'On target — no action needed'
  const gap = (target - baseline.marginPct) * 100
  if (gap < 3)  return 'Small gap — COLA alone likely closes it'
  if (gap < 8)  return 'Moderate gap — COLA plus TL repricing'
  if (gap < 15) return 'Wide gap — combine all three levers'
  return 'Significant gap — full restructure or sunset'
}

export function marginColor(margin, target = 0.85) {
  if (margin >= target)            return 'green'
  if (margin >= target - 0.10)    return 'amber'
  return 'red'
}
