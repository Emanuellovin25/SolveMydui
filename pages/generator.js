import { useState } from 'react'
import Head from 'next/head'

// ─── Auth Gate ────────────────────────────────────────────────────────────────
function AuthGate({ onAuth }) {
  const [pw, setPw] = useState('')
  const [err, setErr] = useState(false)
  const [shake, setShake] = useState(false)

  async function attempt() {
    // Verify password server-side via a quick probe
    const res = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: pw, config: null, checkOnly: true })
    })
    if (res.status === 401) {
      setErr(true)
      setShake(true)
      setTimeout(() => setShake(false), 600)
    } else {
      onAuth(pw)
    }
  }

  return (
    <div style={s.authWrap}>
      <div style={{ ...s.authBox, animation: shake ? 'shake 0.6s ease' : 'none' }}>
        <div style={s.lockIcon}>🔒</div>
        <h1 style={s.authTitle}>Generator</h1>
        <p style={s.authSub}>Acces restricționat</p>
        <input
          type="password"
          placeholder="Parolă"
          value={pw}
          onChange={e => { setPw(e.target.value); setErr(false) }}
          onKeyDown={e => e.key === 'Enter' && attempt()}
          style={{ ...s.input, borderColor: err ? '#ef4444' : '#2a2a2a' }}
          autoFocus
        />
        {err && <p style={s.authErr}>Parolă incorectă</p>}
        <button onClick={attempt} style={s.authBtn}>Intră →</button>
      </div>
      <style>{`
        @keyframes shake {
          0%,100%{transform:translateX(0)}
          20%{transform:translateX(-8px)}
          40%{transform:translateX(8px)}
          60%{transform:translateX(-6px)}
          80%{transform:translateX(6px)}
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #0a0a0a; }
        input:focus { border-color: #f59e0b !important; outline: none; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #0a0a0a; }
        ::-webkit-scrollbar-thumb { background: #2a2a2a; border-radius: 4px; }
      `}</style>
    </div>
  )
}

// ─── Data ─────────────────────────────────────────────────────────────────────
const STATES_META = {
  TX: { name: 'Texas', cities: ['Houston','San Antonio','Dallas','Austin','Fort Worth','El Paso','Arlington','Corpus Christi','Plano','Laredo','Lubbock','Garland','Irving','Amarillo','Grand Prairie','McKinney','Frisco','Brownsville','Killeen','McAllen','Mesquite','Midland','Denton','Waco'] },
  CA: { name: 'California', cities: ['Los Angeles','San Diego','San Jose','San Francisco','Fresno','Sacramento','Long Beach','Oakland','Bakersfield','Anaheim','Santa Ana','Riverside','Stockton','Irvine','Chula Vista','Fremont','San Bernardino','Modesto','Fontana','Moreno Valley'] },
  FL: { name: 'Florida', cities: ['Jacksonville','Miami','Tampa','Orlando','St. Petersburg','Hialeah','Tallahassee','Fort Lauderdale','Port St. Lucie','Cape Coral','Pembroke Pines','Hollywood','Gainesville','Miramar','Coral Springs','Clearwater','Palm Bay','West Palm Beach','Lakeland','Pompano Beach'] },
  NY: { name: 'New York', cities: ['New York City','Buffalo','Rochester','Yonkers','Syracuse','Albany','New Rochelle','Mount Vernon','Schenectady','Utica','White Plains','Hempstead','Troy','Niagara Falls','Binghamton'] },
  IL: { name: 'Illinois', cities: ['Chicago','Aurora','Joliet','Rockford','Springfield','Elgin','Peoria','Champaign','Waukegan','Cicero','Bloomington','Naperville','Evanston','Decatur','Schaumburg'] },
}

const TONES = [
  { id: 'empathetic', label: '💙 Empatic', desc: 'Cald, focusat pe recuperare' },
  { id: 'aggressive', label: '🔥 Agresiv', desc: 'Direct, maximizează despăgubirea' },
  { id: 'neutral', label: '⚖️ Neutru', desc: 'Profesional, bazat pe date' },
  { id: 'urgent', label: '⚡ Urgent', desc: 'Deadline-uri, acționează acum' },
]

