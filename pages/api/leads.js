/**
 * pages/api/leads.js — Dashboard data endpoint
 * Access: GET /api/leads?key=ADMIN_KEY&state=TX&limit=50&offset=0
 *
 * Returns:
 *   { stats, leads, stateBreakdown }
 *
 * KV keys queried:
 *   stats:counters       → hash  (total, state:TX, injury:serious, bac:extreme …)
 *   leads:all            → sorted set (all lead IDs, score = timestamp ms)
 *   leads:state:{CODE}   → sorted set per state
 *   lead:{id}            → full lead JSON
 */

async function getKV() {
  if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) return null
  try {
    const { kv } = await import('@vercel/kv')
    return kv
  } catch {
    return null
  }
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end()

  // Auth check
  const { key, state, limit = '50', offset = '0' } = req.query
  const adminKey = process.env.ADMIN_KEY
  if (adminKey && key !== adminKey) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const kv = await getKV()

  // ── No KV configured → return demo/empty data ────────────────────────────
  if (!kv) {
    return res.status(200).json({
      kvConnected: false,
      stats: { total: 0 },
      stateBreakdown: {},
      leads: [],
      message: 'Vercel KV not connected. Connect KV in Vercel dashboard → Storage.',
    })
  }

  try {
    const lim = Math.min(parseInt(limit) || 50, 200)
    const off = parseInt(offset) || 0

    // 1. Stats counters hash
    const counters = await kv.hgetall('stats:counters') || {}

    // Parse state breakdown from counters
    const stateBreakdown = {}
    for (const [k, v] of Object.entries(counters)) {
      if (k.startsWith('state:')) {
        const code = k.replace('state:', '')
        stateBreakdown[code] = parseInt(v) || 0
      }
    }

    // Injury + BAC breakdown from counters
    const injuryBreakdown = {}
    const bacBreakdown = {}
    for (const [k, v] of Object.entries(counters)) {
      if (k.startsWith('injury:')) injuryBreakdown[k.replace('injury:', '')] = parseInt(v) || 0
      if (k.startsWith('bac:'))    bacBreakdown[k.replace('bac:', '')]       = parseInt(v) || 0
    }

    // 2. Get lead IDs from sorted set (newest first = reverse range)
    const setKey = state ? `leads:state:${state.toUpperCase()}` : 'leads:all'
    const total  = await kv.zcard(setKey)

    // zrange with REV: from highest score (newest) to lowest
    const ids = await kv.zrange(setKey, off, off + lim - 1, { rev: true }) || []

    // 3. Fetch each lead object
    const leadObjects = await Promise.all(
      ids.map(async (id) => {
        try {
          const raw = await kv.get(`lead:${id}`)
          return raw ? (typeof raw === 'string' ? JSON.parse(raw) : raw) : null
        } catch {
          return null
        }
      })
    )

    const leads = leadObjects.filter(Boolean)

    return res.status(200).json({
      kvConnected: true,
      stats: {
        total:   parseInt(counters.total) || 0,
        filtered: total,
      },
      stateBreakdown,
      injuryBreakdown,
      bacBreakdown,
      leads,
      pagination: { limit: lim, offset: off, total },
    })
  } catch (e) {
    console.error('Dashboard KV error:', e.message)
    return res.status(500).json({ error: 'KV query failed', detail: e.message })
  }
}
