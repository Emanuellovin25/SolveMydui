#!/usr/bin/env node
/**
 * lib/safe-publish.js — Google-Safe Publishing Scheduler
 *
 * Generates content in daily batches within Google's safe limits.
 * Max 20–25 pages/day per domain to avoid "scaled content abuse" flag.
 *
 * Usage:
 *   node lib/safe-publish.js --state TX --day 1        → Day 1: Level 1 city hubs
 *   node lib/safe-publish.js --state TX --day 2        → Day 2: Houston L2 pages
 *   node lib/safe-publish.js --state TX --auto         → Auto-detects where you left off
 *   node lib/safe-publish.js --state TX --preview      → Shows what would run today
 *
 * Full 4-week Texas schedule:
 *   Week 1  (Days 1–5):   All Level 1 city hubs (43 pages, 9/day)
 *   Week 2  (Days 6–12):  Level 2 for top 7 cities (98 pages, 14/day)
 *   Week 3  (Days 13–19): Level 2 remaining + L3 Houston start
 *   Week 4  (Days 20–28): Level 3 ultra-deep pages (210 pages, 23/day)
 */

const fs   = require('fs')
const path = require('path')
const { execSync } = require('child_process')

const statesData = require('../data/states.json')
const accidentTypes = require('../data/accident-types.json')

const args = process.argv.slice(2)
const getArg = f => { const i = args.indexOf(f); return i !== -1 ? args[i+1] : null }
const STATE   = getArg('--state') || 'TX'
const DAY     = parseInt(getArg('--day') || '0')
const AUTO    = args.includes('--auto')
const PREVIEW = args.includes('--preview')
const DRY     = args.includes('--dry')

const PAGES_FILE    = path.join(__dirname, '../data/pages.json')
const SCHEDULE_FILE = path.join(__dirname, '../data/schedule-state.json')

function slugify(s) {
  return s.toLowerCase().replace(/\./g,'').replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'')
}

function loadPages() {
  if (!fs.existsSync(PAGES_FILE)) return []
  return JSON.parse(fs.readFileSync(PAGES_FILE, 'utf8'))
}

function loadSchedule() {
  const file = SCHEDULE_FILE.replace('state', STATE)
  if (!fs.existsSync(file)) return { lastDay: 0, totalPublished: 0, log: [] }
  return JSON.parse(fs.readFileSync(file, 'utf8'))
}

function saveSchedule(data) {
  const file = SCHEDULE_FILE.replace('state', STATE)
  fs.writeFileSync(file, JSON.stringify(data, null, 2))
}

// Build full publishing plan
function buildPlan(stateCode) {
  const state = statesData[stateCode]
  const cities = state.cities.filter(c => c.pop >= 30000)
  const accidents = Object.entries(accidentTypes)

  const plan = []
  const DAILY_LIMIT = 22

  // Phase 1: Level 1 city hubs (all cities)
  const l1Batches = []
  for (let i = 0; i < cities.length; i += DAILY_LIMIT) {
    l1Batches.push(cities.slice(i, i + DAILY_LIMIT))
  }
  l1Batches.forEach((batch, i) => {
    plan.push({
      day: i + 1, phase: 1,
      description: `Level 1 city hubs (batch ${i+1}/${l1Batches.length}) — ${batch.map(c=>c.name).join(', ')}`,
      cmd: `--state ${stateCode} --level 1 --limit ${batch.length}`,
      pagesExpected: batch.length,
    })
  })

  // Phase 2: Level 2 for top cities (by DUI crash count)
  const topCities = [...cities].sort((a,b) => b.duiCrashes - a.duiCrashes).slice(0, 12)
  const l2Tasks = []
  topCities.forEach(city => {
    accidents.forEach(([key, acc]) => {
      l2Tasks.push({ city, key, slug: acc.slug })
    })
  })
  const l2StartDay = plan.length + 1
  for (let i = 0; i < l2Tasks.length; i += DAILY_LIMIT) {
    const batch = l2Tasks.slice(i, i + DAILY_LIMIT)
    const cities_in_batch = [...new Set(batch.map(t => t.city.name))]
    plan.push({
      day: l2StartDay + Math.floor(i/DAILY_LIMIT), phase: 2,
      description: `Level 2 city+type (batch) — ${cities_in_batch.slice(0,3).join(', ')}...`,
      cmd: `--state ${stateCode} --level 2 --limit ${batch.length}`,
      pagesExpected: batch.length,
    })
  }

  // Phase 3: Level 3 ultra-deep
  const l3StartDay = plan.length + 1
  const l3Cities = [...cities].sort((a,b) => b.duiCrashes - a.duiCrashes).slice(0, 8)
  const l3Tasks = []
  l3Cities.forEach(city => {
    accidents.filter(([,a]) => a.level3).forEach(([key, acc]) => {
      acc.level3.forEach(v => {
        l3Tasks.push({ city, key, slug: acc.slug, variation: v.slug })
      })
    })
  })
  for (let i = 0; i < l3Tasks.length; i += DAILY_LIMIT) {
    const batch = l3Tasks.slice(i, i + DAILY_LIMIT)
    const cities_in_batch = [...new Set(batch.map(t => t.city.name))]
    plan.push({
      day: l3StartDay + Math.floor(i/DAILY_LIMIT), phase: 3,
      description: `Level 3 ultra-deep (batch) — ${cities_in_batch.slice(0,3).join(', ')}...`,
      cmd: `--state ${stateCode} --level 3 --limit ${batch.length}`,
      pagesExpected: batch.length,
    })
  }

  return plan
}

