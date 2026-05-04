import { useState } from 'react'
import { NextSeo } from 'next-seo'
import { useRouter } from 'next/router'
import Link from 'next/link'
import LeadForm from '../components/LeadForm'

const SITE_URL   = process.env.SITE_URL   || 'https://drunkdriversettlement.com'
const SITE_NAME  = process.env.SITE_NAME  || 'Drunk Driver Settlement Calculator'
const AUTHOR     = process.env.AUTHOR_NAME || 'Settlement Research Team'
const SITE_STATE = process.env.SITE_STATE || 'TX'
import statesData from '../data/states.json'
import accidentTypesData from '../data/accident-types.json'
import pagesData from '../data/pages.json'
import {
  SEVERITY_MULTIPLIERS,
  LIABILITY_MULTIPLIERS,
  LOST_WAGES_MULTIPLIERS,
  BAC_MULTIPLIERS,
  DRAM_SHOP_MULTIPLIERS,
  PRIOR_DUI_MULTIPLIERS,
  getPunitiveCapNote,
  hasDramShop,
} from '../lib/calculationRules'

// ─── Helpers ──────────────────────────────────────────────────────────────────
function slugify(s) {
  return s.toLowerCase().replace(/\./g,'').replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'')
}

// ─── State Page Component ────────────────────────────────────────────────────
function StatePage({ stateInfo, stateCode, accidentTypes, stats }) {
  if (!stateInfo) return null

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        name: `Drunk Driver Settlement Calculator — ${stateInfo.name}`,
        description: `Real DUI settlement data for ${stateInfo.name}. ${stateInfo.avgDuiSettlement} average. ${stateInfo.sol} to file. State-specific calculator by city.`,
        url: `${SITE_URL}/${stateInfo.slug}`,
      },
      {
        '@type': 'FAQPage',
        mainEntity: [
          {
            '@type': 'Question',
            name: `How long do I have to file a drunk driver injury claim in ${stateInfo.name}?`,
            acceptedAnswer: { '@type': 'Answer', text: `${stateInfo.name} gives you ${stateInfo.sol} from the accident date (${stateInfo.solCitation}).` },
          },
          {
            '@type': 'Question',
            name: `What is the average drunk driver settlement in ${stateInfo.name}?`,
            acceptedAnswer: { '@type': 'Answer', text: `The average drunk driver settlement in ${stateInfo.name} is ${stateInfo.avgDuiSettlement} based on public court records 2021–2024.` },
          },
          {
            '@type': 'Question',
            name: `Are punitive damages available for DUI cases in ${stateInfo.name}?`,
            acceptedAnswer: { '@type': 'Answer', text: `${stateInfo.punitives.available ? 'Yes. ' + stateInfo.punitives.cap + ' (' + stateInfo.punitives.citation + ').' : 'Limited. ' + stateInfo.punitives.notes}` },
          },
        ],
      },
    ],
  }

  return (
    <>
      <NextSeo
        title={`Drunk Driver Settlement Calculator — ${stateInfo.name} | ${stateInfo.avgDuiSettlement}`}
        description={`Real DUI settlement data for ${stateInfo.name}: ${stateInfo.avgDuiSettlement} average. ${stateInfo.duiStatute}. ${stateInfo.sol} filing deadline. Punitive damages: ${stateInfo.punitives.available ? 'available' : 'limited'}. Free estimate by city.`}
        canonical={`${SITE_URL}/${stateInfo.slug}`}
        openGraph={{ url: `${SITE_URL}/${stateInfo.slug}`, title: `Drunk Driver Settlement — ${stateInfo.name}`, description: `${stateInfo.avgDuiSettlement} avg settlement · ${stateInfo.sol} SOL · ${stateInfo.fault}` }}
      />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <header className="site-header">
        <div className="header-inner">
          <a href="/" className="site-logo">{SITE_NAME}</a>
          <nav className="header-nav">
            <a href="/methodology">How It Works</a>
            <a href="/about">About</a>
          </nav>
          <a href="#lead-form" className="header-cta">Free Case Review</a>
        </div>
      </header>

      <main>
        <div className="container">

          <nav className="breadcrumb">
            <a href="/">Home</a>
            <span>›</span>
            <span>{stateInfo.name}</span>
          </nav>

          <section className="hook-section">
            <p className="eyebrow">{stateInfo.name} · DUI Settlement Research</p>
            <h1>Drunk Driver Settlement Calculator — {stateInfo.name}</h1>
            <p className="hook-lead">
              {stateInfo.duiCrashesStatewide.toLocaleString()} drunk driving crashes in {stateInfo.name} last year resulted in {stateInfo.duiFatalitiesStatewide.toLocaleString()} fatalities.
              Under {stateInfo.duiStatute}, you have {stateInfo.sol} to file a civil claim ({stateInfo.solCitation}).
              Average settlements range from {stateInfo.avgDuiSettlement} — but the specifics of your case determine where you fall.
            </p>
          </section>

          <div className="honest-numbers">
            <h2>{stateInfo.name} drunk driver settlement data</h2>
            <div className="numbers-grid">
              <div className="number-card">
                <div className="nc-label">Average DUI settlement</div>
                <div className="nc-val nc-val-range">{stateInfo.avgDuiSettlement}</div>
                <p className="nc-sub">All injury types · 2021–2024</p>
              </div>
              <div className="number-card">
                <div className="nc-label">DUI crashes statewide</div>
                <div className="nc-val">{stateInfo.duiCrashesStatewide.toLocaleString()}</div>
                <p className="nc-sub">NHTSA — last reported year</p>
              </div>
              <div className="number-card">
                <div className="nc-label">DUI fatalities</div>
                <div className="nc-val">{stateInfo.duiFatalitiesStatewide.toLocaleString()}</div>
                <p className="nc-sub">NHTSA — last reported year</p>
              </div>
              <div className="number-card">
                <div className="nc-label">Filing deadline</div>
                <div className="nc-val">{stateInfo.sol}</div>
                <p className="nc-sub">{stateInfo.solCitation}</p>
              </div>
              <div className="number-card">
                <div className="nc-label">Cases settled out of court</div>
                <div className="nc-val">{stateInfo.pctOutOfCourt}%</div>
                <p className="nc-sub">In {stateInfo.name}, 2023</p>
              </div>
              <div className="number-card">
                <div className="nc-label">Average days to settle</div>
                <div className="nc-val">{stateInfo.avgDaysToSettle}</div>
                <p className="nc-sub">From accident to resolution</p>
              </div>
            </div>
          </div>

          <div className="settlement-table-wrap">
            <h3>Drunk driver settlement ranges by injury severity — {stateInfo.name}</h3>
            <table className="settlement-table">
              <thead>
                <tr><th>Injury Severity</th><th>Settlement Range</th></tr>
              </thead>
              <tbody>
                <tr><td>Minor (bruises, soft tissue, no surgery)</td><td><strong>{stateInfo.settlementByInjury.minor}</strong></td></tr>
                <tr><td>Moderate (fractures, ER visit, weeks of recovery)</td><td><strong>{stateInfo.settlementByInjury.moderate}</strong></td></tr>
                <tr><td>Serious (surgery, hospitalization 3+ days)</td><td><strong>{stateInfo.settlementByInjury.serious}</strong></td></tr>
                <tr><td>Permanent / life-altering (TBI, spinal, amputation)</td><td><strong>{stateInfo.settlementByInjury.permanent}</strong></td></tr>
              </tbody>
            </table>
          </div>

          <div className="legal-framework">
            <h3>{stateInfo.name} DUI Law — Complete Reference</h3>
            <div className="law-grid">
              <div className="law-item">
                <div className="law-label">DUI Statute</div>
                <div className="law-val">{stateInfo.duiStatute}</div>
              </div>
              <div className="law-item">
                <div className="law-label">BAC Limit</div>
                <div className="law-val">{stateInfo.bacLimit}</div>
              </div>
              <div className="law-item">
                <div className="law-label">Enhanced / Aggravated BAC</div>
                <div className="law-val">{stateInfo.enhancedBac}</div>
                <div className="law-note">{stateInfo.enhancedBacNote}</div>
              </div>
              <div className="law-item">
                <div className="law-label">Statute of Limitations</div>
                <div className="law-val">{stateInfo.sol}</div>
                <div className="law-note">{stateInfo.solCitation}</div>
              </div>
              <div className="law-item">
                <div className="law-label">Fault System</div>
                <div className="law-val">{stateInfo.fault}</div>
                <div className="law-note">{stateInfo.faultDetail}</div>
              </div>
              <div className="law-item">
                <div className="law-label">Punitive Damages</div>
                <div className="law-val">{stateInfo.punitives.available ? 'Available' : 'Limited'}</div>
                <div className="law-note">{stateInfo.punitives.cap} · {stateInfo.punitives.citation}</div>
              </div>
              <div className="law-item">
                <div className="law-label">Dram Shop Law</div>
                <div className="law-val">{stateInfo.dramShop.available ? stateInfo.dramShop.statute : 'Very Limited'}</div>
                <div className="law-note">{stateInfo.dramShop.notes.substring(0, 140)}...</div>
              </div>
              <div className="law-item">
                <div className="law-label">Court System</div>
                <div className="law-val">{stateInfo.court}</div>
                <div className="law-note"><a href={stateInfo.barUrl} target="_blank" rel="noopener noreferrer">{stateInfo.barName}</a></div>
              </div>
            </div>
          </div>

          {stateInfo.punitives.available && (
            <div className="variation-note">
              <h3>Punitive damages in {stateInfo.name} DUI cases</h3>
              <p>{stateInfo.punitives.notes}</p>
              <p className="mult-note">Typical punitive multiplier: {stateInfo.punitives.typicalMultiplier}</p>
            </div>
          )}

          {stateInfo.dramShop.available && (
            <div style={{background:'#e8f5e9',border:'1px solid #4caf50',borderRadius:'8px',padding:'1.1rem',margin:'1rem 0'}}>
              <h3 style={{fontSize:'0.95rem',color:'#2e7d32',marginBottom:'0.4rem'}}>Dram shop liability — {stateInfo.dramShop.statute}</h3>
              <p style={{fontSize:'0.88rem',lineHeight:'1.65'}}>{stateInfo.dramShop.notes}</p>
              <p style={{fontSize:'0.82rem',fontWeight:'600',marginTop:'0.5rem',color:'#2e7d32'}}>Typical additional recovery: {stateInfo.dramShop.typicalAdded}</p>
            </div>
          )}

          <div style={{margin:'2rem 0'}}>
            <h2>Browse by city — {stateInfo.name}</h2>
            <p style={{fontSize:'0.88rem',color:'#5a6a7a',marginBottom:'0.75rem'}}>
              {stats.total} pages with city-specific DUI data, courthouse info, and settlement estimates.
            </p>
            <div className="city-grid">
              {stateInfo.cities.map(city => (
                <a key={city.name} href={`/${slugify(city.name)}`} className="city-card">
                  <span className="city-name">{city.name}</span>
                  <span className="city-stat">{city.duiCrashes.toLocaleString()} DUI crashes/yr · {city.county}</span>
                </a>
              ))}
            </div>
          </div>

          <div style={{margin:'2rem 0'}}>
            <h2>Browse by claim type</h2>
            <div className="accident-type-grid">
              {accidentTypes.map(a => (
                <div key={a.slug} className="accident-type-card">
                  <h3>{a.label}</h3>
                  <a href={`/${slugify(stateInfo.cities[0].name)}-${a.slug}`} className="at-link">
                    {stateInfo.cities[0].name} example →
                  </a>
                </div>
              ))}
            </div>
          </div>

          <div className="lead-form-section" id="lead-form">
            <h2>Free case evaluation — {stateInfo.name}</h2>
            <p>A licensed {stateInfo.name} attorney reviews your situation within 2 hours. Contingency fee — no upfront cost.</p>
            <div className="form-grid">
              <div className="form-field"><label>Name</label><input name="name" type="text" required placeholder="Your name" /></div>
              <div className="form-field"><label>Phone</label><input name="phone" type="tel" required placeholder="(555) 000-0000" /></div>
              <div className="form-field"><label>Email</label><input name="email" type="email" required placeholder="you@email.com" /></div>
              <div className="form-field"><label>City</label><input name="city" type="text" placeholder={stateInfo.cities[0].name} /></div>
            </div>
            <button className="submit-btn">Get my free case evaluation →</button>
            <p className="form-disclaimer">Licensed {stateInfo.name} attorneys only. Never sold.</p>
          </div>

          <div className="legal-disclaimer">
            <strong>Disclaimer:</strong> Settlement data from NHTSA and {stateInfo.name} public court records (2021–2024).
            Not legal advice. {stateInfo.duiStatute}. Consult a licensed {stateInfo.name} attorney for case-specific guidance.
          </div>

        </div>
      </main>

      <footer className="site-footer">
        <div className="footer-inner">
          <div className="footer-cols">
            <div><strong>{SITE_NAME}</strong><p style={{fontSize:'0.8rem',marginTop:'0.3rem',color:'#aaa'}}>Independent research. Not a law firm.</p></div>
            <div className="footer-links">
              <a href="/">Home</a><a href="/about">About</a><a href="/methodology">Methodology</a>
              <a href="/disclaimer">Disclaimer</a><a href="/privacy">Privacy</a><a href="/contact">Contact</a>
              <a href={stateInfo.barUrl} target="_blank" rel="noopener noreferrer">{stateInfo.barName}</a>
            </div>
          </div>
          <p style={{marginTop:'1rem',fontSize:'0.75rem',color:'#999'}}>
            © {new Date().getFullYear()} {SITE_NAME}. Data from NHTSA, {stateInfo.name} court records. {stateInfo.duiStatute}.
          </p>
        </div>
      </footer>
    </>
  )
}

