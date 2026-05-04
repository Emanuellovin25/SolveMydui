#!/usr/bin/env node
/**
 * lib/generate.js — Drunk Driver Settlement Content Generator v3
 *
 * Generates 100% unique, state-specific content using real legal data.
 * Each page is differentiated by:
 *   - Real state statutes (BAC limits, SOL, fault rule citations)
 *   - County courthouse names
 *   - City-level DUI crash statistics
 *   - State-specific punitive damages rules
 *   - Dram shop law availability per state
 *   - Settlement ranges from public court records
 *
 * Usage:
 *   node lib/generate.js --state TX --level 1 --limit 10
 *   node lib/generate.js --state TX --level 2 --city houston --limit 10
 *   node lib/generate.js --state TX --level 3 --city houston --accident drunk-driver --limit 7
 *   node lib/generate.js --state TX --level all --limit 5 --dry
 */

const fs = require('fs')
const path = require('path')
const statesData = require('../data/states.json')
const accidentTypes = require('../data/accident-types.json')

const args = process.argv.slice(2)
const getArg = (f) => { const i = args.indexOf(f); return i !== -1 ? args[i+1] : null }

const STATE    = getArg('--state')    || 'TX'
const LEVEL    = getArg('--level')    || '2'
const CITY     = getArg('--city')     || null
const ACCIDENT = getArg('--accident') || null
const LIMIT    = parseInt(getArg('--limit') || '5')
const DRY_RUN  = args.includes('--dry')
const API_KEY  = process.env.ANTHROPIC_API_KEY

if (!API_KEY && !DRY_RUN) {
  console.error('ERROR: Set ANTHROPIC_API_KEY or use --dry flag')
  process.exit(1)
}

const PAGES_FILE = path.join(__dirname, '../data/pages.json')

function slugify(str) {
  return str.toLowerCase().replace(/\./g,'').replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'')
}

function loadPages() {
  if (fs.existsSync(PAGES_FILE)) return JSON.parse(fs.readFileSync(PAGES_FILE, 'utf8'))
  return []
}

function savePages(pages) {
  fs.writeFileSync(PAGES_FILE, JSON.stringify(pages, null, 2))
}

async function callClaude(prompt) {
  if (DRY_RUN) return null
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-opus-4-6',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    }),
  })
  const data = await res.json()
  if (data.error) throw new Error(data.error.message)
  const text = data.content.map(c => c.text || '').join('')
  const clean = text.replace(/```json\n?/g,'').replace(/```\n?/g,'').trim()
  return JSON.parse(clean)
}

function mockContent(slug, level, city, state, accidentLabel, variationLabel) {
  const s = statesData[state]
  const cityName = city.name || city
  const label = variationLabel ? `${accidentLabel} — ${variationLabel}` : accidentLabel || 'Drunk Driver Settlement'
  return {
    metaTitle: `${label} Calculator — ${cityName}, ${s.name}`,
    metaDescription: `${city.duiCrashes || 'Hundreds of'} DUI crashes in ${cityName} area annually. Real settlement data by injury type. Free estimate — no commitment.`,
    h1: `Drunk Driver Settlement Calculator — ${cityName}, ${s.name}`,
    hook: `In ${new Date().getFullYear()-1}, ${city.duiCrashes || 'hundreds of'} people were injured in drunk driving accidents in the ${cityName} area alone. Most had no idea what their case was worth. Under ${s.duiStatute}, a DUI conviction in criminal court is near-automatic proof of liability in your civil claim — but the settlement value depends on factors most victims never calculate.`,
    section1Title: `What ${cityName} drunk driver victims don't know`,
    section1Body: `${s.name} law gives you ${s.sol} to file your claim (${s.solCitation}). That window sounds generous. It isn't. Under ${s.fault}, your compensation is tied to your percentage of fault — and insurance adjusters spend those months documenting everything that could shift blame your way. The ${city.courthouse || cityName + ' ' + s.court} handles these cases regularly. Evidence that seems obvious today disappears fast.`,
    section2Title: `How ${s.duiStatute} affects your civil case`,
    section2Body: `A DUI arrest and conviction under ${s.duiStatute} operates on a separate track from your civil injury claim — but the two reinforce each other powerfully. If the driver pleads guilty or is convicted in criminal court, that conviction is admissible in your civil case as evidence of fault. ${s.punitives.available ? `${s.name} allows punitive damages in DUI cases — ${s.punitives.cap}. These go beyond compensating you for your losses; they penalize the driver's conduct. ${s.punitives.notes}` : ''}`,
    section3Title: `Settlement ranges from ${s.name} court records`,
    section3Body: `The average drunk driver settlement in ${s.name} is ${s.avgDuiSettlement} — but this range reflects cases across all injury severities. Minor injury cases settle near the lower end; serious injuries involving surgery, hospitalization, or permanent effects reach the upper range and beyond. ${s.dramShop.available ? `${s.name}'s dram shop law (${s.dramShop.statute}) adds another potential source of recovery if alcohol was served at a bar before the crash.` : ''} Use the calculator on this page to estimate where your case falls.`,
  }
}

