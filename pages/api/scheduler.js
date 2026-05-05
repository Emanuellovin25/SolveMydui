/**
 * /api/scheduler — Manages the pre-calculated publishing schedule
 * Uses KV_REST_API_URL / KV_REST_API_TOKEN (Upstash Redis via Vercel KV)
 * v2 — parallel Redis calls to avoid timeout
 */

const KV_URL = process.env.KV_REST_API_URL
const KV_TOKEN = process.env.KV_REST_API_TOKEN

async function kvGet(key) {
  const res = await fetch(`${KV_URL}/get/${encodeURIComponent(key)}`, {
    headers: { Authorization: `Bearer ${KV_TOKEN}` }
  })
  const data = await res.json()
  return data.result ? JSON.parse(data.result) : null
}

async function kvSet(key, value) {
  const res = await fetch(`${KV_URL}/set/${encodeURIComponent(key)}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${KV_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(JSON.stringify(value))
  })
  return res.ok
}

async function kvDel(key) {
  await fetch(`${KV_URL}/del/${encodeURIComponent(key)}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${KV_TOKEN}` }
  })
}

// Fetch all chunks in parallel
async function getAllChunks(meta) {
  const promises = []
  for (let i = 0; i < meta.chunks; i++) {
    promises.push(kvGet(`schedule:chunk:${i}`))
  }
  const results = await Promise.all(promises)
  const all = []
  for (const chunk of results) {
    if (chunk) for (const entry of chunk) all.push(entry)
  }
  return all
}

export default async function handler(req, res) {
  // Auth
  const { password } = req.body || req.query
  if (password !== process.env.GENERATOR_PASSWORD) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const { action } = req.body || req.query

  // ── INIT: Load full schedule from static file into KV ──────────────────────
  if (action === 'init') {
    try {
      const schedule = require('../../data/schedule.json')
      const CHUNK = 10
      const chunks = Math.ceil(schedule.length / CHUNK)

      // Save chunks in parallel batches of 5 to avoid rate limits
      const BATCH = 5
      for (let b = 0; b < chunks; b += BATCH) {
        const batch = []
        for (let i = b; i < Math.min(b + BATCH, chunks); i++) {
          batch.push(kvSet(`schedule:chunk:${i}`, schedule.slice(i * CHUNK, (i + 1) * CHUNK)))
        }
        await Promise.all(batch)
      }

      await kvSet('schedule:meta', { total: schedule.length, chunks, initialized: new Date().toISOString() })
      return res.json({ success: true, total: schedule.length, chunks })
    } catch (e) {
      return res.status(500).json({ error: e.message })
    }
  }

  // ── GET: Return schedule entries for a date range ──────────────────────────
  if (action === 'getRange') {
    const { from, to } = req.body
    try {
      const meta = await kvGet('schedule:meta')
      if (!meta) return res.json({ entries: [] })

      // Fetch all chunks in parallel
      const all = await getAllChunks(meta)

      const entries = all
        .filter(e => (!from || e.date >= from) && (!to || e.date <= to))
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(0, 60)

      return res.json({ entries })
    } catch (e) {
      return res.status(500).json({ error: e.message })
    }
  }

  // ── UPDATE: Save edited entry back to KV ───────────────────────────────────
  if (action === 'updateEntry') {
    const { entry } = req.body
    try {
      const meta = await kvGet('schedule:meta')
      if (!meta) return res.status(404).json({ error: 'Schedule not initialized' })

      // Fetch all chunks in parallel, find and update
      const promises = []
      for (let i = 0; i < meta.chunks; i++) {
        promises.push(kvGet(`schedule:chunk:${i}`))
      }
      const chunks = await Promise.all(promises)

      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i]
        if (!chunk) continue
        const idx = chunk.findIndex(e => e.date === entry.date && e.stateCode === entry.stateCode && e.level === entry.level)
        if (idx !== -1) {
          chunk[idx] = entry
          await kvSet(`schedule:chunk:${i}`, chunk)
          return res.json({ success: true })
        }
      }
      return res.status(404).json({ error: 'Entry not found' })
    } catch (e) {
      return res.status(500).json({ error: e.message })
    }
  }

  // ── PUBLISH: Generate pages via Claude + commit to GitHub ──────────────────
  if (action === 'publish') {
    const { entry } = req.body
    const githubToken = process.env.GITHUB_TOKEN
    const githubRepo = process.env.GITHUB_REPO
    const anthropicKey = process.env.ANTHROPIC_API_KEY

    if (!githubToken || !anthropicKey) {
      return res.status(500).json({ error: 'Missing GITHUB_TOKEN or ANTHROPIC_API_KEY' })
    }

    try {
      // Fetch current pages.json
      const fileRes = await fetch(`https://api.github.com/repos/${githubRepo}/contents/data/pages.json`, {
        headers: { Authorization: `token ${githubToken}`, Accept: 'application/vnd.github.v3+json' }
      })
      const fileData = await fileRes.json()
      const existingPages = JSON.parse(Buffer.from(fileData.content, 'base64').toString('utf8'))
      const fileSha = fileData.sha

      const newPages = []
      const TONES = {
        aggressive: 'Direct, urgent, fight for maximum compensation, every dollar counts',
        empathetic: 'Warm, understanding, focused on victim recovery and healing',
        neutral: 'Professional, data-driven, balanced and informative',
        urgent: 'Time-sensitive, deadline-focused, act before it is too late',
      }

      for (const page of entry.pages) {
        if (existingPages.find(p => p.slug === page.slug)) continue

        const prompt = `You are an expert legal content writer for a drunk driver settlement calculator website.

Generate unique, specific SEO content for this page:
- State: ${entry.stateName} (${entry.stateCode})
- City: ${page.city}
- Topic: ${page.label}
- Tone: ${TONES[entry.tone] || TONES.aggressive}
- Keywords to include naturally: ${page.keywords}
- Page specificity level: ${entry.level === 2 ? 'City + claim type overview' : 'Hyper-specific scenario page'}

Return ONLY a valid JSON object with exactly these fields:
{
  "metaTitle": "under 60 chars with city name",
  "metaDescription": "under 155 chars, compelling CTA",
  "h1": "powerful headline with city name and specific scenario",
  "hook": "2-3 sentences, ${TONES[entry.tone]}, mention ${entry.stateName} law specifically",
  "section1Title": "unique angle heading",
  "section1Body": "130-160 words, include keywords naturally, specific to ${page.city}",
  "section2Title": "different angle heading",
  "section2Body": "130-160 words, different perspective from section 1",
  "section3Title": "action-oriented heading",
  "section3Body": "130-160 words, local specifics, next steps for victim"
}

No markdown, no code blocks, raw JSON only.`

        try {
          const aiRes = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-api-key': anthropicKey, 'anthropic-version': '2023-06-01' },
            body: JSON.stringify({ model: 'claude-sonnet-4-6', max_tokens: 1200, messages: [{ role: 'user', content: prompt }] })
          })
          const aiData = await aiRes.json()
          if (aiData.error) throw new Error(aiData.error.message)
          const text = aiData.content.map(c => c.text || '').join('')
          const content = JSON.parse(text.replace(/```json\n?/g,'').replace(/```\n?/g,'').trim())

          newPages.push({
            slug: page.slug,
            stateCode: entry.stateCode,
            stateName: entry.stateName,
            cityName: page.city,
            accidentType: page.accidentType,
            accidentLabel: page.label,
            level: entry.level,
            tone: entry.tone,
            keywords: page.keywords.split(',').map(k => k.trim()),
            content,
            updatedAt: new Date().toISOString(),
          })
        } catch (e) {
          console.error(`Error generating ${page.slug}:`, e.message)
        }

        await new Promise(r => setTimeout(r, 300))
      }

      if (newPages.length === 0) {
        await markPublished(entry, 0)
        return res.json({ success: true, generated: 0, message: 'All pages already existed' })
      }

      // Commit to GitHub
      const allPages = [...existingPages, ...newPages]
      const newContent = Buffer.from(JSON.stringify(allPages, null, 2)).toString('base64')
      const commitRes = await fetch(`https://api.github.com/repos/${githubRepo}/contents/data/pages.json`, {
        method: 'PUT',
        headers: { Authorization: `token ${githubToken}`, 'Content-Type': 'application/json', Accept: 'application/vnd.github.v3+json' },
        body: JSON.stringify({
          message: `scheduler: ${newPages.length} pages — ${entry.stateName} L${entry.level} (${entry.date})`,
          content: newContent, sha: fileSha,
        })
      })

      if (!commitRes.ok) {
        const err = await commitRes.json()
        throw new Error(err.message)
      }

      await markPublished(entry, newPages.length)

      return res.json({ success: true, generated: newPages.length, slugs: newPages.map(p => p.slug) })
    } catch (e) {
      return res.status(500).json({ error: e.message })
    }

    async function markPublished(entry, count) {
      const meta = await kvGet('schedule:meta')
      if (!meta) return
      const promises = []
      for (let i = 0; i < meta.chunks; i++) {
        promises.push(kvGet(`schedule:chunk:${i}`))
      }
      const chunks = await Promise.all(promises)
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i]
        if (!chunk) continue
        const idx = chunk.findIndex(e => e.date === entry.date && e.stateCode === entry.stateCode && e.level === entry.level)
        if (idx !== -1) {
          chunk[idx].status = 'published'
          chunk[idx].publishedAt = new Date().toISOString()
          chunk[idx].publishedCount = count
          await kvSet(`schedule:chunk:${i}`, chunk)
          return
        }
      }
    }
  }

  return res.status(400).json({ error: 'Unknown action' })
}
