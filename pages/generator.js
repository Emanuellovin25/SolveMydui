import { useState } from 'react'
import Head from 'next/head'

function AuthGate({ onAuth }) {
  const [pw, setPw] = useState('')
  const [err, setErr] = useState(false)
  const [shake, setShake] = useState(false)

  async function attempt() {
    const res = await fetch('/api/generate', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: pw, config: null, checkOnly: true })
    })
    if (res.status === 401) { setErr(true); setShake(true); setTimeout(() => setShake(false), 600) }
    else onAuth(pw)
  }

  return (
    <div style={s.authWrap}>
      <div style={{ ...s.authBox, animation: shake ? 'shake 0.6s ease' : 'none' }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>🔒</div>
        <h1 style={s.authTitle}>Generator</h1>
        <p style={{ color: '#555', fontSize: '0.85rem', marginBottom: '1.5rem' }}>Restricted access</p>
        <input type="password" placeholder="Password" value={pw}
          onChange={e => { setPw(e.target.value); setErr(false) }}
          onKeyDown={e => e.key === 'Enter' && attempt()}
          style={{ ...s.input, borderColor: err ? '#ef4444' : '#2a2a2a', marginBottom: 8 }} autoFocus />
        {err && <p style={{ color: '#ef4444', fontSize: '0.8rem', marginBottom: '0.75rem' }}>Incorrect password</p>}
        <button onClick={attempt} style={s.authBtn}>Enter →</button>
      </div>
      <style>{`
        @keyframes shake { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-8px)} 40%{transform:translateX(8px)} 60%{transform:translateX(-6px)} 80%{transform:translateX(6px)} }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #0a0a0a; }
        input:focus { border-color: #f59e0b !important; outline: none; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: #2a2a2a; border-radius: 4px; }
      `}</style>
    </div>
  )
}

const STATES_META = {
  TX: { name: 'Texas', cities: ['Houston','San Antonio','Dallas','Austin','Fort Worth','El Paso','Arlington','Corpus Christi','Plano','Laredo','Lubbock','Garland','Irving','Amarillo','Grand Prairie','McKinney','Frisco','Brownsville','Killeen','McAllen','Mesquite','Midland','Denton','Waco'] },
  CA: { name: 'California', cities: ['Los Angeles','San Diego','San Jose','San Francisco','Fresno','Sacramento','Long Beach','Oakland','Bakersfield','Anaheim','Santa Ana','Riverside','Stockton','Irvine','Chula Vista','Fremont','San Bernardino','Modesto','Fontana','Moreno Valley'] },
  FL: { name: 'Florida', cities: ['Jacksonville','Miami','Tampa','Orlando','St. Petersburg','Hialeah','Tallahassee','Fort Lauderdale','Port St. Lucie','Cape Coral','Pembroke Pines','Hollywood','Gainesville','Miramar','Coral Springs','Clearwater','Palm Bay','West Palm Beach','Lakeland','Pompano Beach'] },
  NY: { name: 'New York', cities: ['New York City','Buffalo','Rochester','Yonkers','Syracuse','Albany','New Rochelle','Mount Vernon','Schenectady','Utica','White Plains','Hempstead','Troy','Niagara Falls','Binghamton'] },
  IL: { name: 'Illinois', cities: ['Chicago','Aurora','Joliet','Rockford','Springfield','Elgin','Peoria','Champaign','Waukegan','Cicero','Bloomington','Naperville','Evanston','Decatur','Schaumburg'] },
  GA: { name: 'Georgia', cities: ['Atlanta','Augusta','Columbus','Macon','Savannah','Athens','Sandy Springs','Roswell','Albany','Warner Robins'] },
  AZ: { name: 'Arizona', cities: ['Phoenix','Tucson','Mesa','Chandler','Scottsdale','Glendale','Gilbert','Tempe','Peoria','Surprise'] },
  OH: { name: 'Ohio', cities: ['Columbus','Cleveland','Cincinnati','Toledo','Akron','Dayton','Parma','Canton','Youngstown','Lorain'] },
}

const TONES = [
  { id: 'empathetic', label: '💙 Empathetic', desc: 'Warm, focused on recovery' },
  { id: 'aggressive', label: '🔥 Aggressive', desc: 'Direct, maximize compensation' },
  { id: 'neutral', label: '⚖️ Neutral', desc: 'Professional, data-driven' },
  { id: 'urgent', label: '⚡ Urgent', desc: 'Deadlines, act now' },
]

