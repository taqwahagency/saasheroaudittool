import { chromium } from 'playwright'
import Anthropic from '@anthropic-ai/sdk'

export interface CriterionResult {
  score: number
  feedback: string
}

export interface AuditResult {
  url: string
  overallScore: number
  screenshotBase64: string
  messaging: {
    headlineClarity: CriterionResult
    valueProposition: CriterionResult
    targetAudience: CriterionResult
    supportingCopy: CriterionResult
  }
  conversion: {
    ctaStrength: CriterionResult
    aboveFold: CriterionResult
    socialProof: CriterionResult
    trustSignals: CriterionResult
  }
  technical: {
    lcpSpeed: CriterionResult
    mobileResponsiveness: CriterionResult
    imageOptimization: CriterionResult
  }
}

// Fetch PageSpeed data
async function getPageSpeedData(url: string) {
  const apiKey = process.env.PAGESPEED_API_KEY
  const endpoint = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&key=${apiKey}&strategy=mobile`

  const res = await fetch(endpoint)
  if (!res.ok) return null

  const data = await res.json()
  const cats = data?.lighthouseResult?.categories
  const audits = data?.lighthouseResult?.audits

  return {
    lcp: audits?.['largest-contentful-paint']?.numericValue ?? null,
    mobileScore: cats?.performance?.score ?? null,
    imageScore: audits?.['uses-optimized-images']?.score ?? null,
    offscreenImages: audits?.['offscreen-images']?.score ?? null,
    usesWebpImages: audits?.['uses-webp-images']?.score ?? null,
  }
}

// Score LCP in ms → 0-10
function scoreLCP(lcpMs: number | null): CriterionResult {
  if (lcpMs === null) {
    return {
      score: 5,
      feedback:
        "We couldn't measure how fast your hero loads this time. A fast-loading hero keeps people on your page — if things feel slow, that's usually the first thing worth fixing.",
    }
  }

  const seconds = lcpMs / 1000

  if (seconds <= 1.5) {
    return {
      score: 10,
      feedback: `Your hero loads in about ${seconds.toFixed(1)} seconds — that's really fast. People land on your page and see it almost instantly, which is exactly what you want.`,
    }
  } else if (seconds <= 2.5) {
    return {
      score: 8,
      feedback: `Your hero takes around ${seconds.toFixed(1)} seconds to fully load. That's decent, but there's a little room to tighten it up. Faster loading means fewer people leaving before they even see what you offer.`,
    }
  } else if (seconds <= 4.0) {
    return {
      score: 5,
      feedback: `Your hero is taking about ${seconds.toFixed(1)} seconds to load. That's on the slower side — a chunk of your visitors will have already mentally checked out before your page is even fully visible.`,
    }
  } else {
    return {
      score: 2,
      feedback: `Your hero is taking ${seconds.toFixed(1)} seconds to load, which is quite slow. Most people won't wait that long. This is worth fixing before anything else — a slow page hurts everything else you've built.`,
    }
  }
}

// Score mobile performance
function scoreMobile(mobileScore: number | null): CriterionResult {
  if (mobileScore === null) {
    return {
      score: 5,
      feedback:
        "We couldn't check how your hero looks on mobile this time. Since most people visit from their phone, it's worth pulling it up on yours and seeing how it feels.",
    }
  }

  const pct = Math.round(mobileScore * 100)

  if (pct >= 90) {
    return {
      score: 10,
      feedback: `Your hero performs really well on mobile (${pct}/100). Someone scrolling on their phone gets a smooth, fast experience — that matters a lot since most visitors are on mobile.`,
    }
  } else if (pct >= 70) {
    return {
      score: 7,
      feedback: `Mobile performance is okay at ${pct}/100, but not quite great. Some visitors on slower phones or connections might notice a bit of lag. Small improvements here can make a real difference.`,
    }
  } else if (pct >= 50) {
    return {
      score: 4,
      feedback: `Mobile performance is at ${pct}/100, which is below average. A lot of your visitors are on phones, and right now the experience for them isn't as smooth as it should be.`,
    }
  } else {
    return {
      score: 2,
      feedback: `Mobile performance is quite low at ${pct}/100. This means people visiting on their phones are likely having a noticeably slow or choppy experience — and that's most of the internet today.`,
    }
  }
}

// Score image optimization
function scoreImages(
  imageScore: number | null,
  offscreen: number | null,
  webp: number | null
): CriterionResult {
  const scores = [imageScore, offscreen, webp].filter((s) => s !== null) as number[]
  if (scores.length === 0) {
    return {
      score: 5,
      feedback:
        "We couldn't check your image setup this time. Optimized images load faster and make your hero feel more polished — worth a look if you haven't already.",
    }
  }

  const avg = scores.reduce((a, b) => a + b, 0) / scores.length
  const score = Math.round(avg * 10)

  if (score >= 8) {
    return {
      score,
      feedback:
        'Your images are well optimized. They load quickly without losing quality, which helps keep your hero feeling fast and clean.',
    }
  } else if (score >= 5) {
    return {
      score,
      feedback:
        "Your images are okay but could be a bit better. Converting to modern formats like WebP and compressing large files can noticeably speed up how fast your hero appears.",
    }
  } else {
    return {
      score,
      feedback:
        "Your images are slowing things down. Large or unoptimized images are one of the most common reasons a hero feels slow. Compressing them and using modern formats is usually a quick win.",
    }
  }
}