const ACCIDENT_TYPES = [
  { id: 'drunk-driver', label: 'Drunk Driver Settlement' },
  { id: 'enhanced-bac', label: 'High BAC / Extreme DUI' },
  { id: 'dram-shop', label: 'Dram Shop / Bar Liable' },
]

const LEVELS = [
  { id: '1', label: 'Level 1', desc: 'City Hub — pagini generale pe oraș' },
  { id: '2', label: 'Level 2', desc: 'Claim Type — oraș + tip accident' },
  { id: '3', label: 'Level 3', desc: 'Specific Scenario — cel mai bun SEO' },
]

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function Generator() {
  const [password, setPassword] = useState(null)
  const [step, setStep] = useState(1)

  const [selectedState, setSelectedState] = useState('TX')
  const [selectedCities, setSelectedCities] = useState([])
  const [selectedTone, setSelectedTone] = useState('empathetic')
  const [selectedAccidents, setSelectedAccidents] = useState(['drunk-driver'])
  const [selectedLevel, setSelectedLevel] = useState('2')
  const [keywords, setKeywords] = useState('')
  const [pageLimit, setPageLimit] = useState(10)

  const [generating, setGenerating] = useState(false)
  const [logs, setLogs] = useState([])
  const [done, setDone] = useState(false)
  const [generatedCount, setGeneratedCount] = useState(0)
  const [error, setError] = useState(null)

  const cities = STATES_META[selectedState]?.cities || []

  function toggleCity(c) { setSelectedCities(p => p.includes(c) ? p.filter(x => x !== c) : [...p, c]) }
  function toggleAccident(a) { setSelectedAccidents(p => p.includes(a) ? p.filter(x => x !== a) : [...p, a]) }
  function log(msg, type = 'info') { setLogs(p => [...p, { msg, type, ts: new Date().toLocaleTimeString() }]) }

  async function generate() {
    if (selectedCities.length === 0) { setError('Selectați cel puțin un oraș'); return }
    if (selectedAccidents.length === 0) { setError('Selectați cel puțin un tip de accident'); return }

    setGenerating(true)
    setDone(false)
    setError(null)
    setLogs([])

    log('🚀 Trimit request la server...', 'info')
    log(`📍 ${STATES_META[selectedState].name} · ${selectedCities.length} orașe · max ${pageLimit} pagini`, 'info')

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          password,
          config: {
            selectedState,
            selectedCities,
            selectedTone,
            selectedAccidents,
            selectedLevel,
            keywords,
            pageLimit,
            statesMetaName: STATES_META[selectedState].name,
          }
        })
      })

      const data = await res.json()

      if (!res.ok) throw new Error(data.error || 'Eroare server')

      setGeneratedCount(data.generated)

      if (data.generated === 0) {
        log('⚠️ Toate paginile există deja — nimic de generat', 'warn')
      } else {
        data.pages?.forEach(slug => log(`✅ /${slug}`, 'success'))
        log(`🎉 ${data.generated} pagini commituite pe GitHub!`, 'success')
        log('🚀 Vercel redeploy pornit automat — live în ~2 minute', 'info')
        setDone(true)
      }
    } catch (e) {
      setError(e.message)
      log(`💥 ${e.message}`, 'error')
    }

    setGenerating(false)
  }

  if (!password) return <AuthGate onAuth={setPassword} />

  return (
    <>
      <Head>
        <title>Generator — SolveMydui</title>
        <meta name="robots" content="noindex,nofollow" />
        <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600&family=Syne:wght@400;600;700;800&display=swap" rel="stylesheet" />
      </Head>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #0a0a0a; }
        input, button, select { font-family: 'Syne', sans-serif; }
        input:focus { outline: none; border-color: #f59e0b !important; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: #2a2a2a; border-radius: 4px; }
        input[type=range] { accent-color: #f59e0b; }
      `}</style>

      <div style={s.wrap}>

        {/* Sidebar */}
        <aside style={s.sidebar}>
          <div style={s.logo}>
            <span style={{ fontSize: 20 }}>⚡</span>
            <span style={s.logoText}>Generator</span>
          </div>

          <nav style={s.nav}>
            {[
              [1, 'Stat & Orașe'],
              [2, 'Conținut'],
              [3, 'Setări'],
              [4, 'Generează'],
            ].map(([n, label]) => (
              <button key={n} onClick={() => setStep(n)} style={{ ...s.navBtn, ...(step === n ? s.navBtnActive : {}) }}>
                <span style={{ ...s.navNum, ...(step === n ? s.navNumActive : {}) }}>{n}</span>
                {label}
              </button>
            ))}
          </nav>

          <div style={s.summary}>
            {[
              ['Stat', STATES_META[selectedState]?.name],
              ['Orașe', selectedCities.length],
              ['Ton', TONES.find(t => t.id === selectedTone)?.label],
              ['Accidente', selectedAccidents.length],
              ['Max pagini', pageLimit],
            ].map(([k, v]) => (
              <div key={k} style={s.sumRow}>
                <span style={s.sumKey}>{k}</span>
                <strong style={s.sumVal}>{v}</strong>
              </div>
            ))}
          </div>
        </aside>

        {/* Content */}
        <main style={s.main}>

          {/* STEP 1 */}
          {step === 1 && (
            <div>
              <h2 style={s.title}>Stat & Orașe</h2>
              <p style={s.desc}>Alege statul și orașele pentru care generezi pagini.</p>

              <div style={s.section}>
                <div style={s.label}>Stat</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {Object.entries(STATES_META).map(([code, meta]) => (
                    <button key={code} onClick={() => { setSelectedState(code); setSelectedCities([]) }}
                      style={{ ...s.stateBtn, ...(selectedState === code ? s.stateBtnOn : {}) }}>
                      <span style={{ color: '#f59e0b', fontWeight: 800 }}>{code}</span>
                      <span style={{ color: '#64748b', fontSize: '0.7rem' }}>{meta.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div style={s.section}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                  <div style={s.label}>Orașe ({selectedCities.length}/{cities.length})</div>
                  <button onClick={() => setSelectedCities([...cities])} style={s.linkBtn}>toate</button>
                  <button onClick={() => setSelectedCities([])} style={s.linkBtn}>niciuna</button>
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {cities.map(city => (
                    <button key={city} onClick={() => toggleCity(city)}
                      style={{ ...s.cityBtn, ...(selectedCities.includes(city) ? s.cityBtnOn : {}) }}>
                      {selectedCities.includes(city) ? '✓ ' : ''}{city}
                    </button>
                  ))}
                </div>
              </div>

              <div style={s.footer}>
                <span />
                <button onClick={() => setStep(2)} style={s.btnPrimary}>Conținut →</button>
              </div>
            </div>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <div>
              <h2 style={s.title}>Setări Conținut</h2>
              <p style={s.desc}>Ton, tipuri de accident și keywords.</p>

              <div style={s.section}>
                <div style={s.label}>Ton / Wording</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {TONES.map(t => (
                    <button key={t.id} onClick={() => setSelectedTone(t.id)}
                      style={{ ...s.card, ...(selectedTone === t.id ? s.cardOn : {}) }}>
                      <span style={{ color: '#e2e8f0', fontWeight: 700, fontSize: '0.85rem' }}>{t.label}</span>
                      <span style={{ color: '#64748b', fontSize: '0.75rem', marginTop: 3 }}>{t.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div style={s.section}>
                <div style={s.label}>Tip accident</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {ACCIDENT_TYPES.map(a => (
                    <button key={a.id} onClick={() => toggleAccident(a.id)}
                      style={{ ...s.card, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', ...(selectedAccidents.includes(a.id) ? s.cardOn : {}) }}>
                      <span style={{ color: '#e2e8f0', fontWeight: 600, fontSize: '0.85rem' }}>{a.label}</span>
                      {selectedAccidents.includes(a.id) && <span style={{ color: '#f59e0b', fontSize: '0.8rem' }}>✓ selectat</span>}
                    </button>
                  ))}
                </div>
              </div>

              <div style={s.section}>
                <div style={s.label}>Nivel pagini</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {LEVELS.map(l => (
                    <button key={l.id} onClick={() => setSelectedLevel(l.id)}
                      style={{ ...s.card, flexDirection: 'row', alignItems: 'center', gap: 12, ...(selectedLevel === l.id ? s.cardOn : {}) }}>
                      <span style={{ color: '#f59e0b', fontWeight: 800, fontSize: '0.95rem', minWidth: 60 }}>{l.label}</span>
                      <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>{l.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div style={s.section}>
                <div style={s.label}>Keywords custom <span style={{ color: '#475569', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(opțional, separate prin virgulă)</span></div>
                <input type="text" value={keywords} onChange={e => setKeywords(e.target.value)}
                  placeholder="ex: drunk driving lawyer, DUI compensation, car accident attorney"
                  style={s.textInput} />
              </div>

              <div style={s.footer}>
                <button onClick={() => setStep(1)} style={s.btnSecondary}>← Înapoi</button>
                <button onClick={() => setStep(3)} style={s.btnPrimary}>Setări →</button>
              </div>
            </div>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <div>
              <h2 style={s.title}>Configurare</h2>
              <p style={s.desc}>Numărul de pagini de generat.</p>

              <div style={s.section}>
                <div style={s.label}>Număr maxim pagini</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 8 }}>
                  <input type="range" min={1} max={100} value={pageLimit}
                    onChange={e => setPageLimit(parseInt(e.target.value))}
                    style={{ flex: 1 }} />
                  <span style={{ color: '#f59e0b', fontWeight: 800, fontSize: '1.3rem', minWidth: 80 }}>{pageLimit}</span>
                </div>
                <p style={s.hint}>
                  Cost estimat: ~${(pageLimit * 0.02).toFixed(2)} · Timp: ~{Math.round(pageLimit * 1.5)}s
                </p>
              </div>

              <div style={{ ...s.card, ...s.cardOn, flexDirection: 'column', gap: 0, marginBottom: '1.5rem' }}>
                <div style={{ color: '#f59e0b', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Sumar</div>
                {[
                  ['Stat', STATES_META[selectedState]?.name],
                  ['Orașe selectate', selectedCities.join(', ') || '—'],
                  ['Tipuri accident', selectedAccidents.length],
                  ['Ton', TONES.find(t => t.id === selectedTone)?.label],
                  ['Nivel', LEVELS.find(l => l.id === selectedLevel)?.label],
                  ['Keywords', keywords || '—'],
                  ['Max pagini', pageLimit],
                ].map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: 6, color: '#94a3b8' }}>
                    <span>{k}</span>
                    <strong style={{ color: '#e2e8f0', maxWidth: 300, textAlign: 'right' }}>{v}</strong>
                  </div>
                ))}
              </div>

              <div style={s.footer}>
                <button onClick={() => setStep(2)} style={s.btnSecondary}>← Înapoi</button>
                <button onClick={() => setStep(4)} style={s.btnPrimary}>Generează →</button>
              </div>
            </div>
          )}

          {/* STEP 4 */}
          {step === 4 && (
            <div>
              <h2 style={s.title}>Generare</h2>
              <p style={s.desc}>Apasă butonul și urmărește progresul.</p>

              {error && <div style={s.errorBox}>⚠️ {error}</div>}

              {!generating && !done && (
                <button onClick={generate} style={s.generateBtn}>
                  ⚡ Generează {pageLimit} pagini pentru {STATES_META[selectedState]?.name}
                </button>
              )}

              {generating && (
                <div style={s.generatingBox}>
                  <div style={s.spinner} />
                  <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
                    Generare în curs... Claude scrie conținut unic pentru fiecare pagină.
                  </p>
                  <p style={{ color: '#475569', fontSize: '0.8rem', marginTop: 4 }}>
                    Poate dura {Math.round(pageLimit * 1.5)}–{Math.round(pageLimit * 2.5)} secunde
                  </p>
                </div>
              )}

              {done && (
                <div style={s.doneBox}>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>🎉</div>
                  <h3 style={{ color: '#22c55e', fontWeight: 800, marginBottom: 8 }}>{generatedCount} pagini generate!</h3>
                  <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '1.2rem' }}>
                    Commituite pe GitHub. Vercel redeploy-ează automat — live în ~2 minute.
                  </p>
                  <button onClick={() => { setDone(false); setLogs([]); setGeneratedCount(0) }} style={s.btnSuccess}>
                    Generează mai multe
                  </button>
                </div>
              )}

              {logs.length > 0 && (
                <div style={s.logBox}>
                  <div style={s.logHeader}>
                    <span style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Log</span>
                    <button onClick={() => setLogs([])} style={{ ...s.linkBtn, fontSize: '0.72rem' }}>șterge</button>
                  </div>
                  <div style={s.logScroll}>
                    {logs.map((l, i) => (
                      <div key={i} style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: '0.78rem',
                        lineHeight: 1.9,
                        color: l.type === 'error' ? '#ef4444' : l.type === 'success' ? '#22c55e' : l.type === 'warn' ? '#f59e0b' : '#64748b'
                      }}>
                        <span style={{ color: '#334155', marginRight: 10, fontSize: '0.7rem' }}>{l.ts}</span>
                        {l.msg}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div style={s.footer}>
                <button onClick={() => setStep(3)} style={s.btnSecondary} disabled={generating}>← Înapoi</button>
              </div>
            </div>
          )}
        </main>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = {
  // Auth
  authWrap: { minHeight: '100vh', background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Syne', sans-serif" },
  authBox: { background: '#111', border: '1px solid #1e1e1e', borderRadius: 16, padding: '2.5rem', width: 340, textAlign: 'center' },
  lockIcon: { fontSize: 40, marginBottom: 12 },
  authTitle: { color: '#fff', fontSize: '1.8rem', fontWeight: 800, marginBottom: 4 },
  authSub: { color: '#555', fontSize: '0.85rem', marginBottom: '1.5rem' },
  authErr: { color: '#ef4444', fontSize: '0.8rem', marginBottom: '0.75rem' },
  authBtn: { width: '100%', background: '#f59e0b', color: '#000', border: 'none', borderRadius: 8, padding: '0.75rem', fontSize: '1rem', fontWeight: 700, cursor: 'pointer' },

  // Layout
  wrap: { display: 'flex', minHeight: '100vh', background: '#0a0a0a', fontFamily: "'Syne', sans-serif", color: '#e2e8f0' },
  sidebar: { width: 220, background: '#0d0d0d', borderRight: '1px solid #1a1a1a', display: 'flex', flexDirection: 'column', padding: '1.5rem 0', position: 'sticky', top: 0, height: '100vh', flexShrink: 0 },
  logo: { display: 'flex', alignItems: 'center', gap: 8, padding: '0 1.2rem 1.2rem', borderBottom: '1px solid #1a1a1a', marginBottom: '0.75rem' },
  logoText: { fontSize: '1rem', fontWeight: 800, color: '#f59e0b' },
  nav: { display: 'flex', flexDirection: 'column', gap: 2, padding: '0 0.6rem', flex: 1 },
  navBtn: { display: 'flex', alignItems: 'center', gap: 8, padding: '0.6rem 0.75rem', borderRadius: 8, background: 'none', border: 'none', color: '#475569', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600, textAlign: 'left' },
  navBtnActive: { background: '#161616', color: '#f59e0b' },
  navNum: { width: 20, height: 20, borderRadius: '50%', background: '#1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', color: '#475569', flexShrink: 0 },
  navNumActive: { background: '#f59e0b22', color: '#f59e0b' },
  summary: { margin: '0.75rem 0.6rem 0', padding: '0.9rem', background: '#111', borderRadius: 8, border: '1px solid #1a1a1a' },
  sumRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 },
  sumKey: { fontSize: '0.72rem', color: '#475569' },
  sumVal: { fontSize: '0.72rem', color: '#94a3b8', maxWidth: 90, textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },

  // Main
  main: { flex: 1, padding: '2rem 2.5rem', maxWidth: 720, overflowY: 'auto' },
  title: { fontSize: '1.5rem', fontWeight: 800, color: '#fff', marginBottom: 6 },
  desc: { color: '#475569', fontSize: '0.875rem', marginBottom: '1.8rem' },
  section: { marginBottom: '1.75rem' },
  label: { fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 },
  linkBtn: { background: 'none', border: 'none', color: '#f59e0b', cursor: 'pointer', fontSize: '0.78rem', padding: 0, fontFamily: "'Syne', sans-serif" },
  textInput: { width: '100%', background: '#111', border: '1px solid #1e1e1e', borderRadius: 8, padding: '0.7rem 1rem', color: '#e2e8f0', fontSize: '0.875rem' },
  hint: { color: '#334155', fontSize: '0.78rem', marginTop: 6 },

  // Cards
  card: { background: '#111', border: '1px solid #1e1e1e', borderRadius: 8, padding: '0.8rem 1rem', cursor: 'pointer', display: 'flex', flexDirection: 'column', textAlign: 'left', fontFamily: "'Syne', sans-serif" },
  cardOn: { background: '#130f00', border: '1px solid #f59e0b33' },

  // State/city buttons
  stateBtn: { background: '#111', border: '1px solid #1e1e1e', borderRadius: 8, padding: '0.6rem 0.9rem', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, minWidth: 70, fontFamily: "'Syne', sans-serif" },
  stateBtnOn: { background: '#130f00', border: '1px solid #f59e0b' },
  cityBtn: { background: '#111', border: '1px solid #1e1e1e', borderRadius: 6, padding: '0.35rem 0.7rem', cursor: 'pointer', color: '#64748b', fontSize: '0.78rem', fontFamily: "'Syne', sans-serif", fontWeight: 600 },
  cityBtnOn: { background: '#130f00', border: '1px solid #f59e0b44', color: '#f59e0b' },

  // Buttons
  btnPrimary: { background: '#f59e0b', color: '#000', border: 'none', borderRadius: 8, padding: '0.7rem 1.4rem', fontWeight: 800, cursor: 'pointer', fontSize: '0.875rem', fontFamily: "'Syne', sans-serif" },
  btnSecondary: { background: 'none', border: '1px solid #1e1e1e', borderRadius: 8, padding: '0.7rem 1.4rem', color: '#475569', cursor: 'pointer', fontSize: '0.875rem', fontFamily: "'Syne', sans-serif" },
  btnSuccess: { background: '#22c55e', color: '#000', border: 'none', borderRadius: 8, padding: '0.65rem 1.2rem', fontWeight: 700, cursor: 'pointer', fontFamily: "'Syne', sans-serif" },
  footer: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid #1a1a1a' },

  // Generate step
  generateBtn: { width: '100%', background: '#f59e0b', color: '#000', border: 'none', borderRadius: 10, padding: '1rem', fontSize: '0.95rem', fontWeight: 800, cursor: 'pointer', fontFamily: "'Syne', sans-serif", marginBottom: '1.5rem' },
  generatingBox: { background: '#111', border: '1px solid #1e1e1e', borderRadius: 10, padding: '2rem', textAlign: 'center', marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 },
  spinner: { width: 32, height: 32, border: '3px solid #1e1e1e', borderTop: '3px solid #f59e0b', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
  doneBox: { background: '#0a1a0a', border: '1px solid #22c55e44', borderRadius: 10, padding: '2rem', textAlign: 'center', marginBottom: '1.5rem' },
  errorBox: { background: '#1a0808', border: '1px solid #ef444444', borderRadius: 8, padding: '0.85rem 1rem', color: '#ef4444', fontSize: '0.85rem', marginBottom: '1rem' },
  logBox: { background: '#080808', border: '1px solid #1a1a1a', borderRadius: 10, overflow: 'hidden', marginTop: '1rem' },
  logHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 1rem', borderBottom: '1px solid #1a1a1a', background: '#0d0d0d' },
  logScroll: { padding: '0.75rem 1rem', maxHeight: 280, overflowY: 'auto' },

  input: { width: '100%', background: '#0a0a0a', border: '1px solid #2a2a2a', borderRadius: 8, padding: '0.75rem 1rem', color: '#fff', fontSize: '1rem' },
}