const LEVELS = [
  { id: '1', label: 'Level 1', desc: 'City Hub — general city overview page' },
  { id: '2', label: 'Level 2', desc: 'Claim Type — city + accident type' },
  { id: '3', label: 'Level 3', desc: 'Specific Scenario — most granular, best SEO' },
]

const INITIAL_CATEGORIES = {
  accidentType: {
    label: 'Accident / Claim Type', icon: '🚗',
    items: [
      { id: 'drunk-driver', label: 'Drunk Driver Settlement', on: true },
      { id: 'enhanced-bac', label: 'High BAC / Extreme DUI', on: false },
      { id: 'dram-shop', label: 'Dram Shop / Bar Liable', on: false },
      { id: 'wrongful-death', label: 'Wrongful Death — Drunk Driver', on: false },
      { id: 'pedestrian-drunk-driver', label: 'Pedestrian Hit by Drunk Driver', on: false },
      { id: 'hit-and-run-dui', label: 'Hit and Run — DUI Suspect', on: false },
      { id: 'minor-injured', label: 'Minor Injured by Drunk Driver', on: false },
    ]
  },
  impactType: {
    label: 'Impact / Collision Type', icon: '💥',
    items: [
      { id: 'rear-end', label: 'Rear-End Collision', on: false },
      { id: 'head-on', label: 'Head-On Collision', on: false },
      { id: 't-bone', label: 'T-Bone / Side Impact', on: false },
      { id: 'multi-vehicle', label: 'Multi-Vehicle Pileup', on: false },
      { id: 'wrong-way', label: 'Wrong-Way Driver', on: false },
      { id: 'parking-lot', label: 'Parking Lot Accident', on: false },
      { id: 'rollover', label: 'Rollover Accident', on: false },
    ]
  },
  victimType: {
    label: 'Victim Type', icon: '🧑',
    items: [
      { id: 'driver-victim', label: 'Driver (Vehicle Occupant)', on: false },
      { id: 'passenger-victim', label: 'Passenger in Hit Vehicle', on: false },
      { id: 'pedestrian-victim', label: 'Pedestrian Victim', on: false },
      { id: 'cyclist-victim', label: 'Cyclist / Bicyclist', on: false },
      { id: 'motorcyclist-victim', label: 'Motorcyclist', on: false },
      { id: 'elderly-victim', label: 'Elderly Victim (65+)', on: false },
      { id: 'pregnant-victim', label: 'Pregnant Woman', on: false },
      { id: 'child-victim', label: 'Child / Minor Victim', on: false },
    ]
  },
  location: {
    label: 'Location / Context', icon: '📍',
    items: [
      { id: 'highway-dui', label: 'Highway / Interstate DUI', on: false },
      { id: 'school-zone-dui', label: 'School Zone DUI', on: false },
      { id: 'residential-dui', label: 'Residential Area DUI', on: false },
      { id: 'bar-district-dui', label: 'Bar District / Downtown DUI', on: false },
      { id: 'construction-zone-dui', label: 'Construction Zone DUI', on: false },
      { id: 'holiday-dui', label: 'Holiday DUI (New Year, 4th of July)', on: false },
      { id: 'rideshare-dui', label: 'Uber / Lyft Driver Drunk', on: false },
    ]
  },
  aggravating: {
    label: 'Aggravating Circumstances', icon: '⚠️',
    items: [
      { id: 'prior-dui', label: 'Driver Had Prior DUI Conviction', on: false },
      { id: 'extreme-bac', label: 'Extreme BAC (0.20%+)', on: false },
      { id: 'cdl-driver', label: 'Commercial Driver (CDL)', on: false },
      { id: 'off-duty-cop', label: 'Off-Duty Police Officer Drunk', on: false },
      { id: 'no-insurance', label: 'Driver Had No Insurance', on: false },
      { id: 'drugs-alcohol', label: 'Drugs + Alcohol Combined', on: false },
      { id: 'repeat-offender', label: 'Repeat DUI Offender (3+)', on: false },
    ]
  },
  injuryType: {
    label: 'Injury / Damages Type', icon: '🏥',
    items: [
      { id: 'tbi', label: 'Traumatic Brain Injury (TBI)', on: false },
      { id: 'spinal-injury', label: 'Spinal Cord Injury', on: false },
      { id: 'broken-bones', label: 'Broken Bones / Fractures', on: false },
      { id: 'soft-tissue', label: 'Soft Tissue / Whiplash', on: false },
      { id: 'ptsd', label: 'PTSD / Emotional Distress', on: false },
      { id: 'permanent-disability', label: 'Permanent Disability', on: false },
      { id: 'scarring', label: 'Scarring / Disfigurement', on: false },
    ]
  },
  custom: {
    label: 'Custom (fully editable)', icon: '✏️',
    items: [
      { id: 'custom-1', label: 'Motorcycle DUI Accident', on: false },
      { id: 'custom-2', label: 'Commercial Truck DUI', on: false },
      { id: 'custom-3', label: 'DUI Near School / Church', on: false },
      { id: 'custom-4', label: 'DUI — Lost Wages Claim', on: false },
      { id: 'custom-5', label: 'DUI — Pain and Suffering', on: false },
      { id: 'custom-6', label: 'DUI — Medical Bills Recovery', on: false },
    ]
  }
}