// Main Claude analysis
async function analyzeWithClaude(
  screenshotBase64: string,
  heroText: string
): Promise<{
  headlineClarity: CriterionResult
  valueProposition: CriterionResult
  targetAudience: CriterionResult
  supportingCopy: CriterionResult
  ctaStrength: CriterionResult
  aboveFold: CriterionResult
  socialProof: CriterionResult
  trustSignals: CriterionResult
}> {
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

  const prompt = `You are reviewing the hero section of a SaaS website. I'm giving you a screenshot and the text extracted from it.

Your job is to score 8 things, each from 0 to 10, and write honest feedback for each one.

VERY IMPORTANT rules for the feedback writing:
- Write like a smart friend explaining something, not a consultant writing a report
- Use simple, plain language — no marketing jargon, no technical buzzwords
- Be specific to what you actually see on this page, not generic advice
- Keep each feedback to 2-4 sentences
- Be honest — if something is missing or weak, say so clearly but kindly
- Do NOT give recommendations or say "you should" — just describe what you see and why it scores the way it does

Score these 8 things:

1. headlineClarity — Does the main headline clearly say what this product does? Is it easy to understand in 3 seconds?
2. valueProposition — Does the hero communicate a clear reason why someone should care? Is there a benefit that stands out?
3. targetAudience — Can you tell who this product is for? Does it feel like it's speaking to a specific type of person?
4. supportingCopy — Does the text below the headline add useful context, or does it just repeat the same idea?
5. ctaStrength — Is there a clear button or action asking people to do something? Does it stand out and make sense?
6. aboveFold — Is the most important information visible without scrolling? Does the layout prioritize what matters?
7. socialProof — Are there any signs that other people use and trust this product? (logos, reviews, user counts, etc.)
8. trustSignals — Are there any elements that make a first-time visitor feel safe? (security badges, guarantees, recognizable names, etc.)

Extracted hero text:
${heroText}

Respond ONLY in this exact JSON format, nothing else:
{
  "headlineClarity": { "score": 0-10, "feedback": "..." },
  "valueProposition": { "score": 0-10, "feedback": "..." },
  "targetAudience": { "score": 0-10, "feedback": "..." },
  "supportingCopy": { "score": 0-10, "feedback": "..." },
  "ctaStrength": { "score": 0-10, "feedback": "..." },
  "aboveFold": { "score": 0-10, "feedback": "..." },
  "socialProof": { "score": 0-10, "feedback": "..." },
  "trustSignals": { "score": 0-10, "feedback": "..." }
}`

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2048,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: 'image/png',
              data: screenshotBase64,
            },
          },
          {
            type: 'text',
            text: prompt,
          },
        ],
      },
    ],
  })

  const textBlock = message.content.find((block) => block.type === 'text')
  const text = textBlock && textBlock.type === 'text' ? textBlock.text : ''

  // Extract JSON from response
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('Failed to parse Claude response')

  return JSON.parse(jsonMatch[0])
}

export async function runAudit(url: string): Promise<AuditResult> {
  // Ensure URL has protocol
  const fullUrl = url.startsWith('http') ? url : `https://${url}`

  // Launch browser and take screenshot
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()

  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(fullUrl, { waitUntil: 'networkidle', timeout: 30000 })

  // Wait a bit for any animations
  await page.waitForTimeout(2000)

  // Screenshot just the hero (viewport = above the fold)
  const screenshotBuffer = await page.screenshot({
    clip: { x: 0, y: 0, width: 1440, height: 900 },
    type: 'png',
  })

  // Extract text from hero area
  const heroText = await page.evaluate(() => {
    const body = document.body
    const elements = body.querySelectorAll('h1, h2, p, a, button, span, li')
    const texts: string[] = []
    let charCount = 0

    elements.forEach((el) => {
      const text = el.textContent?.trim()
      if (text && text.length > 2 && charCount < 3000) {
        const rect = el.getBoundingClientRect()
        if (rect.top < window.innerHeight && rect.top >= 0) {
          texts.push(text)
          charCount += text.length
        }
      }
    })

    return [...new Set(texts)].join('\n')
  })

  await browser.close()

  const screenshotBase64 = screenshotBuffer.toString('base64')

  // Run PageSpeed and Gemini in parallel
  const [pageSpeedData, aiResults] = await Promise.all([
    getPageSpeedData(fullUrl),
    analyzeWithClaude(screenshotBase64, heroText),
  ])

  // Score technical criteria
  const lcpResult = scoreLCP(pageSpeedData?.lcp ?? null)
  const mobileResult = scoreMobile(pageSpeedData?.mobileScore ?? null)
  const imageResult = scoreImages(
    pageSpeedData?.imageScore ?? null,
    pageSpeedData?.offscreenImages ?? null,
    pageSpeedData?.usesWebpImages ?? null
  )

  // Calculate overall score (average of all 11 criteria)
  const allScores = [
    aiResults.headlineClarity.score,
    aiResults.valueProposition.score,
    aiResults.targetAudience.score,
    aiResults.supportingCopy.score,
    aiResults.ctaStrength.score,
    aiResults.aboveFold.score,
    aiResults.socialProof.score,
    aiResults.trustSignals.score,
    lcpResult.score,
    mobileResult.score,
    imageResult.score,
  ]

  const overallScore = Math.round(
    (allScores.reduce((a, b) => a + b, 0) / allScores.length) * 10
  )

  return {
    url: fullUrl,
    overallScore,
    screenshotBase64,
    messaging: {
      headlineClarity: aiResults.headlineClarity,
      valueProposition: aiResults.valueProposition,
      targetAudience: aiResults.targetAudience,
      supportingCopy: aiResults.supportingCopy,
    },
    conversion: {
      ctaStrength: aiResults.ctaStrength,
      aboveFold: aiResults.aboveFold,
      socialProof: aiResults.socialProof,
      trustSignals: aiResults.trustSignals,
    },
    technical: {
      lcpSpeed: lcpResult,
      mobileResponsiveness: mobileResult,
      imageOptimization: imageResult,
    },
  }
}
