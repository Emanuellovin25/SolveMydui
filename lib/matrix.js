#!/usr/bin/env node
/**
 * lib/matrix.js — Super Octopus Matrix Generator
 *
 * Generates the complete URL matrix for a state:
 * Level 1: /city
 * Level 2: /city-accident-type
 * Level 3: /city-accident-type-variation
 *
 * Usage:
 *   node lib/matrix.js --state TX              → shows full matrix
 *   node lib/matrix.js --state TX --count      → shows page counts only
 *   node lib/matrix.js --state TX --export     → writes matrix to data/matrix-TX.json
 */

const fs = require('fs')
const path = require('path')

const statesData = require('../data/states.json')
const accidentTypes = require('../data/accident-types.json')

const args = process.argv.slice(2)
const getArg = (f) => { const i = args.indexOf(f); return i !== -1 ? args[i+1] : null }
const STATE = getArg('--state') || 'TX'
const COUNT_ONLY = args.includes('--count')
const EXPORT = args.includes('--export')

function slugify(str) {
  return str.toLowerCase().replace(/\./g,'').replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'')
}

function buildMatrix(stateCode) {
  const state = statesData[stateCode]
  if (!state) { console.error(`State ${stateCode} not found`); process.exit(1) }

  const matrix = {
    stateCode,
    stateName: state.name,
    domain: state.domainPattern,
    leaseValue: state.leaseValue,
    pages: { level1: [], level2: [], level3: [] },
    totals: { level1: 0, level2: 0, level3: 0, total: 0 }
  }

  const cities = state.cities.filter(c => c.pop >= 30000)

  cities.forEach(city => {
    const citySlug = slugify(city.name)

    // LEVEL 1 — base city page
    matrix.pages.level1.push({
      url: `/${citySlug}`,
      fullUrl: `https://${state.domainPattern}/${citySlug}`,
      city: city.name,
      pop: city.pop,
      type: 'city-hub',
      level: 1,
      competition: 'Medium',
      rankTime: '3–6 months'
    })

    // LEVEL 2 — city + accident type
    Object.values(accidentTypes).forEach(accident => {
      const slug = `${citySlug}-${accident.slug}`
      matrix.pages.level2.push({
        url: `/${slug}`,
        fullUrl: `https://${state.domainPattern}/${slug}`,
        city: city.name,
        accidentType: accident.label,
        accidentSlug: accident.slug,
        pop: city.pop,
        leadValue: accident.leadValue,
        type: 'city-accident',
        level: 2,
        competition: 'Easy',
        rankTime: '4–8 weeks'
      })

      // LEVEL 3 — ultra-deep variations
      if (accident.level3) {
        accident.level3.forEach(variation => {
          const deepSlug = `${citySlug}-${accident.slug}-${variation.slug}`
          matrix.pages.level3.push({
            url: `/${deepSlug}`,
            fullUrl: `https://${state.domainPattern}/${deepSlug}`,
            city: city.name,
            accidentType: accident.label,
            accidentSlug: accident.slug,
            variation: variation.label,
            variationSlug: variation.slug,
            variationDesc: variation.desc,
            pop: city.pop,
            leadValue: accident.leadValue,
            type: 'ultra-deep',
            level: 3,
            competition: 'Near Zero',
            rankTime: '2–4 weeks'
          })
        })
      }
    })
  })

  matrix.totals.level1 = matrix.pages.level1.length
  matrix.totals.level2 = matrix.pages.level2.length
  matrix.totals.level3 = matrix.pages.level3.length
  matrix.totals.total = matrix.totals.level1 + matrix.totals.level2 + matrix.totals.level3

  return matrix
}

function printMatrix(matrix) {
  console.log(`\n${'='.repeat(60)}`)
  console.log(`SUPER OCTOPUS MATRIX — ${matrix.stateName}`)
  console.log(`Domain: ${matrix.domain}`)
  console.log(`Lease value: ${matrix.leaseValue}`)
  console.log(`${'='.repeat(60)}`)

  console.log(`\nPAGE COUNTS:`)
  console.log(`  Level 1 (city hubs):        ${matrix.totals.level1} pages`)
  console.log(`  Level 2 (city + accident):  ${matrix.totals.level2} pages`)
  console.log(`  Level 3 (ultra-deep):       ${matrix.totals.level3} pages`)
  console.log(`  ─────────────────────────────`)
  console.log(`  TOTAL:                      ${matrix.totals.total} pages`)

  if (!COUNT_ONLY) {
    console.log(`\nSAMPLE LEVEL 1 (first 3):`)
    matrix.pages.level1.slice(0,3).forEach(p => console.log(`  ${p.url}`))

    console.log(`\nSAMPLE LEVEL 2 (first 8):`)
    matrix.pages.level2.slice(0,8).forEach(p => console.log(`  ${p.url}  [${p.leadValue}]`))

    console.log(`\nSAMPLE LEVEL 3 (first 8):`)
    matrix.pages.level3.slice(0,8).forEach(p => console.log(`  ${p.url}  [near-zero competition]`))
  }

  console.log(`\nGENERATION PLAN (20-30 pages/day):`)
  const days = Math.ceil(matrix.totals.total / 25)
  console.log(`  At 25 pages/day: ${days} days (${Math.ceil(days/7)} weeks)`)
  console.log(`  Recommended order: L1 first → L2 by city size → L3`)
  console.log()
}

const matrix = buildMatrix(STATE)
printMatrix(matrix)

if (EXPORT) {
  const outPath = path.join(__dirname, `../data/matrix-${STATE}.json`)
  fs.writeFileSync(outPath, JSON.stringify(matrix, null, 2))
  console.log(`Matrix exported to: data/matrix-${STATE}.json\n`)
}
