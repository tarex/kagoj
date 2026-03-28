import { NextResponse } from 'next/server';
import { z } from 'zod';

const EMPTY_RESPONSE = NextResponse.json({ suggestion: '', source: 'ai' });

const requestSchema = z.object({
  cursorContext: z.string().min(1),
  lastSentence: z.string().optional(),
  currentWord: z.string().optional(),
});

export async function POST(req: Request) {
  if (!process.env.OPENAI_API_KEY) {
    return EMPTY_RESPONSE;
  }

  try {
    const parsed = requestSchema.safeParse(await req.json());

    if (!parsed.success) {
      return EMPTY_RESPONSE;
    }

    const { cursorContext, lastSentence, currentWord } = parsed.data;

    // Dynamic import so the app doesn't crash when @ai-sdk/openai can't find the key at module load
    const { openai } = await import('@ai-sdk/openai');
    const { generateText } = await import('ai');

    const ghostPrompt = `You are a context-aware Bangla writing assistant. Your job is to predict the NEXT few words the writer intends to type, based on:
1. The overall topic and theme of the text
2. The grammatical structure of the current sentence
3. Common Bangla phrases and collocations that fit this context
4. The tone (formal/informal) established by the writing

Rules:
- Return ONLY the completion text (no quotes, no explanation)
- Keep it under 40 characters
- The completion must be grammatically correct and semantically meaningful in context
- Match the existing tone and style of the text
- If the text ends mid-word, complete that word first, then add the next natural word
- If unsure or text is not Bangla, return empty string`;

    // Build a structured prompt with context layers
    let prompt = cursorContext;
    if (lastSentence && lastSentence !== cursorContext) {
      prompt = `[পূর্ববর্তী বাক্য: ${lastSentence}]\n${cursorContext}`;
    }
    if (currentWord) {
      prompt += `\n[বর্তমান শব্দ: ${currentWord}]`;
    }

    const { text: completion } = await generateText({
      model: openai.chat('gpt-4o-mini'),
      system: ghostPrompt,
      prompt,
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