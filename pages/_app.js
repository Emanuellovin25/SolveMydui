import '../styles/globals.css'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'

function ExitIntentPopup() {
  const [show, setShow] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const router = useRouter()

  const noShowPages = ['/generator', '/dashboard', '/thank-you', '/privacy', '/disclaimer', '/contact', '/about', '/methodology']
  const shouldShow = !noShowPages.includes(router.pathname)

  useEffect(() => {
    if (!shouldShow || dismissed) return
    if (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('exit_shown')) return

    let triggered = false

    function handleMouseLeave(e) {
      if (triggered || e.clientY > 5) return
      triggered = true
      setShow(true)
      sessionStorage.setItem('exit_shown', '1')
    }

    let mobileTimer = null
    function handleScroll() {
      if (triggered) return
      const scrollPct = window.scrollY / (document.body.scrollHeight - window.innerHeight)
      if (scrollPct > 0.5 && !mobileTimer) {
        mobileTimer = setTimeout(() => {
          if (!triggered) { triggered = true; setShow(true); sessionStorage.setItem('exit_shown', '1') }
        }, 15000)
      }
    }

    document.addEventListener('mouseleave', handleMouseLeave)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      document.removeEventListener('mouseleave', handleMouseLeave)
      window.removeEventListener('scroll', handleScroll)
      if (mobileTimer) clearTimeout(mobileTimer)
    }
  }, [shouldShow, dismissed, router.pathname])

  function close() { setShow(false); setDismissed(true) }

  async function submit() {
    if (!name || !phone) return
    try {
      await fetch('/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, source: 'exit_intent', page: router.pathname })
      })
    } catch {}
    setSubmitted(true)
    setTimeout(close, 2500)
  }

  if (!show) return null

  return (
    <div className="exit-overlay" onClick={e => e.target === e.currentTarget && close()}>
      <div className="exit-popup">
        <button className="exit-popup-close" onClick={close}>✕</button>
        {submitted ? (
          <div style={{textAlign:'center',padding:'1rem 0'}}>
            <div style={{fontSize:48,marginBottom:12}}>✅</div>
            <h2 style={{fontSize:'1.2rem',color:'#0f2238',marginBottom:8}}>Mulțumim!</h2>
            <p style={{color:'#5a6a7a',fontSize:'0.88rem'}}>Un avocat te va contacta în maxim 2 ore.</p>
          </div>
        ) : (
          <>
            <div className="exit-popup-badge">ÎNAINTE SĂ PLECI</div>
            <h2>Estimează-ți despăgubirea gratuit — 30 secunde</h2>
            <p>Victimele accidentelor cu șoferi beți primesc în medie <strong>$110,000–$380,000</strong>. Un avocat specializat îți evaluează cazul fără niciun cost.</p>
            <div className="exit-popup-form">
              <input type="text" placeholder="Numele tău" value={name} onChange={e => setName(e.target.value)} autoFocus />
              <input type="tel" placeholder="Număr de telefon" value={phone} onChange={e => setPhone(e.target.value)} onKeyDown={e => e.key === 'Enter' && submit()} />
              <button className="exit-popup-submit" onClick={submit} disabled={!name||!phone} style={{opacity:(!name||!phone)?0.6:1}}>
                Vreau evaluarea gratuită →
              </button>
            </div>
            <p className="exit-popup-disclaimer">Avocați licențiați. Informații niciodată vândute.</p>
            <button className="exit-popup-skip" onClick={close}>Nu acum</button>
          </>
        )}
      </div>
    </div>
  )
}

export default function App({ Component, pageProps }) {
  return (
    <>
      <Component {...pageProps} />
      <ExitIntentPopup />
    </>
  )
}