// ─── LEVEL 1: City hub — "Drunk Driver Settlement [City, State]" ──────────────
function promptLevel1(city, state) {
  const s = statesData[state]
  return `You are a legal research writer for a drunk driver settlement information website. Write content for a CITY HUB PAGE for ${city.name}, ${s.name}.

AUDIENCE: Someone who was just injured by a drunk driver in ${city.name} or is researching their rights. They are not a lawyer. They need clear, accurate, honest information.

REAL LOCAL DATA TO USE — integrate these naturally, do not list them:
• City: ${city.name}, ${s.name} (pop. ${city.pop.toLocaleString()})
• County: ${city.county}
• Local courthouse: ${city.courthouse}
• DUI crashes in ${city.name} area: ${city.duiCrashes.toLocaleString()} annually
• State DUI statute: ${s.duiStatute}
• BAC limit: ${s.bacLimit}
• Enhanced BAC threshold: ${s.enhancedBac} (${s.enhancedBacNote})
• Statute of limitations: ${s.sol} — citation: ${s.solCitation}
• Fault rule: ${s.fault}
• Fault detail: ${s.faultDetail}
• Punitive damages: ${s.punitives.available ? 'Available' : 'Not available'} — ${s.punitives.notes}
• Punitive cap: ${s.punitives.cap}
• Dram shop law: ${s.dramShop.available ? 'Available — ' + s.dramShop.statute : 'Very limited in ' + s.name}
• Dram shop note: ${s.dramShop.notes}
• Average DUI settlement in ${s.name}: ${s.avgDuiSettlement}
• % cases settled out of court: ${s.pctOutOfCourt}%
• Average days to settle: ${s.avgDaysToSettle}

WRITING RULES:
1. Open with the ${city.duiCrashes.toLocaleString()} stat — local, specific, impossible to ignore
2. Every sentence must earn its place — no filler, no generic legal advice phrases
3. Tone: calm, expert, like a knowledgeable researcher — NOT a salesman
4. Do NOT use: "best lawyer", "fight for you", "deserve compensation", "don't wait" 
5. DO use: specific statute citations, real courthouse name, real settlement numbers
6. Each H2 section should teach something the reader didn't know before reading it
7. Sections should flow together — not feel like separate blocks

Return ONLY valid JSON, no markdown code fences:
{
  "metaTitle": "60 chars max — drunk driver settlement + city + state",
  "metaDescription": "145–158 chars — includes DUI crash count, city, free estimate angle",
  "h1": "natural H1 mentioning drunk driver settlement calculator and city+state",
  "hook": "3 sentences. Lead with the local crash stat (${city.duiCrashes.toLocaleString()}). Second sentence establishes the legal angle. Third creates urgency without fear-mongering.",
  "section1Title": "H2 about what drunk driver victims in ${city.name} specifically need to know",
  "section1Body": "4 sentences. Weave in: ${s.sol} SOL, ${s.fault} fault rule, ${city.courthouse} courthouse, and why the insurance company's clock is already running.",
  "section2Title": "H2 about how ${s.duiStatute} and the criminal case affects your civil claim",
  "section2Body": "4 sentences. Explain the criminal/civil parallel tracks. How a DUI conviction becomes evidence in civil court. Punitive damages availability in ${s.name} with real cap info.",
  "section3Title": "H2 about what settlements actually look like in ${s.name}",
  "section3Body": "4 sentences. Use the ${s.avgDuiSettlement} range. Mention what moves cases to the upper end. ${s.dramShop.available ? 'Reference dram shop as additional avenue (' + s.dramShop.statute + ').' : 'Note limited dram shop availability in ' + s.name + '.'} End with a specific, honest observation about ${s.name} cases."
}`
}

