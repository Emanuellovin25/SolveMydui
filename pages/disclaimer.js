import { NextSeo } from 'next-seo'
const SITE_URL = process.env.SITE_URL || 'https://drunkdriversettlement.com'
const SITE_NAME = process.env.SITE_NAME || 'Drunk Driver Settlement Calculator'
export default function Disclaimer() {
  return (
    <>
      <NextSeo title={`Legal Disclaimer — ${SITE_NAME}`} description="Legal disclaimer for Drunk Driver Settlement Calculator. This site provides research, not legal advice." canonical={`${SITE_URL}/disclaimer`} />
      <header className="site-header"><div className="header-inner"><a href="/" className="site-logo">{SITE_NAME}</a></div></header>
      <main><div className="container static-page">
        <h1>Legal Disclaimer</h1>
        <p><strong>Last updated: {new Date().toLocaleDateString('en-US',{year:'numeric',month:'long'})}</strong></p>
        <h2>Not Legal Advice</h2>
        <p>The information on this website is provided for general informational purposes only. It does not constitute legal advice and does not create an attorney-client relationship. You should not act on any information from this site without seeking professional legal advice from a licensed attorney in your jurisdiction.</p>
        <h2>Settlement Estimates Are Not Guarantees</h2>
        <p>Settlement figures, ranges, and calculator outputs on this site are statistical estimates based on publicly available data from NHTSA, state court records, and legal research databases. Individual case outcomes depend on many factors specific to each case — including the strength of evidence, insurance coverage limits, specific local court practices, and jury composition — that this calculator cannot assess. Actual settlements may be significantly higher or lower than estimated.</p>
        <h2>We Are Not a Law Firm</h2>
        <p>Drunk Driver Settlement Calculator is not a law firm and does not employ attorneys. We do not provide legal representation. The attorneys we refer users to are independent licensed attorneys — we do not supervise their work, and your relationship with any attorney is governed by a separate engagement agreement between you and that attorney.</p>
        <h2>Statute Information May Change</h2>
        <p>Laws change. While we make every effort to keep statutory information current, the statutes referenced on this site may have been amended since our last update. Always verify current law with a licensed attorney or the relevant state legislature's official website.</p>
        <h2>State Bar Referral</h2>
        <p>If you need to verify an attorney's license or find a licensed attorney in your state independently, contact your state bar association. Links to state bar associations are provided on each state-specific page of this site.</p>
        <div className="legal-disclaimer" style={{marginTop:'1.5rem'}}>By using this website, you acknowledge that you have read and understood this disclaimer.</div>
      </div></main>
      <footer className="site-footer"><div className="footer-inner"><div className="footer-links"><a href="/">Home</a><a href="/about">About</a><a href="/privacy">Privacy</a><a href="/contact">Contact</a></div></div></footer>
    </>
  )
}
