import React, { useState } from 'react'
import { Plus, Trash2, ChevronUp, ChevronDown, MessageSquare, Tent } from 'lucide-react'

function bufferBadge(buf, isTrainingCamp = false) {
  const pct = Math.round(buf * 100)
  if (isTrainingCamp) return <span className="px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-700">⛺ {pct}%</span>
  if (buf <= 0.20) return <span className="px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-700">{pct}%</span>
  if (buf <= 0.30) return <span className="px-2 py-0.5 rounded-full text-xs bg-yellow-100 text-yellow-700">{pct}%</span>
  if (buf <= 0.50) return <span className="px-2 py-0.5 rounded-full text-xs bg-orange-100 text-orange-700">{pct}%</span>
  return <span className="px-2 py-0.5 rounded-full text-xs bg-red-100 text-red-700">{pct}%</span>
}

const STATUS_OPTIONS = ['active','ramp','at risk','renegotiating','ending']
const STATUS_COLORS  = {
  'active':        'bg-green-100 text-green-700',
  'ramp':          'bg-blue-100 text-blue-700',
  'at risk':       'bg-red-100 text-red-700',
  'renegotiating': 'bg-yellow-100 text-yellow-700',
  'ending':        'bg-warm/20 text-ink/50',
}

function Cell({ val, onChange, type = 'number' }) {
  return (
    <input type={type} value={val}
      onChange={e => onChange(type === 'number' ? Number(e.target.value) : e.target.value)}
      className="w-full bg-transparent border-0 outline-none text-ink/90 text-xs text-center hover:bg-cream focus:bg-blue-50 rounded px-1 py-1" />
  )
}

const SORT_KEYS = { buffer: 'buffer', leakage: 'leakage', revenue: 'revenue', margin: 'marginPct' }

