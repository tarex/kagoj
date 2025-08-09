import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { text, mode = 'spellcheck' } = await req.json();

    if (mode === 'spellcheck') {
      // Spell checking mode for Bangla text
      const prompt = `You are a Bengali language expert. Check the following Bengali text for spelling errors:

"${text}"

Rules:
1. Only identify spelling mistakes
2. Provide the correct spelling for each wrong word
3. Return JSON format: {"errors": [{"word": "wrong word", "correction": "correct word"}]}
4. If no errors, return: {"errors": []}
5. Do NOT include startIndex or endIndex
6. Follow Bangladesh Academy and standard spelling rules

Return ONLY valid JSON, no explanation:`;

      const { text: response } = await generateText({
        model: openai('gpt-3.5-turbo'), // Using older model as requested
        prompt: prompt,
        temperature: 0.2, // Lower temperature for more consistent spell checking
        maxRetries: 2,
      });

      try {
        // Parse the JSON response
        const result = JSON.parse(response);
        console.log('Raw AI response:', JSON.stringify(result, null, 2));
        
        // Calculate positions for each error
        if (result.errors && result.errors.length > 0) {
          const usedPositions = new Set<string>();
          
          result.errors = result.errors.map((error: any) => {
            const wordToFind = error.word;
            
            // Simple indexOf search to find the word
            let searchFrom = 0;
            let found = false;
            
            while (searchFrom < text.length && !found) {
              const index = text.indexOf(wordToFind, searchFrom);
              if (index === -1) break;
              
              // Check if this position was already used
              const posKey = `${index}-${index + wordToFind.length}`;
              if (!usedPositions.has(posKey)) {
                error.startIndex = index;
                error.endIndex = index + wordToFind.length;
                usedPositions.add(posKey);
                found = true;
                
                // Verify the position
                const actualText = text.substring(index, index + wordToFind.length);
                console.log(`Found "${wordToFind}" at ${index}-${index + wordToFind.length}, actual: "${actualText}"`);
              }
              searchFrom = index + 1;
            }
            
            if (!found) {
              console.warn(`Could not find "${wordToFind}" in text`);
              error.startIndex = -1;
              error.endIndex = -1;
            }
            
            return error;
          }).filter((error: any) => error.startIndex >= 0); // Filter out errors we couldn't find
        }
        
        console.log('Final errors with positions:', JSON.stringify(result.errors, null, 2));
        return NextResponse.json(result);
      } catch (parseError) {
        console.error('Error parsing spell check response:', parseError);
        return NextResponse.json({ errors: [] });
      }
    } else {
      // Keep the old suggestion mode for word suggestions (not AI)
      return NextResponse.json({ suggestion: '', alternatives: [] });
    }
  } catch (error) {
    console.error('Error in API:', error);
    return NextResponse.json({ errors: [] }, { status: 500 });
  }
}