// ─── Header ──────────────────────────────────────────────────────────────────
function SiteHeader() {
  return (
    <header className="site-header">
      <div className="header-inner">
        <a href="/" className="site-logo">{SITE_NAME}</a>
        <nav className="header-nav">
          <a href="/methodology">How It Works</a>
          <a href="/about">About</a>
        </nav>
        <a href="#lead-form" className="header-cta">Free Case Review</a>
      </div>
    </header>
  )
}

// ─── Footer ──────────────────────────────────────────────────────────────────
function SiteFooter({ stateName, barUrl, barName }) {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-cols">
          <div>
            <strong>{SITE_NAME}</strong>
            <p style={{fontSize:'0.8rem',marginTop:'0.3rem',color:'#aaa'}}>
              Independent legal settlement research. Not a law firm.
            </p>
          </div>
          <div>
            <div className="footer-links">
              <a href="/about">About</a>
              <a href="/methodology">Methodology</a>
              <a href="/contact">Contact</a>
              <a href="/privacy">Privacy Policy</a>
              <a href="/disclaimer">Legal Disclaimer</a>
              <a href={barUrl} target="_blank" rel="noopener noreferrer">{barName}</a>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} {SITE_NAME}. Settlement data sourced from NHTSA, US Census Bureau, and {stateName} public court records.</p>
          <p style={{marginTop:'0.25rem',fontSize:'0.75rem',color:'#999'}}>
            This site provides general information and does not constitute legal advice. No attorney-client relationship is formed by using this site.
          </p>
        </div>
      </div>
    </footer>
  )
}

