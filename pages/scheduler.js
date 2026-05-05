import { useState, useEffect, useCallback } from 'react'
import Head from 'next/head'

// ─── Auth ─────────────────────────────────────────────────────────────────────
function AuthGate({ onAuth }) {
  const [pw, setPw] = useState('')
  const [err, setErr] = useState(false)

  async function attempt() {
    const res = await fetch('/api/scheduler', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: pw, action: 'getRange', from: '2000-01-01', to: '2000-01-01' })
    })
    if (res.status === 401) setErr(true)
    else onAuth(pw)
  }

  return (
    <div style={s.authWrap}>
      <div style={s.authBox}>
        <div style={{ fontSize: 36, marginBottom: 12 }}>📅</div>
        <h1 style={s.authTitle}>Publishing Scheduler</h1>
        <p style={{ color: '#555', fontSize: '0.85rem', marginBottom: '1.5rem' }}>8,910 pages · 267 days · 20 states</p>
        <input type="password" placeholder="Password" value={pw}
          onChange={e => { setPw(e.target.value); setErr(false) }}
          onKeyDown={e => e.key === 'Enter' && attempt()}
          style={{ ...s.input, borderColor: err ? '#ef4444' : '#2a2a2a', marginBottom: 8 }} autoFocus />
        {err && <p style={{ color: '#ef4444', fontSize: '0.8rem', marginBottom: 8 }}>Incorrect password</p>}
        <button onClick={attempt} style={s.authBtn}>Enter →</button>
      </div>
    </div>
  )
}