function printPlan(plan, schedule) {
  console.log(`\n📅 Publishing Schedule — ${STATE}`)
  console.log(`   Published so far: ${schedule.totalPublished} pages`)
  console.log(`   Last day run: Day ${schedule.lastDay}\n`)

  plan.forEach(p => {
    const done = p.day <= schedule.lastDay
    const today = p.day === schedule.lastDay + 1
    const prefix = done ? '✅' : today ? '▶️ ' : '   '
    const label = done ? '(done)' : today ? '(next)' : ''
    console.log(`${prefix} Day ${String(p.day).padStart(2,'0')} [Phase ${p.phase}] ${p.description} — ~${p.pagesExpected} pages ${label}`)
  })

  const totalPages = plan.reduce((s,p) => s + p.pagesExpected, 0)
  const daysLeft = plan.filter(p => p.day > schedule.lastDay).length
  console.log(`\n   Total pages: ~${totalPages} | Days remaining: ${daysLeft} | Estimated completion: ${daysLeft} publishing days\n`)
}

async function runDay(dayNum, plan, schedule) {
  const task = plan.find(p => p.day === dayNum)
  if (!task) {
    console.log(`No task for day ${dayNum}. Publishing complete!`)
    return
  }

  console.log(`\n🚀 Running Day ${dayNum} — Phase ${task.phase}`)
  console.log(`   ${task.description}`)
  console.log(`   Expected: ~${task.pagesExpected} pages\n`)

  const genCmd = `node ${path.join(__dirname, 'generate.js')} ${task.cmd}${DRY ? ' --dry' : ''}`
  console.log(`   Command: ${genCmd}\n`)

  if (!PREVIEW) {
    try {
      execSync(genCmd, { stdio: 'inherit', cwd: path.join(__dirname, '..') })
      const newTotal = loadPages().filter(p => p.stateCode === STATE).length
      schedule.lastDay = dayNum
      schedule.totalPublished = newTotal
      schedule.log.push({
        day: dayNum, date: new Date().toISOString(),
        pagesPublished: task.pagesExpected, total: newTotal
      })
      saveSchedule(schedule)
      console.log(`\n✅ Day ${dayNum} complete. Total published: ${newTotal}`)
      console.log(`\n📋 NEXT STEPS:`)
      console.log(`   1. Run: npm run build`)
      console.log(`   2. Run: vercel deploy`)
      console.log(`   3. Submit sitemap: node lib/sitemap-submit.js`)
      console.log(`   4. Tomorrow: node lib/safe-publish.js --state ${STATE} --auto\n`)
    } catch(e) {
      console.error('Generation failed:', e.message)
    }
  } else {
    console.log(`   [PREVIEW MODE — no pages generated]`)
  }
}

async function main() {
  const plan     = buildPlan(STATE)
  const schedule = loadSchedule()

  if (args.includes('--plan') || PREVIEW) {
    printPlan(plan, schedule)
    if (!PREVIEW) return
  }

  const dayToRun = AUTO ? schedule.lastDay + 1 : DAY
  if (!dayToRun) {
    printPlan(plan, schedule)
    return
  }

  await runDay(dayToRun, plan, schedule)
}

main().catch(console.error)
