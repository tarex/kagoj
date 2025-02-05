import { contextPatterns } from './context-pattern';

interface InputMethod {
  readonly id: string;
  readonly contextLength: number;
  readonly maxKeyLength: number;
  readonly patterns: Array<string[]>;
}

/**
 * Imitates the jQuery IME approach, but without jQuery. Tracks the user's context
 * and applies transliteration patterns in a character-by-character approach.
 */
export class BanglaIME {
  private context: string = '';
  private active: boolean = false;
  private inputMethod: InputMethod;

  public constructor(inputMethod: InputMethod) {
    this.inputMethod = inputMethod;
  }

  /**
   * Enables transliteration.
   */
  public enable(): void {
    this.active = true;
  }

  /**
   * Disables transliteration.
   */
  public disable(): void {
    this.active = false;
    this.context = '';
  }

  /**
   * Tells if transliteration is active.
   * @returns true if active, false otherwise
   */
  public isActive(): boolean {
    return this.active;
  }

  /**
   * Main transliteration method. Replicates jQuery IME's logic:
   * - Looks at the tail of the provided input (plus the newly typed character).
   * - Finds the first pattern (from inputMethod.patterns) that matches the end of the string.
   * - If there's a context constraint, ensures context matches too.
   * - Returns the replaced string if matched, otherwise returns the original input.
   * @param input The user typed text snippet (tail of the text + newly typed char).
   * @param context The stored context from previous characters.
   */
  private transliterate(input: string, context: string = ''): string {
    let result = input;

    for (const rule of this.inputMethod.patterns) {
      const pattern = rule[0];
      const replacement = rule[rule.length - 1];
      const regex = new RegExp(pattern + '$');

      if (rule.length === 3) {
        // Context-specific rule
        const contextPattern = rule[1];
        const contextRegex = new RegExp(contextPattern + '$');

        if (regex.test(result) && contextRegex.test(context)) {
          result = result.replace(regex, replacement);
          break; // Stop after first match
        }
      } else if (rule.length === 2) {
        // Simple replacement rule
        if (regex.test(result)) {
          result = result.replace(regex, replacement);
          break; // Stop after first match
        }
      }
    }

    return result;
  }

  /**
   * Simulates the core logic from jQuery IME's `keypress` handler without jQuery or direct DOM ops.
   * It returns the *new text value* after transliteration. You can integrate it with your
   * React event handlers or any input logic.
   * @param text The current text in the input.
   * @param typedChar The newly typed character (from keypress).
   * @returns The new text after applying transliteration (if active).
   */
  public handleKeyPress(text: string, typedChar: string): string {
    // Allow special keys to pass through
    if (typedChar === 'Enter' || typedChar === '\n' || typedChar === '\r') {
      return text + '\n';
    }

    if (!this.active) {
      return text + typedChar;
    }

    if (typedChar === '\b') {
      return text;
    }

    // Get the text segment to process (last few characters + new char)
    const maxKeyLength: number = this.inputMethod.maxKeyLength;
    const startIndex: number = Math.max(0, text.length - maxKeyLength);
    const textToProcess: string = text.slice(startIndex) + typedChar;

    // Transliterate the segment
    const transliterated: string = this.transliterate(
      textToProcess,
      this.context
    );

    // Update context
    this.context = textToProcess;
    if (this.context.length > this.inputMethod.contextLength) {
      this.context = this.context.slice(-this.inputMethod.contextLength);
    }

    // Combine the unchanged part with the transliterated part
    return text.slice(0, startIndex) + transliterated;
  }
}
