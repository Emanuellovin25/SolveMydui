import { NextSeo } from 'next-seo'
import statesData from '../data/states.json'
import accidentTypesData from '../data/accident-types.json'
import pagesData from '../data/pages.json'

const SITE_STATE = process.env.SITE_STATE || 'TX'
const SITE_NAME  = process.env.SITE_NAME  || 'Drunk Driver Settlement Calculator'
const SITE_URL   = process.env.SITE_URL   || 'https://drunkdriversettlement.com'

export default function Home({ stateInfo, citySample, accidentTypes, stats }) {
  const slugify = s => s.toLowerCase().replace(/\./g,'').replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'')

  return (
    <>
      <NextSeo
        title={`${SITE_NAME} — Real ${stateInfo.name} Settlement Data by City`}
        description={`Real drunk driver settlement data for ${stateInfo.name}: ${stateInfo.avgDuiSettlement} average. ${stateInfo.sol} to file (${stateInfo.solCitation}). ${stateInfo.fault}. Free estimate by city and injury type.`}
        canonical={SITE_URL}
      />

      <header className="site-header">
        <div className="header-inner">
          <span className="site-logo">{SITE_NAME}</span>
          <nav className="header-nav">
            <a href="/methodology">How It Works</a>
            <a href="/about">About</a>
          </nav>
          <a href="#lead-section" className="header-cta">Free Case Review</a>
        </div>
      </header>

      <main>
        <div className="container">

          <section className="hook-section">
            <p className="eyebrow">{stateInfo.name} · DUI Accident Settlement Research</p>
            <h1>Drunk Driver Settlement Calculator — {stateInfo.name}</h1>
            <p className="hook-lead">
              {stateInfo.duiCrashesStatewide.toLocaleString()} drunk driving crashes occurred in {stateInfo.name} last year.
              Most victims have no idea what their case is worth before speaking with an attorney.
              We publish real settlement data from {stateInfo.name} court records — by city, by injury type, and by BAC level — so you enter any conversation informed.
            </p>
          </section>

          <div className="honest-numbers">
            <h2>The real numbers for {stateInfo.name}</h2>
            <div className="numbers-grid">
              <div className="number-card">
                <div className="nc-label">Avg. DUI settlement — {stateInfo.name}</div>
                <div className="nc-val nc-val-range">{stateInfo.avgDuiSettlement}</div>
                <p className="nc-sub">Public court records 2021–2024</p>
              </div>
              <div className="number-card">
                <div className="nc-label">DUI crashes statewide</div>
                <div className="nc-val">{stateInfo.duiCrashesStatewide.toLocaleString()}</div>
                <p className="nc-sub">NHTSA — last reported year</p>
              </div>
              <div className="number-card">
                <div className="nc-label">Filing deadline</div>
                <div className="nc-val">{stateInfo.sol}</div>
                <p className="nc-sub">{stateInfo.solCitation}</p>
              </div>
              <div className="number-card">
                <div className="nc-label">Fault rule</div>
                <div className="nc-val" style={{fontSize:'0.82rem',lineHeight:'1.3'}}>{stateInfo.fault.split('—')[0]}</div>
                <p className="nc-sub">{stateInfo.name} law</p>
              </div>
              <div className="number-card">
                <div className="nc-label">Enhanced BAC threshold</div>
                <div className="nc-val">{stateInfo.enhancedBac}</div>
                <p className="nc-sub">Triggers enhanced penalties & punitives</p>
              </div>
              <div className="number-card">
                <div className="nc-label">Cases settled out of court</div>
                <div className="nc-val">{stateInfo.pctOutOfCourt}%</div>
                <p className="nc-sub">In {stateInfo.name}, 2023</p>
              </div>
            </div>
          </div>

          <div className="law-summary-box">
            <h3>Applicable law — {stateInfo.name}</h3>
            <div className="law-summary-grid">
              <div><span>DUI Statute:</span> {stateInfo.duiStatute}</div>
              <div><span>SOL:</span> {stateInfo.sol} ({stateInfo.solCitation})</div>
              <div><span>Punitives:</span> {stateInfo.punitives.available ? stateInfo.punitives.cap : 'Limited'}</div>
              <div><span>Dram Shop:</span> {stateInfo.dramShop.available ? stateInfo.dramShop.statute : 'Very Limited'}</div>
            </div>
          </div>

          <div style={{margin:'2rem 0'}}>
            <h2>Browse by claim type</h2>
            <div className="accident-type-grid">
              {accidentTypes.map(a => (
                <div key={a.slug} className="accident-type-card">
                  <h3>{a.label}</h3>
                  <p className="at-lead-value">Lead value: {a.leadValue}</p>
                  <a href={`/${slugify(stateInfo.cities[0].name)}-${a.slug}`} className="at-link">
                    {stateInfo.cities[0].name} example →
                  </a>
                </div>
              ))}
            </div>
          </div>

          <div style={{margin:'2rem 0'}}>
            <h2>Browse by city in {stateInfo.name}</h2>
            <div className="city-grid">
              {stateInfo.cities.slice(0, 24).map(city => (
                <a key={city.name} href={`/${slugify(city.name)}`} className="city-card">
                  <span className="city-name">{city.name}</span>
                  <span className="city-stat">{city.duiCrashes.toLocaleString()} DUI crashes/yr</span>
                </a>
              ))}
            </div>
          </div>

          <div id="lead-section" className="lead-form-section">
            <h2>Free case evaluation — {stateInfo.name}</h2>
            <p>A licensed {stateInfo.name} attorney reviews your situation and responds within 2 hours. Contingency fee — no upfront cost.</p>
            <form action="/api/lead" method="POST">
              <div className="form-grid">
                <div className="form-field"><label>Name</label><input name="name" type="text" required placeholder="Your name" /></div>
                <div className="form-field"><label>Phone</label><input name="phone" type="tel" required placeholder="(555) 000-0000" /></div>
                <div className="form-field"><label>Email</label><input name="email" type="email" required placeholder="you@email.com" /></div>
                <div className="form-field"><label>City where accident occurred</label><input name="city" type="text" placeholder="Houston, TX" /></div>
              </div>
              <button type="submit" className="submit-btn">Get my free case evaluation →</button>
              <p className="form-disclaimer">Licensed {stateInfo.name} attorneys only. Information never sold.</p>
            </form>
          </div>

          <div className="legal-disclaimer">
            <strong>About this site:</strong> {SITE_NAME} aggregates publicly available data from NHTSA, US Census Bureau, and {stateInfo.name} public court records. We are not a law firm. Settlement estimates are statistical ranges. Consult a licensed {stateInfo.name} attorney for advice specific to your case.
            <br /><a href="/methodology" style={{marginTop:'0.3rem',display:'inline-block'}}>How our calculator works →</a>
          </div>

        </div>
      </main>

      <footer className="site-footer">
        <div className="footer-inner">
          <div className="footer-cols">
            <div>
              <strong>{SITE_NAME}</strong>
              <p style={{fontSize:'0.8rem',marginTop:'0.3rem',color:'#aaa'}}>Independent settlement research. Not a law firm.</p>
            </div>
            <div className="footer-links">
              <a href="/about">About</a>
              <a href="/methodology">Methodology</a>
              <a href="/disclaimer">Disclaimer</a>
              <a href="/privacy">Privacy</a>
              <a href="/contact">Contact</a>
              <a href={stateInfo.barUrl} target="_blank" rel="noopener noreferrer">{stateInfo.barName}</a>
            </div>
          </div>
          <p style={{marginTop:'1rem',fontSize:'0.75rem',color:'#999'}}>
            © {new Date().getFullYear()} {SITE_NAME}. Data from NHTSA, {stateInfo.name} court records.
            Not legal advice. {stateInfo.duiStatute}.
          </p>
        </div>
      </footer>
    </>
  )
}

export async function getStaticProps() {
  const stateInfo = statesData[SITE_STATE]
  const accidentTypes = Object.values(accidentTypesData).map(a => ({ slug: a.slug, label: a.label, leadValue: a.leadValue }))
  const statePagesTotal = pagesData.filter(p => p.stateCode === SITE_STATE).length
  const slugify = s => s.toLowerCase().replace(/\./g,'').replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'')
  const citySample = slugify(stateInfo.cities[0].name)
  return { props: { stateInfo, citySample, accidentTypes, stats: { total: statePagesTotal } } }
}
