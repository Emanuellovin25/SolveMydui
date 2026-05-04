import { NextSeo } from 'next-seo'
const SITE_NAME = process.env.SITE_NAME || 'Drunk Driver Settlement Calculator'
export default function ThankYou() {
  return (
    <>
      <NextSeo title={`Request Received — ${SITE_NAME}`} noindex={true} />
      <header className="site-header"><div className="header-inner"><a href="/" className="site-logo">{SITE_NAME}</a></div></header>
      <main><div className="container" style={{textAlign:'center',padding:'4rem 1rem'}}>
        <h1 style={{fontSize:'2rem',marginBottom:'1rem'}}>Your evaluation request was received</h1>
        <p style={{fontSize:'1.1rem',color:'#555',maxWidth:'480px',margin:'0 auto 1.5rem'}}>
          A licensed attorney in your state will review your situation and contact you within 2 business hours.
        </p>
        <p style={{fontSize:'0.9rem',color:'#888'}}>
          While you wait — <a href="/methodology">learn how settlement calculations work</a>.
        </p>
        <a href="/" style={{display:'inline-block',marginTop:'2rem',color:'#1a3a5c',fontWeight:600}}>← Back to home</a>
      </div></main>
    </>
  )
}