// ─── Stats Panel ─────────────────────────────────────────────────────────────
function StatsPanel({ page, laws }) {
  const [avgLow, avgHigh] = laws.avgDuiSettlement.split('–').map(s => s.replace(/[$,]/g,'').trim())
  const feeBase = parseInt(avgLow) || 110000
  const fee = Math.round(feeBase * 0.33)

  return (
    <div className="honest-numbers">
      <h2>The real numbers for {page.cityName}, {page.stateName}</h2>
      <p style={{fontSize:'0.88rem',marginBottom:'1rem',color:'#555'}}>
        From NHTSA crash data, {page.stateName} court records, and American Bar Foundation research.
      </p>
      <div className="numbers-grid">
        <div className="number-card">
          <div className="nc-label">DUI crashes — {page.cityName} area</div>
          <div className="nc-val">{page.cityAccidents.toLocaleString()}</div>
          <p className="nc-sub">Per year — NHTSA state data</p>
        </div>
        <div className="number-card">
          <div className="nc-label">Avg drunk driver settlement — {page.stateName}</div>
          <div className="nc-val nc-val-range">{laws.avgDuiSettlement}</div>
          <p className="nc-sub">Public court records 2021–2024</p>
        </div>
        <div className="number-card">
          <div className="nc-label">Filing deadline</div>
          <div className="nc-val">{laws.sol}</div>
          <p className="nc-sub">{laws.solCitation}</p>
        </div>
        <div className="number-card">
          <div className="nc-label">Fault rule</div>
          <div className="nc-val" style={{fontSize:'0.85rem',lineHeight:'1.3'}}>{laws.fault.split('—')[0]}</div>
          <p className="nc-sub">{page.stateName} law</p>
        </div>
        <div className="number-card">
          <div className="nc-label">Typical attorney fee</div>
          <div className="nc-val">33%</div>
          <p className="nc-sub">~${fee.toLocaleString()} on an avg. case</p>
        </div>
        <div className="number-card">
          <div className="nc-label">Cases settled out of court</div>
          <div className="nc-val">{laws.pctOutOfCourt}%</div>
          <p className="nc-sub">In {page.stateName}, 2023</p>
        </div>
      </div>
      <p className="source-note">
        Sources:{' '}
        <a href="https://crashstats.nhtsa.dot.gov" target="_blank" rel="noopener noreferrer">NHTSA Crash Data</a>,{' '}
        <a href={laws.barUrl} target="_blank" rel="noopener noreferrer">{laws.barName}</a>,{' '}
        <a href="https://www.census.gov" target="_blank" rel="noopener noreferrer">US Census Bureau</a>.
        Settlement figures are medians from public records. Individual outcomes vary.
      </p>
    </div>
  )
}

