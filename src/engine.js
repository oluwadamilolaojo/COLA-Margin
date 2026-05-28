export function calcProject(p, salaries, config) {
  const { fxRate, hours, utilization, ctc, overhead, training, it } = config

  const agentUSD = salaries.agent / fxRate
  const qaUSD    = salaries.qa    / fxRate
  const tlUSD    = salaries.tl    / fxRate
  const pcUSD    = salaries.pc    / fxRate

  const billableHeads = p.billableAgents + p.billableQA + p.billableTL + p.billablePC
  const actualHeads   = p.actualAgents   + p.actualQA   + p.actualTL   + p.actualPC

  // Split buffer into agent buffer vs lead buffer
  const agentBillable = p.billableAgents + p.billableQA
  const agentActual   = p.actualAgents   + p.actualQA
  const leadBillable  = p.billableTL     + p.billablePC
  const leadActual    = p.actualTL       + p.actualPC

  const agentBuffer = agentBillable > 0
    ? (agentActual - agentBillable) / agentBillable
    : agentActual > 0 ? 1 : 0

  const leadBuffer  = leadBillable > 0
    ? (leadActual - leadBillable) / leadBillable
    : leadActual > 0 ? 1 : 0

  const billableHours = billableHeads * hours * (utilization / 100)
  const revenue       = billableHours * p.rate

  const salaryCost =
    p.actualAgents * agentUSD +
    p.actualQA     * qaUSD    +
    p.actualTL     * tlUSD    +
    p.actualPC     * pcUSD

  const ctcCost      = salaryCost * (ctc / 100)
  const trainingCost = actualHeads * training
  const itCost       = actualHeads * it
  const overheadCost = revenue * (overhead / 100)
  const totalCost    = salaryCost + ctcCost + trainingCost + itCost + overheadCost

  // Overall buffer = (actual - billable) / billable
  const buffer  = billableHeads > 0 ? (actualHeads - billableHeads) / billableHeads : actualHeads > 0 ? 1 : 0
  const leakage = (actualHeads - billableHeads) * hours * p.rate

  const grossMargin = revenue - totalCost
  const marginPct   = revenue > 0 ? grossMargin / revenue : 0

  return {
    ...p,
    billableHeads,
    actualHeads,
    agentBillable,
    agentActual,
    leadBillable,
    leadActual,
    agentBuffer,
    leadBuffer,
    billableHours,
    revenue,
    salaryCost,
    ctcCost,
    trainingCost,
    itCost,
    overheadCost,
    totalCost,
    buffer,
    leakage,
    grossMargin,
    marginPct,
  }
}

export function calcPortfolio(projects, salaries, config) {
  const rows = projects.map(p => calcProject(p, salaries, config))

  // Exclude training camp projects from headline buffer
  const activeRows    = rows.filter(r => !r.trainingCamp)
  const allRows       = rows

  const totalRevenue  = allRows.reduce((s, r) => s + r.revenue,      0)
  const totalCost     = allRows.reduce((s, r) => s + r.totalCost,     0)
  const totalLeakage  = allRows.reduce((s, r) => s + r.leakage,       0)
  const totalBillable = allRows.reduce((s, r) => s + r.billableHeads, 0)
  const totalActual   = allRows.reduce((s, r) => s + r.actualHeads,   0)

  // Headline buffer excludes training camp
  const activeBillable = activeRows.reduce((s, r) => s + r.billableHeads, 0)
  const activeActual   = activeRows.reduce((s, r) => s + r.actualHeads,   0)
  const portfolioBuffer = activeBillable > 0 ? (activeActual - activeBillable) / activeBillable : 0

  // Agent vs lead buffer split (active only)
  const totalAgentBillable = activeRows.reduce((s, r) => s + r.agentBillable, 0)
  const totalAgentActual   = activeRows.reduce((s, r) => s + r.agentActual,   0)
  const totalLeadBillable  = activeRows.reduce((s, r) => s + r.leadBillable,  0)
  const totalLeadActual    = activeRows.reduce((s, r) => s + r.leadActual,    0)

  const portfolioAgentBuffer = totalAgentBillable > 0 ? (totalAgentActual - totalAgentBillable) / totalAgentBillable : 0
  const portfolioLeadBuffer  = totalLeadBillable  > 0 ? (totalLeadActual  - totalLeadBillable)  / totalLeadBillable  : 0

  const portfolioMargin = totalRevenue > 0 ? (totalRevenue - totalCost) / totalRevenue : 0
  const grossMargin     = totalRevenue - totalCost

  const trainingCampCount = rows.filter(r => r.trainingCamp).length

  return {
    rows,
    activeRows,
    totalRevenue,
    totalCost,
    grossMargin,
    totalLeakage,
    totalBillable,
    totalActual,
    activeBillable,
    activeActual,
    portfolioBuffer,
    portfolioAgentBuffer,
    portfolioLeadBuffer,
    portfolioMargin,
    trainingCampCount,
    totalAgentBillable,
    totalAgentActual,
    totalLeadBillable,
    totalLeadActual,
  }
}

export function autoSolve(portfolio, targetBufferPct, salaries, config) {
  const { fxRate, hours } = config
  const agentUSD   = salaries.agent / fxRate
  const excessHeads = portfolio.activeActual - portfolio.activeBillable
  const targetActual = Math.ceil(portfolio.activeBillable * (1 + targetBufferPct / 100))
  const headsToReduce = Math.max(0, portfolio.activeActual - targetActual)
  const costSavedByReduction = headsToReduce * agentUSD * (1 + config.ctc / 100)
  const totalActualHours = portfolio.activeActual * hours * (config.utilization / 100)
  const requiredRateForAll = portfolio.totalCost / totalActualHours || 0
  const convertibleHeads = excessHeads - headsToReduce
  const avgRate = portfolio.totalRevenue / (portfolio.activeBillable * hours * config.utilization / 100) || 0
  const additionalRevenue = convertibleHeads * hours * (config.utilization / 100) * avgRate

  return {
    currentBuffer: Math.round(portfolio.portfolioBuffer * 100),
    targetBuffer:  targetBufferPct,
    excessHeads,
    headsToReduce,
    targetActual,
    costSavedByReduction,
    requiredRateForAll,
    additionalRevenue,
    convertibleHeads,
  }
}