// ─── LEVEL 2: City + Accident Type ───────────────────────────────────────────
function promptLevel2(city, state, accidentSlug) {
  const s = statesData[state]
  const accident = accidentTypes[accidentSlug]

  return `You are a legal research writer for a drunk driver settlement information website. Write content for a CITY + ACCIDENT TYPE page: "${accident.label}" in ${city.name}, ${s.name}.

AUDIENCE: Someone who just experienced a "${accident.label}" scenario in ${city.name}. They searched specifically for this. They know what happened — you need to show you understand their exact situation.

REAL LOCAL DATA TO USE:
• City: ${city.name}, ${s.name}
• County: ${city.county}
• Local courthouse: ${city.courthouse}
• DUI crashes in ${city.name} area: ${city.duiCrashes.toLocaleString()} annually
• State DUI statute: ${s.duiStatute}
• Enhanced BAC: ${s.enhancedBac} (${s.enhancedBacNote})
• SOL: ${s.sol} — ${s.solCitation}
• Fault rule: ${s.fault} — ${s.faultDetail}
• Punitive damages: ${s.punitives.notes} — Cap: ${s.punitives.cap} (${s.punitives.citation})
• Dram shop: ${s.dramShop.available ? s.dramShop.statute + ' — ' + s.dramShop.notes : 'Very limited in ' + s.name + ': ' + s.dramShop.notes}
• Typical dram shop addition: ${s.dramShop.typicalAdded || 'N/A'}
• Settlement range in ${s.name}: ${s.avgDuiSettlement}
• Settlement by severity: ${JSON.stringify(s.settlementByInjury)}
• This accident type legal note: ${accident.level3[0]?.legalNote || ''}

SCENARIO-SPECIFIC CONTEXT:
This is a "${accident.label}" page. The reader's specific situation is: ${accident.intent}.
The unique legal considerations for this accident type are about the evidence typically available,
how liability is established, and what makes these cases settle higher or lower than average.

WRITING RULES:
1. First sentence: show you understand EXACTLY what happened to them
2. Use the local ${city.duiCrashes.toLocaleString()} stat early — establishes you know this city
3. Explain what makes THEIR specific accident type legally distinct
4. Reference ${s.fault} rule as it applies to their specific situation
5. Mention ${city.courthouse} — shows local knowledge
6. Use actual settlement ranges from ${s.name} data — not generic numbers
7. Tone: calm authority — expert who has seen this exact scenario before

Return ONLY valid JSON, no markdown:
{
  "metaTitle": "60 chars max — specific to ${accident.label} in ${city.name}, ${s.name}",
  "metaDescription": "145–158 chars — speaks to this specific accident type in ${city.name}, includes settlement angle",
  "h1": "natural H1 — drunk driver settlement calculator + ${accident.label} + ${city.name}",
  "hook": "3 sentences. Open by showing you understand their exact scenario: ${accident.label} in ${city.name}. Second sentence: the specific legal angle that makes this accident type different. Third: the ${s.sol} window and why it matters for THIS type of case.",
  "section1Title": "H2 — what makes ${accident.label} cases different in ${s.name}",
  "section1Body": "4 sentences. The evidence typically available in this specific scenario. How ${s.duiStatute} applies. What makes liability easier or harder to establish for this type. Mention ${city.courthouse}.",
  "section2Title": "H2 — punitive damages and dram shop potential in ${city.name}",
  "section2Body": "4 sentences. ${s.punitives.available ? 'Punitive damages under ' + s.punitives.citation + ': ' + s.punitives.cap : 'Punitive damages situation in ' + s.name}. ${s.dramShop.available ? 'Dram shop under ' + s.dramShop.statute + ' as a second source of recovery — ' + s.dramShop.typicalAdded : 'Dram shop is limited in ' + s.name + ' — explain why and what the exception is.'}",
  "section3Title": "H2 — what ${accident.label} settlements look like in ${s.name}",
  "section3Body": "4 sentences. Use the settlement by injury ranges: ${JSON.stringify(s.settlementByInjury)}. What moves cases toward the upper end in ${s.name} specifically. The ${s.pctOutOfCourt}% out-of-court rate and what that means for timing. End with an honest, specific insight about these cases."
}`
}

