import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

// Fallback chain: best quality first, higher-quota models as fallbacks
const MODELS = ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'gemma2-9b-it']

const DIET_RULES: Record<string, string> = {
  // Existing
  protein: `High-protein. Macros: ~35% protein, 40% carbs, 25% fat. Every meal needs a protein source (chicken, fish, eggs, yogurt, legumes, tofu). Prefer brown rice, oats, sweet potato.`,
  gm: `GM Diet strict rules: Mon=fruits only (no banana); Tue=veg only (potato+butter at breakfast OK); Wed=fruits+veg (no banana/potato); Thu=bananas+milk only; Fri=tomatoes+lean protein or brown rice; Sat=lean protein or rice+veg; Sun=fruit juice+rice+veg.`,
  hybrid: `Balanced hybrid. Macros: ~25% protein, 45% carbs, 30% fat. Mix plant and animal protein. One vegetarian day. Healthy fats from avocado, nuts, olive oil. Whole grains and colourful veg daily.`,
  // Weight Loss
  keto: `Ketogenic. Under 20g net carbs/day. Macros: ~70% fat, 25% protein, 5% carbs. Foods: meat, fish, eggs, cheese, butter, nuts, seeds, avocado, leafy greens. STRICTLY NO grains, sugar, fruit (except small berries), legumes, starchy veg.`,
  'low-gi': `Low-GI/Diabetic. All foods must have low-to-medium glycemic index. Focus: whole grains, legumes, non-starchy veg, lean protein. Max 45g carbs per meal. AVOID white bread, white rice, sugary foods, processed carbs, fruit juice.`,
  vlcd: `Very Low Calorie Diet (VLCD). Total 800–1000 kcal/day strictly. Macros: ~40% protein to preserve muscle, 35% carbs, 25% fat. Very small portions. Focus: lean protein, non-starchy veg, minimal healthy fats. No added sugars or oils.`,
  'intermittent-fasting': `Intermittent Fasting 16:8. NO breakfast — eating window is 12pm–8pm only. Generate: lunch (12pm), snack (3–4pm), dinner (7–8pm). Skip the breakfast slot entirely (set breakfast name to "Fasting window — no meal", calories 0). Lunch and dinner are full satisfying meals.`,
  // Muscle & Athletic
  bulking: `Bulking/Mass gain. Caloric surplus: targetCalories is already set high. Macros: ~35% protein, 45% carbs, 20% fat. Large portions, calorie-dense foods. Post-workout meals rich in carbs+protein. Include red meat, whole eggs, rice, oats, bananas, peanut butter.`,
  cutting: `Cutting (fat loss, preserve muscle). Caloric deficit built into targetCalories. Macros: ~40% protein, 35% carbs, 25% fat. High protein every meal to prevent muscle loss. Complex carbs only. Low-fat cooking methods (grilled, steamed, baked). No fried food.`,
  endurance: `Endurance/Athlete plan. Macros: ~60% carbs, 20% protein, 20% fat. Carbohydrate-rich for glycogen replenishment. Pre-workout meals: carb-heavy. Post-workout: carbs+protein. Staples: pasta, rice, oats, sweet potato, banana, chicken, fish.`,
  // Health & Wellness
  mediterranean: `Mediterranean Diet. Olive oil as primary fat every day. Fish or seafood at least 2 days. Lots of vegetables, legumes, whole grains, nuts. Moderate dairy and poultry. Limit red meat to once a week. Herbs and spices instead of salt. No processed food.`,
  dash: `DASH Diet (blood pressure). Keep sodium under 1500mg/day total. Low saturated fat. High in potassium, calcium, magnesium. Focus: fruits, veg, whole grains, low-fat dairy, lean protein. NO processed food, canned soups, salty snacks, added salt.`,
  'anti-inflammatory': `Anti-Inflammatory Diet. Prioritise: omega-3 rich foods (salmon, sardines, walnuts, flaxseed), turmeric, ginger, berries, dark leafy greens, olive oil, avocado, green tea. AVOID refined sugar, trans fats, processed/fried food, refined carbs, excess alcohol.`,
  'gut-health': `Gut Health Diet. Include fermented foods daily (yogurt, kefir, kimchi, sauerkraut, miso). High fibre target 30g/day. Prebiotic foods: garlic, onion, leek, banana, oats, asparagus. Diverse plant foods (aim 30+ different plants/week). AVOID: processed food, artificial sweeteners, excess alcohol.`,
  // Lifestyle & Ethical
  vegan: `Vegan Diet. ZERO animal products — no meat, poultry, fish, dairy, eggs, honey or gelatin. Protein from: tofu, tempeh, seitan, lentils, chickpeas, black beans, edamame, quinoa. Ensure calcium (fortified plant milk, tofu, kale), iron (lentils, spinach), omega-3 (flaxseed, walnuts), B12 (nutritional yeast, fortified foods).`,
  paleo: `Paleo Diet. ONLY foods available pre-agriculture. YES: meat, fish, eggs, vegetables, fruits, nuts, seeds, natural fats (olive oil, coconut oil, ghee). STRICTLY NO: grains (rice, wheat, oats), legumes (beans, lentils, peanuts), dairy, refined sugar, processed food, vegetable oils.`,
  whole30: `Whole30 (strict 30-day elimination). STRICTLY NO: sugar of any kind, alcohol, grains, legumes (including peanuts and soy), dairy, MSG, sulfites, carrageenan, or any processed additives. YES: meat, seafood, eggs, vegetables, fruit, natural fats (olive oil, coconut oil, ghee, avocado), nuts and seeds (except peanuts).`,
  flexitarian: `Flexitarian Diet. Mostly plant-based with occasional meat. Plan: 5 vegetarian days + 2 days with small portion of meat or fish (max 100g). Plant protein primary: legumes, tofu, tempeh, eggs, dairy. High in whole grains, veg, fruits. Minimal processed food.`,
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

    const VALID_TYPES = ['protein','gm','hybrid','keto','low-gi','vlcd','intermittent-fasting','bulking','cutting','endurance','mediterranean','dash','anti-inflammatory','gut-health','vegan','paleo','whole30','flexitarian']
    if (!VALID_TYPES.includes(dietType)) {
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
