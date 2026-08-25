import { corsHeaders } from '../_shared/cors.ts';

interface TransactionSummary {
  totalIncome: number;
  totalExpense: number;
  monthIncome: number;
  monthExpense: number;
  savingsRate: number;
  topCategories: { name: string; amount: number; percentage: number }[];
  weeklyAvgExpense: number;
  budgetUsage: number; // percentage of monthly budget used
  currency: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('ONSPACE_AI_API_KEY');
    const baseUrl = Deno.env.get('ONSPACE_AI_BASE_URL');

    if (!apiKey || !baseUrl) {
      return new Response(
        JSON.stringify({ error: 'AI service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const body = await req.json() as TransactionSummary;
    console.log('AI Advisor request received', { monthExpense: body.monthExpense, savingsRate: body.savingsRate });

    const prompt = `You are a personal finance advisor AI. Analyze the following spending data and provide actionable advice.

Financial Summary:
- This month income: ${body.currency}${body.monthIncome.toFixed(2)}
- This month expenses: ${body.currency}${body.monthExpense.toFixed(2)}
- Savings rate: ${body.savingsRate.toFixed(1)}%
- Budget usage: ${body.budgetUsage.toFixed(1)}%
- Weekly avg expense: ${body.currency}${body.weeklyAvgExpense.toFixed(2)}
- Top spending categories: ${body.topCategories.map(c => `${c.name}: ${body.currency}${c.amount.toFixed(2)} (${c.percentage.toFixed(1)}%)`).join(', ')}

Respond with ONLY a valid JSON object in this exact format (no markdown, no code blocks):
{
  "healthScore": <integer 0-100>,
  "summary": "<2-3 sentence financial health summary>",
  "insights": [
    {"type": "warning"|"success"|"tip"|"info", "title": "<short title>", "message": "<actionable message>"},
    ...3-5 insights total
  ],
  "recommendations": ["<specific actionable recommendation>", "<another recommendation>", "<third recommendation>"]
}

Base healthScore on: savings rate (higher = better), budget adherence (under budget = better), spending diversity.
Keep insights concise and personalized. Recommendations should be specific dollar amounts or percentages.`;

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: 'You are a financial advisor. Always respond with valid JSON only, no markdown formatting.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('AI API error:', errText);
      return new Response(
        JSON.stringify({ error: `AI API error: ${errText}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const aiData = await response.json();
    const content = aiData.choices?.[0]?.message?.content ?? '';
    console.log('AI raw response:', content.substring(0, 200));

    // Parse the JSON response
    let parsed;
    try {
      // Strip markdown code blocks if present
      const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      parsed = JSON.parse(cleaned);
    } catch {
      console.error('Failed to parse AI JSON:', content);
      return new Response(
        JSON.stringify({ error: 'Failed to parse AI response' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    return new Response(
      JSON.stringify({ ...parsed, generatedAt: new Date().toISOString() }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    console.error('Edge function error:', err);
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
