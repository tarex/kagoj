import { NextResponse } from 'next/server';
import { z } from 'zod';

const EMPTY_RESPONSE = NextResponse.json({ suggestion: '', source: 'ai' });

const requestSchema = z.object({
  cursorContext: z.string().min(1),
  lastSentence: z.string().optional(),
  currentWord: z.string().optional(),
  noteTitle: z.string().optional(),
  toneHint: z.string().optional(),
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

    const { cursorContext, lastSentence, currentWord, noteTitle, toneHint } = parsed.data;

    // Dynamic import so the app doesn't crash when @ai-sdk/openai can't find the key at module load
    const { openai } = await import('@ai-sdk/openai');
    const { generateText } = await import('ai');

    const ghostPrompt = `You are a context-aware Bangla writing assistant. Predict the NEXT few words the writer intends to type.

Consider:
1. The topic${noteTitle ? ` (title: "${noteTitle}")` : ''} and theme of the text
2. Grammatical structure of the current sentence
3. Common Bangla phrases and collocations
4. The tone: ${toneHint ?? 'match what the writer has established'}

Rules:
- Return ONLY the completion text (no quotes, no explanation)
- Keep it under 30 characters
- Must be grammatically correct and semantically meaningful
- Match the existing tone and vocabulary level
- If text ends mid-word, complete that word first, then add the next natural word
- If unsure or text is not Bangla, return empty string
- Do NOT repeat what was already written`;

    // Build a structured prompt with context layers
    let prompt = cursorContext;
    if (lastSentence && lastSentence !== cursorContext) {
      prompt = `[পূর্ববর্তী বাক্য: ${lastSentence}]\n${cursorContext}`;
    }
    if (currentWord) {
      prompt += `\n[বর্তমান শব্দ: ${currentWord}]`;
    }

    const result = await generateText({
      model: openai.chat('gpt-4o-mini'),
      system: ghostPrompt,
      prompt,
      temperature: 0.3,
      maxOutputTokens: 40,
      maxRetries: 1,
      stopSequences: ['।', '\n'],
    });

    return NextResponse.json({ suggestion: result.text?.trim() ?? '', source: 'ai' });
  } catch (error) {
    console.error('Ghost text AI error:', error);
    return EMPTY_RESPONSE;
  }
}