import { NextResponse } from 'next/server';

const EMPTY_RESPONSE = NextResponse.json({ suggestion: '', source: 'ai' });

export async function POST(req: Request) {
  if (!process.env.OPENAI_API_KEY) {
    return EMPTY_RESPONSE;
  }

  try {
    const { cursorContext } = await req.json();

    if (typeof cursorContext !== 'string' || cursorContext.length === 0) {
      return EMPTY_RESPONSE;
    }

    // Dynamic import so the app doesn't crash when @ai-sdk/openai can't find the key at module load
    const { openai } = await import('@ai-sdk/openai');
    const { generateText } = await import('ai');

    const ghostPrompt = `You are a Bangla writing assistant. Complete the following Bangla text naturally. Return ONLY the completion text (no quotes, no explanation). Keep it under 40 characters. If the text is not Bangla or you cannot suggest a natural completion, return empty string.`;

    const { text: completion } = await generateText({
      model: openai.chat('gpt-4o-mini'),
      system: ghostPrompt,
      prompt: cursorContext,
      temperature: 0.3,
      maxOutputTokens: 60,
      maxRetries: 1,
    });

    return NextResponse.json({ suggestion: completion.trim(), source: 'ai' });
  } catch (error) {
    console.error('Ghost text AI error:', error);
    return EMPTY_RESPONSE;
  }
}