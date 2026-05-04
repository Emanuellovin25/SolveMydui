import { NextSeo } from 'next-seo'
import { useState } from 'react'
const SITE_URL = process.env.SITE_URL || 'https://drunkdriversettlement.com'
const SITE_NAME = process.env.SITE_NAME || 'Drunk Driver Settlement Calculator'
export default function Contact() {
  const [sent, setSent] = useState(false)
  async function submit(e) {
    e.preventDefault()
    const data = Object.fromEntries(new FormData(e.target))
    await fetch('/api/lead', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({...data, source: '/contact', type: 'contact'}) })
    setSent(true)
  }
  return (
    <>
      <NextSeo title={`Contact — ${SITE_NAME}`} description="Contact the Drunk Driver Settlement Calculator research team with questions about our data or methodology." canonical={`${SITE_URL}/contact`} />
      <header className="site-header"><div className="header-inner"><a href="/" className="site-logo">{SITE_NAME}</a></div></header>
      <main><div className="container static-page">
        <h1>Contact</h1>
        <p>Questions about our data, methodology, or a correction? Use the form below. We respond within 2 business days.</p>
        <p>If you're looking for a <strong>free case evaluation</strong>, please use the form on any city or accident type page — that goes directly to a licensed attorney.</p>
        {sent ? (
          <div className="success-msg">Message received. We'll respond within 2 business days.</div>
        ) : (
          <form onSubmit={submit} className="contact-form">
            <div className="form-field"><label>Name</label><input name="name" type="text" required /></div>
            <div className="form-field"><label>Email</label><input name="email" type="email" required /></div>
            <div className="form-field full"><label>Message</label><textarea name="message" rows={5} required /></div>
            <button type="submit" className="submit-btn">Send message</button>
          </form>
        )}
      </div></main>
      <footer className="site-footer"><div className="footer-inner"><div className="footer-links"><a href="/">Home</a><a href="/about">About</a><a href="/privacy">Privacy</a></div></div></footer>
    </>
  )
}
