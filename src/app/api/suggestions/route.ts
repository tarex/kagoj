import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { text, mode = 'spellcheck', cursorContext } = await req.json();

    if (mode === 'ghost') {
      // Ghost text completion mode — returns a short phrase continuation
      if (typeof cursorContext !== 'string' || cursorContext.length === 0) {
        return NextResponse.json({ suggestion: '', source: 'ai' });
      }

      const ghostPrompt = `You are a Bangla writing assistant. Complete the following Bangla text naturally. Return ONLY the completion text (no quotes, no explanation). Keep it under 40 characters. If the text is not Bangla or you cannot suggest a natural completion, return empty string.`;

      try {
        const { text: completion } = await generateText({
          model: openai.chat('gpt-4o-mini'),
          system: ghostPrompt,
          prompt: cursorContext,
          temperature: 0.3,
          maxOutputTokens: 60,
          maxRetries: 1,
        });

        return NextResponse.json({ suggestion: completion.trim(), source: 'ai' });
      } catch (ghostError) {
        console.error('Ghost text AI error:', ghostError);
        return NextResponse.json({ suggestion: '', source: 'ai' });
      }
    } else if (mode === 'spellcheck') {
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
        model: openai.chat('gpt-3.5-turbo'),
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