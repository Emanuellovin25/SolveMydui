/**
 * pages/api/admin.js — Admin stats endpoint
 * Access: /api/admin?key=YOUR_ADMIN_KEY
 *
 * Set ADMIN_KEY in .env.local for security.
 * Shows: page counts, lead stats, publishing progress per state.
 */

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end()

  const { key } = req.query
  const adminKey = process.env.ADMIN_KEY
  if (adminKey && key !== adminKey) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const pagesData = require('../../data/pages.json')
  const statesData = require('../../data/states.json')
  const accidentTypes = require('../../data/accident-types.json')

  const stateBreakdown = {}
  Object.keys(statesData).forEach(code => {
    const statePages = pagesData.filter(p => p.stateCode === code)
    stateBreakdown[code] = {
      name: statesData[code].name,
      total: statePages.length,
      level1: statePages.filter(p => p.level === 1).length,
      level2: statePages.filter(p => p.level === 2).length,
      level3: statePages.filter(p => p.level === 3).length,
      lastUpdated: statePages.sort((a,b) => b.updatedAt > a.updatedAt ? 1 : -1)[0]?.updatedAt || null,
    }
  })

  const last24h = new Date(Date.now() - 24*60*60*1000).toISOString()
  const last7d  = new Date(Date.now() - 7*24*60*60*1000).toISOString()

  return res.status(200).json({
    summary: {
      totalPages: pagesData.length,
      publishedLast24h: pagesData.filter(p => p.updatedAt > last24h).length,
      publishedLast7d:  pagesData.filter(p => p.updatedAt > last7d).length,
      states: Object.keys(stateBreakdown).length,
      accidentTypes: Object.keys(accidentTypes).length,
    },
    byState: stateBreakdown,
    deployedState: process.env.SITE_STATE || 'ALL',
    timestamp: new Date().toISOString(),
  })
}
