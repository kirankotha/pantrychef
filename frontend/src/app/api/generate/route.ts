import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const SYSTEM_PROMPT = `You are PantryChef, an expert chef and nutritionist. Generate creative, delicious recipes based on the user's available ingredients and preferences.

IMPORTANT RULES:
1. Always respond with ONLY valid JSON — no markdown, no explanation text.
2. Generate 3-4 recipes that best match the available ingredients.
3. Prioritize recipes that use the MAXIMUM number of available ingredients.
4. Each recipe must be realistic and fully cookable.
5. Nutrition values must be accurate estimates.
6. Instructions must be clear, specific, and numbered.

Return a JSON object with this EXACT structure:
{
  "recipes": [
    {
      "id": "unique_id_string",
      "name": "Recipe Name",
      "description": "One appealing sentence describing the dish",
      "cuisine": "cuisine type",
      "difficulty": "Easy|Medium|Hard",
      "prepTime": 15,
      "cookTime": 30,
      "totalTime": 45,
      "servings": 4,
      "matchScore": 85,
      "ingredients": [
        {"name": "ingredient", "amount": "500g", "available": true, "substitute": null},
        {"name": "missing_item", "amount": "1 tsp", "available": false, "substitute": "can skip"}
      ],
      "missingIngredients": ["item1", "item2"],
      "instructions": [
        {"step": 1, "title": "Step Title", "description": "Detailed instruction here.", "time": 5, "tip": null},
        {"step": 2, "title": "Cook it", "description": "Instructions...", "time": 10, "tip": "Optional chef tip"}
      ],
      "nutrition": {
        "calories": 450,
        "protein": 35,
        "carbs": 40,
        "fat": 15,
        "fiber": 5,
        "sugar": 6,
        "sodium": 800,
        "saturatedFat": 4
      },
      "tips": ["Chef tip 1", "Chef tip 2", "Chef tip 3"],
      "storage": "Store in airtight container in fridge for up to 3 days.",
      "tags": ["quick", "high-protein", "one-pot"],
      "healthScore": 8
    }
  ]
}`

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { ingredients, cuisine, dietary, maxTime, skillLevel, servings, mode } = body

    if (!ingredients?.length) {
      return NextResponse.json({ error: 'Please add at least one ingredient' }, { status: 400 })
    }

    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json({ error: 'Groq API key not configured. Add GROQ_API_KEY to .env' }, { status: 500 })
    }

    const openai = new OpenAI({
      apiKey: process.env.GROQ_API_KEY,
      baseURL: 'https://api.groq.com/openai/v1',
    })

    const ingredientList = ingredients.map((i: { name: string; amount?: string }) =>
      i.amount ? `${i.amount} ${i.name}` : i.name
    ).join(', ')

    const modeInstructions: Record<string, string> = {
      healthy: 'Focus on low-calorie, nutrient-dense meals with lots of vegetables. Minimize oil and sugar.',
      budget: 'Focus on budget-friendly meals using simple, affordable ingredients. Minimize expensive items.',
      mealprep: 'Create recipes that are great for batch cooking and store well for 3-5 days. Include storage tips.',
      standard: 'Create balanced, delicious meals.',
    }

    const userPrompt = `Available ingredients: ${ingredientList}

Preferences:
- Cuisine: ${cuisine || 'any cuisine'}
- Dietary restrictions: ${dietary?.length ? dietary.join(', ') : 'none'}
- Maximum cooking time: ${maxTime} minutes total
- Skill level: ${skillLevel || 'intermediate'}
- Servings: ${servings || 4} people
- Cooking mode: ${mode || 'standard'}

Special instructions: ${modeInstructions[mode] || modeInstructions.standard}

Generate 3-4 creative recipes that maximize use of the available ingredients. Include realistic substitutions for missing items where possible.`

    const completion = await openai.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.8,
      max_tokens: 4000,
      response_format: { type: 'json_object' },
    })

    const content = completion.choices[0]?.message?.content
    if (!content) {
      return NextResponse.json({ error: 'No response from AI' }, { status: 500 })
    }

    const parsed = JSON.parse(content)
    const recipes = parsed.recipes || []

    // Sort by match score
    recipes.sort((a: { matchScore: number }, b: { matchScore: number }) => b.matchScore - a.matchScore)

    return NextResponse.json({ recipes, usage: completion.usage })
  } catch (error) {
    console.error('Recipe generation error:', error)
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 })
    }
    return NextResponse.json({ error: 'Failed to generate recipes. Please try again.' }, { status: 500 })
  }
}
