/**
 * pages/api/lead.js — Lead Routing + Storage API v3
 *
 * Storage: Vercel KV (Redis) — free tier, 30K commands/month
 * Setup:   Vercel Dashboard → Storage → Create KV → Connect to project
 *          (Vercel auto-adds KV_REST_API_URL + KV_REST_API_TOKEN to env)
 *
 * Graceful fallback: se email/Boberdoo dacă KV nu e configurat.
 *
 * Lead structure stored:
 *   kv key  "lead:{id}"           → full lead object
 *   kv key  "leads:all"           → sorted set (score = timestamp, member = id)
 *   kv key  "leads:state:{CODE}"  → sorted set per stat (TX, CA, etc.)
 *   kv key  "leads:day:{YYYY-MM-DD}" → sorted set per zi
 *   kv key  "stats:counters"      → hash cu counters (total, per stat, per injury, per bac)
 */

// ── KV helper (wraps @vercel/kv cu graceful fallback) ────────────────────────
async function getKV() {
  if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) return null
  try {
    const { kv } = await import('@vercel/kv')
    return kv
  } catch {
    return null
  }
}

async function storeLead(kv, lead) {
  if (!kv) return false
  try {
    const score = new Date(lead.timestamp).getTime()
    const id    = lead.id

    // Store full lead object
    await kv.set(`lead:${id}`, JSON.stringify(lead), { ex: 60 * 60 * 24 * 365 }) // 1 year TTL

    // Sorted sets for querying (score = unix timestamp ms)
    await kv.zadd('leads:all',            { score, member: id })
    await kv.zadd(`leads:state:${lead.stateCode}`, { score, member: id })
    await kv.zadd(`leads:day:${lead.date}`, { score, member: id })
    if (lead.injury) await kv.zadd(`leads:injury:${lead.injury}`, { score, member: id })
    if (lead.bac && lead.bac !== 'unknown') await kv.zadd(`leads:bac:${lead.bac}`, { score, member: id })

    // Increment counters
    await kv.hincrby('stats:counters', 'total', 1)
    await kv.hincrby('stats:counters', `state:${lead.stateCode}`, 1)
    if (lead.injury) await kv.hincrby('stats:counters', `injury:${lead.injury}`, 1)
    if (lead.bac && lead.bac !== 'unknown') await kv.hincrby('stats:counters', `bac:${lead.bac}`, 1)

    return true
  } catch (e) {
    console.error('KV store error:', e.message)
    return false
  }
}

// ── Lead value estimator ──────────────────────────────────────────────────────
function estimateValue(bac, injury) {
  const vals = {
    extreme:  { permanent: 1200, serious: 900, moderate: 700, minor: 500 },
    enhanced: { permanent: 900,  serious: 700, moderate: 550, minor: 400 },
    standard: { permanent: 750,  serious: 600, moderate: 450, minor: 350 },
    unknown:  { permanent: 700,  serious: 550, moderate: 400, minor: 320 },
  }
  const base = vals[bac || 'unknown']?.[injury || 'moderate'] || 400
  return `$${base}–$${Math.round(base * 1.5)}`
}

