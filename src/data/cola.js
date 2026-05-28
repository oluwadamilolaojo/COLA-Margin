// COLA caps per account — sourced from the published Revenue Impact Dashboard
// (IMF World CPI tenure-weighted). Values are decimal max % (e.g. 0.0575 = 5.75%).
// DNSY = "Do Not Send Yet" — short-tenure accounts excluded from COLA proposals.

export const COLA_CAPS = {
  'Backroads':      { cap: 0.05,    dnsy: false },
  'Bask & Lather':  { cap: 0.0948,  dnsy: false },
  'Edhat':          { cap: 0.1347,  dnsy: false },
  'Fireclay Tiles': { cap: 0.1306,  dnsy: false },
  'Kiddom':         { cap: 0.0387,  dnsy: false },
  'Kings of Neon':  { cap: 0.07,    dnsy: false },
  'Main Factor':    { cap: 0.0865,  dnsy: false },
  'Pinata':         { cap: 0.2525,  dnsy: false },
  'Rest of World':  { cap: 0.069,   dnsy: false },
  'SoHookd':        { cap: 0.2249,  dnsy: false },
  'Sonovate':       { cap: 0.0419,  dnsy: false },
  'Stream Hatchet': { cap: 0.0902,  dnsy: false },
  'Topicals':       { cap: 0.244,   dnsy: false },
  'TRC':            { cap: 0.0686,  dnsy: false },
  'Userwise':       { cap: 0.12,    dnsy: false },
  'Visual DX':      { cap: 0.064,   dnsy: false },
  'Writer':         { cap: 0.1032,  dnsy: false },

  // DNSY — short tenure, no COLA
  'Gravyty':        { cap: 0,       dnsy: true,  reason: 'New account' },
  'Earnest RCM':    { cap: 0,       dnsy: true,  reason: 'Training camp' },
  'Bearefoot':      { cap: 0,       dnsy: true,  reason: 'New account' },
}

// Explicit TL rates where set in contract (overrides multiplier)
export const TL_RATES = {
  'Backroads': 17,
  'Kiddom':    18.08,
}

export function getCola(projectName) {
  return COLA_CAPS[projectName] || { cap: 0, dnsy: false }
}
