import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/router'

/**
 * LeadForm — cu IP geolocation auto-fill + state selector
 *
 * Geolocation flow:
 *   1. La mount: call ipapi.co (free, no key, 1000 req/day) → detectează statul
 *   2. Auto-fillează city + stateCode în form
 *   3. Dacă detection eșuează sau userul e din alt stat → dropdown manual
 *   4. Userul poate override oricând
 *
 * State coverage: TX, CA, FL, NY, GA, IL, AZ, OH
 * Dacă IP-ul e din alt stat → arată mesaj + dropdown
 */

const COVERED_STATES = {
  TX: 'Texas',
  CA: 'California',
  FL: 'Florida',
  NY: 'New York',
  GA: 'Georgia',
  IL: 'Illinois',
  AZ: 'Arizona',
  OH: 'Ohio',
}

// Timezone → state mapping (ca fallback dacă ipapi nu merge)
const TIMEZONE_STATE_MAP = {
  'America/Chicago':       ['TX', 'IL'],
  'America/Los_Angeles':   ['CA', 'AZ'],
  'America/New_York':      ['NY', 'FL', 'GA', 'OH'],
  'America/Denver':        ['AZ'],
  'America/Phoenix':       ['AZ'],
  'America/Indiana/Indianapolis': ['OH'],
}

async function detectState() {
  try {
    // Încearcă ipapi.co — 1000 req/day gratis, no key
    const res = await fetch('https://ipapi.co/json/', { signal: AbortSignal.timeout(4000) })
    if (!res.ok) throw new Error('ipapi failed')
    const data = await res.json()
    return {
      stateCode: data.region_code || '',
      stateName: data.region || '',
      city: data.city || '',
      country: data.country_code || '',
      method: 'ip'
    }
  } catch {
    // Fallback: ghicește din timezone
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
      const candidates = TIMEZONE_STATE_MAP[tz]
      if (candidates && candidates.length === 1) {
        return { stateCode: candidates[0], stateName: COVERED_STATES[candidates[0]], city: '', method: 'timezone' }
      }
    } catch {}
    return { stateCode: '', stateName: '', city: '', method: 'failed' }
  }
}

