import React, { useState } from 'react'
import { TrendingUp, TrendingDown, Minus, Lock } from 'lucide-react'

function Delta({ val, fmt = v => v, inverse = false }) {
  if (Math.abs(val) < 0.001) return <span className="text-ink/40 text-xs flex items-center gap-0.5"><Minus size={10} />—</span>
  const positive = inverse ? val < 0 : val > 0
  return (
    <span className={`text-xs flex items-center gap-0.5 font-medium ${positive ? 'text-green-600' : 'text-red-600'}`}>
      {val > 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
      {val > 0 ? '+' : ''}{fmt(val)}
    </span>
  )
}

export default function MoMTracker({ portfolio, currency, fxRate }) {
  const [baseline, setBaseline] = useState(null)
  const [baselineLabel, setBaselineLabel] = useState('')
  const sym = currency === 'NGN' ? '₦' : '$'
  const fx  = currency === 'NGN' ? fxRate : 1

  function lockBaseline() {
    setBaseline({
      revenue:    portfolio.totalRevenue,
      cost:       portfolio.totalCost,
      margin:     portfolio.portfolioMargin,
      buffer:     portfolio.portfolioBuffer,
      leakage:    portfolio.totalLeakage,
      billable:   portfolio.totalBillable,
      actual:     portfolio.totalActual,
      lockedAt:   new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
    })
    setBaselineLabel(new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }))
  }

  function clearBaseline() { setBaseline(null) }

  const fmtMoney = v => {
    const val = v * fx
    if (Math.abs(val) >= 1000) return sym + (val/1000).toFixed(0) + 'k'
    return sym + Math.round(val)
  }

  const metrics = [
    {
      label: 'Revenue',
      current: portfolio.totalRevenue,
      base: baseline?.revenue,
      fmt: v => fmtMoney(v),
      fmtDelta: v => fmtMoney(v),
    },
    {
      label: 'Total cost',
      current: portfolio.totalCost,
      base: baseline?.cost,
      fmt: v => fmtMoney(v),
      fmtDelta: v => fmtMoney(v),
      inverse: true,
    },
    {
      label: 'Gross margin %',
      current: portfolio.portfolioMargin,
      base: baseline?.margin,
      fmt: v => (v * 100).toFixed(1) + '%',
      fmtDelta: v => (v * 100).toFixed(1) + 'pp',
    },
    {
      label: 'Buffer %',
      current: portfolio.portfolioBuffer,
      base: baseline?.buffer,
      fmt: v => (v * 100).toFixed(1) + '%',
      fmtDelta: v => (v * 100).toFixed(1) + 'pp',
      inverse: true,
    },
    {
      label: 'Leakage',
      current: portfolio.totalLeakage,
      base: baseline?.leakage,
      fmt: v => fmtMoney(v),
      fmtDelta: v => fmtMoney(v),
      inverse: true,
    },
    {
      label: 'Billable heads',
      current: portfolio.totalBillable,
      base: baseline?.billable,
      fmt: v => v,
      fmtDelta: v => (v > 0 ? '+' : '') + v + ' heads',
    },
    {
      label: 'Actual heads',
      current: portfolio.totalActual,
      base: baseline?.actual,
      fmt: v => v,
      fmtDelta: v => (v > 0 ? '+' : '') + v + ' heads',
      inverse: true,
    },
  ]

  return (
    <div className="bg-card rounded-xl border border-warm p-5">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-ink mb-0.5">Month-over-month tracker</h3>
          <p className="text-xs text-ink/40">
            {baseline ? `Comparing current vs baseline locked: ${baselineLabel}` : 'Lock current numbers as your baseline to start tracking'}
          </p>
        </div>
        <div className="flex gap-2">
          {baseline && (
            <button onClick={clearBaseline}
              className="text-xs px-3 py-1.5 border border-warm rounded-lg text-ink/50 hover:bg-cream transition-colors">
              Clear
            </button>
          )}
          <button onClick={lockBaseline}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-panel text-white rounded-lg hover:bg-gray-700 transition-colors">
            <Lock size={11} />
            {baseline ? 'Re-lock baseline' : 'Lock baseline'}
          </button>
        </div>
      </div>

      {!baseline ? (
        <div className="border-2 border-dashed border-warm rounded-xl p-8 text-center">
          <Lock size={20} className="text-ink/30 mx-auto mb-2" />
          <p className="text-sm text-ink/40 mb-1">No baseline locked yet</p>
          <p className="text-xs text-ink/30">Click "Lock baseline" to snapshot today's numbers. Next month, come back and see what changed.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {metrics.map((m, i) => {
            const delta = m.base != null ? m.current - m.base : null
            return (
              <div key={i} className="bg-cream rounded-lg p-3">
                <p className="text-xs text-ink/40 mb-1">{m.label}</p>
                <p className="text-base font-semibold text-ink mb-1">{m.fmt(m.current)}</p>
                <div className="flex items-center gap-1">
                  <span className="text-xs text-ink/40">vs {baseline.lockedAt}:</span>
                  {delta !== null
                    ? <Delta val={delta} fmt={v => m.fmtDelta(Math.abs(v))} inverse={m.inverse} />
                    : <span className="text-xs text-ink/30">—</span>
                  }
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