// ─── Drag & Drop Page Editor ──────────────────────────────────────────────────
function PageEditor({ page, onSave, onClose }) {
  const [sections, setSections] = useState([
    { id: 'hook', label: 'Hook / Intro', value: page.hook || '' },
    { id: 'section1', label: page.section1Title || 'Section 1', value: page.section1Body || '' },
    { id: 'section2', label: page.section2Title || 'Section 2', value: page.section2Body || '' },
    { id: 'section3', label: page.section3Title || 'Section 3', value: page.section3Body || '' },
  ])
  const [h1, setH1] = useState(page.h1 || '')
  const [metaTitle, setMetaTitle] = useState(page.metaTitle || '')
  const [metaDesc, setMetaDesc] = useState(page.metaDescription || '')
  const [dragIdx, setDragIdx] = useState(null)
  const [dragOver, setDragOver] = useState(null)

  function updateSection(id, field, val) {
    setSections(prev => prev.map(s => s.id === id ? { ...s, [field]: val } : s))
  }

  function onDragStart(idx) { setDragIdx(idx) }
  function onDragEnter(idx) { setDragOver(idx) }
  function onDrop() {
    if (dragIdx === null || dragOver === null || dragIdx === dragOver) return
    const arr = [...sections]
    const [moved] = arr.splice(dragIdx, 1)
    arr.splice(dragOver, 0, moved)
    setSections(arr)
    setDragIdx(null); setDragOver(null)
  }

  function save() {
    onSave({
      ...page,
      h1, metaTitle, metaDescription: metaDesc,
      hook: sections.find(s => s.id === 'hook')?.value || '',
      section1Title: sections[1]?.label || '',
      section1Body: sections[1]?.value || '',
      section2Title: sections[2]?.label || '',
      section2Body: sections[2]?.value || '',
      section3Title: sections[3]?.label || '',
      section3Body: sections[3]?.value || '',
    })
  }

  return (
    <div style={s.editorOverlay}>
      <div style={s.editorModal}>
        <div style={s.editorHeader}>
          <div>
            <div style={{ color: '#f59e0b', fontSize: '0.7rem', fontWeight: 700, marginBottom: 4 }}>EDITING PAGE</div>
            <div style={{ color: '#e2e8f0', fontWeight: 700 }}>/{page.slug}</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={save} style={s.saveBtn}>Save Changes</button>
            <button onClick={onClose} style={s.closeBtn}>✕</button>
          </div>
        </div>

        <div style={s.editorBody}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={s.fieldLabel}>Meta Title <span style={{ color: '#475569' }}>({metaTitle.length}/60)</span></label>
            <input value={metaTitle} onChange={e => setMetaTitle(e.target.value)}
              style={{ ...s.fieldInput, borderColor: metaTitle.length > 60 ? '#ef4444' : '#1e1e1e' }} />
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label style={s.fieldLabel}>Meta Description <span style={{ color: '#475569' }}>({metaDesc.length}/155)</span></label>
            <input value={metaDesc} onChange={e => setMetaDesc(e.target.value)}
              style={{ ...s.fieldInput, borderColor: metaDesc.length > 155 ? '#ef4444' : '#1e1e1e' }} />
          </div>
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={s.fieldLabel}>H1 Headline</label>
            <input value={h1} onChange={e => setH1(e.target.value)} style={s.fieldInput} />
          </div>

          <div style={{ color: '#64748b', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
            Content Sections — drag to reorder
          </div>

          {sections.map((sec, idx) => (
            <div key={sec.id}
              draggable
              onDragStart={() => onDragStart(idx)}
              onDragEnter={() => onDragEnter(idx)}
              onDragOver={e => e.preventDefault()}
              onDrop={onDrop}
              style={{
                ...s.sectionCard,
                borderColor: dragOver === idx ? '#f59e0b' : '#1e1e1e',
                opacity: dragIdx === idx ? 0.5 : 1,
              }}>
              <div style={s.sectionHandle}>⠿ drag</div>
              <input
                value={sec.label}
                onChange={e => updateSection(sec.id, 'label', e.target.value)}
                style={s.sectionTitle}
                placeholder="Section title..."
              />
              <textarea
                value={sec.value}
                onChange={e => updateSection(sec.id, 'value', e.target.value)}
                style={s.sectionTextarea}
                rows={5}
                placeholder="Section content..."
              />
              <div style={{ color: '#334155', fontSize: '0.68rem', marginTop: 4 }}>{sec.value.length} chars · ~{Math.round(sec.value.split(' ').length)} words</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Day Card ─────────────────────────────────────────────────────────────────
function DayCard({ entry, password, onUpdate }) {
  const [expanded, setExpanded] = useState(false)
  const [editingPage, setEditingPage] = useState(null)
  const [publishing, setPublishing] = useState(false)
  const [publishResult, setPublishResult] = useState(null)
  const [localEntry, setLocalEntry] = useState(entry)

  const isPublished = localEntry.status === 'published'
  const isToday = localEntry.date === new Date().toISOString().split('T')[0]

  const levelColor = localEntry.level === 2 ? '#3b82f6' : '#8b5cf6'
  const toneEmoji = { aggressive: '🔥', empathetic: '💙', neutral: '⚖️', urgent: '⚡' }

  async function publish() {
    setPublishing(true)
    setPublishResult(null)
    try {
      const res = await fetch('/api/scheduler', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, action: 'publish', entry: localEntry })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setPublishResult({ ok: true, count: data.generated })
      setLocalEntry(prev => ({ ...prev, status: 'published', publishedCount: data.generated }))
      onUpdate({ ...localEntry, status: 'published' })
    } catch (e) {
      setPublishResult({ ok: false, msg: e.message })
    }
    setPublishing(false)
  }

  async function saveEntry(updatedEntry) {
    setLocalEntry(updatedEntry)
    await fetch('/api/scheduler', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password, action: 'updateEntry', entry: updatedEntry })
    })
  }

  function savePage(updatedPage) {
    const updatedPages = localEntry.pages.map(p =>
      p.slug === updatedPage.slug ? updatedPage : p
    )
    const updated = { ...localEntry, pages: updatedPages }
    setLocalEntry(updated)
    setEditingPage(null)
    saveEntry(updated)
  }

  return (
    <>
      <div style={{
        ...s.dayCard,
        borderColor: isToday ? '#f59e0b' : isPublished ? '#22c55e33' : '#1a1a1a',
        background: isPublished ? '#0a1a0a' : isToday ? '#130f00' : '#0d0d0d',
      }}>
        {/* Header */}
        <div style={s.dayHeader} onClick={() => setExpanded(e => !e)}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {isToday && <span style={s.todayBadge}>TODAY</span>}
            <span style={{ color: '#e2e8f0', fontWeight: 700, fontSize: '0.88rem' }}>{localEntry.date}</span>
            <span style={{ color: '#475569', fontSize: '0.75rem' }}>{new Date(localEntry.date).toLocaleDateString('en-US', { weekday: 'short' })}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ background: levelColor + '22', color: levelColor, fontSize: '0.68rem', fontWeight: 700, padding: '0.15rem 0.5rem', borderRadius: 4 }}>
              L{localEntry.level}
            </span>
            <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>{localEntry.stateName}</span>
            <span style={{ fontSize: '0.85rem' }}>{toneEmoji[localEntry.tone]}</span>
            <span style={{ color: '#475569', fontSize: '0.75rem' }}>{localEntry.pages.length} pages</span>
            {isPublished && <span style={{ color: '#22c55e', fontSize: '0.75rem', fontWeight: 700 }}>✓ Published</span>}
            <span style={{ color: '#475569', fontSize: '0.8rem' }}>{expanded ? '▲' : '▼'}</span>
          </div>
        </div>

        {/* Expanded */}
        {expanded && (
          <div style={s.dayBody}>
            {/* Controls */}
            <div style={{ display: 'flex', gap: 8, marginBottom: '1rem', flexWrap: 'wrap' }}>
              {/* Tone selector */}
              <div style={{ display: 'flex', gap: 4 }}>
                {['aggressive','empathetic','neutral','urgent'].map(t => (
                  <button key={t} onClick={() => saveEntry({ ...localEntry, tone: t })}
                    style={{ ...s.toneBtn, background: localEntry.tone === t ? '#f59e0b' : '#111', color: localEntry.tone === t ? '#000' : '#64748b' }}>
                    {toneEmoji[t]} {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Pages list */}
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ color: '#475569', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                Pages in this batch
              </div>
              <div style={s.pagesList}>
                {localEntry.pages.map((page, idx) => (
                  <div key={page.slug} style={s.pageRow}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ color: '#94a3b8', fontSize: '0.78rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        /{page.slug}
                      </div>
                      <div style={{ color: '#475569', fontSize: '0.68rem', marginTop: 2 }}>
                        {page.city} · {page.label}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                      <button onClick={() => setEditingPage(page)} style={s.editPageBtn}>Edit</button>
                      <button onClick={() => {
                        const updated = { ...localEntry, pages: localEntry.pages.filter(p => p.slug !== page.slug) }
                        setLocalEntry(updated)
                        saveEntry(updated)
                      }} style={s.removeBtn}>✕</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Publish button */}
            {!isPublished && (
              <button onClick={publish} disabled={publishing} style={{
                ...s.publishBtn,
                opacity: publishing ? 0.6 : 1,
                cursor: publishing ? 'not-allowed' : 'pointer',
              }}>
                {publishing ? '⏳ Generating & publishing...' : `⚡ Publish ${localEntry.pages.length} pages → GitHub`}
              </button>
            )}

            {publishResult && (
              <div style={{ marginTop: 8, padding: '0.6rem 0.85rem', borderRadius: 6, fontSize: '0.82rem',
                background: publishResult.ok ? '#0a1a0a' : '#1a0808',
                color: publishResult.ok ? '#22c55e' : '#ef4444',
                border: `1px solid ${publishResult.ok ? '#22c55e44' : '#ef444444'}` }}>
                {publishResult.ok
                  ? `✓ ${publishResult.count} pages published to GitHub. Vercel redeploys automatically.`
                  : `✕ Error: ${publishResult.msg}`}
              </div>
            )}

            {isPublished && (
              <div style={{ color: '#22c55e', fontSize: '0.82rem', fontWeight: 600 }}>
                ✓ Published {localEntry.publishedCount || 0} pages · {localEntry.publishedAt ? new Date(localEntry.publishedAt).toLocaleString() : ''}
              </div>
            )}
          </div>
        )}
      </div>

      {editingPage && (
        <PageEditor
          page={editingPage}
          onSave={savePage}
          onClose={() => setEditingPage(null)}
        />
      )}
    </>
  )
}

// ─── Main Scheduler ───────────────────────────────────────────────────────────
export default function Scheduler() {
  const [password, setPassword] = useState(null)
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(false)
  const [initialized, setInitialized] = useState(false)
  const [initLoading, setInitLoading] = useState(false)
  const [view, setView] = useState('upcoming') // upcoming | all | byState
  const [filterState, setFilterState] = useState('ALL')
  const [filterLevel, setFilterLevel] = useState('ALL')
  const [stats, setStats] = useState(null)

  const STATES = ['ALL','TX','CA','FL','NY','IL','GA','AZ','OH','PA','NC','MI','NJ','VA','WA','CO','TN','IN','MO','MD','MN']

  async function initSchedule() {
    setInitLoading(true)
    const res = await fetch('/api/scheduler', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password, action: 'init' })
    })
    const data = await res.json()
    if (data.success) { setInitialized(true); loadEntries() }
    setInitLoading(false)
  }

  async function loadEntries() {
    setLoading(true)
    const today = new Date().toISOString().split("T")[0]
    const d = new Date(); d.setDate(d.getDate() + 90); const future = d.toISOString().split("T")[0]
    try {
      const res = await fetch('/api/scheduler', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, action: 'getRange', from: today, to: future })
      })
      const data = await res.json()
      if (data.entries) {
        setEntries(data.entries)
        setInitialized(true)
        const totalPages = data.entries.reduce((s, e) => s + e.pages.length, 0)
        const published = data.entries.filter(e => e.status === 'published').length
        setStats({ total: data.entries.length, totalPages, published })
      }
    } catch {}
    setLoading(false)
  }

  useEffect(() => { if (password) loadEntries() }, [password])

  function updateEntry(updated) {
    setEntries(prev => prev.map(e =>
      e.date === updated.date && e.stateCode === updated.stateCode && e.level === updated.level ? updated : e
    ))
  }

  const filtered = entries.filter(e => {
    if (filterState !== 'ALL' && e.stateCode !== filterState) return false
    if (filterLevel !== 'ALL' && e.level !== parseInt(filterLevel)) return false
    return true
  })

  if (!password) return <AuthGate onAuth={p => setPassword(p)} />

  return (
    <>
      <Head>
        <title>Publishing Scheduler — SolveMydui</title>
        <meta name="robots" content="noindex,nofollow" />
        <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet" />
      </Head>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #0a0a0a; font-family: 'Syne', sans-serif; }
        input, button, textarea { font-family: 'Syne', sans-serif; }
        textarea { resize: vertical; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: #2a2a2a; border-radius: 4px; }
      `}</style>

      <div style={{ minHeight: '100vh', background: '#0a0a0a', color: '#e2e8f0' }}>

        {/* Top nav */}
        <div style={s.topNav}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 20 }}>📅</span>
            <span style={{ fontWeight: 800, color: '#f59e0b' }}>Publishing Scheduler</span>
            <a href="/generator" style={{ color: '#475569', fontSize: '0.78rem', marginLeft: 8 }}>← Generator</a>
          </div>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            {stats && (
              <>
                <span style={{ color: '#475569', fontSize: '0.75rem' }}>{stats.total} days scheduled</span>
                <span style={{ color: '#475569', fontSize: '0.75rem' }}>{stats.totalPages} pages</span>
                <span style={{ color: '#22c55e', fontSize: '0.75rem' }}>{stats.published} published</span>
              </>
            )}
            <button onClick={loadEntries} style={s.refreshBtn}>↻ Refresh</button>
          </div>
        </div>

        <div style={{ maxWidth: 900, margin: '0 auto', padding: '1.5rem 1rem' }}>

          {/* Init prompt */}
          {!initialized && !loading && (
            <div style={s.initBox}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🚀</div>
              <h2 style={{ color: '#fff', fontWeight: 800, marginBottom: 8 }}>Initialize Schedule</h2>
              <p style={{ color: '#64748b', fontSize: '0.88rem', marginBottom: '1.5rem', maxWidth: 400 }}>
                Load the pre-calculated schedule of 8,910 pages across 20 states into your database.
                This only needs to be done once.
              </p>
              <button onClick={initSchedule} disabled={initLoading} style={s.initBtn}>
                {initLoading ? '⏳ Loading schedule...' : '⚡ Initialize 267-day schedule'}
              </button>
            </div>
          )}

          {/* Filters */}
          {initialized && (
            <div style={s.filtersBar}>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                <span style={{ color: '#475569', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>State:</span>
                {STATES.map(st => (
                  <button key={st} onClick={() => setFilterState(st)}
                    style={{ ...s.filterBtn, ...(filterState === st ? s.filterBtnOn : {}) }}>
                    {st}
                  </button>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 8 }}>
                <span style={{ color: '#475569', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Level:</span>
                {['ALL','2','3'].map(l => (
                  <button key={l} onClick={() => setFilterLevel(l)}
                    style={{ ...s.filterBtn, ...(filterLevel === l ? s.filterBtnOn : {}) }}>
                    {l === 'ALL' ? 'All' : `Level ${l}`}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#475569' }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>
              Loading schedule...
            </div>
          )}

          {/* Entries */}
          {!loading && initialized && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {filtered.length === 0 && (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#475569' }}>
                  No entries match filters.
                </div>
              )}
              {filtered.map((entry, idx) => (
                <DayCard
                  key={`${entry.date}-${entry.stateCode}-${entry.level}`}
                  entry={entry}
                  password={password}
                  onUpdate={updateEntry}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = {
  authWrap: { minHeight: '100vh', background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  authBox: { background: '#111', border: '1px solid #1e1e1e', borderRadius: 16, padding: '2.5rem', width: 360, textAlign: 'center' },
  authTitle: { color: '#fff', fontSize: '1.5rem', fontWeight: 800, marginBottom: 4 },
  authBtn: { width: '100%', background: '#f59e0b', color: '#000', border: 'none', borderRadius: 8, padding: '0.75rem', fontSize: '1rem', fontWeight: 700, cursor: 'pointer' },
  input: { width: '100%', background: '#0a0a0a', border: '1px solid #2a2a2a', borderRadius: 8, padding: '0.75rem 1rem', color: '#fff', fontSize: '1rem' },
  topNav: { background: '#0d0d0d', borderBottom: '1px solid #1a1a1a', padding: '0.85rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 50 },
  refreshBtn: { background: 'none', border: '1px solid #1e1e1e', borderRadius: 6, padding: '0.35rem 0.75rem', color: '#64748b', cursor: 'pointer', fontSize: '0.78rem' },
  initBox: { background: '#111', border: '1px solid #1e1e1e', borderRadius: 12, padding: '3rem', textAlign: 'center', margin: '2rem auto', maxWidth: 500 },
  initBtn: { background: '#f59e0b', color: '#000', border: 'none', borderRadius: 8, padding: '0.85rem 2rem', fontWeight: 800, cursor: 'pointer', fontSize: '0.95rem' },
  filtersBar: { background: '#0d0d0d', border: '1px solid #1a1a1a', borderRadius: 8, padding: '0.85rem 1rem', marginBottom: '1rem' },
  filterBtn: { background: '#111', border: '1px solid #1a1a1a', borderRadius: 5, padding: '0.25rem 0.6rem', color: '#475569', cursor: 'pointer', fontSize: '0.72rem', fontWeight: 600 },
  filterBtnOn: { background: '#f59e0b', color: '#000', border: '1px solid #f59e0b' },
  dayCard: { background: '#0d0d0d', border: '1px solid #1a1a1a', borderRadius: 8, overflow: 'hidden' },
  dayHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', cursor: 'pointer', userSelect: 'none' },
  dayBody: { padding: '0.75rem 1rem 1rem', borderTop: '1px solid #1a1a1a' },
  todayBadge: { background: '#f59e0b', color: '#000', fontSize: '0.6rem', fontWeight: 800, padding: '0.15rem 0.5rem', borderRadius: 3, letterSpacing: '0.06em' },
  toneBtn: { border: 'none', borderRadius: 5, padding: '0.25rem 0.6rem', cursor: 'pointer', fontSize: '0.7rem', fontWeight: 600 },
  pagesList: { background: '#080808', border: '1px solid #1a1a1a', borderRadius: 6, maxHeight: 220, overflowY: 'auto' },
  pageRow: { display: 'flex', alignItems: 'center', gap: 8, padding: '0.45rem 0.75rem', borderBottom: '1px solid #111' },
  editPageBtn: { background: '#1e1e1e', border: 'none', borderRadius: 4, padding: '0.2rem 0.5rem', color: '#94a3b8', cursor: 'pointer', fontSize: '0.7rem' },
  removeBtn: { background: 'none', border: 'none', color: '#334155', cursor: 'pointer', fontSize: '0.75rem', padding: '0.2rem 0.35rem' },
  publishBtn: { width: '100%', background: '#f59e0b', color: '#000', border: 'none', borderRadius: 8, padding: '0.85rem', fontWeight: 800, fontSize: '0.9rem', cursor: 'pointer', marginTop: 8 },
  // Editor
  editorOverlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 999, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '2rem 1rem', overflowY: 'auto' },
  editorModal: { background: '#0d0d0d', border: '1px solid #1e1e1e', borderRadius: 12, width: '100%', maxWidth: 680, minHeight: 500 },
  editorHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.25rem', borderBottom: '1px solid #1a1a1a' },
  editorBody: { padding: '1.25rem' },
  saveBtn: { background: '#f59e0b', color: '#000', border: 'none', borderRadius: 7, padding: '0.55rem 1.1rem', fontWeight: 700, cursor: 'pointer', fontSize: '0.82rem' },
  closeBtn: { background: '#1a1a1a', color: '#64748b', border: 'none', borderRadius: 7, padding: '0.55rem 0.75rem', cursor: 'pointer', fontSize: '0.88rem' },
  fieldLabel: { display: 'block', color: '#64748b', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 5 },
  fieldInput: { width: '100%', background: '#080808', border: '1px solid #1e1e1e', borderRadius: 6, padding: '0.6rem 0.85rem', color: '#e2e8f0', fontSize: '0.85rem' },
  sectionCard: { background: '#111', border: '1px solid #1e1e1e', borderRadius: 8, padding: '0.85rem', marginBottom: 8, cursor: 'grab' },
  sectionHandle: { color: '#334155', fontSize: '0.68rem', fontWeight: 600, marginBottom: 6, userSelect: 'none' },
  sectionTitle: { width: '100%', background: 'none', border: 'none', borderBottom: '1px solid #1e1e1e', color: '#f59e0b', fontWeight: 700, fontSize: '0.85rem', padding: '0.25rem 0', marginBottom: 8, outline: 'none' },
  sectionTextarea: { width: '100%', background: '#080808', border: '1px solid #1a1a1a', borderRadius: 6, padding: '0.6rem 0.75rem', color: '#e2e8f0', fontSize: '0.82rem', lineHeight: 1.6 },
}