export default function LeadForm({ page, laws, compact = false }) {
  const router  = useRouter()
  const formRef = useRef(null)

  const [form, setForm] = useState({
    name: '', phone: '', email: '',
    city: page?.cityName || '',
    stateCode: page?.stateCode || '',
    stateName: page?.stateName || '',
    accidentType: page?.accidentLabel || 'Drunk Driver',
    injury: '', bac: '', message: '',
  })

  const [geoStatus, setGeoStatus] = useState('detecting') // detecting | covered | outside | failed | override
  const [loading, setLoading]     = useState(false)
  const [showStateSelect, setShowStateSelect] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    // Dacă pagina deja știe statul (slug pages), nu mai detectăm
    if (page?.stateCode && COVERED_STATES[page.stateCode]) {
      setGeoStatus('covered')
      return
    }

    detectState().then(geo => {
      if (geo.country && geo.country !== 'US') {
        setGeoStatus('outside')
        setShowStateSelect(true)
        return
      }

      if (geo.stateCode && COVERED_STATES[geo.stateCode]) {
        // Statul e acoperit
        setForm(f => ({
          ...f,
          stateCode: geo.stateCode,
          stateName: COVERED_STATES[geo.stateCode],
          city: geo.city || f.city,
        }))
        setGeoStatus('covered')
      } else if (geo.stateCode) {
        // Detectat dar nu-l acoperim
        setGeoStatus('outside')
        setShowStateSelect(true)
      } else {
        // Detection eșuat
        setGeoStatus('failed')
        setShowStateSelect(true)
      }
    })
  }, [page])

  const handle = e => setForm({ ...form, [e.target.name]: e.target.value })

  const handleStateChange = e => {
    const code = e.target.value
    setForm(f => ({ ...f, stateCode: code, stateName: COVERED_STATES[code] || '' }))
    setGeoStatus('override')
    setShowStateSelect(false)
  }

  async function submit(e) {
    e.preventDefault()
    setLoading(true)
    try {
      const payload = {
        ...form,
        source: router.asPath,
        pageLevel: page?.level,
        cityAccidents: page?.cityAccidents,
        county: page?.county,
        courthouse: page?.courthouse,
        userAgent: navigator.userAgent.substring(0, 120),
        referrer: document.referrer || 'direct',
        timestamp: new Date().toISOString(),
      }
      const res = await fetch('/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (res.ok) {
        setSubmitted(true)
        setTimeout(() => router.push('/thank-you'), 800)
      } else {
        throw new Error('Submit failed')
      }
    } catch {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="lead-form-section" style={{ textAlign: 'center', padding: '2rem' }}>
        <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>✓</div>
        <p style={{ fontWeight: 700, color: '#27ae60' }}>Request received — redirecting...</p>
      </div>
    )
  }

  const coveredState = form.stateCode && COVERED_STATES[form.stateCode]

  return (
    <div className="lead-form-section" id="lead-form">
      <h2>{compact ? 'Free Case Evaluation' : 'Get a free case evaluation'}</h2>

      {!compact && (
        <p style={{ marginBottom: '1rem' }}>
          A licensed {form.stateName || 'state'} attorney reviews your situation — no commitment, no upfront cost.
          Contingency fee (33%, only if you win). Response within 2 hours.
        </p>
      )}

      {/* Geo status bar */}
      <div className="geo-status-bar">
        {geoStatus === 'detecting' && (
          <span className="geo-detecting">⟳ Detecting your location...</span>
        )}
        {geoStatus === 'covered' && coveredState && (
          <span className="geo-covered">
            ✓ Detected: <strong>{COVERED_STATES[form.stateCode]}</strong>
            <button className="geo-change-btn" onClick={() => setShowStateSelect(s => !s)}>
              {showStateSelect ? 'Cancel' : 'Change state'}
            </button>
          </span>
        )}
        {(geoStatus === 'outside' || geoStatus === 'failed') && (
          <span className="geo-outside">
            {geoStatus === 'outside'
              ? '⚠ Your state may not be covered yet — select below'
              : '⚠ Could not detect state — please select below'}
          </span>
        )}
        {geoStatus === 'override' && coveredState && (
          <span className="geo-covered">
            ✓ Selected: <strong>{COVERED_STATES[form.stateCode]}</strong>
            <button className="geo-change-btn" onClick={() => setShowStateSelect(true)}>Change</button>
          </span>
        )}
      </div>

      {/* State selector dropdown */}
      {showStateSelect && (
        <div className="state-select-wrap">
          <label className="state-select-label">Select your state</label>
          <div className="state-grid">
            {Object.entries(COVERED_STATES).map(([code, name]) => (
              <button
                key={code}
                type="button"
                className={`state-btn${form.stateCode === code ? ' active' : ''}`}
                onClick={() => handleStateChange({ target: { value: code } })}
              >
                {name}
              </button>
            ))}
          </div>
          {form.stateCode && !COVERED_STATES[form.stateCode] && (
            <div style={{ marginTop: '0.75rem' }}>
              <label className="state-select-label">Or type your state</label>
              <input
                type="text"
                name="stateName"
                value={form.stateName}
                onChange={e => setForm(f => ({ ...f, stateName: e.target.value }))}
                placeholder="e.g. Michigan"
                style={{ width: '100%', padding: '0.6rem', border: '1.5px solid #dde3ea', borderRadius: '6px' }}
              />
              <p style={{ fontSize: '0.75rem', color: '#888', marginTop: '0.3rem' }}>
                We're expanding. We'll notify you when your state is covered.
              </p>
            </div>
          )}
        </div>
      )}

      <form ref={formRef} onSubmit={submit}>
        <div className="form-grid">
          <div className="form-field">
            <label>Full name</label>
            <input name="name" type="text" placeholder="Your name" value={form.name} onChange={handle} required />
          </div>
          <div className="form-field">
            <label>Phone number</label>
            <input name="phone" type="tel" placeholder="(555) 000-0000" value={form.phone} onChange={handle} required />
          </div>
          <div className="form-field">
            <label>Email address</label>
            <input name="email" type="email" placeholder="you@email.com" value={form.email} onChange={handle} required />
          </div>
          <div className="form-field">
            <label>City where accident occurred</label>
            <input name="city" type="text" value={form.city} onChange={handle} placeholder="e.g. Houston" />
          </div>
          <div className="form-field">
            <label>Injury level</label>
            <select name="injury" value={form.injury} onChange={handle}>
              <option value="">— Select —</option>
              <option value="minor">Minor (bruises, soft tissue)</option>
              <option value="moderate">Moderate (fractures, ER visit)</option>
              <option value="serious">Serious (surgery, hospitalization)</option>
              <option value="permanent">Permanent / life-altering</option>
            </select>
          </div>
          <div className="form-field">
            <label>Driver's BAC (from police report, if known)</label>
            <select name="bac" value={form.bac} onChange={handle}>
              <option value="">— Unknown —</option>
              <option value="standard">0.08%–0.14%</option>
              <option value="enhanced">0.15%–0.19% (Enhanced/Extreme DUI)</option>
              <option value="extreme">0.20%+ (Super Extreme / Aggravated)</option>
            </select>
          </div>
          <div className="form-field full">
            <label>Brief description <span style={{ fontWeight: 400, opacity: 0.6 }}>(optional)</span></label>
            <input
              name="message" type="text"
              placeholder="e.g. Rear-ended at intersection, 2 days hospitalized, driver arrested"
              value={form.message} onChange={handle}
            />
          </div>
        </div>

        {/* Hidden fields for tracking */}
        <input type="hidden" name="stateCode" value={form.stateCode} />
        <input type="hidden" name="stateName" value={form.stateName} />

        <button type="submit" className="submit-btn" disabled={loading || !form.stateCode}>
          {loading ? 'Sending...' : 'Get my free case evaluation →'}
        </button>

        {!form.stateCode && (
          <p style={{ fontSize: '0.78rem', color: '#c0392b', marginTop: '0.5rem' }}>
            Please select your state above to continue.
          </p>
        )}

        <p className="form-disclaimer">
          By submitting, you agree to be contacted by a licensed attorney in {form.stateName || 'your state'}.
          Your information is never sold or shared with non-attorneys.
        </p>
      </form>
    </div>
  )
}
