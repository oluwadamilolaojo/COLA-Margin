import React, { useState } from 'react'

function bufferColor(buf) {
  if (buf > 0.5)  return 'text-red-600'
  if (buf > 0.3)  return 'text-orange-600'
  if (buf > 0.15) return 'text-yellow-600'
  return 'text-green-600'
}

export default function BreakEvenCalculator({ computed, currency, fxRate }) {
  const [targetMargin, setTargetMargin] = useState(80)
  const sym = currency === 'NGN' ? '₦' : '$'
  const fx  = currency === 'NGN' ? fxRate : 1

  const rows = computed
    .filter(r => r.actualHeads > 0)
    .map(r => {
      const billableHours = r.billableHeads * 160 * 0.85
      const breakEven = billableHours > 0 ? r.totalCost / billableHours : 0
      const targetRate = billableHours > 0 ? r.totalCost / (billableHours * (1 - targetMargin / 100)) : 0
      const rateGap = targetRate - r.rate
      const status = r.rate >= targetRate ? 'ok' : r.rate >= breakEven ? 'thin' : 'loss'
      return { ...r, breakEven, targetRate, rateGap, status }
    })
    .sort((a, b) => b.rateGap - a.rateGap)

  const statusBadge = (s) => {
    if (s === 'ok')   return <span className="px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-700">healthy</span>
    if (s === 'thin') return <span className="px-2 py-0.5 rounded-full text-xs bg-yellow-100 text-yellow-700">thin</span>
    return <span className="px-2 py-0.5 rounded-full text-xs bg-red-100 text-red-700">loss</span>
  }

  return (
    <div className="bg-card rounded-xl border border-warm p-5">
      <h3 className="text-sm font-semibold text-ink mb-0.5">Break-even rate calculator</h3>
      <p className="text-xs text-ink/40 mb-4">What rate do you need to charge to hit your margin target?</p>

      <div className="flex items-center gap-4 mb-5 p-3 bg-cream rounded-lg">
        <span className="text-xs text-ink/70 font-medium whitespace-nowrap">Target margin</span>
        <input type="range" min={40} max={95} step={1} value={targetMargin}
          onChange={e => setTargetMargin(Number(e.target.value))}
          className="flex-1 h-1.5 accent-gray-900" />
        <span className="text-xs font-semibold text-ink w-8">{targetMargin}%</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-warm">
              <th className="text-left pb-2 text-ink/40 font-medium">Project</th>
              <th className="text-right pb-2 text-ink/40 font-medium">Current rate</th>
              <th className="text-right pb-2 text-ink/40 font-medium">Break-even</th>
              <th className="text-right pb-2 text-ink/40 font-medium">Target rate ({targetMargin}%)</th>
              <th className="text-right pb-2 text-ink/40 font-medium">Gap</th>
              <th className="text-right pb-2 text-ink/40 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {rows.map(r => (
              <tr key={r.id} className={r.status === 'loss' ? 'bg-red-50/40' : ''}>
                <td className="py-2 font-medium text-ink/90">{r.name}</td>
                <td className="py-2 text-right text-ink/80">${r.rate.toFixed(2)}</td>
                <td className="py-2 text-right text-ink/80">${r.breakEven.toFixed(2)}</td>
                <td className="py-2 text-right font-medium text-ink">${r.targetRate.toFixed(2)}</td>
                <td className={`py-2 text-right font-medium ${r.rateGap > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {r.rateGap > 0 ? '+' : ''}{r.rateGap.toFixed(2)}
                </td>
                <td className="py-2 text-right">{statusBadge(r.status)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-ink/40 mt-3">
        Break-even = total cost ÷ billable hours. Target rate = cost ÷ (billable hours × (1 − margin target)).
      </p>
    </div>
  )
}
