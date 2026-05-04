import { NextSeo } from 'next-seo'
const SITE_URL = process.env.SITE_URL || 'https://drunkdriversettlement.com'
const SITE_NAME = process.env.SITE_NAME || 'Drunk Driver Settlement Calculator'

export default function Methodology() {
  return (
    <>
      <NextSeo
        title={`How the Calculator Works — ${SITE_NAME}`}
        description="How our drunk driver settlement calculator uses real state laws, BAC levels, fault rules, and court data to produce location-specific estimates."
        canonical={`${SITE_URL}/methodology`}
      />
      <header className="site-header">
        <div className="header-inner">
          <a href="/" className="site-logo">{SITE_NAME}</a>
          <nav className="header-nav"><a href="/about">About</a><a href="/contact">Contact</a></nav>
        </div>
      </header>
      <main>
        <div className="container static-page">
          <h1>How the Settlement Calculator Works</h1>
          <p className="lead-text">
            Our calculator applies state-specific legal variables to public court settlement data. Here's exactly what goes into each estimate — and what doesn't.
          </p>

          <h2>The Base Settlement Figure</h2>
          <p>
            Each state has a different average settlement for drunk driver injury cases. We derive these figures from state court public records, NHTSA crash data, and American Bar Foundation research. These are averages across all injury severities in each state — they are not the starting point for any individual case.
          </p>
          <p>
            The base figures for our 8 covered states range from $58,100 (Ohio average, all injury types) to $112,000 (New York average). These are lower than what you'll read on law firm websites — that's intentional. Law firms publish high-end cases. We publish averages.
          </p>

          <h2>Injury Severity Multipliers</h2>
          <p>
            The single largest factor in any personal injury settlement is the severity of injury. We apply four tiers, based on Jury Verdict Research data calibrated to drunk driver cases:
          </p>
          <ul>
            <li><strong>Minor (bruises, soft tissue):</strong> 0.12x the state base average</li>
            <li><strong>Moderate (fractures, ER visit):</strong> 0.42x the base</li>
            <li><strong>Serious (surgery, hospitalization):</strong> 1.0x the base</li>
            <li><strong>Permanent / life-altering:</strong> 2.4x the base</li>
          </ul>
          <p>The resulting figure is presented as a range (55%–220% of the midpoint) to reflect real-world variance.</p>

          <h2>Fault and Comparative Negligence</h2>
          <p>
            Each state applies a different fault rule. Our calculator uses the actual rule for your state:
          </p>
          <ul>
            <li><strong>Pure comparative fault (CA, NY, AZ):</strong> Your award is reduced proportionally by your fault — even if you were 80% at fault, you recover 20%.</li>
            <li><strong>Modified comparative fault, 51% bar (TX, FL, IL, OH):</strong> You can recover as long as you were not more than 50% at fault. Above 51%, recovery is barred.</li>
            <li><strong>Modified comparative fault, 50% bar (GA):</strong> Recovery barred if you were 50% or more at fault.</li>
          </ul>
          <p>
            The fault adjustment reduces the estimate: full fault at other driver reduces nothing; 75% their fault reduces by 25%; 50/50 reduces by approximately 55% (reflecting negotiation leverage at the bar threshold).
          </p>

          <h2>BAC Level and Punitive Damages</h2>
          <p>
            The drunk driver's BAC at the time of the accident affects punitive damages exposure — not the base compensatory award. Punitive damages are a separate calculation:
          </p>
          <ul>
            <li><strong>0.08%–0.14%:</strong> Punitive damages are arguable but not automatic. 1.22x adjustment.</li>
            <li><strong>0.15%–0.19% (Enhanced/Extreme DUI):</strong> Strong punitive argument in all states. 1.58x adjustment. Most states treat this as aggravated DUI.</li>
            <li><strong>0.20%+ (Super Extreme/Aggravated):</strong> Near-automatic punitive damages in states where available. 1.95x adjustment. Punitive awards at this BAC level are rarely contested at trial.</li>
          </ul>
          <p>
            Punitive damages caps vary by state: uncapped in CA, NY, GA, IL, AZ; capped at 2x compensatory in TX and OH; capped at 3x in FL. The calculator notes which rule applies.
          </p>

          <h2>Dram Shop Liability</h2>
          <p>
            When a bar or restaurant served the drunk driver before the accident, a second defendant may be available under dram shop law. Availability varies significantly by state:
          </p>
          <ul>
            <li><strong>Strong dram shop states:</strong> NY (General Obligations Law § 11-101), IL (235 ILCS 5/6-21 — strict liability), TX (Alcoholic Beverage Code § 2.02)</li>
            <li><strong>Moderate:</strong> FL, GA, AZ, OH — available with showing of visible intoxication</li>
            <li><strong>Very limited:</strong> CA (Business & Professions Code § 25602) — only applies if driver was a minor served illegally</li>
          </ul>
          <p>The calculator flags dram shop availability for your state and adjusts the estimate upward (1.32x) when a confirmed bar visit is indicated.</p>

          <h2>What the Calculator Does Not Include</h2>
          <p>
            The estimate does not include: attorney fees (typically 33%), medical liens from your health insurance, property damage (vehicles are a separate claim), or non-economic damages beyond what's captured in the injury severity multiplier. It also does not account for insurance policy limits — if the at-fault driver is underinsured, recovery may be capped regardless of case value.
          </p>

          <h2>Confidence Interval</h2>
          <p>
            We present results as a range (low–high) rather than a single number because settlement outcomes are inherently variable. The low figure is approximately 55% of the midpoint; the high is approximately 220%. Most cases with comparable facts settle within this range. Outliers exist in both directions.
          </p>

          <div className="legal-disclaimer" style={{marginTop:'2rem'}}>
            These calculations are for informational purposes only. They do not constitute legal advice or a prediction of your specific case outcome. Consult a licensed attorney in your state for a case-specific evaluation.
          </div>
        </div>
      </main>
      <footer className="site-footer">
        <div className="footer-inner">
          <div className="footer-links">
            <a href="/">Home</a><a href="/about">About</a><a href="/privacy">Privacy</a><a href="/contact">Contact</a>
          </div>
          <p style={{marginTop:'0.5rem',fontSize:'0.78rem',color:'#aaa'}}>© {new Date().getFullYear()} {SITE_NAME}. Not a law firm.</p>
        </div>
      </footer>
    </>
  )
}