// ─── Legal Framework Box ──────────────────────────────────────────────────────
function LegalFramework({ laws, page }) {
  return (
    <div className="legal-framework">
      <h3>Applicable law — {page.stateName}</h3>
      <div className="law-grid">
        <div className="law-item">
          <div className="law-label">DUI Statute</div>
          <div className="law-val">{laws.duiStatute}</div>
        </div>
        <div className="law-item">
          <div className="law-label">BAC Limit</div>
          <div className="law-val">{laws.bacLimit}</div>
        </div>
        <div className="law-item">
          <div className="law-label">Enhanced BAC</div>
          <div className="law-val">{laws.enhancedBac}</div>
          <div className="law-note">{laws.enhancedBacNote}</div>
        </div>
        <div className="law-item">
          <div className="law-label">Statute of Limitations</div>
          <div className="law-val">{laws.sol}</div>
          <div className="law-note">{laws.solCitation}</div>
        </div>
        <div className="law-item">
          <div className="law-label">Fault System</div>
          <div className="law-val">{laws.fault.split('—')[0]}</div>
          <div className="law-note">{laws.faultDetail}</div>
        </div>
        <div className="law-item">
          <div className="law-label">Punitive Damages</div>
          <div className="law-val">{laws.punitives.available ? 'Available' : 'Limited'}</div>
          <div className="law-note">{laws.punitives.cap} — {laws.punitives.citation}</div>
        </div>
        <div className="law-item">
          <div className="law-label">Dram Shop Law</div>
          <div className="law-val">{laws.dramShop.available ? laws.dramShop.statute : 'Very Limited'}</div>
          <div className="law-note">{laws.dramShop.notes.substring(0, 120)}...</div>
        </div>
      </div>
    </div>
  )
}

