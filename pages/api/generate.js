/**
 * /api/generate — Server-side generation endpoint
 * Token-ul GitHub și parola stau DOAR în environment variables, nu în browser.
 */

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  // Auth check
  const { password, config } = req.body
  const validPassword = process.env.GENERATOR_PASSWORD
  if (!validPassword || password !== validPassword) {
    return res.status(401).json({ error: 'Parolă incorectă' })
  }

  const githubToken = process.env.GITHUB_TOKEN
  const githubRepo = process.env.GITHUB_REPO || 'Emanuellovin25/SolveMydui'
  const anthropicKey = process.env.ANTHROPIC_API_KEY

  if (!githubToken) return res.status(500).json({ error: 'GITHUB_TOKEN lipsă din environment variables' })
  if (!anthropicKey) return res.status(500).json({ error: 'ANTHROPIC_API_KEY lipsă din environment variables' })

  const { selectedState, selectedCities, selectedTone, selectedAccidents, selectedLevel, keywords, pageLimit, statesMetaName, accidentLabels: customLabels } = config

  const TONES = {
    empathetic: 'Warm, empathetic, focused on victim recovery and healing',
    aggressive: 'Direct, urgent, maximize compensation, fight for every dollar',
    neutral: 'Professional, data-driven, balanced and informative',
    urgent: 'Time-sensitive, deadline-focused, act now before it is too late',
  }

  const ACCIDENT_LABELS = {
    'drunk-driver': 'Drunk Driver Settlement',
    'enhanced-bac': 'High BAC / Extreme DUI Settlement',
    'dram-shop': 'Bar / Restaurant Liable — Dram Shop Claim',
  }

  function slugify(s) {
    return s.toLowerCase().replace(/\./g,'').replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'')
  }

  try {
    // 1. Fetch current pages.json from GitHub
    const fileRes = await fetch(`https://api.github.com/repos/${githubRepo}/contents/data/pages.json`, {
      headers: { Authorization: `token ${githubToken}`, Accept: 'application/vnd.github.v3+json' }
    })
    if (!fileRes.ok) throw new Error('Nu pot citi pages.json din GitHub')
    const fileData = await fileRes.json()
    const existingPages = JSON.parse(Buffer.from(fileData.content, 'base64').toString('utf8'))
    const fileSha = fileData.sha

    // 2. Generate pages
    const newPages = []
    const keywordList = (keywords || '').split(',').map(k => k.trim()).filter(Boolean)
    const toneDesc = TONES[selectedTone] || TONES.neutral

    const citiesToProcess = selectedCities.slice(0, pageLimit)

    for (const city of citiesToProcess) {
      for (const accidentId of selectedAccidents) {
        if (newPages.length >= pageLimit) break

        const citySlug = slugify(city)
        const slug = selectedLevel === '1' ? citySlug : `${citySlug}-${accidentId}`

        // Skip if already exists
        if (existingPages.find(p => p.slug === slug)) continue

        const accidentLabel = (customLabels && customLabels[accidentId]) || ACCIDENT_LABELS[accidentId] || accidentId

        const prompt = `You are an expert legal content writer for a drunk driver settlement calculator website.

Generate unique, compelling SEO content for this specific page:
- State: ${statesMetaName} (${selectedState})
- City: ${city}
- Accident type: ${accidentLabel}
- Writing tone: ${toneDesc}
${keywordList.length > 0 ? `- Include these keywords naturally: ${keywordList.join(', ')}` : ''}
- Page level: ${selectedLevel}

Return ONLY a valid JSON object with exactly these fields:
{
  "metaTitle": "under 60 chars, include city + drunk driver settlement",
  "metaDescription": "under 155 chars, compelling with call to action",
  "h1": "powerful headline with city name",
  "hook": "2-3 sentences with ${toneDesc} tone, mention state law",
  "section1Title": "unique section heading",
  "section1Body": "120-150 words, unique angle, naturally include keywords",
  "section2Title": "unique section heading",
  "section2Body": "120-150 words, different angle from section 1",
  "section3Title": "unique section heading",
  "section3Body": "120-150 words, focus on local specifics and next steps"
}

No markdown, no code blocks, just the raw JSON object.`

        const aiRes = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': anthropicKey,
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model: 'claude-sonnet-4-6',
            max_tokens: 1000,
            messages: [{ role: 'user', content: prompt }]
          })
        })

        const aiData = await aiRes.json()
        if (aiData.error) throw new Error(`Claude API: ${aiData.error.message}`)

        const text = aiData.content.map(c => c.text || '').join('')
        const clean = text.replace(/```json\n?/g,'').replace(/```\n?/g,'').trim()
        const content = JSON.parse(clean)

        newPages.push({
          slug,
          stateCode: selectedState,
          cityName: city,
          stateName: statesMetaName,
          accidentType: accidentId,
          accidentSlug: accidentId,
          accidentLabel,
          level: parseInt(selectedLevel),
          tone: selectedTone,
          keywords: keywordList,
          content,
          courthouse: `${city} District Court`,
          cityAccidents: Math.floor(Math.random() * 3000) + 200,
          updatedAt: new Date().toISOString(),
        })

        // Small delay to avoid rate limits
        await new Promise(r => setTimeout(r, 300))
      }
      if (newPages.length >= pageLimit) break
    }

    if (newPages.length === 0) {
      return res.status(200).json({ success: true, generated: 0, message: 'Toate paginile există deja' })
    }

    // 3. Commit to GitHub
    const allPages = [...existingPages, ...newPages]
    const newContent = Buffer.from(JSON.stringify(allPages, null, 2)).toString('base64')

    const commitRes = await fetch(`https://api.github.com/repos/${githubRepo}/contents/data/pages.json`, {
      method: 'PUT',
      headers: {
        Authorization: `token ${githubToken}`,
        'Content-Type': 'application/json',
        Accept: 'application/vnd.github.v3+json',
      },
      body: JSON.stringify({
        message: `generator: add ${newPages.length} pages for ${statesMetaName} (${selectedTone} tone)`,
        content: newContent,
        sha: fileSha,
      })
    })

    if (!commitRes.ok) {
      const errData = await commitRes.json()
      throw new Error(`GitHub commit failed: ${errData.message}`)
    }

    return res.status(200).json({
      success: true,
      generated: newPages.length,
      pages: newPages.map(p => p.slug),
    })

  } catch (err) {
    console.error('Generator error:', err)
    return res.status(500).json({ error: err.message })
  }
}
