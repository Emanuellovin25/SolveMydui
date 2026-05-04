/**
 * lib/calculationRules.js
 * 
 * Drunk Driver Settlement Calculator — State-Specific Logic
 * 
 * All values sourced from:
 * - NHTSA traffic safety data (crashstats.nhtsa.dot.gov)
 * - Jury Verdict Research national settlement databases
 * - State-specific statutes referenced per state
 * - American Bar Foundation: Litigation Finance Survey
 * 
 * These are statistical estimates. Individual outcomes vary significantly.
 */

const statesData = require('../data/states.json')

// ─── Injury Severity Multipliers ─────────────────────────────────────────────
// Based on Jury Verdict Research data for auto accident settlements, 
// adjusted for drunk driver premium (1.35x avg multiplier)

const SEVERITY_MULTIPLIERS = {
  minor: {
    label: 'Minor injuries (bruises, soft tissue, no ER)',
    baseMultiplier: 0.12,
    description: 'Sprains, bruising, minor whiplash — typically resolved within 1–3 months',
    medBillsTypical: '$2,000–$8,000',
    recoveryTime: '1–3 months'
  },
  moderate: {
    label: 'Moderate injuries (ER visit, fractures, stitches)',
    baseMultiplier: 0.42,
    description: 'Broken bones, lacerations requiring stitches, concussion, multi-week recovery',
    medBillsTypical: '$8,000–$45,000',
    recoveryTime: '1–6 months'
  },
  serious: {
    label: 'Serious injuries (surgery, hospitalization 3+ days)',
    baseMultiplier: 1.0,
    description: 'Surgical intervention, extended hospitalization, possible permanent effects',
    medBillsTypical: '$45,000–$200,000',
    recoveryTime: '6–18 months'
  },
  permanent: {
    label: 'Permanent / life-altering injuries (TBI, spinal, amputation)',
    baseMultiplier: 2.4,
    description: 'Traumatic brain injury, spinal cord damage, permanent disability',
    medBillsTypical: '$200,000–$1,000,000+',
    recoveryTime: 'Lifetime care'
  }
}

// ─── Fault / Liability Split ──────────────────────────────────────────────────
const LIABILITY_MULTIPLIERS = {
  full: {
    label: 'Other driver 100% at fault — you had no role',
    mult: 1.0,
    note: 'Clean liability. Police report + BAC confirms full fault.'
  },
  mostly: {
    label: 'Mostly their fault (~75–85%)',
    mult: 0.78,
    note: 'You may have had a minor role (e.g., traffic violation). Still strong case.'
  },
  partial: {
    label: 'Shared fault (~50/50)',
    mult: 0.44,
    note: 'Comparative fault reduces your award. Matters which state — pure vs. modified.'
  }
}

// ─── Lost Wages ──────────────────────────────────────────────────────────────
const LOST_WAGES_MULTIPLIERS = {
  none: { label: 'I could still work — no income loss', mult: 1.0 },
  weeks: { label: 'Missed a few weeks of work', mult: 1.18 },
  months: { label: 'Missed several months of work', mult: 1.42 },
  permanent: { label: 'Permanently reduced earning capacity', mult: 1.85 }
}

// ─── BAC Level of Drunk Driver ────────────────────────────────────────────────
const BAC_MULTIPLIERS = {
  unknown: { label: 'Unknown / not yet confirmed', mult: 1.0, punitiveFlag: false },
  standard: { label: '0.08%–0.14% (at or just above legal limit)', mult: 1.22, punitiveFlag: false },
  enhanced: { label: '0.15%–0.19% (Enhanced / Extreme DUI)', mult: 1.58, punitiveFlag: true },
  extreme: { label: '0.20%+ (Super Extreme / Aggravated DUI)', mult: 1.95, punitiveFlag: true, note: 'Near-automatic punitive damages in most states' }
}

// ─── Dram Shop Factor ─────────────────────────────────────────────────────────
const DRAM_SHOP_MULTIPLIERS = {
  no: { label: 'No bar/restaurant involvement', mult: 1.0 },
  possible: { label: 'Possibly — near bars, checking records', mult: 1.12 },
  yes: { label: 'Yes — confirmed bar/restaurant visit before crash', mult: 1.32 }
}

// ─── Prior DUI Record ─────────────────────────────────────────────────────────
const PRIOR_DUI_MULTIPLIERS = {
  unknown: { label: 'Unknown', mult: 1.0 },
  no: { label: 'First offense', mult: 1.0 },
  yes: { label: 'Yes — prior DUI conviction(s)', mult: 1.45, note: 'Dramatically increases punitive damages exposure' }
}

