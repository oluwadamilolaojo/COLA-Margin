import React, { useState } from 'react'
import { AlertTriangle } from 'lucide-react'

function scoreColor(s) {
  if (s >= 80) return { bg: 'bg-green-100', text: 'text-green-700', bar: '#22c55e' }
  if (s >= 60) return { bg: 'bg-yellow-100', text: 'text-yellow-700', bar: '#eab308' }
  if (s >= 40) return { bg: 'bg-orange-100', text: 'text-orange-700', bar: '#f97316' }
  return { bg: 'bg-red-100', text: 'text-red-700', bar: '#ef4444' }
}

function calcHealthScore(r, avgRate, minRate) {
  // 4 dimensions, 25 pts each
  // 1. Buffer (25pts) — 0% = 25, 50%+ = 0
  const bufScore = Math.max(0, 25 - (r.buffer * 50))

  // 2. Margin (25pts) — 90%+ = 25, below 60% = 0
  const marginScore = Math.max(0, Math.min(25, (r.marginPct - 0.6) / 0.3 * 25))

  // 3. Rate vs benchmark (25pts) — at/above avg = 25, below min = 0
  const rateScore = r.rate >= avgRate ? 25 : r.rate >= minRate ? ((r.rate - minRate) / (avgRate - minRate)) * 25 : 0

  // 4. Leakage efficiency (25pts) — no leakage = 25, leakage > 20% of revenue = 0
  const leakRatio = r.revenue > 0 ? r.leakage / (r.revenue + r.leakage) : 0
  const leakScore = Math.max(0, 25 - (leakRatio * 125))

  const total = Math.round(bufScore + marginScore + rateScore + leakScore)
  return { total, bufScore: Math.round(bufScore), marginScore: Math.round(marginScore), rateScore: Math.round(rateScore), leakScore: Math.round(leakScore) }
}

export default function HealthAndBenchmark({ computed, currency, fxRate }) {
  const [minRate, setMinRate] = useState(11)
  const sym = currency === 'NGN' ? '₦' : '$'
  const fx  = currency === 'NGN' ? fxRate : 1

  const activeProjects = computed.filter(r => r.actualHeads > 0)
  const avgRate = activeProjects.length > 0
    ? activeProjects.reduce((s, r) => s + r.rate, 0) / activeProjects.length
    : 12

  const rows = activeProjects
    .map(r => ({ ...r, health: calcHealthScore(r, avgRate, minRate) }))
    .sort((a, b) => a.health.total - b.health.total)

  const flagged = rows.filter(r => r.rate < minRate || r.rate < avgRate)

  return (
    <div className="space-y-4">

      {/* Rate benchmarking controls */}
      <div className="bg-card rounded-xl border border-warm p-5">
        <h3 className="text-sm font-semibold text-ink mb-0.5">Client rate benchmarking</h3>
        <p className="text-xs text-ink/40 mb-4">Flag projects below your minimum or below portfolio average</p>

        <div className="flex items-center gap-4 mb-4 p-3 bg-cream rounded-lg">
          <span className="text-xs text-ink/70 font-medium whitespace-nowrap">Minimum acceptable rate</span>
          <input type="range" min={8} max={20} step={0.5} value={minRate}
            onChange={e => setMinRate(Number(e.target.value))}
            className="flex-1 h-1.5 accent-gray-900" />
          <span className="text-xs font-semibold text-ink w-14">${minRate}/hr</span>
        </div>

        <div className="flex gap-4 mb-4 text-xs text-ink/50">
          <span>Portfolio avg rate: <strong className="text-ink/90">${avgRate.toFixed(2)}/hr</strong></span>
          <span>Flagged projects: <strong className="text-red-600">{flagged.length}</strong></span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-warm">
                <th className="text-left pb-2 text-ink/40 font-medium">Project</th>
                <th className="text-right pb-2 text-ink/40 font-medium">Rate</th>
                <th className="text-right pb-2 text-ink/40 font-medium">vs avg</th>
                <th className="text-right pb-2 text-ink/40 font-medium">vs min</th>
                <th className="text-right pb-2 text-ink/40 font-medium">Flag</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {[...rows].sort((a,b) => a.rate - b.rate).map(r => {
                const belowMin = r.rate < minRate
                const belowAvg = r.rate < avgRate
                const vsAvg = r.rate - avgRate
                const vsMin = r.rate - minRate
                return (
                  <tr key={r.id} className={belowMin ? 'bg-red-50/40' : belowAvg ? 'bg-yellow-50/30' : ''}>
                    <td className="py-2 font-medium text-ink/90">{r.name}</td>
                    <td className="py-2 text-right text-ink/80">${r.rate.toFixed(2)}</td>
                    <td className={`py-2 text-right font-medium ${vsAvg >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {vsAvg >= 0 ? '+' : ''}{vsAvg.toFixed(2)}
                    </td>
                    <td className={`py-2 text-right font-medium ${vsMin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {vsMin >= 0 ? '+' : ''}{vsMin.toFixed(2)}
                    </td>
                    <td className="py-2 text-right">
                      {belowMin
                        ? <span className="flex items-center justify-end gap-1 text-red-600"><AlertTriangle size={10}/>below min</span>
                        : belowAvg
                        ? <span className="flex items-center justify-end gap-1 text-yellow-600"><AlertTriangle size={10}/>below avg</span>
                        : <span className="text-green-600">ok</span>
                      }
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Health scores */}
      <div className="bg-card rounded-xl border border-warm p-5">
        <h3 className="text-sm font-semibold text-ink mb-0.5">Project health scores</h3>
        <p className="text-xs text-ink/40 mb-4">Composite score across buffer, margin, rate, and leakage efficiency · sorted worst first</p>

        <div className="space-y-2">
          {rows.map(r => {
            const c = scoreColor(r.health.total)
            return (
              <div key={r.id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-cream">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${c.bg}`}>
                  <span className={`text-sm font-semibold ${c.text}`}>{r.health.total}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-ink/90">{r.name}</span>
                    <div className="flex gap-2 text-xs text-ink/40">
                      <span title="Buffer score">B:{r.health.bufScore}</span>
                      <span title="Margin score">M:{r.health.marginScore}</span>
                      <span title="Rate score">R:{r.health.rateScore}</span>
                      <span title="Leakage score">L:{r.health.leakScore}</span>
                    </div>
                  </div>
                  <div className="h-1.5 bg-warm/20 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${r.health.total}%`, background: c.bar }} />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
        <p className="text-xs text-ink/30 mt-3">B = Buffer · M = Margin · R = Rate · L = Leakage. Each dimension max 25pts.</p>
      </div>

    </div>
  )
}
