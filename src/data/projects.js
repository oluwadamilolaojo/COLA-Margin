export const INITIAL_PROJECTS = [
  { id: 1,  name: 'Backroads',       rate: 15,    tlRate: 17,    billableAgents: 3,  actualAgents: 4,  billableQA: 0, actualQA: 0, billableTL: 1,    actualTL: 1,    billablePC: 0, actualPC: 0, status: 'active', note: '', trainingCamp: false },
  { id: 2,  name: 'Bask & Lather',   rate: 11,    tlRate: null,  billableAgents: 12, actualAgents: 13, billableQA: 0, actualQA: 0, billableTL: 0,    actualTL: 1,    billablePC: 0, actualPC: 0, status: 'active', note: '', trainingCamp: false },
  { id: 3,  name: 'Edhat',           rate: 10,    tlRate: null,  billableAgents: 1,  actualAgents: 1,  billableQA: 0, actualQA: 0, billableTL: 0,    actualTL: 0,    billablePC: 0, actualPC: 0, status: 'active', note: '', trainingCamp: false },
  { id: 4,  name: 'Fireclay Tiles',  rate: 12,    tlRate: null,  billableAgents: 3,  actualAgents: 4,  billableQA: 0, actualQA: 0, billableTL: 0,    actualTL: 1,    billablePC: 0, actualPC: 0, status: 'active', note: 'TL is player-coach', trainingCamp: false },
  { id: 5,  name: 'Kiddom',          rate: 14.23, tlRate: 18.08, billableAgents: 3,  actualAgents: 4,  billableQA: 0, actualQA: 0, billableTL: 1,    actualTL: 1,    billablePC: 0, actualPC: 0, status: 'active', note: '', trainingCamp: false },
  { id: 6,  name: 'Kings of Neon',   rate: 12,    tlRate: null,  billableAgents: 7,  actualAgents: 8,  billableQA: 0, actualQA: 0, billableTL: 0,    actualTL: 0,    billablePC: 0, actualPC: 0, status: 'active', note: '', trainingCamp: false },
  { id: 7,  name: 'Main Factor',     rate: 12,    tlRate: null,  billableAgents: 2,  actualAgents: 3,  billableQA: 0, actualQA: 0, billableTL: 0,    actualTL: 0.33, billablePC: 0, actualPC: 0, status: 'active', note: 'TL shared across Main Factor, Userwise, SoHookd (0.33 each)', trainingCamp: false },
  { id: 8,  name: 'Pinata',          rate: 12,    tlRate: null,  billableAgents: 3,  actualAgents: 4,  billableQA: 0, actualQA: 1, billableTL: 0,    actualTL: 0.5,  billablePC: 0, actualPC: 0, status: 'active', note: 'TL shared across Pinata and TRC (0.5 each)', trainingCamp: false },
  { id: 9,  name: 'Rest of World',   rate: 13,    tlRate: null,  billableAgents: 0,  actualAgents: 0,  billableQA: 0, actualQA: 0, billableTL: 1,    actualTL: 1,    billablePC: 0, actualPC: 0, status: 'active', note: '', trainingCamp: false },
  { id: 10, name: 'SoHookd',         rate: 12,    tlRate: null,  billableAgents: 2,  actualAgents: 2,  billableQA: 0, actualQA: 0, billableTL: 0,    actualTL: 0.33, billablePC: 0, actualPC: 0, status: 'active', note: 'TL shared across Main Factor, Userwise, SoHookd (0.33 each)', trainingCamp: false },
  { id: 11, name: 'Sonovate',        rate: 11,    tlRate: null,  billableAgents: 5,  actualAgents: 8,  billableQA: 1, actualQA: 0, billableTL: 1,    actualTL: 1,    billablePC: 0, actualPC: 0, status: 'active', note: '', trainingCamp: false },
  { id: 12, name: 'Stream Hatchet',  rate: 10,    tlRate: null,  billableAgents: 6,  actualAgents: 8,  billableQA: 0, actualQA: 0, billableTL: 0,    actualTL: 1,    billablePC: 0, actualPC: 1, status: 'active', note: 'Transition paused', trainingCamp: false },
  { id: 13, name: 'Topicals',        rate: 12,    tlRate: null,  billableAgents: 1,  actualAgents: 1,  billableQA: 0, actualQA: 0, billableTL: 0,    actualTL: 0,    billablePC: 0, actualPC: 0, status: 'active', note: '', trainingCamp: false },
  { id: 14, name: 'TRC',             rate: 11,    tlRate: null,  billableAgents: 1,  actualAgents: 1,  billableQA: 0, actualQA: 0, billableTL: 0,    actualTL: 0.5,  billablePC: 0, actualPC: 0, status: 'active', note: 'TL shared with Pinata (0.5 each)', trainingCamp: false },
  { id: 15, name: 'Userwise',        rate: 12,    tlRate: null,  billableAgents: 3,  actualAgents: 3,  billableQA: 0, actualQA: 0, billableTL: 0,    actualTL: 0.33, billablePC: 0, actualPC: 0, status: 'active', note: 'TL shared across Main Factor, Userwise, SoHookd (0.33 each)', trainingCamp: false },
  { id: 16, name: 'Visual DX',       rate: 15,    tlRate: null,  billableAgents: 1,  actualAgents: 1,  billableQA: 0, actualQA: 0, billableTL: 0,    actualTL: 0,    billablePC: 0, actualPC: 0, status: 'active', note: '', trainingCamp: false },
  { id: 17, name: 'Writer',          rate: 14,    tlRate: null,  billableAgents: 3,  actualAgents: 3,  billableQA: 1, actualQA: 1, billableTL: 0,    actualTL: 0,    billablePC: 0, actualPC: 0, status: 'active', note: '', trainingCamp: false },
  { id: 18, name: 'Gravyty',         rate: 14,    tlRate: null,  billableAgents: 2,  actualAgents: 2,  billableQA: 0, actualQA: 0, billableTL: 0,    actualTL: 0,    billablePC: 2, actualPC: 2, status: 'active', note: '', trainingCamp: false },
  { id: 19, name: 'Earnest RCM',     rate: 16,    tlRate: null,  billableAgents: 10, actualAgents: 15, billableQA: 0, actualQA: 0, billableTL: 1,    actualTL: 1,    billablePC: 0, actualPC: 1, status: 'ramp',   note: 'Training camp — scaling back June. Max 2 buffers target', trainingCamp: true },
  { id: 20, name: 'Bearefoot',       rate: 16,    tlRate: null,  billableAgents: 1,  actualAgents: 1,  billableQA: 0, actualQA: 0, billableTL: 1,    actualTL: 1,    billablePC: 0, actualPC: 0, status: 'active', note: '', trainingCamp: false },
]

export const SALARY_BANDS = {
  agent: 325000,
  qa:    429000,
  tl:    669000,
  pc:    925000,
}

export const DEFAULTS = {
  fxRate:      1400,
  hours:       160,
  utilization: 85,
  ctc:         30,
  overhead:    5,
  training:    0,
  it:          0,
}
