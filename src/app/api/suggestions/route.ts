import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';
import { NextResponse } from 'next/server';

const suggestionSchema = z.object({
  suggestions: z.array(z.string()),
});

export async function POST(req: Request) {
  try {
    const { input, previousText } = await req.json();

    // Keep last 150 characters for better context preservation
    const truncatedPreviousText = previousText;

    const { object } = await generateObject({
      model: openai('gpt-4-turbo'), // Upgrade to GPT-4-turbo for better suggestions
      schema: suggestionSchema,
      prompt: `তুমি একজন দক্ষ বাংলা লেখক। তুমি কবিতা, গল্প, বা গান লেখার জন্য মানুষের লেখাকে স্বয়ংক্রিয়ভাবে সম্পূর্ণ করতে পারো।

পূর্ববর্তী লেখা: "${truncatedPreviousText}"
বর্তমান ইনপুট: "${input}"

নিয়মাবলী:
1. এটি হতে পারে কবিতা, গান, গল্প, বা উপন্যাসের অংশ।
2. বানান অবশ্যই সঠিক হতে হবে।
3. প্রাকৃত বাংলা ব্যবহার করো, কঠিন সংস্কৃত শব্দ পরিহার করো।
4. কেবল বাংলা শব্দ ব্যবহার করো, ইংরেজি শব্দ ব্যবহার করো না।
5. লেখা যেন সাবলীল ও প্রাকৃতিক হয়।
6. ১০টি সম্ভাব্য শব্দ বা বাক্যাংশ প্রদান করো যা পরবর্তী অংশ হতে পারে।`,
    });

    return NextResponse.json(object);
  } catch (error) {
    console.error('Error fetching suggestions:', error);
    return NextResponse.json({ suggestions: [] }, { status: 500 });
  }
}