// ── Main handler ──────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const {
    name, phone, email, city, stateCode, stateName,
    accidentType, injury, bac, message,
    source, type, referrer, userAgent,
    pageLevel, cityAccidents, county, courthouse,
  } = req.body

  if (!name || (!phone && !email)) {
    return res.status(400).json({ error: 'Name and phone or email required' })
  }
  if (!stateCode) {
    return res.status(400).json({ error: 'State is required' })
  }

  const now = new Date()
  const lead = {
    id:           `ld_${now.getTime()}_${Math.random().toString(36).substr(2, 6)}`,
    timestamp:    now.toISOString(),
    date:         now.toISOString().slice(0, 10),          // YYYY-MM-DD
    // Contact
    name, phone: phone || '', email: email || '',
    // Location
    city:         city || '',
    stateCode:    (stateCode || '').toUpperCase(),
    stateName:    stateName || stateCode,
    county:       county || '',
    courthouse:   courthouse || '',
    // Case
    accidentType: accidentType || 'Drunk Driver',
    injury:       injury || 'unknown',
    bac:          bac    || 'unknown',
    message:      message || '',
    // Meta
    estimatedValue: estimateValue(bac, injury),
    source:       source || '/',
    referrer:     referrer || 'direct',
    type:         type || 'case_evaluation',
    pageLevel:    pageLevel || null,
    cityAccidents: cityAccidents || null,
    userAgent:    (userAgent || '').substring(0, 120),
    siteState:    process.env.SITE_STATE || 'ALL',
  }

  console.log(`📥 Lead [${lead.id}] — ${lead.name} · ${lead.city}, ${lead.stateCode} · ${lead.injury} · BAC: ${lead.bac} · Est: ${lead.estimatedValue}`)

  // Run all integrations in parallel, don't block response
  const tasks = []

  // 1. Vercel KV storage
  const kv = await getKV()
  if (kv) {
    tasks.push(storeLead(kv, lead).then(ok => {
      if (ok) console.log(`✅ KV stored: lead:${lead.id}`)
      else    console.warn('⚠️  KV store failed — email fallback active')
    }))
  }

  // 2. Resend email notification
  if (process.env.RESEND_API_KEY && process.env.NOTIFICATION_EMAIL) {
    const bacLabel = { extreme: '0.20%+ 🔴', enhanced: '0.15–0.19% 🟠', standard: '0.08–0.14% 🟡', unknown: 'Unknown ⚪' }
    const injuryLabel = { permanent: 'Permanent 🔴', serious: 'Serious 🟠', moderate: 'Moderate 🟡', minor: 'Minor ⚪' }

    tasks.push(
      fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: `leads@${(process.env.SITE_URL||'drunkdriversettlement.com').replace('https://','').replace('http://','') }`,
          to: [process.env.NOTIFICATION_EMAIL],
          subject: `[${lead.estimatedValue}] ${lead.name} · ${lead.city}, ${lead.stateCode} · ${injuryLabel[lead.injury]||lead.injury}`,
          text: [
            `LEAD ID: ${lead.id}`,
            `Value:   ${lead.estimatedValue}`,
            `Time:    ${now.toLocaleString('en-US', { timeZone: 'America/New_York' })} ET`,
            '',
            `Name:  ${lead.name}`,
            `Phone: ${lead.phone || '—'}`,
            `Email: ${lead.email || '—'}`,
            `City:  ${lead.city}, ${lead.stateCode}${lead.county ? ' (' + lead.county + ')' : ''}`,
            '',
            `Accident: ${lead.accidentType}`,
            `Injury:   ${injuryLabel[lead.injury] || lead.injury}`,
            `BAC:      ${bacLabel[lead.bac] || lead.bac}`,
            lead.message ? `Details:  ${lead.message}` : '',
            '',
            `Source:   ${process.env.SITE_URL}${lead.source}`,
            `Referrer: ${lead.referrer}`,
            `Dashboard: ${process.env.SITE_URL}/dashboard`,
          ].filter(l => l !== undefined).join('\n'),
        }),
      }).catch(e => console.error('Resend error:', e.message))
    )
  }

  // 3. Boberdoo lead network
  if (process.env.BOBERDOO_API_KEY) {
    const [firstName, ...rest] = lead.name.split(' ')
    tasks.push(
      fetch('https://api.boberdoo.com/api_lead.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: process.env.BOBERDOO_API_KEY,
          lead_type: 'Personal Injury', sub_type: 'DUI / Drunk Driver',
          firstname: firstName, lastname: rest.join(' ') || firstName,
          phone1: lead.phone, email: lead.email,
          state: lead.stateCode, city: lead.city,
          comments: `Injury: ${lead.injury} | BAC: ${lead.bac} | Est: ${lead.estimatedValue} | ${lead.message}`,
          source_url: `${process.env.SITE_URL}${lead.source}`,
          lead_id: lead.id,
        }),
      }).catch(e => console.error('Boberdoo error:', e.message))
    )
  }

  // 4. Webhook (Zapier, Make.com, CRM)
  if (process.env.WEBHOOK_URL) {
    tasks.push(
      fetch(process.env.WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(lead),
      }).catch(e => console.error('Webhook error:', e.message))
    )
  }

  await Promise.allSettled(tasks)

  return res.status(200).json({ success: true, id: lead.id })
}