function CategorySection({ groupKey, group, onChange }) {
  const selectedCount = group.items.filter(i => i.on).length

  function toggleItem(id) {
    onChange(groupKey, group.items.map(i => i.id === id ? { ...i, on: !i.on } : i))
  }
  function editLabel(id, val) {
    onChange(groupKey, group.items.map(i => i.id === id ? { ...i, label: val } : i))
  }

  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          {group.icon} {group.label}
        </span>
        {selectedCount > 0 && (
          <span style={{ background: '#f59e0b22', color: '#f59e0b', fontSize: '0.63rem', fontWeight: 700, padding: '0.1rem 0.45rem', borderRadius: 4 }}>
            {selectedCount} on
          </span>
        )}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
        {group.items.map(item => (
          <button key={item.id} onClick={() => toggleItem(item.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: item.on ? '#130f00' : '#0c0c0c',
              border: `1px solid ${item.on ? '#f59e0b55' : '#1a1a1a'}`,
              borderRadius: 6, padding: '0.4rem 0.6rem',
              cursor: 'pointer', textAlign: 'left',
            }}>
            <span style={{ color: item.on ? '#f59e0b' : '#2a2a2a', fontSize: '0.75rem', flexShrink: 0 }}>
              {item.on ? '✓' : '○'}
            </span>
            <input
              type="text" value={item.label}
              onChange={e => { e.stopPropagation(); editLabel(item.id, e.target.value) }}
              onClick={e => e.stopPropagation()}
              style={{
                background: 'none', border: 'none',
                color: item.on ? '#e2e8f0' : '#475569',
                fontSize: '0.78rem', fontWeight: 600, flex: 1,
                outline: 'none', cursor: 'text',
                fontFamily: "'Syne', sans-serif",
              }}
              placeholder="Type name..."
            />
          </button>
        ))}
      </div>
    </div>
  )
}

