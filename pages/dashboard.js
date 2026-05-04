/**
 * pages/dashboard.js — Lead Management Dashboard
 *
 * Password-protected via ADMIN_KEY env var.
 * Queries /api/leads → Vercel KV for all lead data.
 *
 * Features:
 *  • State breakdown bar chart
 *  • Recent leads table with state filter
 *  • Injury + BAC breakdowns
 *  • CSV export
 *  • Auto-refresh every 60s
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import Head from 'next/head'

// ── State metadata ────────────────────────────────────────────────────────────
const STATE_NAMES = {
  TX: 'Texas', CA: 'California', FL: 'Florida', NY: 'New York',
  GA: 'Georgia', IL: 'Illinois', AZ: 'Arizona', OH: 'Ohio',
}
const STATE_ORDER = ['TX', 'CA', 'FL', 'NY', 'GA', 'IL', 'AZ', 'OH']

const INJURY_LABELS = {
  permanent: 'Permanent', serious: 'Serious',
  moderate: 'Moderate', minor: 'Minor', unknown: 'Unknown',
}
const BAC_LABELS = {
  extreme: 'Extreme (0.20%+)', enhanced: 'Enhanced (0.15–0.19%)',
  standard: 'Standard (0.08–0.14%)', unknown: 'Unknown',
}
const BAC_COLORS = {
  extreme: '#dc2626', enhanced: '#ea580c', standard: '#ca8a04', unknown: '#6b7280',
}
const INJURY_COLORS = {
  permanent: '#7c3aed', serious: '#dc2626', moderate: '#ea580c', minor: '#ca8a04', unknown: '#6b7280',
}

// ── Utility ───────────────────────────────────────────────────────────────────
function fmtDate(iso) {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleString('en-US', {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
    })
  } catch { return iso }
}

function exportCSV(leads) {
  const cols = ['id','timestamp','name','phone','email','city','stateCode','county',
                'injury','bac','estimatedValue','accidentType','source','referrer','pageLevel','cityAccidents']
  const rows = [cols.join(',')]
  for (const l of leads) {
    rows.push(cols.map(c => `"${(l[c] || '').toString().replace(/"/g, '""')}"`).join(','))
  }
  const blob = new Blob([rows.join('\n')], { type: 'text/csv' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `leads-${new Date().toISOString().slice(0,10)}.csv`
  a.click()
}

// ── Sub-components ────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, color }) {
  return (
    <div style={{
      background: 'white', border: '1px solid #e5e7eb', borderRadius: 10,
      padding: '1.1rem 1.4rem', borderLeft: `4px solid ${color || '#1e3a5f'}`,
    }}>
      <div style={{ fontSize: '0.72rem', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
      <div style={{ fontSize: '2rem', fontWeight: 700, color: '#111827', lineHeight: 1.1, marginTop: 4 }}>{value}</div>
      {sub && <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: 4 }}>{sub}</div>}
    </div>
  )
}

function StateBar({ code, count, maxCount }) {
  const pct = maxCount > 0 ? (count / maxCount) * 100 : 0
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
      <div style={{ width: 32, fontSize: '0.75rem', fontWeight: 700, color: '#374151', flexShrink: 0 }}>{code}</div>
      <div style={{ flex: 1, background: '#f3f4f6', borderRadius: 4, overflow: 'hidden', height: 20 }}>
        <div style={{
          width: `${pct}%`, height: '100%', background: '#1e3a5f',
          borderRadius: 4, transition: 'width 0.6s ease',
          display: 'flex', alignItems: 'center', paddingLeft: pct > 15 ? 8 : 0,
        }}>
          {pct > 15 && <span style={{ fontSize: '0.7rem', color: 'white', fontWeight: 600 }}>{count}</span>}
        </div>
      </div>
      <div style={{ width: 32, fontSize: '0.78rem', color: '#374151', textAlign: 'right', flexShrink: 0 }}>
        {pct <= 15 ? count : ''}
      </div>
    </div>
  )
}

function MiniBreakdown({ title, data, labels, colors }) {
  const total = Object.values(data).reduce((a, b) => a + b, 0)
  if (total === 0) return null
  return (
    <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 10, padding: '1.1rem 1.4rem' }}>
      <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#374151', marginBottom: 12 }}>{title}</div>
      {Object.entries(data).sort((a,b) => b[1]-a[1]).map(([k, v]) => (
        <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7 }}>
          <div style={{ width: 10, height: 10, borderRadius: 2, background: colors[k] || '#6b7280', flexShrink: 0 }} />
          <div style={{ flex: 1, fontSize: '0.78rem', color: '#374151' }}>{labels[k] || k}</div>
          <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#111827' }}>{v}</div>
          <div style={{ width: 60, background: '#f3f4f6', borderRadius: 3, height: 6 }}>
            <div style={{ width: `${(v/total)*100}%`, height: '100%', background: colors[k] || '#6b7280', borderRadius: 3 }} />
          </div>
        </div>
      ))}
    </div>
  )
}

function LeadRow({ lead, even }) {
  const [open, setOpen] = useState(false)
  const injuryColor = INJURY_COLORS[lead.injury] || '#6b7280'
  const bacColor    = BAC_COLORS[lead.bac]    || '#6b7280'
  return (
    <>
      <tr
        onClick={() => setOpen(o => !o)}
        style={{
          background: even ? '#f9fafb' : 'white', cursor: 'pointer',
          borderBottom: '1px solid #e5e7eb',
        }}
      >
        <td style={td}>{fmtDate(lead.timestamp)}</td>
        <td style={td}>{lead.name}</td>
        <td style={td}>{lead.city}, <strong>{lead.stateCode}</strong></td>
        <td style={td}>
          <span style={{ background: injuryColor + '18', color: injuryColor, padding: '2px 8px', borderRadius: 12, fontSize: '0.72rem', fontWeight: 600 }}>
            {INJURY_LABELS[lead.injury] || lead.injury || '—'}
          </span>
        </td>
        <td style={td}>
          <span style={{ background: bacColor + '18', color: bacColor, padding: '2px 8px', borderRadius: 12, fontSize: '0.72rem', fontWeight: 600 }}>
            {lead.bac || '—'}
          </span>
        </td>
        <td style={{ ...td, fontWeight: 700, color: '#15803d' }}>{lead.estimatedValue || '—'}</td>
        <td style={{ ...td, fontSize: '0.7rem', color: '#9ca3af' }}>{lead.source || '—'}</td>
        <td style={{ ...td, textAlign: 'center' }}>
          <span style={{ fontSize: '0.7rem', color: '#6b7280' }}>{open ? '▲' : '▼'}</span>
        </td>
      </tr>
      {open && (
        <tr style={{ background: '#eff6ff', borderBottom: '1px solid #dbeafe' }}>
          <td colSpan={8} style={{ padding: '0.75rem 1.25rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.5rem 1.5rem', fontSize: '0.78rem', color: '#374151' }}>
              <div><strong>ID:</strong> {lead.id}</div>
              <div><strong>Phone:</strong> {lead.phone || '—'}</div>
              <div><strong>Email:</strong> {lead.email || '—'}</div>
              <div><strong>County:</strong> {lead.county || '—'}</div>
              <div><strong>Courthouse:</strong> {lead.courthouse || '—'}</div>
              <div><strong>Page Level:</strong> {lead.pageLevel || '—'}</div>
              <div><strong>City DUI crashes:</strong> {lead.cityAccidents || '—'}</div>
              <div><strong>Referrer:</strong> {lead.referrer || 'direct'}</div>
              <div><strong>Accident type:</strong> {lead.accidentType || '—'}</div>
              {lead.message && <div style={{ gridColumn: '1 / -1' }}><strong>Message:</strong> {lead.message}</div>}
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

const td = { padding: '0.6rem 0.9rem', fontSize: '0.82rem', color: '#374151', verticalAlign: 'middle' }
const th = { padding: '0.6rem 0.9rem', fontSize: '0.72rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'left', background: '#f9fafb', borderBottom: '2px solid #e5e7eb' }

// ── Main Dashboard ────────────────────────────────────────────────────────────
export default function Dashboard() {
  const [adminKey, setAdminKey]       = useState('')
  const [inputKey, setInputKey]       = useState('')
  const [authError, setAuthError]     = useState('')
  const [loading, setLoading]         = useState(false)
  const [data, setData]               = useState(null)
  const [stateFilter, setStateFilter] = useState('ALL')
  const [page, setPage]               = useState(0)
  const [lastRefresh, setLastRefresh] = useState(null)
  const refreshTimer = useRef(null)

  const PER_PAGE = 50

  const fetchData = useCallback(async (key, state, pg) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        key,
        limit: PER_PAGE,
        offset: pg * PER_PAGE,
        ...(state && state !== 'ALL' ? { state } : {}),
      })
      const res  = await fetch(`/api/leads?${params}`)
      const json = await res.json()
      if (res.status === 401) { setAuthError('Wrong admin key'); setLoading(false); return }
      setData(json)
      setLastRefresh(new Date())
      setAuthError('')
    } catch (e) {
      setAuthError('Network error: ' + e.message)
    }
    setLoading(false)
  }, [])

  // Auto-refresh every 60s
  useEffect(() => {
    if (!adminKey) return
    fetchData(adminKey, stateFilter, page)
    refreshTimer.current = setInterval(() => fetchData(adminKey, stateFilter, page), 60_000)
    return () => clearInterval(refreshTimer.current)
  }, [adminKey, stateFilter, page, fetchData])

  const handleLogin = (e) => {
    e.preventDefault()
    setAdminKey(inputKey)
  }

  const handleStateFilter = (code) => {
    setStateFilter(code)
    setPage(0)
  }

  // ── Login screen ─────────────────────────────────────────────────────────
  if (!adminKey) {
    return (
      <>
        <Head><title>Dashboard · Drunk Driver Settlement</title></Head>
        <div style={{ minHeight: '100vh', background: '#f9fafb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <form onSubmit={handleLogin} style={{
            background: 'white', padding: '2.5rem 2rem', borderRadius: 14,
            boxShadow: '0 4px 24px rgba(0,0,0,0.08)', width: '100%', maxWidth: 360,
          }}>
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '2rem' }}>📊</div>
              <h1 style={{ fontSize: '1.3rem', fontWeight: 700, color: '#111827', margin: '0.5rem 0 0.25rem' }}>Lead Dashboard</h1>
              <p style={{ fontSize: '0.82rem', color: '#6b7280', margin: 0 }}>Drunk Driver Settlement</p>
            </div>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151' }}>Admin Key</label>
            <input
              type="password"
              value={inputKey}
              onChange={e => setInputKey(e.target.value)}
              placeholder="Enter ADMIN_KEY"
              style={{
                width: '100%', marginTop: 6, padding: '0.65rem 0.85rem',
                border: '1px solid #d1d5db', borderRadius: 8, fontSize: '0.9rem',
                outline: 'none', boxSizing: 'border-box',
              }}
              autoFocus
            />
            {authError && <p style={{ color: '#dc2626', fontSize: '0.78rem', marginTop: 6 }}>{authError}</p>}
            <button type="submit" style={{
              marginTop: '1.2rem', width: '100%', background: '#1e3a5f', color: 'white',
              border: 'none', borderRadius: 8, padding: '0.75rem', fontSize: '0.9rem',
              fontWeight: 600, cursor: 'pointer',
            }}>
              Access Dashboard
            </button>
            <p style={{ fontSize: '0.72rem', color: '#9ca3af', textAlign: 'center', marginTop: '1rem' }}>
              Set ADMIN_KEY in Vercel environment variables
            </p>
          </form>
        </div>
      </>
    )
  }

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading && !data) {
    return (
      <div style={{ minHeight: '100vh', background: '#f9fafb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: '#6b7280' }}>
          <div style={{ fontSize: '2rem', marginBottom: 12 }}>⏳</div>
          <p>Loading lead data…</p>
        </div>
      </div>
    )
  }

  const stateBreakdown = data?.stateBreakdown || {}
  const injuryBreakdown = data?.injuryBreakdown || {}
  const bacBreakdown = data?.bacBreakdown || {}
  const leads = data?.leads || []
  const total = data?.stats?.total || 0
  const filteredTotal = data?.pagination?.total || 0
  const maxStateCount = Math.max(...Object.values(stateBreakdown), 1)
  const totalPages = Math.ceil(filteredTotal / PER_PAGE)

  return (
    <>
      <Head><title>Lead Dashboard · Drunk Driver Settlement</title></Head>
      <div style={{ minHeight: '100vh', background: '#f9fafb', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>

        {/* Header */}
        <div style={{ background: '#1e3a5f', color: 'white', padding: '1rem 1.5rem' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div>
              <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>📊 Lead Dashboard</span>
              <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', marginLeft: 12 }}>
                Drunk Driver Settlement
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              {!data?.kvConnected && (
                <span style={{ background: '#fef2f2', color: '#dc2626', fontSize: '0.72rem', fontWeight: 600, padding: '4px 10px', borderRadius: 20 }}>
                  KV not connected
                </span>
              )}
              {lastRefresh && (
                <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.55)' }}>
                  Updated {fmtDate(lastRefresh.toISOString())}
                </span>
              )}
              <button
                onClick={() => fetchData(adminKey, stateFilter, page)}
                disabled={loading}
                style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)', color: 'white', borderRadius: 6, padding: '0.4rem 0.85rem', fontSize: '0.78rem', cursor: 'pointer' }}
              >
                {loading ? '⏳' : '↻'} Refresh
              </button>
              <button
                onClick={() => { setAdminKey(''); setData(null) }}
                style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.25)', color: 'rgba(255,255,255,0.7)', borderRadius: 6, padding: '0.4rem 0.85rem', fontSize: '0.78rem', cursor: 'pointer' }}
              >
                Sign out
              </button>
            </div>
          </div>
        </div>

        {/* KV warning banner */}
        {!data?.kvConnected && (
          <div style={{ background: '#fef9c3', borderBottom: '1px solid #fde047', padding: '0.75rem 1.5rem', textAlign: 'center', fontSize: '0.82rem', color: '#713f12' }}>
            ⚠️ <strong>Vercel KV not connected.</strong> Go to Vercel Dashboard → Storage → Create KV → Connect to project. Leads won't be stored until KV is active.
          </div>
        )}

        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '1.5rem 1rem' }}>

          {/* Stat cards row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.85rem', marginBottom: '1.5rem' }}>
            <StatCard label="Total Leads" value={total} color="#1e3a5f" />
            <StatCard label="States Active" value={Object.keys(stateBreakdown).length} color="#15803d" />
            <StatCard label="Top State" value={
              Object.entries(stateBreakdown).sort((a,b) => b[1]-a[1])[0]?.[0] || '—'
            } sub={`${Object.entries(stateBreakdown).sort((a,b) => b[1]-a[1])[0]?.[1] || 0} leads`} color="#7c3aed" />
            <StatCard label="Top Injury" value={
              Object.entries(injuryBreakdown).sort((a,b) => b[1]-a[1])[0]?.[0] || '—'
            } color="#dc2626" />
            <StatCard label="Viewing" value={stateFilter === 'ALL' ? 'All States' : STATE_NAMES[stateFilter] || stateFilter} color="#0891b2" />
          </div>

          {/* Charts row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 220px 220px', gap: '1rem', marginBottom: '1.5rem' }}>

            {/* State bar chart */}
            <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 10, padding: '1.25rem 1.5rem' }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#374151', marginBottom: 16 }}>Leads by State</div>
              {STATE_ORDER.filter(c => stateBreakdown[c] > 0).length === 0
                ? <p style={{ color: '#9ca3af', fontSize: '0.8rem' }}>No leads yet.</p>
                : STATE_ORDER.map(code => stateBreakdown[code] > 0 && (
                    <StateBar key={code} code={code} count={stateBreakdown[code]} maxCount={maxStateCount} />
                  ))}
              {/* Also show unknown states */}
              {Object.entries(stateBreakdown)
                .filter(([c]) => !STATE_ORDER.includes(c) && stateBreakdown[c] > 0)
                .map(([code, count]) => (
                  <StateBar key={code} code={code} count={count} maxCount={maxStateCount} />
                ))}
            </div>

            <MiniBreakdown title="By Injury" data={injuryBreakdown} labels={INJURY_LABELS} colors={INJURY_COLORS} />
            <MiniBreakdown title="By BAC Level" data={bacBreakdown} labels={BAC_LABELS} colors={BAC_COLORS} />
          </div>

          {/* Filter bar */}
          <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 10, padding: '1rem 1.25rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#6b7280', marginRight: 6 }}>Filter by state:</span>
            {['ALL', ...STATE_ORDER].map(code => (
              <button
                key={code}
                onClick={() => handleStateFilter(code)}
                style={{
                  padding: '0.35rem 0.75rem', borderRadius: 20, fontSize: '0.75rem', fontWeight: 600,
                  border: stateFilter === code ? '2px solid #1e3a5f' : '1px solid #d1d5db',
                  background: stateFilter === code ? '#1e3a5f' : 'white',
                  color: stateFilter === code ? 'white' : '#374151',
                  cursor: 'pointer',
                }}
              >
                {code === 'ALL' ? 'All States' : code}
                {code !== 'ALL' && stateBreakdown[code] ? ` (${stateBreakdown[code]})` : ''}
              </button>
            ))}
            <div style={{ marginLeft: 'auto' }}>
              <button
                onClick={() => exportCSV(leads)}
                disabled={leads.length === 0}
                style={{
                  padding: '0.4rem 0.9rem', background: '#15803d', color: 'white', border: 'none',
                  borderRadius: 8, fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer',
                }}
              >
                ↓ Export CSV
              </button>
            </div>
          </div>

          {/* Leads table */}
          <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 10, overflow: 'hidden' }}>
            <div style={{ padding: '0.85rem 1.25rem', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#374151' }}>
                {stateFilter === 'ALL' ? 'All Leads' : `${STATE_NAMES[stateFilter] || stateFilter} Leads`}
                <span style={{ fontWeight: 400, color: '#9ca3af', marginLeft: 8 }}>({filteredTotal} total)</span>
              </span>
              <span style={{ fontSize: '0.72rem', color: '#9ca3af' }}>Click a row to expand details</span>
            </div>

            {leads.length === 0 ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: '#9ca3af' }}>
                <div style={{ fontSize: '2rem', marginBottom: 12 }}>📭</div>
                <p>{data?.kvConnected ? 'No leads yet for this filter.' : 'Connect Vercel KV to start storing leads.'}</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={th}>Time</th>
                      <th style={th}>Name</th>
                      <th style={th}>Location</th>
                      <th style={th}>Injury</th>
                      <th style={th}>BAC</th>
                      <th style={th}>Est. Value</th>
                      <th style={th}>Source Page</th>
                      <th style={th}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {leads.map((lead, i) => (
                      <LeadRow key={lead.id || i} lead={lead} even={i % 2 === 0} />
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{ padding: '0.85rem 1.25rem', borderTop: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
                <button
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                  style={{ padding: '0.35rem 0.85rem', border: '1px solid #d1d5db', borderRadius: 6, background: page === 0 ? '#f9fafb' : 'white', cursor: page === 0 ? 'default' : 'pointer', fontSize: '0.8rem' }}
                >
                  ← Prev
                </button>
                <span style={{ fontSize: '0.78rem', color: '#6b7280', padding: '0 0.5rem' }}>
                  Page {page + 1} of {totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  style={{ padding: '0.35rem 0.85rem', border: '1px solid #d1d5db', borderRadius: 6, background: page >= totalPages - 1 ? '#f9fafb' : 'white', cursor: page >= totalPages - 1 ? 'default' : 'pointer', fontSize: '0.8rem' }}
                >
                  Next →
                </button>
              </div>
            )}
          </div>

          {/* Footer */}
          <p style={{ textAlign: 'center', fontSize: '0.72rem', color: '#9ca3af', marginTop: '1.5rem' }}>
            Auto-refreshes every 60s · Data stored in Vercel KV (Redis) · <a href="/" style={{ color: '#9ca3af' }}>← Back to site</a>
          </p>
        </div>
      </div>
    </>
  )
}
