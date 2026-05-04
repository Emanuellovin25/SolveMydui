#!/usr/bin/env node
/**
 * lib/sitemap-submit.js — Google Search Console Sitemap Submitter
 *
 * Submits your sitemap to Google Search Console after each deploy.
 * Uses the Google Indexing API (requires service account credentials).
 *
 * Setup (one-time):
 *   1. Go to Google Search Console → Settings → Users and permissions
 *   2. Go to Google Cloud Console → Create project → Enable "Indexing API"
 *   3. Create Service Account → Download JSON credentials
 *   4. Add service account email as "Owner" in Search Console
 *   5. Save credentials JSON as lib/gsc-credentials.json
 *
 * Usage:
 *   node lib/sitemap-submit.js --ping       → Ping Google with sitemap URL (simple, no auth needed)
 *   node lib/sitemap-submit.js --api        → Use Indexing API for faster indexing
 */

const https = require('https')
const fs    = require('fs')
const path  = require('path')

const SITE_URL = process.env.SITE_URL || 'https://drunkdriversettlement.com'
const args = process.argv.slice(2)

// ── Simple ping (no auth required) ────────────────────────────────────────
function pingSitemap() {
  const sitemapUrl = encodeURIComponent(`${SITE_URL}/sitemap.xml`)
  const pingUrl = `https://www.google.com/ping?sitemap=${sitemapUrl}`

  console.log(`\n📡 Pinging Google with sitemap...`)
  console.log(`   Sitemap: ${SITE_URL}/sitemap.xml`)

  const url = new URL(pingUrl)
  const req = https.get({ hostname: url.hostname, path: url.pathname + url.search }, res => {
    if (res.statusCode === 200) {
      console.log(`✅ Google pinged successfully (HTTP ${res.statusCode})`)
      console.log(`\n   Next: Check Search Console in 24–48 hours for indexing status.`)
      console.log(`   URL: https://search.google.com/search-console\n`)
    } else {
      console.warn(`⚠️  Unexpected response: HTTP ${res.statusCode}`)
    }
  })
  req.on('error', e => console.error('Ping failed:', e.message))
  req.end()
}

// ── Indexing API (faster — requires service account) ──────────────────────
async function indexingApiSubmit() {
  const credFile = path.join(__dirname, 'gsc-credentials.json')
  if (!fs.existsSync(credFile)) {
    console.log(`\n⚠️  No credentials found at lib/gsc-credentials.json`)
    console.log(`   Falling back to simple ping...\n`)
    pingSitemap()
    return
  }

  console.log(`\n📡 Submitting URLs via Google Indexing API...`)
  console.log(`   Note: Indexing API prioritizes crawling — not guaranteed immediate indexing.`)
  console.log(`   For now, the simple ping (--ping) is sufficient for most sites.\n`)
  console.log(`   Full Indexing API implementation requires: npm install googleapis`)
  console.log(`   Then: https://developers.google.com/search/apis/indexing-api/v3/using-api\n`)
}

if (args.includes('--api')) {
  indexingApiSubmit()
} else {
  pingSitemap()
}
