import { useState, useEffect, useRef } from 'react'
import { NextSeo } from 'next-seo'
import statesData from '../data/states.json'
import accidentTypesData from '../data/accident-types.json'
import pagesData from '../data/pages.json'
import { SEVERITY_MULTIPLIERS, BAC_MULTIPLIERS, LIABILITY_MULTIPLIERS } from '../lib/calculationRules'

const SITE_URL  = process.env.SITE_URL  || 'https://drunkdriversettlement.com'
const SITE_NAME = process.env.SITE_NAME || 'SolveMydui'

function slugify(s) {
  return s.toLowerCase().replace(/\./g,'').replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'')
}

function Counter({ value, prefix='', suffix='', duration=1800 }) {
  const [display, setDisplay] = useState(0)
  const ref = useRef(null)
  const started = useRef(false)
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true
        const num = parseFloat(String(value).replace(/[^0-9.]/g,''))
        const start = Date.now()
        const tick = () => {
          const p = Math.min((Date.now()-start)/duration,1)
          const e = 1-Math.pow(1-p,3)
          setDisplay(Math.floor(e*num))
          if (p<1) requestAnimationFrame(tick)
          else setDisplay(num)
        }
        requestAnimationFrame(tick)
      }
    }, {threshold:0.3})
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [value, duration])
  return <span ref={ref}>{prefix}{display.toLocaleString()}{suffix}</span>
}

function MobileMenu() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button className="mob-toggle" onClick={() => setOpen(o=>!o)} aria-label="Menu">
        <span className={`hamburger ${open?'open':''}`}><span/><span/><span/></span>
      </button>
      {open && (
        <nav className="mob-nav">
          <a href="/methodology" onClick={()=>setOpen(false)}>How It Works</a>
          <a href="/about" onClick={()=>setOpen(false)}>About</a>
          <a href="#calculator" onClick={()=>setOpen(false)}>Calculator</a>
          <a href="#lead-form" onClick={()=>setOpen(false)} className="mob-cta">Free Case Review</a>
        </nav>
      )}
    </>
  )
}

