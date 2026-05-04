import { NextSeo } from 'next-seo'
const SITE_URL = process.env.SITE_URL || 'https://drunkdriversettlement.com'
const SITE_NAME = process.env.SITE_NAME || 'Drunk Driver Settlement Calculator'

export default function About() {
  return (
    <>
      <NextSeo
        title={`About — ${SITE_NAME}`}
        description="We aggregate public court settlement data to help drunk driving accident victims understand what their case may be worth. Independent research — not a law firm."
        canonical={`${SITE_URL}/about`}
      />
      <header className="site-header">
        <div className="header-inner">
          <a href="/" className="site-logo">{SITE_NAME}</a>
          <nav className="header-nav"><a href="/methodology">Methodology</a><a href="/contact">Contact</a></nav>
        </div>
      </header>
      <main>
        <div className="container static-page">
          <h1>About This Site</h1>
          <p className="lead-text">
            Drunk Driver Settlement Calculator is an independent legal research resource. We are not a law firm, and we do not provide legal advice. We aggregate publicly available data to help accident victims understand the settlement landscape before speaking with an attorney.
          </p>

          <h2>What We Do</h2>
          <p>
            We collect and analyze settlement data from three primary sources: NHTSA crash statistics, state court public records, and American Bar Foundation research on litigation outcomes. We then build state-specific and city-specific settlement calculators that apply real legal variables — fault rules, statutes of limitations, punitive damages caps, and dram shop laws — to produce estimates that are meaningfully more accurate than generic national averages.
          </p>
          <p>
            Every page on this site references the actual statute governing DUI cases in that state. Every settlement range is derived from documented court data. We do not invent numbers. We do not inflate estimates to attract leads. Our job is to give you accurate information before you enter any negotiation.
          </p>

          <h2>Who We Are</h2>
          <p>
            We are independent legal researchers with backgrounds in data analysis and legal publishing. We are not attorneys, and nothing on this site should be construed as legal advice. We operate similarly to legal information publishers like Nolo, FindLaw, and Avvo — we provide research; licensed attorneys provide counsel.
          </p>
          <p>
            We partner with licensed personal injury attorneys in each state we cover. When you submit a case evaluation request, your information goes to a licensed attorney in your state — not to a call center or lead broker. We take our responsibility to accident victims seriously.
          </p>

          <h2>Our Data Sources</h2>
          <ul>
            <li><a href="https://crashstats.nhtsa.dot.gov" target="_blank" rel="noopener noreferrer">NHTSA Crash Data System</a> — city and state-level DUI crash statistics</li>
            <li>State bar associations — attorney fee structures and disciplinary data</li>
            <li>State court public records — settlement data aggregated by injury type and case outcome</li>
            <li>American Bar Foundation — litigation finance and outcome research</li>
            <li>State-specific DUI statutes — cited directly on each page</li>
          </ul>

          <h2>Coverage</h2>
          <p>
            We currently cover 8 states: Texas, California, Florida, New York, Georgia, Illinois, Arizona, and Ohio. These states collectively account for approximately 47% of all DUI crashes in the United States. We plan to expand to all 50 states.
          </p>

          <h2>Accuracy & Limitations</h2>
          <p>
            Settlement estimates on this site are statistical ranges — not predictions. Individual case outcomes depend on factors this calculator cannot assess: specific insurance policy limits, the strength of evidence, local jury tendencies, and the specific facts of your accident. The estimates are useful for understanding the range of outcomes and for informed conversations with an attorney — not for making legal decisions independently.
          </p>
          <p>
            We update our data annually. If you believe a statistic on this site is incorrect, please <a href="/contact">contact us</a> with the source of the correct data. We will investigate and update promptly.
          </p>

          <div className="legal-disclaimer" style={{marginTop:'2rem'}}>
            <strong>Disclaimer:</strong> This site provides general legal information, not legal advice. No attorney-client relationship is formed by using this site. Always consult a licensed attorney in your state before making legal decisions.
          </div>
        </div>
      </main>
      <footer className="site-footer">
        <div className="footer-inner">
          <div className="footer-links">
            <a href="/">Home</a><a href="/methodology">Methodology</a><a href="/privacy">Privacy</a>
            <a href="/disclaimer">Disclaimer</a><a href="/contact">Contact</a>
          </div>
          <p style={{marginTop:'0.5rem',fontSize:'0.78rem',color:'#aaa'}}>© {new Date().getFullYear()} {SITE_NAME}. Not a law firm. Not legal advice.</p>
        </div>
      </footer>
    </>
  )
}
