import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const DIET_CONFIGS: Record<string, { label: string; description: string; rules: string }> = {
  protein: {
    label: 'Protein Diet',
    description: 'High-protein plan for muscle building and satiety',
    rules: `PROTEIN DIET RULES:
- Macros: ~35% protein, 40% carbs, 25% fat
- Every meal must include a significant protein source (chicken, fish, eggs, Greek yogurt, legumes, tofu)
- Lean meats, eggs, dairy, legumes, quinoa are staples
- Limit refined carbs — prefer brown rice, oats, sweet potato
- Include at least 2 vegetables per lunch/dinner`,
  },
  gm: {
    label: 'GM Diet',
    description: 'General Motors 7-day detox cleanse',
    rules: `GM DIET STRICT RULES (follow exactly):
- Day 1 (Monday): ONLY fruits — no bananas. Unlimited portions. Watermelon, cantaloupe, apples, oranges, etc.
- Day 2 (Tuesday): ONLY vegetables — raw or cooked. One boiled potato with butter at breakfast. No fruits.
- Day 3 (Wednesday): Fruits + vegetables combined — no bananas, no potatoes.
- Day 4 (Thursday): ONLY bananas + milk — up to 8 bananas and 3 glasses of milk all day.
- Day 5 (Friday): Tomatoes + protein — 6 tomatoes + 280g lean chicken or fish or 1 cup brown rice (vegetarian).
- Day 6 (Saturday): Protein/rice + unlimited vegetables — 280g chicken/fish OR 1 cup brown rice + unlimited veg.
- Day 7 (Sunday): Fruit juice + 1 cup brown rice + all vegetables you want.
- Keep snack consistent with that day's allowed foods.
- Drink 8–10 glasses of water daily.`,
  },
  hybrid: {
    label: 'Hybrid Diet',
    description: 'Balanced, sustainable plan blending multiple diet principles',
    rules: `HYBRID DIET RULES:
- Macros: ~25% protein, 45% carbs, 30% fat
- Mix plant-based and animal protein across the week
- Alternate between heavier and lighter days
- Include one vegetarian day, one high-protein day, one Mediterranean-style day
- Healthy fats from avocado, nuts, olive oil, salmon
- Whole grains, legumes, and colorful vegetables every day
- No processed foods, minimal sugar`,
  },
}

const buildPrompt = (dietType: string, targetCalories: number, cuisine: string, avoidIngredients: string[]): string => {
  const config = DIET_CONFIGS[dietType]
  const cuisineLine = cuisine ? `- Cuisine style: ${cuisine} — all meals should reflect ${cuisine} cooking traditions and ingredients.` : ''
  const avoidLine = avoidIngredients.length > 0
    ? `- STRICTLY avoid these ingredients in every meal: ${avoidIngredients.join(', ')}. Do not use them or any derivatives.`
    : ''

  return `You are an expert nutritionist. Generate a precise 7-day ${config.label} meal plan targeting ${targetCalories} kcal per day.

${config.rules}
${cuisineLine}
${avoidLine}

CRITICAL: Return ONLY valid JSON. No markdown, no text outside JSON.

Use this EXACT JSON structure:
{
  "plan": {
    "name": "7-Day ${config.label}${cuisine ? ' (' + cuisine + ')' : ''}",
    "description": "${config.description}",
    "weeklyAvgCalories": ${targetCalories},
    "days": [
      {
        "day": "Monday",
        "breakfast": {
          "name": "Meal name",
          "calories": 400,
          "protein": 30,
          "carbs": 40,
          "fat": 10,
          "prepTime": 10,
          "ingredients": [
            {"name": "ingredient name", "amount": "200g", "grams": 200},
            {"name": "another item", "amount": "2 large", "grams": 120}
          ],
          "instructions": ["Step 1 instruction.", "Step 2 instruction.", "Step 3 instruction."]
        },
        "lunch": { same structure },
        "dinner": { same structure },
        "snack": { same structure },
        "totalCalories": ${targetCalories},
        "totalProtein": 120,
        "totalCarbs": 180,
        "totalFat": 55
      }
    ]
  }
}

REQUIREMENTS:
- Generate all 7 days (Monday through Sunday)
- Each meal must have 3-5 ingredients with exact gram weights
- Each meal must have 2-4 instructions
- Calories across the 4 meals of each day must sum close to ${targetCalories}
- Protein, carbs, fat must be realistic macros in grams
- Vary meals — no repeated dishes across the week
- Keep JSON compact — no extra whitespace`
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

    const completion = await openai.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: buildPrompt(dietType, targetCalories, cuisine, avoidIngredients) }],
      temperature: 0.6,
      max_tokens: 8000,
      response_format: { type: 'json_object' },
    })

    const content = completion.choices[0]?.message?.content
    if (!content) {
      return NextResponse.json({ error: 'No response from AI' }, { status: 500 })
    }

    const parsed = JSON.parse(content)
    if (!parsed.plan?.days?.length) {
      return NextResponse.json({ error: 'AI returned an incomplete plan. Please try again.' }, { status: 500 })
    }

    return NextResponse.json({ plan: parsed.plan })
  } catch (error) {
    console.error('Diet plan generation error:', error)
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: 'Failed to parse AI response. Please try again.' }, { status: 500 })
    }
    return NextResponse.json({ error: 'Failed to generate diet plan. Please try again.' }, { status: 500 })
  }
}