export default function StatePage({ stateInfo, stateCode, accidentTypes }) {
  const [calcSeverity, setCalcSeverity] = useState('')
  const [calcBac, setCalcBac] = useState('')
  const [calcLiability, setCalcLiability] = useState('')
  const [calcResult, setCalcResult] = useState(null)
  const [formDone, setFormDone] = useState(false)
  const [openFaq, setOpenFaq] = useState(null)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')

  if (!stateInfo) return null

  function runCalc() {
    if (!calcSeverity) return
    const base = {minor:25000,moderate:85000,serious:220000,permanent:480000}[calcSeverity]||85000
    const bacM = {unknown:1,standard:1.2,enhanced:1.55,extreme:2.1}[calcBac]||1
    const liabM = {none:1,minor:0.92,moderate:0.8,significant:0.65}[calcLiability]||1
    const low = Math.round(base*0.7*bacM*liabM)
    const high = Math.round(base*1.4*bacM*liabM)
    setCalcResult({low, high, mid:Math.round((low+high)/2)})
  }

  async function submitForm(e) {
    e.preventDefault()
    try { await fetch('/api/lead',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name,phone,email,state:stateCode,source:'state_page'})}) } catch {}
    setFormDone(true)
  }

  const faqs = [
    {q:`How long do I have to file in ${stateInfo.name}?`, a:`${stateInfo.name} has a ${stateInfo.sol} statute of limitations under ${stateInfo.solCitation}. The clock starts on the accident date. Missing this deadline means permanently losing your right to compensation.`},
    {q:`What is the average settlement in ${stateInfo.name}?`, a:`Based on ${stateInfo.name} public court records 2021–2024, the average DUI settlement ranges from ${stateInfo.avgDuiSettlement}. High BAC, prior convictions, and serious injuries push settlements significantly higher.`},
    {q:`Can I get punitive damages?`, a:stateInfo.punitives?.available?`Yes. ${stateInfo.name} allows punitive damages in DUI cases — ${stateInfo.punitives.cap} (${stateInfo.punitives.citation}). These are additional damages when the driver's conduct was especially reckless.`:`Punitive damages are limited in ${stateInfo.name}. ${stateInfo.punitives?.notes||''}`},
    {q:`Does ${stateInfo.name} have dram shop laws?`, a:stateInfo.dramShop?.available?`Yes — ${stateInfo.dramShop.statute}. Bars that serve visibly intoxicated patrons can be held jointly liable. ${stateInfo.dramShop.notes}`:`Dram shop liability is very limited in ${stateInfo.name}.`},
    {q:`How long does a DUI settlement take?`, a:`Most DUI injury cases in ${stateInfo.name} settle in ${stateInfo.avgDaysToSettle} days. ${stateInfo.pctOutOfCourt}% of cases settle before reaching a courtroom.`},
  ]

  return (
    <>
      <NextSeo
        title={`Drunk Driver Settlement Calculator — ${stateInfo.name} | ${stateInfo.avgDuiSettlement}`}
        description={`Real DUI settlement data for ${stateInfo.name}: ${stateInfo.avgDuiSettlement} average. ${stateInfo.sol} filing deadline. Free estimate based on real court records.`}
        canonical={`${SITE_URL}/${stateInfo.slug}`}
        openGraph={{url:`${SITE_URL}/${stateInfo.slug}`,title:`Drunk Driver Settlement — ${stateInfo.name}`,description:`${stateInfo.avgDuiSettlement} avg · ${stateInfo.sol} deadline · ${stateInfo.fault}`}}
      />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,400&display=swap');
        :root{--ink:#080d18;--ink2:#0f1724;--ink3:#1a2234;--gold:#c9a84c;--gold2:#e8c97a;--golddim:rgba(201,168,76,0.12);--slate:#64748b;--muted:#8fa3bc;--light:#e8edf5;--white:#fff;--green:#10b981;--red:#ef4444;--border:rgba(255,255,255,0.06);--serif:'Playfair Display',Georgia,serif;--sans:'DM Sans',system-ui,sans-serif;--r:14px;--sh:0 8px 40px rgba(0,0,0,0.5);--glow:0 0 60px rgba(201,168,76,0.08)}
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        html{scroll-behavior:smooth;font-size:16px}
        body{font-family:var(--sans);background:var(--ink);color:var(--light);line-height:1.65;overflow-x:hidden;-webkit-font-smoothing:antialiased}
        a{color:var(--gold);text-decoration:none;transition:color .2s}
        a:hover{color:var(--gold2)}
        ::selection{background:var(--golddim);color:var(--gold2)}

        /* HEADER */
        .site-header{position:fixed;top:0;left:0;right:0;z-index:100;background:rgba(8,13,24,0.88);backdrop-filter:blur(24px) saturate(180%);border-bottom:1px solid var(--border);transition:all .3s}
        .hdr{max-width:1200px;margin:0 auto;padding:0 1.5rem;height:70px;display:flex;align-items:center;gap:2rem}
        .logo{font-family:var(--serif);font-size:1.1rem;font-weight:700;color:var(--white);letter-spacing:.02em;flex:1}
        .logo b{color:var(--gold)}
        .hdr-nav{display:flex;gap:1.75rem}
        .hdr-nav a{color:var(--slate);font-size:.85rem;font-weight:500;transition:color .2s}
        .hdr-nav a:hover{color:var(--white)}
        .hdr-cta{background:var(--gold);color:var(--ink)!important;font-weight:700;font-size:.82rem;padding:.55rem 1.4rem;border-radius:999px;transition:all .2s;white-space:nowrap}
        .hdr-cta:hover{background:var(--gold2);transform:translateY(-1px);box-shadow:0 6px 24px rgba(201,168,76,.35)}
        .mob-toggle{display:none;background:none;border:none;cursor:pointer;padding:4px}
        .hamburger{display:flex;flex-direction:column;gap:5px}
        .hamburger span{width:22px;height:1.5px;background:var(--muted);border-radius:2px;transition:all .3s;display:block}
        .hamburger.open span:nth-child(1){transform:rotate(45deg) translate(4px,4px)}
        .hamburger.open span:nth-child(2){opacity:0}
        .hamburger.open span:nth-child(3){transform:rotate(-45deg) translate(4px,-4px)}
        .mob-nav{position:fixed;top:70px;left:0;right:0;background:rgba(8,13,24,.98);backdrop-filter:blur(20px);padding:1.5rem;display:flex;flex-direction:column;gap:1rem;border-bottom:1px solid var(--border);z-index:99;animation:sld .25s ease}
        .mob-nav a{color:var(--muted);font-size:1rem;padding:.5rem 0;border-bottom:1px solid var(--border)}
        .mob-cta{background:var(--gold)!important;color:var(--ink)!important;text-align:center;border-radius:999px;padding:.75rem!important;border-bottom:none!important;font-weight:700}
        @keyframes sld{from{opacity:0;transform:translateY(-10px)}to{opacity:1;transform:translateY(0)}}
        .sticky-bar{display:none;position:fixed;bottom:0;left:0;right:0;z-index:90;background:var(--gold);color:var(--ink);padding:.9rem 1.5rem;text-align:center;font-weight:700;font-size:.9rem;box-shadow:0 -4px 24px rgba(201,168,76,.25)}

        /* HERO */
        .hero{padding:140px 1.5rem 80px;max-width:1200px;margin:0 auto;position:relative}
        .hero::after{content:'';position:absolute;top:60px;right:-120px;width:700px;height:700px;background:radial-gradient(circle,rgba(201,168,76,.07) 0%,transparent 65%);pointer-events:none;z-index:0}
        .hero>*{position:relative;z-index:1}
        .eyebrow{display:inline-flex;align-items:center;gap:8px;background:var(--golddim);border:1px solid rgba(201,168,76,.25);color:var(--gold);font-size:.7rem;font-weight:600;letter-spacing:.12em;text-transform:uppercase;padding:.4rem 1rem;border-radius:999px;margin-bottom:1.5rem;animation:fup .6s ease both}
        .eyebrow::before{content:'●';font-size:.45em;animation:pulse 2s infinite}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
        .hero h1{font-family:var(--serif);font-size:clamp(2.2rem,5.5vw,4rem);font-weight:900;line-height:1.08;color:var(--white);margin-bottom:1.25rem;max-width:820px;animation:fup .6s .1s ease both}
        .hero h1 i{font-style:normal;color:var(--gold)}
        .hero-lead{font-size:clamp(1rem,1.8vw,1.12rem);color:var(--muted);max-width:580px;line-height:1.8;animation:fup .6s .2s ease both;margin-bottom:2rem}
        .hero-btns{display:flex;gap:12px;flex-wrap:wrap;animation:fup .6s .3s ease both}
        @keyframes fup{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}
        .btn-gold{background:var(--gold);color:var(--ink);font-weight:700;font-size:.9rem;padding:.85rem 2rem;border-radius:999px;border:none;cursor:pointer;transition:all .25s;display:inline-flex;align-items:center;gap:8px;font-family:var(--sans)}
        .btn-gold:hover{background:var(--gold2);transform:translateY(-2px);box-shadow:0 10px 32px rgba(201,168,76,.35);color:var(--ink)}
        .btn-ghost{background:transparent;color:var(--light);font-weight:500;font-size:.9rem;padding:.85rem 2rem;border-radius:999px;border:1px solid var(--border);cursor:pointer;transition:all .25s;font-family:var(--sans)}
        .btn-ghost:hover{border-color:rgba(255,255,255,.18);background:rgba(255,255,255,.04)}

        /* STATS */
        .stats-wrap{border-top:1px solid var(--border);border-bottom:1px solid var(--border);background:rgba(255,255,255,.015);padding:2.5rem 1.5rem}
        .stats-inner{max-width:1200px;margin:0 auto;display:grid;grid-template-columns:repeat(4,1fr)}
        .stat{padding:0 2rem;border-right:1px solid var(--border);text-align:center}
        .stat:last-child{border-right:none}
        .stat-n{font-family:var(--serif);font-size:clamp(1.8rem,3.5vw,2.8rem);font-weight:700;color:var(--gold);line-height:1;margin-bottom:.4rem}
        .stat-l{font-size:.73rem;color:var(--slate);font-weight:500;line-height:1.4}

        /* LAYOUT */
        .sec{max-width:1200px;margin:0 auto;padding:5rem 1.5rem}
        .sec-sm{max-width:1200px;margin:0 auto;padding:2.5rem 1.5rem}
        .lbl{font-size:.68rem;font-weight:700;letter-spacing:.15em;text-transform:uppercase;color:var(--gold);margin-bottom:.6rem;display:block}
        .h2{font-family:var(--serif);font-size:clamp(1.6rem,3vw,2.4rem);font-weight:700;color:var(--white);line-height:1.15;margin-bottom:.75rem}
        .sub{font-size:1rem;color:var(--muted);max-width:560px;line-height:1.75;margin-bottom:2rem}
        hr.div{border:none;border-top:1px solid var(--border);margin:0}

        /* CALC */
        .calc-card{background:var(--ink2);border:1px solid var(--border);border-radius:20px;padding:2.5rem;box-shadow:var(--sh),var(--glow);position:relative;overflow:hidden}
        .calc-card::before{content:'';position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,var(--gold),transparent)}
        .calc-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:1rem;margin:1.5rem 0}
        .calc-field label{display:block;font-size:.7rem;font-weight:700;color:var(--slate);text-transform:uppercase;letter-spacing:.08em;margin-bottom:.5rem}
        .calc-sel{width:100%;background:var(--ink3);border:1px solid var(--border);border-radius:10px;padding:.75rem 1rem;color:var(--light);font-size:.88rem;font-family:var(--sans);appearance:none;cursor:pointer;transition:border-color .2s}
        .calc-sel:focus{outline:none;border-color:var(--gold)}
        .calc-btn{width:100%;background:var(--gold);color:var(--ink);border:none;border-radius:12px;padding:1rem;font-size:1rem;font-weight:700;cursor:pointer;transition:all .25s;font-family:var(--sans);display:flex;align-items:center;justify-content:center;gap:8px}
        .calc-btn:hover{background:var(--gold2);transform:translateY(-1px);box-shadow:0 6px 24px rgba(201,168,76,.3)}
        .calc-btn:disabled{opacity:.5;cursor:not-allowed;transform:none;box-shadow:none}
        .result-box{margin-top:1.5rem;padding:1.75rem;background:rgba(16,185,129,.05);border:1px solid rgba(16,185,129,.18);border-radius:14px;text-align:center;animation:fup .4s ease}
        .result-range{font-family:var(--serif);font-size:clamp(1.9rem,5vw,3rem);font-weight:900;color:var(--green);line-height:1;margin-bottom:.5rem}
        .result-mid{font-size:.88rem;color:var(--slate)}
        .result-disc{font-size:.7rem;color:var(--slate);margin-top:.75rem;line-height:1.5}

        /* TABLE */
        .tbl-wrap{overflow-x:auto;border-radius:var(--r);border:1px solid var(--border)}
        .stbl{width:100%;border-collapse:collapse;min-width:480px}
        .stbl th{background:var(--ink3);padding:.8rem 1.2rem;font-size:.7rem;font-weight:700;color:var(--slate);text-transform:uppercase;letter-spacing:.08em;text-align:left;border-bottom:1px solid var(--border)}
        .stbl td{padding:.9rem 1.2rem;border-bottom:1px solid rgba(255,255,255,.04);font-size:.88rem;color:var(--muted)}
        .stbl tr:last-child td{border-bottom:none}
        .stbl tr:hover td{background:rgba(255,255,255,.02)}
        .stbl td b{color:var(--gold);font-weight:600}

        /* LAW GRID */
        .law-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:1px;background:var(--border);border-radius:var(--r);overflow:hidden;border:1px solid var(--border)}
        .law-item{background:var(--ink2);padding:1.25rem 1.5rem}
        .law-lbl{font-size:.66rem;font-weight:700;color:var(--slate);text-transform:uppercase;letter-spacing:.1em;margin-bottom:.3rem}
        .law-val{font-size:.93rem;font-weight:600;color:var(--white);margin-bottom:.2rem}
        .law-note{font-size:.73rem;color:var(--slate);line-height:1.4}

        /* ACCIDENT TYPES */
        .at-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:1rem}
        .at-card{background:var(--ink2);border:1px solid var(--border);border-radius:16px;padding:1.5rem;transition:all .25s;position:relative;overflow:hidden;cursor:default}
        .at-card::after{content:'';position:absolute;bottom:0;left:0;right:0;height:2px;background:linear-gradient(90deg,var(--gold),var(--gold2));transform:scaleX(0);transform-origin:left;transition:transform .3s ease}
        .at-card:hover{border-color:rgba(201,168,76,.25);transform:translateY(-3px);box-shadow:0 12px 40px rgba(0,0,0,.4)}
        .at-card:hover::after{transform:scaleX(1)}
        .at-lbl{font-size:.66rem;font-weight:700;color:var(--gold);text-transform:uppercase;letter-spacing:.1em;margin-bottom:.5rem}
        .at-title{font-family:var(--serif);font-size:1rem;font-weight:700;color:var(--white);margin-bottom:.75rem;line-height:1.3}
        .at-link{font-size:.78rem;font-weight:600;color:var(--gold)}
        .at-link:hover{color:var(--gold2)}

        /* CITY GRID */
        .city-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:.5rem}
        .city-a{display:flex;flex-direction:column;padding:.75rem 1rem;border-radius:10px;background:var(--ink2);border:1px solid var(--border);transition:all .2s;text-decoration:none}
        .city-a:hover{border-color:rgba(201,168,76,.3);background:var(--ink3);transform:translateY(-2px);box-shadow:0 4px 20px rgba(0,0,0,.35)}
        .city-n{font-size:.85rem;font-weight:600;color:var(--white);margin-bottom:.2rem}
        .city-s{font-size:.68rem;color:var(--slate)}

        /* FAQ */
        .faq-list{display:flex;flex-direction:column;gap:6px}
        .faq-item{background:var(--ink2);border:1px solid var(--border);border-radius:var(--r);overflow:hidden;transition:border-color .2s}
        .faq-item:hover{border-color:rgba(255,255,255,.1)}
        .faq-q{width:100%;text-align:left;background:none;border:none;padding:1.2rem 1.5rem;cursor:pointer;display:flex;justify-content:space-between;align-items:center;gap:1rem;font-size:.93rem;font-weight:600;color:var(--light);font-family:var(--sans);transition:color .2s}
        .faq-q:hover{color:var(--white)}
        .faq-icon{font-size:1.2rem;color:var(--gold);transition:transform .3s;flex-shrink:0;line-height:1}
        .faq-icon.open{transform:rotate(45deg)}
        .faq-a{display:none;padding:0 1.5rem 1.2rem;font-size:.88rem;color:var(--muted);line-height:1.75}
        .faq-a.open{display:block;animation:fup .25s ease}

        /* FORM */
        .form-split{display:grid;grid-template-columns:1fr 1fr;gap:4rem;align-items:center}
        .form-card{background:var(--ink2);border:1px solid rgba(201,168,76,.2);border-radius:20px;padding:2.5rem;position:relative;overflow:hidden;box-shadow:var(--sh),0 0 80px rgba(201,168,76,.05)}
        .form-card::before{content:'';position:absolute;top:0;left:0;right:0;height:2px;background:linear-gradient(90deg,transparent,var(--gold),transparent)}
        .form-row{display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-bottom:1rem}
        .form-f{display:flex;flex-direction:column}
        .form-f label{font-size:.7rem;font-weight:700;color:var(--slate);text-transform:uppercase;letter-spacing:.08em;margin-bottom:.5rem}
        .form-inp{background:var(--ink3);border:1px solid var(--border);border-radius:10px;padding:.8rem 1rem;color:var(--light);font-size:.9rem;font-family:var(--sans);transition:border-color .2s;width:100%}
        .form-inp:focus{outline:none;border-color:var(--gold)}
        .form-sub{width:100%;background:var(--gold);color:var(--ink);border:none;border-radius:12px;padding:1.1rem;font-size:1rem;font-weight:700;cursor:pointer;transition:all .25s;font-family:var(--sans);margin-top:.5rem}
        .form-sub:hover{background:var(--gold2);transform:translateY(-1px);box-shadow:0 8px 30px rgba(201,168,76,.35)}
        .form-note{font-size:.7rem;color:var(--slate);text-align:center;margin-top:.75rem;line-height:1.5}
        .form-ok{text-align:center;padding:2rem 1rem}
        .form-ok-icon{font-size:48px;margin-bottom:1rem}
        .form-ok h3{font-family:var(--serif);font-size:1.5rem;color:var(--white);margin-bottom:.5rem}
        .form-ok p{color:var(--muted);font-size:.88rem}
        .trust-item{display:flex;align-items:center;gap:10px;font-size:.85rem;color:var(--muted);margin-top:.75rem}
        .trust-item::before{content:'✓';color:var(--green);font-weight:700;flex-shrink:0}

        /* BADGES */
        .badge{display:inline-flex;align-items:center;gap:6px;padding:.3rem .85rem;border-radius:999px;font-size:.7rem;font-weight:600}
        .bdg-gold{background:var(--golddim);color:var(--gold);border:1px solid rgba(201,168,76,.2)}
        .bdg-green{background:rgba(16,185,129,.1);color:var(--green);border:1px solid rgba(16,185,129,.2)}

        /* DISC */
        .disc{background:rgba(255,255,255,.015);border:1px solid var(--border);border-radius:var(--r);padding:1.25rem 1.5rem;font-size:.76rem;color:var(--slate);line-height:1.65}

        /* FOOTER */
        .site-footer{border-top:1px solid var(--border);padding:3rem 1.5rem;margin-top:4rem}
        .ftr{max-width:1200px;margin:0 auto}
        .ftr-grid{display:grid;grid-template-columns:1fr 2fr;gap:3rem;margin-bottom:2rem}
        .ftr-brand{font-family:var(--serif);font-size:1.1rem;font-weight:700;color:var(--white);margin-bottom:.4rem}
        .ftr-tag{font-size:.78rem;color:var(--slate)}
        .ftr-links{display:flex;flex-wrap:wrap;gap:.5rem 1.5rem}
        .ftr-links a{color:var(--slate);font-size:.8rem;transition:color .2s}
        .ftr-links a:hover{color:var(--muted)}
        .ftr-bottom{border-top:1px solid var(--border);padding-top:1.25rem;font-size:.73rem;color:var(--slate)}

        /* PUNITIVE NOTE */
        .pun-note{margin-top:.75rem;padding:.75rem 1rem;background:rgba(201,168,76,.07);border-radius:10px;border:1px solid rgba(201,168,76,.18);font-size:.8rem;color:var(--gold);line-height:1.5}

        /* BREADCRUMB */
        .bc{display:flex;gap:.5rem;align-items:center;font-size:.76rem;color:var(--slate);flex-wrap:wrap;margin-bottom:1.5rem}
        .bc a{color:var(--slate);transition:color .2s}
        .bc a:hover{color:var(--muted)}

        /* RESPONSIVE */
        @media(max-width:960px){
          .hdr-nav,.hdr-cta{display:none}
          .mob-toggle{display:block}
          .sticky-bar{display:block}
          .stats-inner{grid-template-columns:1fr 1fr}
          .stat:nth-child(2){border-right:none}
          .stat:nth-child(3){border-top:1px solid var(--border)}
          .stat:nth-child(4){border-right:none;border-top:1px solid var(--border)}
          .calc-grid{grid-template-columns:1fr}
          .law-grid{grid-template-columns:1fr}
          .at-grid{grid-template-columns:1fr 1fr}
          .city-grid{grid-template-columns:1fr 1fr}
          .form-split{grid-template-columns:1fr;gap:2rem}
          .form-row{grid-template-columns:1fr}
          .ftr-grid{grid-template-columns:1fr;gap:1.5rem}
          .sec{padding:3.5rem 1.25rem}
          .hero{padding:120px 1.25rem 60px}
          .calc-card,.form-card{padding:1.5rem}
        }
        @media(max-width:520px){
          .at-grid{grid-template-columns:1fr}
          .city-grid{grid-template-columns:1fr 1fr}
          .stats-inner{grid-template-columns:1fr 1fr}
        }
      `}</style>

      {/* HEADER */}
      <header className="site-header">
        <div className="hdr">
          <a href="/" className="logo">{SITE_NAME}<b>.</b></a>
          <nav className="hdr-nav">
            <a href="/methodology">How It Works</a>
            <a href="/about">About</a>
            <a href="#calculator">Calculator</a>
          </nav>
          <a href="#lead-form" className="hdr-cta">Free Case Review</a>
          <MobileMenu />
        </div>
      </header>

      <a href="#lead-form" className="sticky-bar">Get Your Free Case Review — No Fee Unless You Win</a>

      {/* HERO */}
      <section className="hero">
        <nav className="bc">
          <a href="/">Home</a><span style={{color:'var(--ink3)'}}>›</span><span>{stateInfo.name}</span>
        </nav>
        <div className="eyebrow">{stateInfo.name} · DUI Settlement Research</div>
        <h1>Drunk Driver Settlement<br />Calculator — <i>{stateInfo.name}</i></h1>
        <p className="hero-lead">
          {stateInfo.duiCrashesStatewide.toLocaleString()} drunk driving crashes in {stateInfo.name} last year.
          The average settlement is {stateInfo.avgDuiSettlement} — but your case may be worth significantly more.
          Get a free estimate based on real {stateInfo.name} court records.
        </p>
        <div className="hero-btns">
          <a href="#calculator" className="btn-gold"><span>→</span> Estimate My Settlement</a>
          <a href="#lead-form" className="btn-ghost">Free Attorney Review</a>
        </div>
      </section>

      {/* STATS */}
      <div className="stats-wrap">
        <div className="stats-inner">
          {[
            {n:<Counter value={stateInfo.avgDuiSettlement?.replace?.(/[^0-9]/g,'')||110000} prefix="$"/>, l:`Avg. Settlement\n${stateInfo.name} · 2021–2024`},
            {n:<Counter value={stateInfo.duiCrashesStatewide}/>, l:`DUI Crashes\nStatewide Last Year`},
            {n:stateInfo.sol, l:`Filing Deadline\n${stateInfo.solCitation}`},
            {n:<Counter value={stateInfo.pctOutOfCourt} suffix="%"/>, l:`Settled Out of Court\nin ${stateInfo.name}`},
          ].map((s,i)=>(
            <div key={i} className="stat">
              <div className="stat-n">{s.n}</div>
              <div className="stat-l">{s.l.split('\n').map((t,j)=><span key={j}>{t}{j===0&&<br/>}</span>)}</div>
            </div>
          ))}
        </div>
      </div>

      <hr className="div" />

      {/* CALCULATOR */}
      <div className="sec" id="calculator">
        <span className="lbl">Settlement Estimator</span>
        <h2 className="h2">What Is Your Case Worth?</h2>
        <p className="sub">Based on {stateInfo.name} public court records under {stateInfo.duiStatute}. Results are estimates, not legal advice.</p>
        <div className="calc-card">
          <div className="calc-grid">
            <div className="calc-field">
              <label>Injury Severity</label>
              <select className="calc-sel" value={calcSeverity} onChange={e=>setCalcSeverity(e.target.value)}>
                <option value="">Select injury level...</option>
                <option value="minor">Minor — bruises, soft tissue</option>
                <option value="moderate">Moderate — fractures, ER visit</option>
                <option value="serious">Serious — surgery, hospitalization</option>
                <option value="permanent">Permanent — TBI, spinal, amputation</option>
              </select>
            </div>
            <div className="calc-field">
              <label>Driver's BAC Level</label>
              <select className="calc-sel" value={calcBac} onChange={e=>setCalcBac(e.target.value)}>
                <option value="">Select BAC if known...</option>
                <option value="unknown">Unknown / not tested</option>
                <option value="standard">0.08%–0.14% (legal limit)</option>
                <option value="enhanced">0.15%–0.19% (enhanced)</option>
                <option value="extreme">0.20%+ (extreme / punitive)</option>
              </select>
            </div>
            <div className="calc-field">
              <label>Your Fault Level</label>
              <select className="calc-sel" value={calcLiability} onChange={e=>setCalcLiability(e.target.value)}>
                <option value="">Select liability...</option>
                <option value="none">0% — fully drunk driver's fault</option>
                <option value="minor">1–10% — minor contribution</option>
                <option value="moderate">11–25% — some contribution</option>
                <option value="significant">26%+ — significant contribution</option>
              </select>
            </div>
          </div>
          <button className="calc-btn" onClick={runCalc} disabled={!calcSeverity}>
            <span>⚡</span> Calculate My Estimate
          </button>
          {calcResult && (
            <div className="result-box">
              <div style={{fontSize:'.72rem',color:'var(--slate)',marginBottom:'.5rem',textTransform:'uppercase',letterSpacing:'.08em',fontWeight:600}}>
                Estimated Range · {stateInfo.name}
              </div>
              <div className="result-range">${calcResult.low.toLocaleString()} – ${calcResult.high.toLocaleString()}</div>
              <div className="result-mid">Most likely: ${calcResult.mid.toLocaleString()}</div>
              {stateInfo.punitives?.available && calcBac==='extreme' && (
                <div className="pun-note">⚠️ High BAC qualifies for punitive damages under {stateInfo.duiStatute} — potential additional {stateInfo.punitives.typicalMultiplier || '2x–3x'} multiplier</div>
              )}
              <div className="result-disc">Estimate based on {stateInfo.name} court records 2021–2024 under {stateInfo.duiStatute}. Not legal advice.</div>
            </div>
          )}
        </div>
      </div>

      <hr className="div" />

      {/* SETTLEMENT TABLE */}
      <div className="sec">
        <span className="lbl">Real Data</span>
        <h2 className="h2">Settlement Ranges by Injury Type</h2>
        <p className="sub">Public court records · {stateInfo.name} · 2021–2024</p>
        <div className="tbl-wrap">
          <table className="stbl">
            <thead><tr><th>Injury Type</th><th>Settlement Range</th><th>Key Driver</th></tr></thead>
            <tbody>
              {[
                ['Minor — bruises, soft tissue, no surgery', stateInfo.settlementByInjury?.minor, 'BAC level, liability split'],
                ['Moderate — fractures, ER visit, weeks of recovery', stateInfo.settlementByInjury?.moderate, 'Lost wages, treatment duration'],
                ['Serious — surgery, hospitalization 3+ days', stateInfo.settlementByInjury?.serious, 'Prior DUI, punitive exposure'],
                ['Permanent — TBI, spinal cord, amputation', stateInfo.settlementByInjury?.permanent, 'Life-care plan, future earnings'],
              ].map(([type,range,driver])=>(
                <tr key={type}><td>{type}</td><td><b>{range}</b></td><td style={{color:'var(--slate)',fontSize:'.78rem'}}>{driver}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <hr className="div" />

      {/* LAW */}
      <div className="sec">
        <span className="lbl">{stateInfo.name} Law</span>
        <h2 className="h2">Complete Legal Reference</h2>
        <div style={{display:'flex',gap:'0.75rem',flexWrap:'wrap',marginBottom:'1.75rem'}}>
          {stateInfo.punitives?.available && <span className="badge bdg-gold">⚡ Punitive damages available</span>}
          {stateInfo.dramShop?.available && <span className="badge bdg-green">✓ Dram shop law active</span>}
          <span className="badge bdg-gold">⏱ {stateInfo.sol} filing deadline</span>
        </div>
        <div className="law-grid">
          {[
            ['DUI Statute', stateInfo.duiStatute, null],
            ['BAC Limit', stateInfo.bacLimit, `Enhanced threshold: ${stateInfo.enhancedBac}`],
            ['Filing Deadline', stateInfo.sol, stateInfo.solCitation],
            ['Fault System', stateInfo.fault, stateInfo.faultDetail],
            ['Punitive Damages', stateInfo.punitives?.available?'Available':'Limited', stateInfo.punitives?.cap],
            ['Dram Shop', stateInfo.dramShop?.available?stateInfo.dramShop.statute:'Very Limited', (stateInfo.dramShop?.notes||'').slice(0,90)+'...'],
            ['Avg. Days to Settle', stateInfo.avgDaysToSettle, `${stateInfo.pctOutOfCourt}% settle out of court`],
            ['Court System', stateInfo.court, null],
          ].map(([lbl,val,note])=>(
            <div key={lbl} className="law-item">
              <div className="law-lbl">{lbl}</div>
              <div className="law-val">{val}</div>
              {note && <div className="law-note">{note}</div>}
            </div>
          ))}
        </div>
      </div>

      <hr className="div" />

      {/* ACCIDENT TYPES */}
      <div className="sec">
        <span className="lbl">Browse by Claim Type</span>
        <h2 className="h2">What Kind of Case Do You Have?</h2>
        <p className="sub">Each claim type has different settlement dynamics and legal strategies.</p>
        <div className="at-grid">
          {accidentTypes?.map(acc=>(
            <div key={acc.slug} className="at-card">
              <div className="at-lbl">Claim Type</div>
              <div className="at-title">{acc.label}</div>
              <a href={`/${slugify(stateInfo.cities?.[0]?.name||'city')}-${acc.slug}`} className="at-link">
                See {stateInfo.cities?.[0]?.name} example →
              </a>
            </div>
          ))}
        </div>
      </div>

      <hr className="div" />

      {/* CITIES */}
      <div className="sec">
        <span className="lbl">Browse by City</span>
        <h2 className="h2">{stateInfo.name} — City DUI Data</h2>
        <p className="sub">City-specific courthouse info, local settlement data, and injury calculators.</p>
        <div className="city-grid">
          {stateInfo.cities?.map(city=>(
            <a key={city.name} href={`/${slugify(city.name)}`} className="city-a">
              <span className="city-n">{city.name}</span>
              <span className="city-s">{city.duiCrashes?.toLocaleString()} crashes/yr · {city.county}</span>
            </a>
          ))}
        </div>
      </div>

      <hr className="div" />

      {/* FAQ */}
      <div className="sec">
        <span className="lbl">FAQ</span>
        <h2 className="h2">Common Questions</h2>
        <div className="faq-list" style={{marginTop:'2rem'}}>
          {faqs.map((faq,idx)=>(
            <div key={idx} className="faq-item">
              <button className="faq-q" onClick={()=>setOpenFaq(openFaq===idx?null:idx)}>
                {faq.q}
                <span className={`faq-icon ${openFaq===idx?'open':''}`}>+</span>
              </button>
              <div className={`faq-a ${openFaq===idx?'open':''}`}>{faq.a}</div>
            </div>
          ))}
        </div>
      </div>

      <hr className="div" />

      {/* LEAD FORM */}
      <div className="sec" id="lead-form">
        <div className="form-split">
          <div>
            <span className="lbl">Free Case Review</span>
            <h2 className="h2">Talk to a {stateInfo.name} DUI Attorney</h2>
            <p style={{fontSize:'1rem',color:'var(--muted)',lineHeight:'1.75',marginBottom:'1.5rem'}}>
              Licensed {stateInfo.name} attorneys only. Contingency fee — no upfront cost. Response within 2 hours.
            </p>
            {['No upfront costs — contingency fee only',`Licensed ${stateInfo.name} attorneys`,'Response within 2 hours','Information never shared or sold'].map(item=>(
              <div key={item} className="trust-item">{item}</div>
            ))}
          </div>
          <div className="form-card">
            {formDone ? (
              <div className="form-ok">
                <div className="form-ok-icon">✅</div>
                <h3>You're All Set</h3>
                <p>A licensed {stateInfo.name} attorney will contact you within 2 hours.</p>
              </div>
            ) : (
              <form onSubmit={submitForm}>
                <div className="form-row">
                  <div className="form-f">
                    <label>Full Name</label>
                    <input className="form-inp" type="text" required placeholder="Your name" value={name} onChange={e=>setName(e.target.value)} />
                  </div>
                  <div className="form-f">
                    <label>Phone</label>
                    <input className="form-inp" type="tel" required placeholder="(555) 000-0000" value={phone} onChange={e=>setPhone(e.target.value)} />
                  </div>
                </div>
                <div className="form-f" style={{marginBottom:'1rem'}}>
                  <label>Email</label>
                  <input className="form-inp" type="email" required placeholder="you@email.com" value={email} onChange={e=>setEmail(e.target.value)} />
                </div>
                <button type="submit" className="form-sub">Get My Free Case Review →</button>
                <p className="form-note">Licensed {stateInfo.name} attorneys only. Never sold.</p>
              </form>
            )}
          </div>
        </div>
      </div>

      <hr className="div" />

      {/* DISCLAIMER */}
      <div className="sec-sm">
        <div className="disc">
          <strong style={{color:'var(--muted)'}}>Disclaimer:</strong> Settlement data from NHTSA and {stateInfo.name} public court records (2021–2024).
          Not legal advice. {stateInfo.duiStatute}. Consult a licensed {stateInfo.name} attorney for case-specific guidance.
          Calculator results are statistical estimates — not guaranteed outcomes.
        </div>
      </div>

      {/* FOOTER */}
      <footer className="site-footer">
        <div className="ftr">
          <div className="ftr-grid">
            <div>
              <div className="ftr-brand">{SITE_NAME}.</div>
              <div className="ftr-tag">Independent research. Not a law firm.</div>
            </div>
            <nav className="ftr-links">
              {['/','/about','/methodology','/disclaimer','/privacy','/contact'].map((href,i)=>(
                <a key={href} href={href}>{['Home','About','Methodology','Disclaimer','Privacy','Contact'][i]}</a>
              ))}
              <a href={stateInfo.barUrl} target="_blank" rel="noopener noreferrer">{stateInfo.barName}</a>
            </nav>
          </div>
          <div className="ftr-bottom">
            © {new Date().getFullYear()} {SITE_NAME}. Data: NHTSA, {stateInfo.name} court records. {stateInfo.duiStatute}. Not legal advice.
          </div>
        </div>
      </footer>
    </>
  )
}

export async function getStaticProps({ params }) {
  const { slug } = params
  const stateCode = Object.keys(statesData).find(k => statesData[k].slug === slug)
  if (!stateCode) return { notFound: true }
  const deployedState = process.env.SITE_STATE
  if (deployedState && deployedState !== 'ALL' && stateCode !== deployedState) return { notFound: true }
  const stateInfo = statesData[stateCode]
  const accidentTypes = Object.values(accidentTypesData).map(a => ({ slug: a.slug, label: a.label }))
  return { props: { stateInfo, stateCode, accidentTypes } }
}

export async function getStaticPaths() {
  const deployedState = process.env.SITE_STATE
  const paths = Object.entries(statesData)
    .filter(([code]) => !deployedState || deployedState === 'ALL' || code === deployedState)
    .map(([, state]) => ({ params: { slug: state.slug } }))
  return { paths, fallback: false }
}
