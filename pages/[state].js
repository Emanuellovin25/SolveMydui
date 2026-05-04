import { useState } from 'react'
import { NextSeo } from 'next-seo'
import Link from 'next/link'
import statesData from '../data/states.json'
import accidentTypesData from '../data/accident-types.json'
import pagesData from '../data/pages.json'

const SITE_URL   = process.env.SITE_URL   || 'https://drunkdriversettlement.com'
const SITE_NAME  = process.env.SITE_NAME  || 'Drunk Driver Settlement Calculator'
const SITE_STATE = process.env.SITE_STATE || 'TX'

function slugify(s) {
  return s.toLowerCase().replace(/\./g,'').replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'')
}

export default function StatePage({ stateInfo, stateCode, cityPages, accidentTypes, stats }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
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
          <button className="mobile-menu-btn" onClick={() => setMobileMenuOpen(o => !o)} aria-label="Menu">☰</button>
        </div>
        {mobileMenuOpen && (
          <nav className="mobile-nav open">
            <a href="/methodology" onClick={() => setMobileMenuOpen(false)}>How It Works</a>
            <a href="/about" onClick={() => setMobileMenuOpen(false)}>About</a>
            <a href="#lead-form" onClick={() => setMobileMenuOpen(false)}>Free Case Review</a>
          </nav>
        )}
      </header>
      <a href="#lead-form" className="sticky-cta">📞 Free Case Review — No Fee Unless You Win</a>

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

          {/* Full Stats Panel */}
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

          {/* Settlement by Injury */}
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

          {/* Full Legal Framework */}
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

          {/* Punitive note */}
          {stateInfo.punitives.available && (
            <div className="variation-note">
              <h3>Punitive damages in {stateInfo.name} DUI cases</h3>
              <p>{stateInfo.punitives.notes}</p>
              <p className="mult-note">Typical punitive multiplier: {stateInfo.punitives.typicalMultiplier}</p>
            </div>
          )}

          {/* Dram Shop note */}
          {stateInfo.dramShop.available && (
            <div style={{background:'#e8f5e9',border:'1px solid #4caf50',borderRadius:'8px',padding:'1.1rem',margin:'1rem 0'}}>
              <h3 style={{fontSize:'0.95rem',color:'#2e7d32',marginBottom:'0.4rem'}}>Dram shop liability — {stateInfo.dramShop.statute}</h3>
              <p style={{fontSize:'0.88rem',lineHeight:'1.65'}}>{stateInfo.dramShop.notes}</p>
              <p style={{fontSize:'0.82rem',fontWeight:'600',marginTop:'0.5rem',color:'#2e7d32'}}>Typical additional recovery: {stateInfo.dramShop.typicalAdded}</p>
            </div>
          )}

          {/* Browse by city */}
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

          {/* Browse by claim type */}
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

          {/* Lead Form */}
          <div className="lead-form-section" id="lead-form">
            <h2>Free case evaluation — {stateInfo.name}</h2>
            <p>A licensed {stateInfo.name} attorney reviews your situation within 2 hours. Contingency fee — no upfront cost.</p>
            <form action="/api/lead" method="POST">
              <div className="form-grid">
                <div className="form-field"><label>Name</label><input name="name" type="text" required placeholder="Your name" /></div>
                <div className="form-field"><label>Phone</label><input name="phone" type="tel" required placeholder="(555) 000-0000" /></div>
                <div className="form-field"><label>Email</label><input name="email" type="email" required placeholder="you@email.com" /></div>
                <div className="form-field"><label>City</label><input name="city" type="text" placeholder={stateInfo.cities[0].name} /></div>
              </div>
              <input type="hidden" name="stateCode" value={stateCode} />
              <button type="submit" className="submit-btn">Get my free case evaluation →</button>
              <p className="form-disclaimer">Licensed {stateInfo.name} attorneys only. Never sold.</p>
            </form>
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

export async function getStaticProps({ params }) {
  const { state } = params
  const stateCode = Object.keys(statesData).find(k => statesData[k].slug === state)
  if (!stateCode || statesData[stateCode] === undefined) return { notFound: true }
  // For multi-state domain: only show this state's pages
  // For single domain: show all states
  const deployedState = process.env.SITE_STATE
  if (deployedState && deployedState !== 'ALL' && stateCode !== deployedState) return { notFound: true }

  const stateInfo = statesData[stateCode]
  const accidentTypes = Object.values(accidentTypesData).map(a => ({ slug: a.slug, label: a.label }))
  const statePagesTotal = pagesData.filter(p => p.stateCode === stateCode).length

  return { props: { stateInfo, stateCode, accidentTypes, stats: { total: statePagesTotal } } }
}

export async function getStaticPaths() {
  const paths = Object.values(statesData).map(s => ({ params: { state: s.slug } }))
  return { paths, fallback: false }
}