// ─── LEVEL 3: Ultra-deep variation ───────────────────────────────────────────
function promptLevel3(city, state, accidentSlug, variation) {
  const s = statesData[state]
  const accident = accidentTypes[accidentSlug]

  return `You are a legal research writer for a drunk driver settlement information website. Write content for an ULTRA-DEEP PAGE: "${accident.label} — ${variation.label}" in ${city.name}, ${s.name}.

AUDIENCE: Someone who searched specifically for "${variation.desc}" in ${city.name}. They know EXACTLY what happened. Your job is to show you understand their specific scenario better than any generic page could.

THEIR SPECIFIC SCENARIO: ${variation.desc}
LEGAL NOTE FOR THIS VARIATION: ${variation.legalNote}
SETTLEMENT ADJUSTMENT FOR THIS TYPE: ${variation.avgMultiplierAdjust}x the base average

REAL LOCAL DATA:
• City: ${city.name}, ${s.name} — ${city.county}
• Courthouse: ${city.courthouse}
• Local DUI crashes: ${city.duiCrashes.toLocaleString()} annually
• DUI statute: ${s.duiStatute}
• Enhanced BAC: ${s.enhancedBac}
• SOL: ${s.sol} (${s.solCitation})
• Fault rule: ${s.fault} — ${s.faultDetail}
• Punitive damages: ${s.punitives.citation} — ${s.punitives.cap}
• Punitive note: ${s.punitives.notes}
• Dram shop: ${s.dramShop.available ? s.dramShop.statute + ' available' : 'Limited in ' + s.name}
• Settlement range ${s.name}: ${s.avgDuiSettlement}
• By injury severity: ${JSON.stringify(s.settlementByInjury)}
• Avg days to settle: ${s.avgDaysToSettle}

WRITING RULES:
1. First sentence: make them feel you are describing THEIR exact scenario
2. Explain what makes "${variation.label}" legally distinct from generic drunk driver cases
3. Reference the specific legal note: ${variation.legalNote}
4. Show you know ${city.name} and ${city.courthouse}
5. Use ${s.name} law with real citations — not generic "laws vary by state"
6. This page converts at 2–3x the rate of generic pages — it must feel tailor-made
7. Mention the ${variation.avgMultiplierAdjust}x settlement multiplier angle naturally

Return ONLY valid JSON, no markdown:
{
  "metaTitle": "60 chars max — ultra-specific: ${variation.label} drunk driver settlement ${city.name}",
  "metaDescription": "145–158 chars — describes ${variation.desc} specifically in ${city.name}",
  "h1": "natural H1 — highly specific to ${variation.label} + drunk driver settlement + ${city.name}",
  "hook": "3 sentences. First: shows you know their EXACT scenario (${variation.desc}). Second: the specific legal distinction that makes this type of case different. Third: the ${s.sol} window and how it applies to THIS scenario.",
  "section1Title": "H2 — what makes ${variation.label} cases legally unique in ${s.name}",
  "section1Body": "4 sentences. Explain the specific legal considerations: ${variation.legalNote}. How ${s.duiStatute} applies. What evidence is typically available in this exact scenario. Why this variation settles ${variation.avgMultiplierAdjust > 1.1 ? 'higher' : 'differently'} than standard drunk driver cases.",
  "section2Title": "H2 — how ${variation.label} cases proceed through ${city.courthouse}",
  "section2Body": "4 sentences. The local court process for this type of case. Punitive damages under ${s.punitives.citation} — specifically how ${variation.label} strengthens or affects the punitive argument. The criminal/civil parallel in this specific scenario. Timeline expectations.",
  "section3Title": "H2 — realistic settlement values for ${variation.label} in ${s.name}",
  "section3Body": "4 sentences. Use injury-level breakdown from ${s.name} data. How the ${variation.avgMultiplierAdjust}x adjustment applies. What the ${s.pctOutOfCourt}% out-of-court rate means in practice. A specific, honest insight about this exact scenario that generic pages miss."
}`
}

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