// ─── Calculator ───────────────────────────────────────────────────────────────
function Calculator({ laws, page }) {
  const [severity, setSeverity] = useState('')
  const [liability, setLiability] = useState('')
  const [wages, setWages] = useState('')
  const [bac, setBac] = useState('unknown')
  const [dram, setDram] = useState('no')
  const [prior, setPrior] = useState('unknown')
  const [result, setResult] = useState(null)

  // State average as base midpoint
  const avgStr = laws.avgDuiSettlement.replace(/[$,]/g, '').split('–')
  const base = Math.round((parseInt(avgStr[0]) + parseInt(avgStr[1])) / 2) || 245000

  function calc() {
    if (!severity || !liability || !wages) return

    const sevMult = SEVERITY_MULTIPLIERS[severity]?.baseMultiplier ?? 1.0
    const libMult = LIABILITY_MULTIPLIERS[liability]?.mult ?? 1.0
    const wageMult = LOST_WAGES_MULTIPLIERS[wages]?.mult ?? 1.0
    const bacMult = BAC_MULTIPLIERS[bac]?.mult ?? 1.0
    const dramMult = { no: 1.0, possible: 1.12, yes: 1.32 }[dram] ?? 1.0
    const priorMult = { unknown: 1.0, no: 1.0, yes: 1.45 }[prior] ?? 1.0

    const mid = Math.round(base * sevMult * libMult * wageMult * bacMult * dramMult * priorMult)
    const low = Math.round(mid * 0.55)
    const high = Math.round(mid * 2.2)

    const punitiveFlag = BAC_MULTIPLIERS[bac]?.punitiveFlag || prior === 'yes'
    const dramShopActive = dram === 'yes' && hasDramShop(page.stateCode)

    setResult({ low, mid, high, punitiveFlag, dramShopActive })
  }

  return (
    <div className="calculator" id="calculator">
      <h2>Estimate your drunk driver settlement</h2>
      <p style={{fontSize:'0.88rem',marginBottom:'1.2rem',color:'#555'}}>
        Based on {page.stateName} public court records — {laws.avgDuiSettlement} average range.
        Calculations use {laws.duiStatute} and {laws.fault} as applied by {page.courthouse || page.cityName + ' ' + laws.court}.
      </p>

      <div className="calc-fields">
        <div className="calc-field">
          <label>How severe were your injuries?</label>
          <select value={severity} onChange={e=>{setSeverity(e.target.value);setResult(null)}}>
            <option value="">— Select injury severity —</option>
            {Object.entries(SEVERITY_MULTIPLIERS).map(([k,v])=>(
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
          {severity && <p className="field-hint">{SEVERITY_MULTIPLIERS[severity].description} · Typical medical bills: {SEVERITY_MULTIPLIERS[severity].medBillsTypical}</p>}
        </div>

        <div className="calc-field">
          <label>Who was at fault?</label>
          <select value={liability} onChange={e=>{setLiability(e.target.value);setResult(null)}}>
            <option value="">— Select fault scenario —</option>
            {Object.entries(LIABILITY_MULTIPLIERS).map(([k,v])=>(
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
          {liability && <p className="field-hint">{LIABILITY_MULTIPLIERS[liability].note}</p>}
        </div>

        <div className="calc-field">
          <label>Did you miss work due to your injuries?</label>
          <select value={wages} onChange={e=>{setWages(e.target.value);setResult(null)}}>
            <option value="">— Select work impact —</option>
            {Object.entries(LOST_WAGES_MULTIPLIERS).map(([k,v])=>(
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
        </div>

        <div className="calc-field calc-field-secondary">
          <label>Driver's BAC level (if known) <span className="label-optional">— affects punitive damages</span></label>
          <select value={bac} onChange={e=>{setBac(e.target.value);setResult(null)}}>
            {Object.entries(BAC_MULTIPLIERS).map(([k,v])=>(
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
          {BAC_MULTIPLIERS[bac]?.punitiveFlag && (
            <p className="field-hint punitive-hint">⚠ {laws.punitives.notes.substring(0, 150)}... Cap: {laws.punitives.cap}</p>
          )}
        </div>

        <div className="calc-field calc-field-secondary">
          <label>Was alcohol served at a bar/restaurant before the crash? <span className="label-optional">— dram shop claim</span></label>
          <select value={dram} onChange={e=>{setDram(e.target.value);setResult(null)}}>
            <option value="no">No — private setting or unknown</option>
            <option value="possible">Possibly — driver was near bars</option>
            <option value="yes">Yes — confirmed bar/restaurant visit</option>
          </select>
          {dram !== 'no' && (
            <p className="field-hint">{laws.dramShop.available ? laws.dramShop.statute + ': ' + laws.dramShop.notes.substring(0,120) + '...' : 'Note: ' + laws.dramShop.notes.substring(0,120) + '...'}</p>
          )}
        </div>

        <div className="calc-field calc-field-secondary">
          <label>Does the driver have prior DUI convictions? <span className="label-optional">— check police report</span></label>
          <select value={prior} onChange={e=>{setPrior(e.target.value);setResult(null)}}>
            {Object.entries(PRIOR_DUI_MULTIPLIERS).map(([k,v])=>(
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
          {prior === 'yes' && <p className="field-hint punitive-hint">Prior DUI record dramatically increases punitive damages in virtually every state — including {page.stateName}.</p>}
        </div>
      </div>

      <button className="calc-btn" onClick={calc} disabled={!severity || !liability || !wages}>
        Calculate my estimated settlement
      </button>

      {result && (
        <div className="calc-result visible">
          <div className="result-state-label">Estimate for {page.cityName}, {page.stateName} · {laws.duiStatute}</div>
          <div className="range">${result.low.toLocaleString()} – ${result.high.toLocaleString()}</div>
          <div className="result-mid">Most likely: around ${result.mid.toLocaleString()}</div>

          {result.punitiveFlag && (
            <div className="punitive-alert">
              <strong>Punitive damages may apply</strong>
              <p>{getPunitiveCapNote(page.stateCode)}</p>
            </div>
          )}

          {result.dramShopActive && (
            <div className="dram-alert">
              <strong>Dram shop claim possible</strong>
              <p>{laws.dramShop.statute}: {laws.dramShop.typicalAdded} in additional recovery potential.</p>
            </div>
          )}

          <p className="calc-disclaimer">
            Based on {page.stateName} public court records (2021–2024). Applies {laws.fault} rule.
            Filing deadline: {laws.sol} from accident date ({laws.solCitation}).
            Excludes attorney fees (~33%) and medical liens. Not legal advice.
          </p>
        </div>
      )}
    </div>
  )
}

// ─── Timeline ────────────────────────────────────────────────────────────────
const PHASES = [
  { key: 'hour1',  label: 'Hour 1',   urgency: 'CRITICAL', title: 'The first hour' },
  { key: 'day1',   label: 'Day 1',    urgency: 'URGENT',   title: 'First 24 hours' },
  { key: 'week1',  label: 'Week 1',   urgency: 'IMPORTANT',title: 'Days 2–7' },
  { key: 'month1', label: 'Month 1',  urgency: null,       title: 'Weeks 2–4' },
  { key: 'month3', label: 'Month 3+', urgency: null,       title: 'The negotiation phase' },
]

function Timeline({ page }) {
  const [active, setActive] = useState(0)
  const accidentData = accidentTypesData[page.accidentType]
  if (!accidentData) return null
  const phase = PHASES[active]
  const content = accidentData.timelineSpecific?.[phase.key]
  if (!content) return null

  return (
    <div className="timeline-section">
      <h2>What happens next — a realistic timeline</h2>
      <p style={{fontSize:'0.9rem',color:'#555',marginBottom:'1rem'}}>
        Most {page.cityName} DUI accident victims don't know what to expect in the days after. Here's exactly what happens, step by step.
      </p>
      <div className="timeline-tabs">
        {PHASES.map((p,i) => (
          <button key={p.key} className={`timeline-tab${active===i?' active':''}`} onClick={()=>setActive(i)}>
            {p.label}
          </button>
        ))}
      </div>
      <div className="timeline-content">
        <h3>{phase.title}</h3>
        {phase.urgency && <div className={`urgency-badge urgency-${phase.urgency.toLowerCase()}`}>{phase.urgency}</div>}
        <p>{content}</p>
      </div>
    </div>
  )
}

// ─── Settlement Breakdown Table ───────────────────────────────────────────────
function SettlementTable({ laws, page }) {
  const rows = [
    { severity: 'Minor injuries', range: laws.settlementByInjury.minor, note: 'Soft tissue, bruising, no surgery' },
    { severity: 'Moderate injuries', range: laws.settlementByInjury.moderate, note: 'Fractures, ER visit, weeks of recovery' },
    { severity: 'Serious injuries', range: laws.settlementByInjury.serious, note: 'Surgery, hospitalization 3+ days' },
    { severity: 'Permanent / life-altering', range: laws.settlementByInjury.permanent, note: 'TBI, spinal injury, long-term disability' },
  ]

  return (
    <div className="settlement-table-wrap">
      <h3>Drunk driver settlement ranges — {page.stateName} by injury severity</h3>
      <p style={{fontSize:'0.83rem',color:'#666',marginBottom:'0.75rem'}}>
        Source: {page.stateName} public court records, 2021–2024. These are statistical ranges — individual outcomes vary significantly based on liability, insurance limits, and case specifics.
      </p>
      <table className="settlement-table">
        <thead>
          <tr>
            <th>Injury Type</th>
            <th>Typical Settlement Range</th>
            <th>Includes</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.severity}>
              <td>{r.severity}</td>
              <td><strong>{r.range}</strong></td>
              <td style={{fontSize:'0.8rem',color:'#666'}}>{r.note}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {laws.punitives.available && (
        <p className="table-note">
          ⚠ Punitive damages ({laws.punitives.citation}) are calculated separately and can add significantly above these ranges — especially for BAC ≥ {laws.enhancedBac} or prior DUI history.
          {laws.dramShop.available && ` Dram shop claims (${laws.dramShop.statute}) add additional recovery if alcohol was served at a bar before the crash.`}
        </p>
      )}
    </div>
  )
}

// ─── FAQ ─────────────────────────────────────────────────────────────────────
function buildFAQ(page, laws) {
  const items = [
    {
      q: `How long do I have to file a drunk driver injury claim in ${page.stateName}?`,
      a: `${page.stateName} gives you ${laws.sol} from the date of the accident (${laws.solCitation}). Missing this deadline almost always means permanently losing your right to compensation — regardless of how clear the driver's fault was. The clock runs even while you're recovering, and evidence deteriorates fast. Most attorneys recommend contacting them within the first 30 days.`
    },
    {
      q: `What does ${laws.fault} mean for my case?`,
      a: `${laws.faultDetail} In practice, this means insurance adjusters will try to establish that you shared some fault for the accident — even if the driver was drunk. A DUI arrest and conviction under ${laws.duiStatute} makes this argument much harder for them, but it's still raised in negotiation. The fault determination directly affects your settlement amount.`
    },
    {
      q: `Can I get punitive damages against a drunk driver in ${page.stateName}?`,
      a: `${laws.punitives.available ? `Yes. Under ${laws.punitives.citation}, punitive damages are available in ${page.stateName} when the defendant acted with conscious disregard for others' safety. Courts consistently find that driving with a BAC at or above the legal limit meets this standard. The cap in ${page.stateName}: ${laws.punitives.cap}. ${laws.punitives.notes}` : `Punitive damages are limited in ${page.stateName}. ${laws.punitives.notes}`}`
    },
    {
      q: `If the drunk driver was at a bar before the accident, can I sue the bar?`,
      a: `${laws.dramShop.available ? `Yes — under ${page.stateName}'s dram shop law (${laws.dramShop.statute}). ${laws.dramShop.notes} If successful, this adds a second defendant with their own insurance policy. Typical additional recovery: ${laws.dramShop.typicalAdded}. Bar receipts, surveillance footage, and bartender testimony are the core evidence — which is why acting fast matters.` : `${page.stateName} has very limited dram shop liability: ${laws.dramShop.notes} Consult an attorney about whether an exception might apply to your case.`}`
    },
    {
      q: `What if the drunk driver had a high BAC — ${laws.enhancedBac} or above?`,
      a: `A BAC at or above ${laws.enhancedBac} is classified as enhanced or aggravated DUI in ${page.stateName} (${laws.duiStatute}). ${laws.enhancedBacNote} In civil cases, this level of intoxication significantly strengthens your punitive damages argument. Courts and juries react strongly to elevated BAC figures — most high-BAC DUI cases settle before trial because the defense has little ground to stand on.`
    },
    {
      q: `Should I accept the first settlement offer from the drunk driver's insurance?`,
      a: `Almost never — especially in DUI cases. Insurance companies know that drunk driving cases carry punitive damages exposure, and their first offers are typically 20–40% of the case's actual value. Once you accept and sign a release, all future claims are permanently waived — even if your injuries worsen. In ${page.stateName}, ${laws.pctOutOfCourt}% of cases settle out of court, but at amounts far above the initial offer. An attorney will typically achieve 2–3x the first offer.`
    },
    {
      q: `How long does a drunk driver settlement case take in ${page.stateName}?`,
      a: `The average drunk driver settlement in ${page.stateName} takes ${laws.avgDaysToSettle} days from the date of the accident to resolution. Cases are handled by ${page.courthouse || page.stateName + ' ' + laws.court}. Factors that extend timelines: ongoing medical treatment (you can't fully value injuries until treatment is complete), disputes over liability percentage, and dram shop claims (which add a second defendant). Faster cases resolve in 3–4 months; complex cases with severe injuries can take 2+ years.`
    },
  ]
  return items
}

function FAQ({ items }) {
  const [open, setOpen] = useState(null)
  return (
    <div className="faq-section">
      <h2>Frequently asked questions</h2>
      {items.map((item, i) => (
        <div key={i} className={`faq-item${open===i?' open':''}`}>
          <button className="faq-question" onClick={()=>setOpen(open===i?null:i)}>
            {item.q}
            <span className="faq-chevron">{open===i?'▲':'▼'}</span>
          </button>
          <div className={`faq-answer${open===i?' open':''}`}>
            <p>{item.a}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Lead Form ────────────────────────────────────────────────────────────────
// ─── CrossLinks ───────────────────────────────────────────────────────────────
function CrossLinks({ page }) {
  const slugify = s => s.toLowerCase().replace(/\./g,'').replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'')
  const citySlug = slugify(page.cityName)
  const links = []

  if (page.level === 3) {
    links.push({ href: `/${citySlug}-${page.accidentSlug}`, label: `${page.accidentLabel} in ${page.cityName}`, type: 'Parent page' })
    links.push({ href: `/${citySlug}`, label: `All drunk driver info — ${page.cityName}`, type: 'City hub' })
    const accident = accidentTypesData[page.accidentType]
    if (accident?.level3) {
      accident.level3.filter(v => v.slug !== page.variation).slice(0, 4).forEach(v => {
        links.push({ href: `/${citySlug}-${page.accidentSlug}-${v.slug}`, label: v.label, type: 'Related scenario' })
      })
    }
  } else if (page.level === 2) {
    links.push({ href: `/${citySlug}`, label: `All drunk driver info — ${page.cityName}`, type: 'City hub' })
    const accident = accidentTypesData[page.accidentType]
    if (accident?.level3) {
      accident.level3.slice(0, 5).forEach(v => {
        links.push({ href: `/${citySlug}-${page.accidentSlug}-${v.slug}`, label: v.label, type: 'Specific scenario' })
      })
    }
    Object.values(accidentTypesData).filter(a => a.slug !== page.accidentSlug).slice(0, 3).forEach(a => {
      links.push({ href: `/${citySlug}-${a.slug}`, label: `${a.label} — ${page.cityName}`, type: 'Related claim type' })
    })
  } else {
    Object.values(accidentTypesData).forEach(a => {
      links.push({ href: `/${citySlug}-${a.slug}`, label: `${a.label} in ${page.cityName}`, type: 'Claim type' })
    })
  }

  if (!links.length) return null

  return (
    <div className="crosslinks-section">
      <h3>Related resources</h3>
      <div className="crosslinks-grid">
        {links.slice(0, 9).map(l => (
          <Link key={l.href} href={l.href} className="crosslink-item">
            <span className="cl-type">{l.type}</span>
            {l.label} →
          </Link>
        ))}
      </div>
    </div>
  )
}

// ─── Variation Legal Note (Level 3 only) ─────────────────────────────────────
function VariationNote({ page }) {
  if (page.level !== 3 || !page.variationLegalNote) return null
  return (
    <div className="variation-note">
      <h3>Why {page.variationLabel} cases are legally distinct</h3>
      <p>{page.variationLegalNote}</p>
      {page.variationMultiplier > 1.05 && (
        <p className="mult-note">
          Settlement data shows {page.variationLabel} cases settle approximately {Math.round((page.variationMultiplier - 1) * 100)}% above the {page.stateName} baseline average for drunk driver cases.
        </p>
      )}
    </div>
  )
}

// ─── Root Router: dispatches to StatePage or CityPage ────────────────────────
export default function SlugRouter(props) {
  if (props.pageType === 'state') {
    return <StatePage {...props} />
  }
  return <CityPage page={props.page} />
}

// ─── City Page ────────────────────────────────────────────────────────────────
function CityPage({ page }) {
  if (!page) return null
  const laws = statesData[page.stateCode]
  const { content, level } = page

  const levelLabel = level === 1 ? 'City Overview' : level === 2 ? 'Claim Type' : 'Specific Scenario'
  const eyebrowParts = [page.cityName, page.stateName]
  if (page.accidentLabel) eyebrowParts.push(page.accidentLabel)
  if (page.variationLabel) eyebrowParts.push(page.variationLabel)

  const faqItems = buildFAQ(page, laws)

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': `${SITE_URL}/${page.slug}`,
        url: `${SITE_URL}/${page.slug}`,
        name: content.metaTitle,
        description: content.metaDescription,
        dateModified: page.updatedAt,
        author: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
        breadcrumb: {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
            { '@type': 'ListItem', position: 2, name: page.cityName, item: `${SITE_URL}/${page.cityName.toLowerCase().replace(/ /g,'-')}` },
            ...(level >= 2 ? [{ '@type': 'ListItem', position: 3, name: page.accidentLabel, item: `${SITE_URL}/${page.slug}` }] : []),
          ],
        },
      },
      {
        '@type': 'FAQPage',
        mainEntity: faqItems.map(item => ({
          '@type': 'Question',
          name: item.q,
          acceptedAnswer: { '@type': 'Answer', text: item.a },
        })),
      },
      {
        '@type': 'WebApplication',
        name: 'Drunk Driver Settlement Calculator',
        applicationCategory: 'LegalApplication',
        description: `Calculate drunk driver settlement estimates for ${page.cityName}, ${page.stateName} based on real court data and ${laws.duiStatute}.`,
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      },
    ],
  }

  return (
    <>
      <NextSeo
        title={content.metaTitle}
        description={content.metaDescription}
        canonical={`${SITE_URL}/${page.slug}`}
        openGraph={{ url: `${SITE_URL}/${page.slug}`, title: content.metaTitle, description: content.metaDescription }}
      />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <SiteHeader />

      <main>
        <div className="container">

          {/* Breadcrumb */}
          <nav className="breadcrumb" aria-label="Breadcrumb">
            <a href="/">Home</a>
            <span aria-hidden="true">›</span>
            <a href={`/${page.cityName.toLowerCase().replace(/\./g,'').replace(/ /g,'-')}`}>{page.cityName}</a>
            {level >= 2 && (
              <>
                <span aria-hidden="true">›</span>
                <a href={`/${page.cityName.toLowerCase().replace(/\./g,'').replace(/ /g,'-')}-${page.accidentSlug}`}>{page.accidentLabel}</a>
              </>
            )}
            {level === 3 && (
              <>
                <span aria-hidden="true">›</span>
                <span>{page.variationLabel}</span>
              </>
            )}
          </nav>

          {/* Hook Section */}
          <section className="hook-section">
            <p className="eyebrow">{eyebrowParts.join(' · ')}</p>
            <h1>{content.h1}</h1>
            <p className="hook-lead">{content.hook}</p>
            <p className="meta-line">
              Last updated: {new Date(page.updatedAt).toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'})} ·
              Data from NHTSA, {page.stateName} court records ·
              {page.courthouse || page.cityName + ' ' + laws.court}
            </p>
          </section>

          {/* Stats Panel */}
          <StatsPanel page={page} laws={laws} />

          {/* Jump to Calculator */}
          <div className="jump-bar">
            <a href="#calculator" className="jump-btn">→ Jump to settlement calculator</a>
            <a href="#lead-form" className="jump-btn jump-btn-secondary">→ Free case evaluation</a>
          </div>

          {/* Body Content */}
          <div className="content-body">
            <h2>{content.section1Title}</h2>
            <p>{content.section1Body}</p>
            <h2>{content.section2Title}</h2>
            <p>{content.section2Body}</p>
            <h2>{content.section3Title}</h2>
            <p>{content.section3Body}</p>
          </div>

          {/* Legal Framework */}
          <LegalFramework laws={laws} page={page} />

          {/* Variation note (L3 only) */}
          <VariationNote page={page} />

          {/* Timeline (L2 + L3) */}
          {level >= 2 && <Timeline page={page} />}

          {/* Calculator */}
          <Calculator laws={laws} page={page} />

          {/* Settlement Table */}
          <SettlementTable laws={laws} page={page} />

          {/* FAQ */}
          <FAQ items={faqItems} />

          {/* Legal Disclaimer */}
          <div className="legal-disclaimer">
            <strong>Legal disclaimer:</strong> This page is for informational purposes only.
            Settlement estimates are based on statistical data from NHTSA and {page.stateName} public court records (2021–2024).
            No attorney-client relationship is formed by visiting this page.
            {laws.duiStatute} governs DUI liability in {page.stateName} — consult a licensed {page.stateName} attorney for advice specific to your case.
          </div>

          {/* Lead Form */}
          <LeadForm page={page} laws={laws} />

          {/* Trust Bar */}
          <div className="trust-bar">
            <div>
              Research by <strong>{AUTHOR}</strong> — Independent Legal Settlement Research.
              Data sources:{' '}
              <a href="https://crashstats.nhtsa.dot.gov" target="_blank" rel="noopener noreferrer">NHTSA</a>,{' '}
              <a href={laws.barUrl} target="_blank" rel="noopener noreferrer">{laws.barName}</a>,{' '}
              <a href="https://www.census.gov" target="_blank" rel="noopener noreferrer">US Census Bureau</a>.
            </div>
          </div>

          {/* CrossLinks */}
          <CrossLinks page={page} />

        </div>
      </main>

      <SiteFooter stateName={page.stateName} barUrl={laws.barUrl} barName={laws.barName} />
    </>
  )
}

export async function getStaticProps({ params }) {
  const { slug } = params
  const deployedState = process.env.SITE_STATE

  // Check if slug matches a state
  const stateCode = Object.keys(statesData).find(k => statesData[k].slug === slug)
  if (stateCode) {
    // Filter by deployed state unless ALL
    if (deployedState && deployedState !== 'ALL' && stateCode !== deployedState) {
      return { notFound: true }
    }
    const stateInfo = statesData[stateCode]
    const accidentTypes = Object.values(accidentTypesData).map(a => ({ slug: a.slug, label: a.label }))
    const statePagesTotal = pagesData.filter(p => p.stateCode === stateCode).length
    return { props: { pageType: 'state', stateInfo, stateCode, accidentTypes, stats: { total: statePagesTotal } } }
  }

  // Otherwise treat as city/accident page slug
  const filterState = deployedState && deployedState !== 'ALL' ? deployedState : null
  const page = filterState
    ? pagesData.find(p => p.slug === slug && p.stateCode === filterState)
    : pagesData.find(p => p.slug === slug)
  if (!page) return { notFound: true }
  return { props: { pageType: 'city', page } }
}

export async function getStaticPaths() {
  const deployedState = process.env.SITE_STATE
  const filterState = deployedState && deployedState !== 'ALL' ? deployedState : null

  // State slugs
  const statePaths = Object.values(statesData)
    .filter(s => !filterState || Object.keys(statesData).find(k => statesData[k] === s) === filterState)
    .map(s => ({ params: { slug: s.slug } }))

  // City/accident page slugs
  const cityPaths = (filterState
    ? pagesData.filter(p => p.stateCode === filterState)
    : pagesData
  ).map(p => ({ params: { slug: p.slug } }))

  return { paths: [...statePaths, ...cityPaths], fallback: false }
}
