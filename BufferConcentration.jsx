import React, { useState } from 'react'
import { autoSolve } from '../engine'
import { Lightbulb, Minus, TrendingUp } from 'lucide-react'

function fmt(val, sym, fx) {
  return sym + Math.round(val * fx).toLocaleString('en-US')
}

export default function ScenarioPanel({ portfolio, salaries, config, currency, fxRate }) {
  const [rateAdj, setRateAdj]           = useState(0)    // % adjustment
  const [hcAdj, setHcAdj]               = useState(0)    // heads to remove
  const [targetBuffer, setTargetBuffer] = useState(20)   // %

  const sym = currency === 'NGN' ? '₦' : '$'
  const fx  = currency === 'NGN' ? fxRate : 1

  // Apply rate adjustment
  const adjRevenue  = portfolio.totalRevenue * (1 + rateAdj / 100)
  const adjMargin   = portfolio.totalCost > 0 ? (adjRevenue - portfolio.totalCost) / adjRevenue : 0

  // Apply headcount reduction (assume average agent cost)
  const agentUSD    = salaries.agent / fxRate
  const hcSaving    = hcAdj * agentUSD * (1 + config.ctc / 100)
  const adjCost     = Math.max(0, portfolio.totalCost - hcSaving)
  const adjMarginHC = portfolio.totalRevenue > 0 ? (portfolio.totalRevenue - adjCost) / portfolio.totalRevenue : 0

  // Combined
  const combinedRevenue = portfolio.totalRevenue * (1 + rateAdj / 100)
  const combinedCost    = adjCost
  const combinedMargin  = combinedRevenue > 0 ? (combinedRevenue - combinedCost) / combinedRevenue : 0
  const combinedBuffer  = (portfolio.totalActual - hcAdj - portfolio.totalBillable) / portfolio.totalBillable

  // Auto-solve
  const solve = autoSolve(portfolio, targetBuffer, salaries, config)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

      {/* Scenario Sliders */}
      <div className="bg-card rounded-xl border border-warm p-5">
        <h3 className="text-sm font-semibold text-ink mb-1">Scenario Simulator</h3>
        <p className="text-xs text-ink/40 mb-5">Adjust levers and see real-time impact</p>

        {/* Rate slider */}
        <div className="mb-5">
          <div className="flex justify-between mb-1.5">
            <span className="text-xs text-ink/70 font-medium">Rate adjustment</span>
            <span className={`text-xs font-semibold ${rateAdj >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {rateAdj >= 0 ? '+' : ''}{rateAdj}%
            </span>
          </div>
          <input type="range" min={-20} max={30} step={1} value={rateAdj}
            onChange={e => setRateAdj(Number(e.target.value))}
            className="w-full h-1.5 bg-gray-200 rounded appearance-none cursor-pointer accent-gray-900 mb-3"/>
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-cream rounded-lg p-2.5 text-center">
              <p className="text-xs text-ink/40 mb-0.5">New revenue</p>
              <p className="text-sm font-semibold text-ink">{fmt(adjRevenue, sym, fx)}</p>
            </div>
            <div className="bg-cream rounded-lg p-2.5 text-center">
              <p className="text-xs text-ink/40 mb-0.5">Revenue delta</p>
              <p className={`text-sm font-semibold ${rateAdj >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {rateAdj >= 0 ? '+' : ''}{fmt(adjRevenue - portfolio.totalRevenue, sym, fx)}
              </p>
            </div>
            <div className="bg-cream rounded-lg p-2.5 text-center">
              <p className="text-xs text-ink/40 mb-0.5">New margin</p>
              <p className="text-sm font-semibold text-ink">{(adjMargin * 100).toFixed(1)}%</p>
            </div>
          </div>
        </div>

        {/* HC slider */}
        <div className="mb-5">
          <div className="flex justify-between mb-1.5">
            <span className="text-xs text-ink/70 font-medium">Headcount reduction</span>
            <span className="text-xs font-semibold text-orange-600">−{hcAdj} heads</span>
          </div>
          <input type="range" min={0} max={portfolio.totalActual - portfolio.totalBillable} step={1} value={hcAdj}
            onChange={e => setHcAdj(Number(e.target.value))}
            className="w-full h-1.5 bg-gray-200 rounded appearance-none cursor-pointer accent-gray-900 mb-3"/>
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-cream rounded-lg p-2.5 text-center">
              <p className="text-xs text-ink/40 mb-0.5">Cost saved</p>
              <p className="text-sm font-semibold text-green-600">+{fmt(hcSaving, sym, fx)}</p>
            </div>
            <div className="bg-cream rounded-lg p-2.5 text-center">
              <p className="text-xs text-ink/40 mb-0.5">New buffer</p>
              <p className={`text-sm font-semibold ${combinedBuffer <= 0.2 ? 'text-green-600' : 'text-orange-600'}`}>
                {Math.max(0, combinedBuffer * 100).toFixed(1)}%
              </p>
            </div>
            <div className="bg-cream rounded-lg p-2.5 text-center">
              <p className="text-xs text-ink/40 mb-0.5">New margin</p>
              <p className="text-sm font-semibold text-ink">{(adjMarginHC * 100).toFixed(1)}%</p>
            </div>
          </div>
        </div>

        {/* Combined impact */}
        {(rateAdj !== 0 || hcAdj !== 0) && (
          <div className="bg-panel rounded-xl p-4">
            <p className="text-xs text-ink/40 mb-3 font-medium">Combined impact</p>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <p className="text-xs text-ink/50 mb-0.5">Revenue</p>
                <p className="text-sm font-semibold text-white">{fmt(combinedRevenue, sym, fx)}</p>
              </div>
              <div>
                <p className="text-xs text-ink/50 mb-0.5">Margin</p>
                <p className="text-sm font-semibold text-green-400">{(combinedMargin * 100).toFixed(1)}%</p>
              </div>
              <div>
                <p className="text-xs text-ink/50 mb-0.5">Buffer</p>
                <p className={`text-sm font-semibold ${Math.max(0, combinedBuffer) <= 0.2 ? 'text-green-400' : 'text-orange-400'}`}>
                  {Math.max(0, combinedBuffer * 100).toFixed(1)}%
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Auto-solve */}
      <div className="bg-card rounded-xl border border-warm p-5">
        <div className="flex items-center gap-2 mb-1">
          <Lightbulb size={14} className="text-amber-500"/>
          <h3 className="text-sm font-semibold text-ink">Auto-solve</h3>
        </div>
        <p className="text-xs text-ink/40 mb-5">Set your target buffer and see what it takes to get there</p>

        <div className="mb-5">
          <div className="flex justify-between mb-1.5">
            <span className="text-xs text-ink/70 font-medium">Target buffer</span>
            <span className="text-xs font-semibold text-ink">{targetBuffer}%</span>
          </div>
          <input type="range" min={5} max={35} step={1} value={targetBuffer}
            onChange={e => setTargetBuffer(Number(e.target.value))}
            className="w-full h-1.5 bg-gray-200 rounded appearance-none cursor-pointer accent-gray-900"/>
          <div className="flex justify-between text-xs text-ink/30 mt-1">
            <span>5% (boss)</span><span>20% (your target)</span><span>35% (today)</span>
          </div>
        </div>

        <div className="space-y-3">
          {/* Option A */}
          <div className="border border-warm rounded-xl p-3.5">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-5 h-5 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-xs font-bold">A</div>
              <span className="text-xs font-semibold text-ink/80">Reduce headcount</span>
            </div>
            <p className="text-xs text-ink/50 mb-2">Remove <strong className="text-ink/90">{solve.headsToReduce} heads</strong> to bring actual to {solve.targetActual}</p>
            <div className="flex gap-2">
              <div className="flex-1 bg-cream rounded-lg p-2 text-center">
                <p className="text-xs text-ink/40">Heads removed</p>
                <p className="text-sm font-semibold text-ink">−{solve.headsToReduce}</p>
              </div>
              <div className="flex-1 bg-cream rounded-lg p-2 text-center">
                <p className="text-xs text-ink/40">Cost saved / mo</p>
                <p className="text-sm font-semibold text-green-600">+{fmt(solve.costSavedByReduction, sym, fx)}</p>
              </div>
            </div>
          </div>

          {/* Option B */}
          <div className="border border-warm rounded-xl p-3.5">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">B</div>
              <span className="text-xs font-semibold text-ink/80">Increase billing rate</span>
            </div>
            <p className="text-xs text-ink/50 mb-2">
              Bill all actual heads — required avg rate: <strong className="text-ink/90">${solve.requiredRateForAll.toFixed(2)}/hr</strong>
            </p>
            <div className="flex gap-2">
              <div className="flex-1 bg-cream rounded-lg p-2 text-center">
                <p className="text-xs text-ink/40">Required rate</p>
                <p className="text-sm font-semibold text-ink">${solve.requiredRateForAll.toFixed(2)}/hr</p>
              </div>
              <div className="flex-1 bg-cream rounded-lg p-2 text-center">
                <p className="text-xs text-ink/40">Addtl revenue</p>
                <p className="text-sm font-semibold text-blue-600">+{fmt(solve.additionalRevenue, sym, fx)}</p>
              </div>
            </div>
          </div>

          {/* Option C */}
          <div className="border border-dashed border-warm rounded-xl p-3.5 bg-cream/50">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-5 h-5 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs font-bold">C</div>
              <span className="text-xs font-semibold text-ink/80">Transfer to big projects</span>
            </div>
            <p className="text-xs text-ink/50">
              Redeploy <strong className="text-ink/90">{solve.headsToReduce} pre-trained heads</strong> to big projects instead of terminating. Buffer drops, big project ramp cost avoided.
            </p>
          </div>
        </div>
      </div>

    </div>
  )
}