export default function Generator() {
  const [password, setPassword] = useState(null)
  const [step, setStep] = useState(1)
  const [selectedState, setSelectedState] = useState('TX')
  const [selectedCities, setSelectedCities] = useState([])
  const [selectedTone, setSelectedTone] = useState('empathetic')
  const [categories, setCategories] = useState(INITIAL_CATEGORIES)
  const [selectedLevel, setSelectedLevel] = useState('2')
  const [keywords, setKeywords] = useState('')
  const [pageLimit, setPageLimit] = useState(10)
  const [generating, setGenerating] = useState(false)
  const [logs, setLogs] = useState([])
  const [done, setDone] = useState(false)
  const [generatedCount, setGeneratedCount] = useState(0)
  const [error, setError] = useState(null)

  const cities = STATES_META[selectedState]?.cities || []
  const allSelectedItems = Object.values(categories).flatMap(g => g.items.filter(i => i.on))
  const totalSelected = allSelectedItems.length
  const estimatedPages = Math.min(pageLimit, selectedCities.length * Math.max(totalSelected, 1))

  function toggleCity(c) { setSelectedCities(p => p.includes(c) ? p.filter(x => x !== c) : [...p, c]) }
  function updateCategory(key, items) { setCategories(p => ({ ...p, [key]: { ...p[key], items } })) }
  function log(msg, type = 'info') { setLogs(p => [...p, { msg, type, ts: new Date().toLocaleTimeString() }]) }

  async function generate() {
    if (selectedCities.length === 0) { setError('Select at least one city'); return }
    if (totalSelected === 0) { setError('Select at least one accident/scenario type'); return }
    setGenerating(true); setDone(false); setError(null); setLogs([])

    const selectedAccidents = allSelectedItems.map(i => i.id)
    const accidentLabels = Object.fromEntries(allSelectedItems.map(i => [i.id, i.label]))

    log('🚀 Sending request to server...', 'info')
    log(`📍 ${STATES_META[selectedState].name} · ${selectedCities.length} cities · ${selectedAccidents.length} types · max ${pageLimit} pages`, 'info')

    try {
      const res = await fetch('/api/generate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          password,
          config: { selectedState, selectedCities, selectedTone, selectedAccidents, accidentLabels, selectedLevel, keywords, pageLimit, statesMetaName: STATES_META[selectedState].name }
        })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Server error')
      setGeneratedCount(data.generated)
      if (data.generated === 0) {
        log('⚠️ All pages already exist — nothing new to generate', 'warn')
      } else {
        data.pages?.forEach(slug => log(`✅ /${slug}`, 'success'))
        log(`🎉 ${data.generated} pages committed to GitHub!`, 'success')
        log('🚀 Vercel auto-redeploy triggered — live in ~2 minutes', 'info')
        setDone(true)
      }
    } catch (e) { setError(e.message); log(`💥 ${e.message}`, 'error') }
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
        input, button { font-family: 'Syne', sans-serif; }
        input:focus { outline: none; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: #2a2a2a; border-radius: 4px; }
        input[type=range] { accent-color: #f59e0b; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      <div style={s.wrap}>
        <aside style={s.sidebar}>
          <div style={s.logo}>
            <span style={{ fontSize: 20 }}>⚡</span>
            <span style={s.logoText}>Generator</span>
          </div>
          <nav style={s.nav}>
            {[[1,'Cities'],[2,'Content'],[3,'Settings'],[4,'Generate']].map(([n, label]) => (
              <button key={n} onClick={() => setStep(n)} style={{ ...s.navBtn, ...(step===n ? s.navBtnActive : {}) }}>
                <span style={{ ...s.navNum, ...(step===n ? s.navNumActive : {}) }}>{n}</span>
                {label}
              </button>
            ))}
          </nav>
          <div style={s.summary}>
            {[['State', STATES_META[selectedState]?.name],['Cities', selectedCities.length],['Types', totalSelected],['Level', `L${selectedLevel}`],['Max pages', pageLimit]].map(([k,v]) => (
              <div key={k} style={s.sumRow}>
                <span style={s.sumKey}>{k}</span>
                <strong style={s.sumVal}>{v}</strong>
              </div>
            ))}
          </div>
          {totalSelected > 0 && selectedCities.length > 0 && (
            <div style={{ margin: '0.5rem 0.6rem', padding: '0.7rem', background: '#0f1a00', border: '1px solid #f59e0b22', borderRadius: 6 }}>
              <div style={{ color: '#64748b', fontSize: '0.63rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Est. Pages</div>
              <div style={{ color: '#f59e0b', fontSize: '1.2rem', fontWeight: 800 }}>{estimatedPages}</div>
              <div style={{ color: '#334155', fontSize: '0.63rem', marginTop: 2 }}>{selectedCities.length} × {totalSelected} types</div>
            </div>
          )}
        </aside>

        <main style={s.main}>

          {step === 1 && (
            <div>
              <h2 style={s.title}>State & Cities</h2>
              <p style={s.desc}>Choose the state and cities to generate pages for.</p>
              <div style={s.section}>
                <div style={s.label}>State</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {Object.entries(STATES_META).map(([code, meta]) => (
                    <button key={code} onClick={() => { setSelectedState(code); setSelectedCities([]) }}
                      style={{ ...s.stateBtn, ...(selectedState===code ? s.stateBtnOn : {}) }}>
                      <span style={{ color: '#f59e0b', fontWeight: 800 }}>{code}</span>
                      <span style={{ color: '#64748b', fontSize: '0.68rem' }}>{meta.name}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div style={s.section}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                  <div style={s.label}>Cities ({selectedCities.length}/{cities.length})</div>
                  <button onClick={() => setSelectedCities([...cities])} style={s.linkBtn}>all</button>
                  <button onClick={() => setSelectedCities([])} style={s.linkBtn}>none</button>
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
              <div style={s.footer}><span /><button onClick={() => setStep(2)} style={s.btnPrimary}>Content →</button></div>
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 style={s.title}>Content Settings</h2>
              <p style={s.desc}>Select tone and scenario types. <strong style={{ color: '#f59e0b' }}>Every label is editable</strong> — click any text to customize it.</p>

              <div style={s.section}>
                <div style={s.label}>Tone / Wording</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {TONES.map(t => (
                    <button key={t.id} onClick={() => setSelectedTone(t.id)}
                      style={{ ...s.card, ...(selectedTone===t.id ? s.cardOn : {}) }}>
                      <span style={{ color: '#e2e8f0', fontWeight: 700, fontSize: '0.85rem' }}>{t.label}</span>
                      <span style={{ color: '#64748b', fontSize: '0.73rem', marginTop: 3 }}>{t.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {Object.entries(categories).map(([key, group]) => (
                <CategorySection key={key} groupKey={key} group={group} onChange={updateCategory} />
              ))}

              <div style={s.section}>
                <div style={s.label}>Page Level</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {LEVELS.map(l => (
                    <button key={l.id} onClick={() => setSelectedLevel(l.id)}
                      style={{ ...s.card, flexDirection: 'row', alignItems: 'center', gap: 12, ...(selectedLevel===l.id ? s.cardOn : {}) }}>
                      <span style={{ color: '#f59e0b', fontWeight: 800, fontSize: '0.9rem', minWidth: 55 }}>{l.label}</span>
                      <span style={{ color: '#94a3b8', fontSize: '0.78rem' }}>{l.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div style={s.section}>
                <div style={s.label}>Custom Keywords <span style={{ color: '#475569', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(optional, comma-separated)</span></div>
                <input type="text" value={keywords} onChange={e => setKeywords(e.target.value)}
                  placeholder="e.g. drunk driving lawyer, DUI compensation, car accident attorney"
                  style={s.textInput} />
              </div>

              <div style={s.footer}>
                <button onClick={() => setStep(1)} style={s.btnSecondary}>← Back</button>
                <button onClick={() => setStep(3)} style={s.btnPrimary}>Settings →</button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <h2 style={s.title}>Settings</h2>
              <p style={s.desc}>Configure how many pages to generate per run.</p>
              <div style={s.section}>
                <div style={s.label}>Maximum pages per run</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 8 }}>
                  <input type="range" min={1} max={200} value={pageLimit}
                    onChange={e => setPageLimit(parseInt(e.target.value))} style={{ flex: 1 }} />
                  <span style={{ color: '#f59e0b', fontWeight: 800, fontSize: '1.3rem', minWidth: 80 }}>{pageLimit}</span>
                </div>
                <p style={s.hint}>Estimated cost: ~${(pageLimit * 0.02).toFixed(2)} · Time: ~{Math.round(pageLimit * 1.5)}s</p>
              </div>

              <div style={{ ...s.card, ...s.cardOn, flexDirection: 'column', gap: 0, marginBottom: '1.5rem' }}>
                <div style={{ color: '#f59e0b', fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Summary</div>
                {[
                  ['State', STATES_META[selectedState]?.name],
                  ['Cities', selectedCities.length ? selectedCities.slice(0,3).join(', ')+(selectedCities.length>3?` +${selectedCities.length-3} more`:'') : '—'],
                  ['Types selected', `${totalSelected} across ${Object.values(categories).filter(g=>g.items.some(i=>i.on)).length} categories`],
                  ['Tone', TONES.find(t=>t.id===selectedTone)?.label],
                  ['Level', LEVELS.find(l=>l.id===selectedLevel)?.label],
                  ['Keywords', keywords||'—'],
                  ['Max pages', pageLimit],
                  ['Pages to generate', estimatedPages],
                ].map(([k,v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: 6, color: '#94a3b8' }}>
                    <span>{k}</span>
                    <strong style={{ color: '#e2e8f0', maxWidth: 300, textAlign: 'right' }}>{v}</strong>
                  </div>
                ))}
              </div>

              <div style={s.footer}>
                <button onClick={() => setStep(2)} style={s.btnSecondary}>← Back</button>
                <button onClick={() => setStep(4)} style={s.btnPrimary}>Generate →</button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div>
              <h2 style={s.title}>Generate</h2>
              <p style={s.desc}>Press the button and watch real-time progress.</p>
              {error && <div style={s.errorBox}>⚠️ {error}</div>}
              {!generating && !done && (
                <button onClick={generate} style={s.generateBtn}>
                  ⚡ Generate {estimatedPages} pages for {STATES_META[selectedState]?.name}
                </button>
              )}
              {generating && (
                <div style={s.generatingBox}>
                  <div style={s.spinner} />
                  <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Generating... Claude is writing unique content for each page.</p>
                  <p style={{ color: '#475569', fontSize: '0.8rem', marginTop: 4 }}>Expected: {Math.round(pageLimit*1.5)}–{Math.round(pageLimit*2.5)} seconds</p>
                </div>
              )}
              {done && (
                <div style={s.doneBox}>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>🎉</div>
                  <h3 style={{ color: '#22c55e', fontWeight: 800, marginBottom: 8 }}>{generatedCount} pages generated!</h3>
                  <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '1.2rem' }}>Committed to GitHub. Vercel auto-redeploys — live in ~2 minutes.</p>
                  <button onClick={() => { setDone(false); setLogs([]); setGeneratedCount(0) }} style={s.btnSuccess}>Generate more</button>
                </div>
              )}
              {logs.length > 0 && (
                <div style={s.logBox}>
                  <div style={s.logHeader}>
                    <span style={{ color: '#64748b', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Log</span>
                    <button onClick={() => setLogs([])} style={{ ...s.linkBtn, fontSize: '0.7rem' }}>clear</button>
                  </div>
                  <div style={s.logScroll}>
                    {logs.map((l,i) => (
                      <div key={i} style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.76rem', lineHeight: 1.9, color: l.type==='error'?'#ef4444':l.type==='success'?'#22c55e':l.type==='warn'?'#f59e0b':'#64748b' }}>
                        <span style={{ color: '#334155', marginRight: 10, fontSize: '0.68rem' }}>{l.ts}</span>{l.msg}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div style={s.footer}>
                <button onClick={() => setStep(3)} style={s.btnSecondary} disabled={generating}>← Back</button>
              </div>
            </div>
          )}
        </main>
      </div>
    </>
  )
}

const s = {
  authWrap: { minHeight: '100vh', background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Syne', sans-serif" },
  authBox: { background: '#111', border: '1px solid #1e1e1e', borderRadius: 16, padding: '2.5rem', width: 340, textAlign: 'center' },
  authTitle: { color: '#fff', fontSize: '1.8rem', fontWeight: 800, marginBottom: 4 },
  authBtn: { width: '100%', background: '#f59e0b', color: '#000', border: 'none', borderRadius: 8, padding: '0.75rem', fontSize: '1rem', fontWeight: 700, cursor: 'pointer' },
  wrap: { display: 'flex', minHeight: '100vh', background: '#0a0a0a', fontFamily: "'Syne', sans-serif", color: '#e2e8f0' },
  sidebar: { width: 220, background: '#0d0d0d', borderRight: '1px solid #1a1a1a', display: 'flex', flexDirection: 'column', padding: '1.5rem 0', position: 'sticky', top: 0, height: '100vh', flexShrink: 0, overflowY: 'auto' },
  logo: { display: 'flex', alignItems: 'center', gap: 8, padding: '0 1.2rem 1.2rem', borderBottom: '1px solid #1a1a1a', marginBottom: '0.75rem' },
  logoText: { fontSize: '1rem', fontWeight: 800, color: '#f59e0b' },
  nav: { display: 'flex', flexDirection: 'column', gap: 2, padding: '0 0.6rem', flex: 1 },
  navBtn: { display: 'flex', alignItems: 'center', gap: 8, padding: '0.6rem 0.75rem', borderRadius: 8, background: 'none', border: 'none', color: '#475569', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600, textAlign: 'left' },
  navBtnActive: { background: '#161616', color: '#f59e0b' },
  navNum: { width: 20, height: 20, borderRadius: '50%', background: '#1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', color: '#475569', flexShrink: 0 },
  navNumActive: { background: '#f59e0b22', color: '#f59e0b' },
  summary: { margin: '0.75rem 0.6rem 0', padding: '0.9rem', background: '#111', borderRadius: 8, border: '1px solid #1a1a1a' },
  sumRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 },
  sumKey: { fontSize: '0.68rem', color: '#475569' },
  sumVal: { fontSize: '0.68rem', color: '#94a3b8', maxWidth: 90, textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  main: { flex: 1, padding: '2rem 2.5rem', maxWidth: 800, overflowY: 'auto' },
  title: { fontSize: '1.5rem', fontWeight: 800, color: '#fff', marginBottom: 6 },
  desc: { color: '#475569', fontSize: '0.875rem', marginBottom: '1.8rem' },
  section: { marginBottom: '1.5rem' },
  label: { fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10, display: 'block' },
  linkBtn: { background: 'none', border: 'none', color: '#f59e0b', cursor: 'pointer', fontSize: '0.78rem', padding: 0, fontFamily: "'Syne', sans-serif" },
  textInput: { width: '100%', background: '#0c0c0c', border: '1px solid #1a1a1a', borderRadius: 8, padding: '0.7rem 1rem', color: '#e2e8f0', fontSize: '0.875rem', fontFamily: "'Syne', sans-serif" },
  hint: { color: '#334155', fontSize: '0.78rem', marginTop: 6 },
  card: { background: '#0f0f0f', border: '1px solid #1a1a1a', borderRadius: 8, padding: '0.8rem 1rem', cursor: 'pointer', display: 'flex', flexDirection: 'column', textAlign: 'left', fontFamily: "'Syne', sans-serif" },
  cardOn: { background: '#130f00', border: '1px solid #f59e0b44' },
  stateBtn: { background: '#0c0c0c', border: '1px solid #1a1a1a', borderRadius: 8, padding: '0.6rem 0.9rem', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, minWidth: 68, fontFamily: "'Syne', sans-serif" },
  stateBtnOn: { background: '#130f00', border: '1px solid #f59e0b' },
  cityBtn: { background: '#0c0c0c', border: '1px solid #1a1a1a', borderRadius: 6, padding: '0.32rem 0.65rem', cursor: 'pointer', color: '#64748b', fontSize: '0.76rem', fontFamily: "'Syne', sans-serif", fontWeight: 600 },
  cityBtnOn: { background: '#130f00', border: '1px solid #f59e0b44', color: '#f59e0b' },
  btnPrimary: { background: '#f59e0b', color: '#000', border: 'none', borderRadius: 8, padding: '0.7rem 1.4rem', fontWeight: 800, cursor: 'pointer', fontSize: '0.875rem', fontFamily: "'Syne', sans-serif" },
  btnSecondary: { background: 'none', border: '1px solid #1e1e1e', borderRadius: 8, padding: '0.7rem 1.4rem', color: '#475569', cursor: 'pointer', fontSize: '0.875rem', fontFamily: "'Syne', sans-serif" },
  btnSuccess: { background: '#22c55e', color: '#000', border: 'none', borderRadius: 8, padding: '0.65rem 1.2rem', fontWeight: 700, cursor: 'pointer', fontFamily: "'Syne', sans-serif" },
  footer: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid #1a1a1a' },
  generateBtn: { width: '100%', background: '#f59e0b', color: '#000', border: 'none', borderRadius: 10, padding: '1rem', fontSize: '0.95rem', fontWeight: 800, cursor: 'pointer', fontFamily: "'Syne', sans-serif", marginBottom: '1.5rem' },
  generatingBox: { background: '#0c0c0c', border: '1px solid #1a1a1a', borderRadius: 10, padding: '2rem', textAlign: 'center', marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 },
  spinner: { width: 32, height: 32, border: '3px solid #1e1e1e', borderTop: '3px solid #f59e0b', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
  doneBox: { background: '#0a1a0a', border: '1px solid #22c55e44', borderRadius: 10, padding: '2rem', textAlign: 'center', marginBottom: '1.5rem' },
  errorBox: { background: '#1a0808', border: '1px solid #ef444444', borderRadius: 8, padding: '0.85rem 1rem', color: '#ef4444', fontSize: '0.85rem', marginBottom: '1rem' },
  logBox: { background: '#080808', border: '1px solid #1a1a1a', borderRadius: 10, overflow: 'hidden', marginTop: '1rem' },
  logHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 1rem', borderBottom: '1px solid #1a1a1a', background: '#0d0d0d' },
  logScroll: { padding: '0.75rem 1rem', maxHeight: 280, overflowY: 'auto' },
  input: { width: '100%', background: '#0a0a0a', border: '1px solid #2a2a2a', borderRadius: 8, padding: '0.75rem 1rem', color: '#fff', fontSize: '1rem' },
}