async function generateLevel1(stateCode, limit) {
  const state = statesData[stateCode]
  const existing = loadPages()
  const existingSlugs = new Set(existing.map(p => p.slug))
  const cities = state.cities.filter(c => c.pop >= 30000)
  const toProcess = cities.filter(c => !existingSlugs.has(slugify(c.name))).slice(0, limit)

  console.log(`\nLevel 1 — ${toProcess.length} city hub pages (${stateCode})`)
  const newPages = []

  for (const city of toProcess) {
    const slug = slugify(city.name)
    console.log(`  Generating: /${slug}`)
    try {
      const content = DRY_RUN
        ? mockContent(slug, 1, city, stateCode)
        : await callClaude(promptLevel1(city, stateCode))
      newPages.push({
        slug, level: 1, stateCode, stateName: state.name,
        cityName: city.name, cityPop: city.pop, cityAccidents: city.duiCrashes,
        county: city.county, courthouse: city.courthouse,
        content: content || mockContent(slug, 1, city, stateCode),
        updatedAt: new Date().toISOString(),
      })
      console.log(`  ✓ /${slug}`)
      if (!DRY_RUN) await sleep(1800)
    } catch(e) { console.error(`  ✗ ${city.name}:`, e.message) }
  }

  savePages([...existing, ...newPages])
  return newPages.length
}

async function generateLevel2(stateCode, cityFilter, accidentFilter, limit) {
  const state = statesData[stateCode]
  const existing = loadPages()
  const existingSlugs = new Set(existing.map(p => p.slug))
  let cities = state.cities.filter(c => c.pop >= 30000)
  if (cityFilter) cities = cities.filter(c => slugify(c.name) === cityFilter)
  let accidents = Object.entries(accidentTypes)
  if (accidentFilter) accidents = accidents.filter(([k]) => k === accidentFilter)

  const toProcess = []
  cities.forEach(city => {
    accidents.forEach(([key, acc]) => {
      const slug = `${slugify(city.name)}-${acc.slug}`
      if (!existingSlugs.has(slug)) toProcess.push({ city, key, acc, slug })
    })
  })

  const batch = toProcess.slice(0, limit)
  console.log(`\nLevel 2 — ${batch.length} city+type pages (${stateCode})`)
  const newPages = []

  for (const { city, key, acc, slug } of batch) {
    console.log(`  Generating: /${slug}`)
    try {
      const content = DRY_RUN
        ? mockContent(slug, 2, city, stateCode, acc.label)
        : await callClaude(promptLevel2(city, stateCode, key))
      newPages.push({
        slug, level: 2, stateCode, stateName: state.name,
        cityName: city.name, cityPop: city.pop, cityAccidents: city.duiCrashes,
        county: city.county, courthouse: city.courthouse,
        accidentType: key, accidentLabel: acc.label, accidentSlug: acc.slug,
        leadValue: acc.leadValue,
        content: content || mockContent(slug, 2, city, stateCode, acc.label),
        updatedAt: new Date().toISOString(),
      })
      console.log(`  ✓ /${slug}`)
      if (!DRY_RUN) await sleep(1800)
    } catch(e) { console.error(`  ✗ ${slug}:`, e.message) }
  }

  savePages([...existing, ...newPages])
  return newPages.length
}