export default function ProjectTable({ projects, setProjects, computed, currency, fxRate }) {
  const [sort, setSort]         = useState({ key: 'buffer', dir: 'desc' })
  const [expandedNote, setExpandedNote] = useState(null)
  const sym = currency === 'NGN' ? '₦' : '$'
  const fx  = currency === 'NGN' ? fxRate : 1

  function updateProject(id, field, val) {
    setProjects(ps => ps.map(p => p.id === id ? { ...p, [field]: val } : p))
  }
  function addProject() {
    const newId = Math.max(...projects.map(p => p.id)) + 1
    setProjects(ps => [...ps, { id: newId, name: 'New Project', rate: 12, status: 'active', note: '',
      billableAgents: 2, actualAgents: 3, billableQA: 0, actualQA: 0, billableTL: 0, actualTL: 0, billablePC: 0, actualPC: 0 }])
  }
  function removeProject(id) { setProjects(ps => ps.filter(p => p.id !== id)) }
  function toggleSort(key) { setSort(s => s.key === key ? { key, dir: s.dir === 'desc' ? 'asc' : 'desc' } : { key, dir: 'desc' }) }

  const sorted = [...computed].sort((a, b) => {
    const k = SORT_KEYS[sort.key] || sort.key
    return sort.dir === 'desc' ? b[k] - a[k] : a[k] - b[k]
  })

  function SortBtn({ label, k }) {
    const active = sort.key === k
    return (
      <button onClick={() => toggleSort(k)} className={`flex items-center gap-0.5 text-xs font-medium uppercase tracking-wide ${active ? 'text-ink' : 'text-ink/40 hover:text-ink/70'}`}>
        {label}{active ? (sort.dir === 'desc' ? <ChevronDown size={10}/> : <ChevronUp size={10}/>) : null}
      </button>
    )
  }

  return (
    <div className="bg-card rounded-xl border border-warm overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-warm">
        <div>
          <h3 className="text-sm font-semibold text-ink">Project breakdown</h3>
          <p className="text-xs text-ink/40 mt-0.5">Click any cell to edit · blue rate column updates revenue instantly · {projects.length} projects</p>
        </div>
        <button onClick={addProject} className="flex items-center gap-1.5 text-xs bg-panel text-white px-3 py-1.5 rounded-lg hover:bg-gray-700 transition-colors">
          <Plus size={12} /> Add project
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-cream border-b border-warm">
              <th className="text-left px-4 py-2.5 text-ink/40 font-medium w-28">Project</th>
              <th className="text-center px-2 py-2.5 text-blue-500 font-medium w-20">Rate ($/hr)</th>
              <th className="text-center px-2 py-2.5 text-ink/40 font-medium w-24">Status</th>
              <th className="text-center px-2 py-3 text-blue-500 font-medium text-xs bg-blue-50/30">Billable agents</th>
              <th className="text-center px-2 py-3 text-blue-500 font-medium text-xs bg-blue-50/30">Billable QA</th>
              <th className="text-center px-2 py-3 text-blue-500 font-medium text-xs bg-blue-50/30">Billable TL</th>
              <th className="text-center px-2 py-3 text-blue-500 font-medium text-xs bg-blue-50/30">Billable PC</th>
              <th className="text-center px-2 py-3 text-orange-500 font-medium text-xs bg-orange-50/30">Actual agents</th>
              <th className="text-center px-2 py-3 text-orange-500 font-medium text-xs bg-orange-50/30">Actual QA</th>
              <th className="text-center px-2 py-3 text-orange-500 font-medium text-xs bg-orange-50/30">Actual TL</th>
              <th className="text-center px-2 py-3 text-orange-500 font-medium text-xs bg-orange-50/30">Actual PC</th>
              <th className="px-2 py-2.5"><SortBtn label="Buffer" k="buffer"/></th>
              <th className="px-2 py-2.5"><SortBtn label="Revenue" k="revenue"/></th>
              <th className="px-2 py-2.5"><SortBtn label="Margin" k="margin"/></th>
              <th className="px-2 py-2.5"><SortBtn label="Leakage" k="leakage"/></th>
              <th className="px-2 py-2.5 text-ink/40 font-medium">Notes</th>
              <th className="px-2 py-2.5 w-8"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {sorted.map(row => {
              const p = projects.find(x => x.id === row.id)
              if (!p) return null
              return (
                <React.Fragment key={p.id}>
                  <tr className={`hover:bg-cream transition-colors ${p.trainingCamp ? 'bg-blue-50/20' : row.buffer > 0.4 ? 'bg-red-50/30' : ''}`}>
                    <td className="px-4 py-1.5">
                      <input type="text" value={p.name} onChange={e => updateProject(p.id, 'name', e.target.value)}
                        className="w-full bg-transparent text-ink/90 text-xs outline-none hover:bg-warm/20 focus:bg-blue-50 rounded px-1 py-0.5 font-medium"/>
                    </td>
                    <td className="px-2 py-1.5 text-center">
                      <div className="flex items-center justify-center gap-0.5 bg-blue-50 rounded border border-blue-100">
                        <span className="text-blue-300 text-xs pl-1">$</span>
                        <input type="number" value={p.rate} onChange={e => updateProject(p.id, 'rate', Number(e.target.value))}
                          className="w-12 bg-transparent text-blue-700 text-xs font-semibold outline-none text-center py-1"/>
                      </div>
                    </td>
                    <td className="px-2 py-1.5 text-center">
                      <select value={p.status || 'active'} onChange={e => updateProject(p.id, 'status', e.target.value)}
                        className={`text-xs rounded-full px-2 py-0.5 border-0 outline-none cursor-pointer ${STATUS_COLORS[p.status || 'active']}`}>
                        {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                    {['billableAgents','billableQA','billableTL','billablePC'].map(f => (
                      <td key={f} className="px-1 py-1.5 text-center text-blue-600">
                        <Cell val={p[f]} onChange={v => updateProject(p.id, f, v)} />
                      </td>
                    ))}
                    {['actualAgents','actualQA','actualTL','actualPC'].map(f => (
                      <td key={f} className="px-1 py-1.5 text-center text-orange-600">
                        <Cell val={p[f]} onChange={v => updateProject(p.id, f, v)} />
                      </td>
                    ))}
                    <td className="px-2 py-1.5 text-center">{bufferBadge(row.buffer, p.trainingCamp)}</td>
                    <td className="px-2 py-1.5 text-center text-ink/80">{sym}{(row.revenue*fx).toLocaleString('en-US',{maximumFractionDigits:0})}</td>
                    <td className="px-2 py-1.5 text-center text-ink/80">{(row.marginPct*100).toFixed(0)}%</td>
                    <td className="px-2 py-1.5 text-center text-amber-600">{sym}{(row.leakage*fx).toLocaleString('en-US',{maximumFractionDigits:0})}</td>
                    <td className="px-2 py-1.5 text-center">
                      <button onClick={() => setExpandedNote(expandedNote === p.id ? null : p.id)}
                        className={`transition-colors ${p.note ? 'text-blue-400' : 'text-ink/20 hover:text-ink/40'}`}>
                        <MessageSquare size={12}/>
                      </button>
                    </td>
                    <td className="px-2 py-1.5 text-center">
                      <button onClick={() => removeProject(p.id)} className="text-ink/20 hover:text-red-400 transition-colors">
                        <Trash2 size={12}/>
                      </button>
                    </td>
                  </tr>
                  {expandedNote === p.id && (
                    <tr className="bg-blue-50/30">
                      <td colSpan={18} className="px-4 py-2">
                        <div className="flex items-start gap-2">
                          <span className="text-xs text-ink/40 mt-1 whitespace-nowrap">Note / flag:</span>
                          <input type="text" placeholder="e.g. In renegotiation · client expanding · at risk..."
                            value={p.note || ''} onChange={e => updateProject(p.id, 'note', e.target.value)}
                            className="flex-1 text-xs bg-card border border-blue-100 rounded-lg px-3 py-1.5 outline-none focus:border-blue-300 text-ink/80"/>
                          <button
                            onClick={() => updateProject(p.id, 'trainingCamp', !p.trainingCamp)}
                            className={`flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg border transition-colors whitespace-nowrap ${p.trainingCamp ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-card text-ink/40 border-warm hover:border-blue-200'}`}>
                            <Tent size={11} /> Training camp
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              )
            })}
          </tbody>
          <tfoot>
            <tr className="bg-cream border-t border-warm font-semibold">
              <td className="px-4 py-2.5 text-ink/80 text-xs">TOTAL</td><td/><td/>
              {['billableAgents','billableQA','billableTL','billablePC'].map(f => (
                <td key={f} className="text-center text-blue-600 text-xs px-1">{computed.reduce((s,r)=>s+r[f],0)}</td>
              ))}
              {['actualAgents','actualQA','actualTL','actualPC'].map(f => (
                <td key={f} className="text-center text-orange-600 text-xs px-1">{computed.reduce((s,r)=>s+r[f],0)}</td>
              ))}
              <td className="text-center px-2 text-xs">
                {bufferBadge(computed.reduce((s,r)=>s+r.billableHeads,0)>0
                  ?(computed.reduce((s,r)=>s+r.actualHeads,0)-computed.reduce((s,r)=>s+r.billableHeads,0))/computed.reduce((s,r)=>s+r.billableHeads,0):0)}
              </td>
              <td className="text-center text-ink/90 text-xs px-2">{sym}{(computed.reduce((s,r)=>s+r.revenue,0)*fx).toLocaleString('en-US',{maximumFractionDigits:0})}</td>
              <td className="text-center text-ink/90 text-xs px-2">
                {(()=>{const r=computed.reduce((s,x)=>s+x.revenue,0);const c=computed.reduce((s,x)=>s+x.totalCost,0);return r>0?((r-c)/r*100).toFixed(0)+'%':'-'})()}
              </td>
              <td className="text-center text-amber-700 text-xs px-2">{sym}{(computed.reduce((s,r)=>s+r.leakage,0)*fx).toLocaleString('en-US',{maximumFractionDigits:0})}</td>
              <td/><td/>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}
