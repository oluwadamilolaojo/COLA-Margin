import React from 'react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'

const COLORS = ['#ef4444','#f97316','#eab308','#22c55e','#3b82f6','#8b5cf6','#ec4899','#14b8a6','#f59e0b','#6366f1']

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="bg-card border border-warm rounded-lg shadow p-2.5 text-xs">
      <p className="font-semibold text-ink/90">{d.name}</p>
      <p className="text-ink/50">Excess heads: <span className="font-medium text-ink/90">{d.excess}</span></p>
      <p className="text-ink/50">Share of buffer: <span className="font-medium text-ink/90">{d.share}%</span></p>
      <p className="text-ink/50">Buffer %: <span className="font-medium text-ink/90">{Math.round(d.buf * 100)}%</span></p>
    </div>
  )
}

export default function BufferConcentration({ computed }) {
  const withExcess = computed
    .filter(r => r.actualHeads > r.billableHeads)
    .sort((a, b) => (b.actualHeads - b.billableHeads) - (a.actualHeads - a.billableHeads))

  const totalExcess = withExcess.reduce((s, r) => s + (r.actualHeads - r.billableHeads), 0)

  const data = withExcess.map(r => ({
    name: r.name,
    excess: r.actualHeads - r.billableHeads,
    share: Math.round((r.actualHeads - r.billableHeads) / totalExcess * 100),
    buf: r.buffer,
    value: r.actualHeads - r.billableHeads,
  }))

  const top3 = data.slice(0, 3)
  const top3Share = top3.reduce((s, d) => s + d.share, 0)

  return (
    <div className="bg-card rounded-xl border border-warm p-5">
      <h3 className="text-sm font-semibold text-ink mb-0.5">Buffer concentration</h3>
      <p className="text-xs text-ink/40 mb-4">Which projects own your excess headcount</p>

      <div className="grid grid-cols-2 gap-4 items-center">
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" innerRadius={55} outerRadius={90}
              dataKey="value" paddingAngle={2}>
              {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>

        <div>
          <div className="bg-amber-50 rounded-lg p-2.5 mb-3 text-center">
            <p className="text-xs text-amber-600 mb-0.5">Top 3 projects own</p>
            <p className="text-2xl font-semibold text-amber-700">{top3Share}%</p>
            <p className="text-xs text-amber-500">of all excess heads</p>
          </div>
          <div className="space-y-1.5">
            {data.map((d, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                <span className="text-xs text-ink/70 flex-1 truncate">{d.name}</span>
                <span className="text-xs font-medium text-ink/90">{d.excess} heads</span>
                <span className="text-xs text-ink/40">{d.share}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-50">
        <p className="text-xs text-ink/50">
          <span className="font-medium text-ink/80">{totalExcess} total excess heads</span> across {withExcess.length} projects.
          {top3.length > 0 && ` Fix ${top3.map(d => d.name).join(', ')} and you solve ${top3Share}% of the problem.`}
        </p>
      </div>
    </div>
  )
}
