# Drunk Driver Settlement Calculator — v3
## Programmatic SEO + Lead Gen · 8 States · 3-Level URL Architecture

---

## What you need from me → everything else is automated

| Task | Who does it | Time |
|------|-------------|------|
| Register domain | **You** | 5 min |
| Create Vercel account | **You** | 5 min |
| Get Anthropic API key | **You** | 5 min |
| Get Boberdoo account | **You** | 15 min |
| Set up Google Search Console | **You** | 10 min |
| Everything else | Automated | — |

---

## Setup (one time only)

```bash
# 1. Install dependencies
npm install

# 2. Create your environment file
cp .env.example .env.local
```

Edit `.env.local`:
```env
ANTHROPIC_API_KEY=sk-ant-xxxxxx        ← from console.anthropic.com
SITE_STATE=TX                           ← which state this deploy serves
SITE_NAME=Drunk Driver Settlement Calculator
SITE_URL=https://drunkdriversettlement.com
AUTHOR_NAME=Settlement Research Team
NOTIFICATION_EMAIL=you@youremail.com
RESEND_API_KEY=re_xxxx                 ← from resend.com (free tier: 3k emails/month)
BOBERDOO_API_KEY=                      ← add when you have account
ADMIN_KEY=choose-a-secret-key          ← for /api/admin dashboard
```

---

## Week 1 — Generate content for Texas

### Step 1: Dry run (free, no API calls)
```bash
node lib/safe-publish.js --state TX --plan
```
Shows the full publishing schedule before spending any API credits.

### Step 2: Day 1 — Generate city hub pages (Level 1)
```bash
node lib/safe-publish.js --state TX --day 1
```
Generates ~22 Level 1 city hub pages. Uses ~$0.40 in Claude API credits.

### Step 3: Build and deploy
```bash
npm run build
vercel deploy
```

### Step 4: Submit sitemap to Google
```bash
node lib/sitemap-submit.js --ping
```

### Step 5: Following days — keep going
```bash
# Each morning, run the next day's batch:
node lib/safe-publish.js --state TX --auto
npm run build && vercel deploy
node lib/sitemap-submit.js --ping
```

---

## Full publishing schedule for Texas (~28 days)

| Week | Phases | Pages | Daily limit |
|------|--------|-------|-------------|
| Week 1 | Level 1 (all city hubs) | 43 | 22/day |
| Week 2 | Level 2 (top cities × claim types) | ~66 | 22/day |
| Week 3 | Level 2 remaining + L3 start | ~110 | 22/day |
| Week 4 | Level 3 ultra-deep variations | ~210 | 22/day |
| **Total** | — | **~430 pages** | — |

**Cost: ~$8.60 in Claude API credits** (claude-opus-4-6 at $0.02/page)

---

## Adding a second state (20 minutes)

```bash
# 1. In Vercel: create NEW project from SAME GitHub repo
# 2. Set different env vars:
SITE_STATE=CA
SITE_URL=https://drunkdriversettlementa-ca.com  (or subpath on same domain)

# 3. Generate California content:
node lib/safe-publish.js --state CA --day 1
npm run build && vercel deploy
```

---

## Monetization — connect Boberdoo (lead network)

1. Register at **boberdoo.com** → choose "Personal Injury" vertical
2. Get your API key from the dashboard
3. Add to `.env.local`: `BOBERDOO_API_KEY=your-key`
4. The integration is already coded in `pages/api/lead.js` — just add the key
5. Typical payout: **$400–$800 per lead** depending on BAC and injury level

Lead values are pre-calculated in the API based on injury + BAC inputs.

---

## Monetization — lease to attorneys (alternative)

Instead of Boberdoo, find personal injury attorneys in your state who advertise on Google.
Offer: "I'll hand you all leads from my DUI settlement site in your state for $X/month flat."

Suggested rates (from states.json):
- Texas: $3,000/mo
- California: $4,000/mo
- Florida: $2,500/mo
- New York: $3,500/mo
- Georgia: $2,000/mo

Show them Search Console data each month for retention.

---

## Daily workflow (after setup)

```bash
# Morning (~10 min)
node lib/safe-publish.js --state TX --auto   # generates today's batch
node lib/safety-check.js --state TX           # validates content quality
npm run build                                  # builds Next.js
vercel deploy                                  # deploys to Vercel
node lib/sitemap-submit.js --ping             # pings Google
```

---

## Check your stats

```bash
# Page count by state
node lib/matrix.js --state TX --count

# Safety check before deploy
node lib/safety-check.js

# Lead/page stats (once deployed)
curl https://drunkdriversettlement.com/api/admin?key=YOUR_ADMIN_KEY
```

---

## Project structure

```
drunk-driver-settlement/
├── pages/
│   ├── index.js              ← State homepage
│   ├── [state].js            ← State hub pages (/texas, /california, etc.)
│   ├── [slug].js             ← All city/type/variation pages
│   ├── about.js              ← About page (entity establishment)
│   ├── methodology.js        ← How calculator works (E-E-A-T signal)
│   ├── disclaimer.js         ← Legal disclaimer
│   ├── privacy.js            ← Privacy policy
│   ├── contact.js            ← Contact form
│   ├── thank-you.js          ← Post-submission page
│   └── api/
│       ├── lead.js           ← Lead routing (Boberdoo + Resend + Webhooks)
│       └── admin.js          ← Stats dashboard
├── lib/
│   ├── generate.js           ← Content generator (Claude API)
│   ├── calculationRules.js   ← State-specific settlement calculator logic
│   ├── matrix.js             ← URL matrix planner
│   ├── safe-publish.js       ← Google-safe publishing scheduler
│   ├── safety-check.js       ← Pre-deploy content validator
│   └── sitemap-submit.js     ← Google Search Console submitter
├── data/
│   ├── states.json           ← 8 states with REAL legal data per state
│   ├── accident-types.json   ← Claim types with calculator multipliers
│   └── pages.json            ← Generated content (starts empty)
└── styles/globals.css        ← Complete design system
```

---

## Google safety rules (non-negotiable)

- ✅ Max 22 pages/day per domain — `safe-publish.js` enforces this
- ✅ Run `safety-check.js` before every deploy
- ✅ Never publish overnight — run batches during business hours
- ✅ Submit sitemap after each deploy
- ✅ Each page uses real city DUI data + state-specific statute citations
- ✅ Calculator produces genuinely different outputs per state (different fault rules)
- ❌ Never duplicate content across states
- ❌ Never change just the city name in otherwise identical text

---

## Cost estimate — Texas fully built

| Item | Cost |
|------|------|
| Claude API (430 pages × $0.02) | ~$8.60 |
| Domain registration | ~$12/year |
| Vercel (free tier) | $0 |
| Resend (free tier: 3k emails/mo) | $0 |
| **Total to launch Texas** | **~$21** |

---

## Revenue timeline

```
Month 1–2: Building and indexing (0 revenue — normal)
Month 3:   First organic leads ($2–5K)
Month 4:   Scaling ($8–15K)
Month 5–6: Momentum ($15–25K/month)
At 5 states active: $14,000–$20,000 MRR
```

---

Built with Claude Opus 4.6. Not legal or financial advice.
