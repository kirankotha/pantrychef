import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

// Fallback chain: best quality first, higher-quota models as fallbacks
const MODELS = ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'gemma2-9b-it']

const DIET_RULES: Record<string, string> = {
  protein: `High-protein plan. Macros: ~35% protein, 40% carbs, 25% fat. Every meal needs a protein source (chicken, fish, eggs, Greek yogurt, legumes, tofu). Prefer brown rice, oats, sweet potato over refined carbs.`,
  gm: `GM Diet strict rules: Mon=fruits only (no banana); Tue=vegetables only (potato+butter at breakfast OK); Wed=fruits+veg (no banana/potato); Thu=bananas+milk only; Fri=tomatoes+lean protein or brown rice; Sat=lean protein or brown rice+veg; Sun=fruit juice+brown rice+veg.`,
  hybrid: `Balanced hybrid plan. Macros: ~25% protein, 45% carbs, 30% fat. Mix plant and animal protein. Include one vegetarian day. Healthy fats from avocado, nuts, olive oil. Whole grains and colourful veg every day.`,
}

const buildPrompt = (dietType: string, targetCalories: number, cuisine: string, avoidIngredients: string[]): string => {
  const cuisineLine = cuisine ? `Cuisine: ${cuisine} style throughout.` : ''
  const avoidLine = avoidIngredients.length > 0 ? `NEVER use: ${avoidIngredients.join(', ')}.` : ''

  return `Generate a 7-day ${dietType} diet meal plan at ${targetCalories} kcal/day.
Rules: ${DIET_RULES[dietType]}
${cuisineLine} ${avoidLine}
Return ONLY compact JSON (no markdown):
{"plan":{"name":"7-Day ${dietType} plan${cuisine ? ' (' + cuisine + ')' : ''}","description":"...","weeklyAvgCalories":${targetCalories},"days":[{"day":"Monday","breakfast":{"name":"...","calories":0,"protein":0,"carbs":0,"fat":0,"prepTime":0,"ingredients":[{"name":"...","amount":"...","grams":0}],"instructions":["..."]},"lunch":{same},"dinner":{same},"snack":{same},"totalCalories":0,"totalProtein":0,"totalCarbs":0,"totalFat":0}]}}
Rules: all 7 days, 2-3 ingredients per meal with gram weights, 2 instructions per meal, meal calories sum to ${targetCalories} per day, no repeated dishes.`
}

async function callWithFallback(openai: OpenAI, prompt: string): Promise<string> {
  let lastError: any
  for (const model of MODELS) {
    try {
      const completion = await openai.chat.completions.create({
        model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.6,
        max_tokens: 5000,
        response_format: { type: 'json_object' },
      })
      const content = completion.choices[0]?.message?.content
      if (!content) throw new Error('Empty response')
      return content
    } catch (err: any) {
      lastError = err
      const isRateLimit = err?.status === 429 || err?.code === 'rate_limit_exceeded'
      const isTooBig = err?.code === 'rate_limit_exceeded' && err?.error?.message?.includes('tokens per minute')
      // Only try next model if this one is rate-limited (not for other errors)
      if (isRateLimit && !isTooBig) {
        console.warn(`Model ${model} rate limited, trying next...`)
        continue
      }
      throw err
    }
  }
  throw lastError
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { dietType, targetCalories, cuisine = '', avoidIngredients = [] } = body

    if (!['protein', 'gm', 'hybrid'].includes(dietType)) {
      return NextResponse.json({ error: 'Invalid diet type' }, { status: 400 })
    }
    if (!targetCalories || targetCalories < 1000 || targetCalories > 4000) {
      return NextResponse.json({ error: 'Target calories must be between 1000 and 4000' }, { status: 400 })
    }
    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json({ error: 'Groq API key not configured' }, { status: 500 })
    }

    const openai = new OpenAI({
      apiKey: process.env.GROQ_API_KEY,
      baseURL: 'https://api.groq.com/openai/v1',
    })

    const content = await callWithFallback(openai, buildPrompt(dietType, targetCalories, cuisine, avoidIngredients))

    const parsed = JSON.parse(content)
    if (!parsed.plan?.days?.length) {
      return NextResponse.json({ error: 'AI returned an incomplete plan. Please try again.' }, { status: 500 })
    }

    return NextResponse.json({ plan: parsed.plan })
  } catch (error: any) {
    console.error('Diet plan generation error:', error)
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: 'Failed to parse AI response. Please try again.' }, { status: 500 })
    }
    if (error?.status === 429 || error?.code === 'rate_limit_exceeded') {
      const msg = error?.error?.message || ''
      const waitMatch = msg.match(/try again in ([\dhms.]+)/)
      const wait = waitMatch ? ` Try again in ${waitMatch[1]}.` : ' Please wait a few minutes and try again.'
      return NextResponse.json({ error: `AI quota exhausted across all models.${wait}` }, { status: 429 })
    }
    return NextResponse.json({ error: 'Failed to generate diet plan. Please try again.' }, { status: 500 })
  }
}
