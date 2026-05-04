import { NextSeo } from 'next-seo'
const SITE_URL = process.env.SITE_URL || 'https://drunkdriversettlement.com'
const SITE_NAME = process.env.SITE_NAME || 'Drunk Driver Settlement Calculator'
export default function Privacy() {
  return (
    <>
      <NextSeo title={`Privacy Policy — ${SITE_NAME}`} description="Privacy policy for Drunk Driver Settlement Calculator." canonical={`${SITE_URL}/privacy`} />
      <header className="site-header"><div className="header-inner"><a href="/" className="site-logo">{SITE_NAME}</a></div></header>
      <main><div className="container static-page">
        <h1>Privacy Policy</h1>
        <p><strong>Last updated: {new Date().toLocaleDateString('en-US',{year:'numeric',month:'long'})}</strong></p>
        <h2>What We Collect</h2>
        <p>When you submit a case evaluation form, we collect: your name, phone number, email address, city, injury description, and the page you submitted from. We do not collect payment information.</p>
        <h2>How We Use Your Information</h2>
        <p>Information submitted through case evaluation forms is shared with licensed personal injury attorneys in your state for the purpose of providing a free case review. We do not sell your information to non-attorneys, data brokers, or marketing companies.</p>
        <h2>Cookies and Analytics</h2>
        <p>We use privacy-respecting analytics to understand which pages are most helpful to visitors. We do not use tracking pixels or third-party advertising cookies.</p>
        <h2>Data Retention</h2>
        <p>Case evaluation submissions are retained for 90 days, then deleted. You may request deletion of your data at any time by contacting us.</p>
        <h2>Contact</h2>
        <p>For privacy questions, use the <a href="/contact">contact form</a>.</p>
      </div></main>
      <footer className="site-footer"><div className="footer-inner"><div className="footer-links"><a href="/">Home</a><a href="/about">About</a><a href="/disclaimer">Disclaimer</a></div></div></footer>
    </>
  )
}