async function generateLevel3(stateCode, cityFilter, accidentFilter, limit) {
  const state = statesData[stateCode]
  const existing = loadPages()
  const existingSlugs = new Set(existing.map(p => p.slug))
  let cities = state.cities.filter(c => c.pop >= 30000)
  if (cityFilter) cities = cities.filter(c => slugify(c.name) === cityFilter)
  let accidents = Object.entries(accidentTypes).filter(([,a]) => a.level3)
  if (accidentFilter) accidents = accidents.filter(([k]) => k === accidentFilter)

  const toProcess = []
  cities.forEach(city => {
    accidents.forEach(([key, acc]) => {
      acc.level3.forEach(variation => {
        const slug = `${slugify(city.name)}-${acc.slug}-${variation.slug}`
        if (!existingSlugs.has(slug)) toProcess.push({ city, key, acc, variation, slug })
      })
    })
  })

  const batch = toProcess.slice(0, limit)
  console.log(`\nLevel 3 — ${batch.length} ultra-deep pages (${stateCode})`)
  const newPages = []

  for (const { city, key, acc, variation, slug } of batch) {
    console.log(`  Generating: /${slug}`)
    try {
      const content = DRY_RUN
        ? mockContent(slug, 3, city, stateCode, acc.label, variation.label)
        : await callClaude(promptLevel3(city, stateCode, key, variation))
      newPages.push({
        slug, level: 3, stateCode, stateName: state.name,
        cityName: city.name, cityPop: city.pop, cityAccidents: city.duiCrashes,
        county: city.county, courthouse: city.courthouse,
        accidentType: key, accidentLabel: acc.label, accidentSlug: acc.slug,
        variation: variation.slug, variationLabel: variation.label, variationDesc: variation.desc,
        variationLegalNote: variation.legalNote, variationMultiplier: variation.avgMultiplierAdjust,
        leadValue: acc.leadValue,
        content: content || mockContent(slug, 3, city, stateCode, acc.label, variation.label),
        updatedAt: new Date().toISOString(),
      })
      console.log(`  ✓ /${slug}`)
      if (!DRY_RUN) await sleep(1800)
    } catch(e) { console.error(`  ✗ ${slug}:`, e.message) }
  }

  savePages([...existing, ...newPages])
  return newPages.length
}

async function main() {
  console.log(`\n🍺 Drunk Driver Settlement Generator v3`)
  console.log(`   State: ${STATE} | Level: ${LEVEL} | Limit: ${LIMIT} | Dry: ${DRY_RUN}`)
  if (!DRY_RUN) console.log(`   Model: claude-opus-4-6 (highest quality for unique content)\n`)

  let count = 0
  if (LEVEL === '1' || LEVEL === 'all') count += await generateLevel1(STATE, LIMIT)
  if (LEVEL === '2' || LEVEL === 'all') count += await generateLevel2(STATE, CITY ? slugify(CITY) : null, ACCIDENT, LIMIT)
  if (LEVEL === '3' || LEVEL === 'all') count += await generateLevel3(STATE, CITY ? slugify(CITY) : null, ACCIDENT, LIMIT)

  const total = loadPages().length
  console.log(`\n✅ Added ${count} pages. Total in pages.json: ${total}`)
  console.log(`\nNEXT STEPS:`)
  console.log(`  npm run build`)
  console.log(`  vercel deploy`)
  console.log(`  Submit sitemap to Google Search Console\n`)
}

main().catch(console.error)