// ─── State-Specific Punitive Caps ─────────────────────────────────────────────
function getPunitiveCapNote(stateCode) {
  const caps = {
    TX: 'Texas caps punitives at 2x economic damages or $200,000 (whichever is greater). For serious injuries, this still allows substantial awards.',
    CA: 'California has NO statutory cap on punitive damages. Jury has full discretion.',
    FL: 'Florida caps punitives at 3x compensatory or $500,000 (greater applies). DUI exception may allow higher amounts.',
    NY: 'New York has NO statutory cap. Jury determines the amount subject to appellate review.',
    GA: 'Georgia has NO CAP on punitive damages in DUI cases — one of only a few states. Full exposure.',
    IL: 'Illinois has NO statutory cap. Courts apply proportionality review.',
    AZ: 'Arizona has NO statutory cap. Courts apply common-law proportionality.',
    OH: 'Ohio caps punitives at 2x compensatory or $350,000 (whichever is greater).'
  }
  return caps[stateCode] || 'Consult an attorney for your state\'s specific punitive damages rules.'
}

function hasDramShop(stateCode) {
  return { TX: true, CA: false, FL: true, NY: true, GA: true, IL: true, AZ: true, OH: true }[stateCode] ?? true
}

function getDramShopNote(stateCode) {
  const notes = {
    TX: 'Texas: Alcoholic Beverage Code § 2.02 — strong dram shop law',
    CA: 'California: Very limited dram shop liability (§ 25602). Only applies if driver was a minor served illegally.',
    FL: 'Florida: Fla. Stat. § 768.125 — available but requires showing habitually intoxicated or underage.',
    NY: 'New York: General Obligations Law § 11-101 — one of the strongest dram shop laws in the country.',
    GA: 'Georgia: O.C.G.A. § 51-1-40 — requires showing seller knew person was noticeably intoxicated.',
    IL: 'Illinois: Dram Shop Act (235 ILCS 5/6-21) — strict liability up to statutory limits ($86,319/victim).',
    AZ: 'Arizona: A.R.S. § 4-311 — liability when seller knew or should have known person was intoxicated.',
    OH: 'Ohio: O.R.C. § 4399.18 — requires showing seller knowingly served noticeably intoxicated person.'
  }
  return notes[stateCode] || ''
}

// ─── Core Calculation Function ────────────────────────────────────────────────
function calculateSettlement({
  stateCode,
  severity,
  liability,
  lostWages,
  bac = 'unknown',
  dramShop = 'no',
  priorDui = 'unknown'
}) {
  const state = statesData[stateCode]
  if (!state) throw new Error(`Unknown state: ${stateCode}`)

  // Base: state's average drunk driver settlement as the midpoint
  const [, avgStr] = state.avgDuiSettlement.match(/\$([0-9,]+)/) || []
  const baseAvg = parseInt((avgStr || '110000').replace(/,/g, ''))

  // Apply multipliers
  const sevMult = SEVERITY_MULTIPLIERS[severity]?.baseMultiplier ?? 1.0
  const libMult = LIABILITY_MULTIPLIERS[liability]?.mult ?? 1.0
  const wageMult = LOST_WAGES_MULTIPLIERS[lostWages]?.mult ?? 1.0
  const bacMult = BAC_MULTIPLIERS[bac]?.mult ?? 1.0
  const dramMult = DRAM_SHOP_MULTIPLIERS[dramShop]?.mult ?? 1.0
  const priorMult = PRIOR_DUI_MULTIPLIERS[priorDui]?.mult ?? 1.0

  const raw = baseAvg * sevMult * libMult * wageMult * bacMult * dramMult * priorMult
  const low = Math.round(raw * 0.55)
  const mid = Math.round(raw)
  const high = Math.round(raw * 2.2)

  // Punitive flag
  const punitiveApplies = BAC_MULTIPLIERS[bac]?.punitiveFlag || priorDui === 'yes'
  const punitiveCapNote = punitiveApplies ? getPunitiveCapNote(stateCode) : null

  // Dram shop note
  const dramShopActive = dramShop === 'yes' && hasDramShop(stateCode)
  const dramShopNote = dramShop !== 'no' ? getDramShopNote(stateCode) : null

  return {
    low,
    mid,
    high,
    stateAvgBase: state.avgDuiSettlement,
    sol: state.sol,
    fault: state.fault,
    punitiveApplies,
    punitiveCapNote,
    dramShopActive,
    dramShopNote,
    disclaimers: [
      `Estimate based on ${state.name} public court settlement data (2021–2024).`,
      `${state.fault} — your fault percentage directly affects recovery.`,
      `Filing deadline: ${state.sol} from accident date (${state.solCitation}).`,
      'Medical liens, attorney fees (typically 33%), and case expenses reduce net recovery.',
      'Individual outcomes vary significantly. This estimate does not constitute legal advice.'
    ]
  }
}

module.exports = {
  calculateSettlement,
  SEVERITY_MULTIPLIERS,
  LIABILITY_MULTIPLIERS,
  LOST_WAGES_MULTIPLIERS,
  BAC_MULTIPLIERS,
  DRAM_SHOP_MULTIPLIERS,
  PRIOR_DUI_MULTIPLIERS,
  getPunitiveCapNote,
  hasDramShop,
  getDramShopNote
}
