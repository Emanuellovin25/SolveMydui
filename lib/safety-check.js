#!/usr/bin/env node
/**
 * lib/safety-check.js — Google Content Quality Validator
 *
 * Run before every Vercel deploy to catch issues before Google does.
 * Checks: duplicate content, thin pages, missing data, SOL consistency.
 *
 * Usage:
 *   node lib/safety-check.js
 *   node lib/safety-check.js --state TX
 *   node lib/safety-check.js --verbose
 */

const fs   = require('fs')
const path = require('path')

const statesData    = require('../data/states.json')
const accidentTypes = require('../data/accident-types.json')

const args    = process.argv.slice(2)
const getArg  = f => { const i = args.indexOf(f); return i !== -1 ? args[i+1] : null }
const STATE   = getArg('--state')
const VERBOSE = args.includes('--verbose')

const PAGES_FILE = path.join(__dirname, '../data/pages.json')

if (!fs.existsSync(PAGES_FILE)) {
  console.log('⚠️  No pages.json yet — generate content first.')
  process.exit(0)
}

const allPages = JSON.parse(fs.readFileSync(PAGES_FILE, 'utf8'))
const pages = STATE ? allPages.filter(p => p.stateCode === STATE) : allPages

let errors = 0, warnings = 0

function error(msg) { console.error(`  ❌ ERROR: ${msg}`); errors++ }
function warn(msg)  { console.warn( `  ⚠️  WARN:  ${msg}`); warnings++ }
function ok(msg)    { if (VERBOSE) console.log(`  ✅ OK:    ${msg}`) }

console.log(`\n🔍 Safety Check — ${pages.length} pages${STATE ? ' (' + STATE + ')' : ''}\n`)

// ── 1. Duplicate slug check ────────────────────────────────────────────────
const slugs = pages.map(p => p.slug)
const dupSlugs = slugs.filter((s, i) => slugs.indexOf(s) !== i)
if (dupSlugs.length) {
  error(`Duplicate slugs found: ${[...new Set(dupSlugs)].join(', ')}`)
} else { ok('No duplicate slugs') }

// ── 2. Thin content check ─────────────────────────────────────────────────
const MIN_HOOK_CHARS = 120
const MIN_SECTION_CHARS = 180
pages.forEach(p => {
  if (!p.content) { error(`Page /${p.slug} has no content object`); return }
  const c = p.content
  if (!c.h1)          error(`Page /${p.slug} missing H1`)
  if (!c.hook || c.hook.length < MIN_HOOK_CHARS) warn(`Page /${p.slug} hook too short (${c.hook?.length || 0} chars, min ${MIN_HOOK_CHARS})`)
  if (!c.section1Body || c.section1Body.length < MIN_SECTION_CHARS) warn(`Page /${p.slug} section1Body thin (${c.section1Body?.length || 0} chars)`)
  if (!c.section2Body || c.section2Body.length < MIN_SECTION_CHARS) warn(`Page /${p.slug} section2Body thin (${c.section2Body?.length || 0} chars)`)
  if (!c.section3Body || c.section3Body.length < MIN_SECTION_CHARS) warn(`Page /${p.slug} section3Body thin (${c.section3Body?.length || 0} chars)`)
  if (!c.metaTitle)   error(`Page /${p.slug} missing metaTitle`)
  if (c.metaTitle && c.metaTitle.length > 62) warn(`Page /${p.slug} metaTitle too long (${c.metaTitle.length} chars, max 62)`)
  if (!c.metaDescription) error(`Page /${p.slug} missing metaDescription`)
  if (c.metaDescription && c.metaDescription.length > 160) warn(`Page /${p.slug} metaDescription too long`)
})

// ── 3. Duplicate content fingerprint check ────────────────────────────────
// Check for near-identical hooks (sign of template substitution only)
const hooks = pages.map(p => ({slug: p.slug, hook: p.content?.hook || ''}))
const normalized = hooks.map(h => h.hook.replace(/[A-Z][a-z]+ ?, [A-Z]{2}|[A-Z][a-z]+/g, 'CITY').replace(/\d[\d,]*/g, 'NUM'))
const seen = new Map()
normalized.forEach((n, i) => {
  const key = n.substring(0, 60)
  if (seen.has(key)) {
    warn(`Possible duplicate hook pattern: /${hooks[i].slug} ≈ /${hooks[seen.get(key)].slug}`)
  } else { seen.set(key, i) }
})

// ── 4. State data integrity ───────────────────────────────────────────────
const stateCodes = [...new Set(pages.map(p => p.stateCode))]
stateCodes.forEach(sc => {
  if (!statesData[sc]) {
    error(`Unknown stateCode: ${sc}`)
    return
  }
  const s = statesData[sc]
  if (!s.duiStatute)     error(`State ${sc} missing duiStatute`)
  if (!s.sol)            error(`State ${sc} missing sol`)
  if (!s.fault)          error(`State ${sc} missing fault`)
  if (!s.punitives)      error(`State ${sc} missing punitives`)
  if (!s.dramShop)       error(`State ${sc} missing dramShop`)
  if (!s.avgDuiSettlement) error(`State ${sc} missing avgDuiSettlement`)
  ok(`State ${sc} data complete`)
})

// ── 5. Courthouse data check ──────────────────────────────────────────────
pages.forEach(p => {
  if (!p.courthouse && !p.county) {
    warn(`Page /${p.slug} missing courthouse/county — less local specificity`)
  }
})

// ── 6. Publishing rate check ──────────────────────────────────────────────
const last7Days = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
const recentPages = pages.filter(p => p.updatedAt > last7Days)
if (recentPages.length > 175) {
  error(`${recentPages.length} pages updated in last 7 days — exceeds safe limit of 175/week. Risk of Google "scaled content abuse" flag.`)
} else if (recentPages.length > 140) {
  warn(`${recentPages.length} pages updated in last 7 days — approaching limit. Stay under 175/week.`)
} else {
  ok(`Publishing rate: ${recentPages.length} pages in last 7 days (safe)`)
}

// ── 7. Summary ────────────────────────────────────────────────────────────
console.log(`\n── Summary ──────────────────────────────────────`)
console.log(`   Pages checked: ${pages.length}`)
console.log(`   Errors:   ${errors}`)
console.log(`   Warnings: ${warnings}`)

if (errors > 0) {
  console.log(`\n❌ FAILED — fix ${errors} error(s) before deploying.\n`)
  process.exit(1)
} else if (warnings > 5) {
  console.log(`\n⚠️  CAUTION — ${warnings} warnings. Review before deploying.\n`)
} else {
  console.log(`\n✅ PASSED — safe to deploy.\n`)
}
