import React from 'react'
import { TrendingUp, TrendingDown, AlertTriangle, Users, DollarSign, Zap, Tent } from 'lucide-react'

function fmt(val, currency, fxRate, type = 'currency') {
  const v = currency === 'NGN' ? val * fxRate : val
  if (type === 'currency') {
    const sym = currency === 'NGN' ? '₦' : '$'
    if (Math.abs(v) >= 1000000) return sym + (v / 1000000).toFixed(1) + 'M'
    if (Math.abs(v) >= 1000)    return sym + (v / 1000).toFixed(0) + 'k'
    return sym + Math.round(v)
  }
  if (type === 'pct') return (val * 100).toFixed(1) + '%'
  return v.toLocaleString()
}

// Green ≤20%, Amber 20-30%, Red >30%
function bufColor(buf) {
  if (buf > 0.30) return 'red'
  if (buf > 0.20) return 'amber'
  return 'green'
}

function PrimaryCard({ label, value, sub, color, icon: Icon, flag, extra }) {
  const colors = {
    red:   { bg: 'bg-red-50 border-red-200',    val: 'text-red-700',    sub: 'text-red-400' },
    amber: { bg: 'bg-amber-50 border-amber-200', val: 'text-amber-700',  sub: 'text-amber-400' },
    green: { bg: 'bg-green-50 border-green-200', val: 'text-green-700',  sub: 'text-green-400' },
    gray:  { bg: 'bg-card border-warm',     val: 'text-ink',   sub: 'text-ink/40' },
  }
  const c = colors[color] || colors.gray
  return (
    <div className={`rounded-xl border-2 p-5 ${c.bg}`}>
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs font-medium text-ink/50 leading-tight">{label}</p>
        {Icon && <Icon size={15} className="text-ink/30 mt-0.5 flex-shrink-0" />}
      </div>
      <p className={`text-3xl font-semibold tracking-tight ${c.val}`}>{value}</p>
      {sub   && <p className={`text-xs mt-1.5 ${c.sub}`}>{sub}</p>}
      {flag  && (
        <div className="mt-2 flex items-center gap-1">
          <AlertTriangle size={10} className="text-amber-500" />
          <span className="text-xs text-amber-600">{flag}</span>
        </div>
      )}
      {extra && <div className="mt-3 pt-3 border-t border-warm">{extra}</div>}
    </div>
  )
}

function SecondaryCard({ label, value, sub, icon: Icon }) {
  return (
    <div className="rounded-xl border border-warm bg-card p-4">
      <div className="flex items-start justify-between mb-2">
        <p className="text-xs text-ink/40 leading-tight">{label}</p>
        {Icon && <Icon size={13} className="text-ink/20 mt-0.5 flex-shrink-0" />}
      </div>
      <p className="text-xl font-semibold text-ink tracking-tight">{value}</p>
      {sub && <p className="text-xs text-ink/40 mt-1">{sub}</p>}
    </div>
  )
}

export default function ExecutiveSummary({ portfolio, currency, fxRate }) {
  const {
    totalRevenue, totalCost, grossMargin, portfolioMargin,
    portfolioBuffer, portfolioAgentBuffer, portfolioLeadBuffer,
    totalLeakage, activeBillable, activeActual, trainingCampCount,
  } = portfolio

  const problems = portfolio.rows.filter(r => r.buffer > 0.3 && !r.trainingCamp).length

  const bufferSplit = (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="text-ink/50">Agent buffer</span>
        <span className={`font-semibold ${bufColor(portfolioAgentBuffer) === 'red' ? 'text-red-600' : bufColor(portfolioAgentBuffer) === 'amber' ? 'text-amber-600' : 'text-green-600'}`}>
          {(portfolioAgentBuffer * 100).toFixed(1)}%
        </span>
      </div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-ink/50">Lead buffer</span>
        <span className="text-ink/70 font-medium">{(portfolioLeadBuffer * 100).toFixed(1)}%</span>
      </div>
      {trainingCampCount > 0 && (
        <div className="flex items-center gap-1 mt-1 pt-1 border-t border-warm">
          <Tent size={10} className="text-blue-400" />
          <span className="text-xs text-blue-500">{trainingCampCount} project{trainingCampCount > 1 ? 's' : ''} in training camp — excluded from buffer</span>
        </div>
      )}
    </div>
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs text-ink/40">Small projects portfolio · active projects only</p>
        <div className="flex gap-2">
          <span className="text-xs bg-blue-50 text-blue-600 px-2.5 py-1 rounded-full font-medium">{activeBillable} billable</span>
          <span className="text-xs bg-orange-50 text-orange-600 px-2.5 py-1 rounded-full font-medium">{activeActual} actual</span>
          {trainingCampCount > 0 && (
            <span className="text-xs bg-blue-50 text-blue-600 px-2.5 py-1 rounded-full font-medium flex items-center gap-1">
              <Tent size={10} />{trainingCampCount} training camp
            </span>
          )}
          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${problems > 4 ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'}`}>
            {problems} problem projects
          </span>
        </div>
      </div>

      {/* Primary — buffer and leakage */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        <PrimaryCard
          label="Portfolio buffer (excl. training camp)"
          value={(portfolioBuffer * 100).toFixed(1) + '%'}
          sub={`${activeActual - activeBillable} excess heads · target ≤20%`}
          icon={Users}
          color={bufColor(portfolioBuffer)}
          flag={portfolioBuffer > 0.20 ? 'Above 20% target' : null}
          extra={bufferSplit}
        />
        <PrimaryCard
          label="Revenue leakage"
          value={fmt(totalLeakage, currency, fxRate)}
          sub="Unbilled capacity per month"
          icon={Zap}
          color={totalLeakage > 20000 ? 'amber' : 'gray'}
        />
      </div>

      {/* Secondary */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        <SecondaryCard label="Monthly revenue"  value={fmt(totalRevenue, currency, fxRate)}  sub="Billable heads only"     icon={TrendingUp} />
        <SecondaryCard label="Total cost"        value={fmt(totalCost, currency, fxRate)}     sub="Incl. CTC & overhead"   icon={TrendingDown} />
        <SecondaryCard label="Gross margin"      value={fmt(grossMargin, currency, fxRate)}   sub={fmt(portfolioMargin, currency, fxRate, 'pct') + ' margin'} icon={DollarSign} />
        <SecondaryCard label="Problem projects"  value={problems}                             sub="Buffer >30%, excl. camp" icon={AlertTriangle} />
      </div>
    </div>
  )
}
