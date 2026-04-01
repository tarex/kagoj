import type { TransliterationRule } from './types';
import { contextPatterns } from './rules';

/**
 * Stateful Bangla transliteration engine.
 * Converts English keystrokes to Bangla characters using context-aware rules.
 * Framework-agnostic -- no DOM or React dependencies.
 */
export class Transliterator {
  private context = '';
  private active = false;
  private readonly rules: TransliterationRule[];
  private readonly maxPatternLength: number;

  constructor(rules?: TransliterationRule[]) {
    this.rules = rules ?? contextPatterns;
    this.maxPatternLength = this.calculateMaxPatternLength();
  }

  public enable(): void {
    this.active = true;
  }

  public disable(): void {
    this.active = false;
    this.context = '';
  }

  public isActive(): boolean {
    return this.active;
  }

  /**
   * Process a keypress given text before cursor and the typed character.
   * Returns the new text-before-cursor after transliteration.
   */
  public handleKeyPress(text: string, typedChar: string): string {
    if (this.isNonCharacterOrSpecialKey(typedChar)) {
      return text;
    }

    if (this.shouldPassThrough(typedChar)) {
      return this.handleSpecialChar(text, typedChar);
    }

    if (!this.active) {
      return text + typedChar;
    }

    const segment = this.getTextSegmentToProcess(text, typedChar);
    const transliterated = this.transliterate(segment.text, this.context);
    this.updateContext(segment.text);

    return text.slice(0, segment.startIndex) + transliterated;
  }

  /** Reset internal context (e.g., on focus change) */
  public resetContext(): void {
    this.context = '';
  }

  private shouldPassThrough(char: string): boolean {
    return (
      char === 'Enter' || char === 'Backspace' || char === '\n' || char === '\r'
    );
  }

  private handleSpecialChar(text: string, char: string): string {
    if (char === 'Backspace') {
      return text.slice(0, -1);
    }
    if (char === 'Enter') {
      return text + '\n';
    }
    return text + char;
  }

  private getTextSegmentToProcess(text: string, char: string) {
    const startIndex = Math.max(0, text.length - this.maxPatternLength);
    return {
      startIndex,
      text: text.slice(startIndex) + char,
    };
  }

  private updateContext(text: string): void {
    this.context = text.slice(-this.maxPatternLength);
  }

  private transliterate(input: string, context: string): string {
    for (const rule of this.rules) {
      const regex = new RegExp(rule.pattern + '$');

      if (rule.contextPattern) {
        const contextRegex = new RegExp(rule.contextPattern + '$');
        if (regex.test(input) && contextRegex.test(context)) {
          return input.replace(regex, rule.replacement);
        }
      } else if (regex.test(input)) {
        return input.replace(regex, rule.replacement);
      }
    }
    return input;
  }

  private isNonCharacterOrSpecialKey(key: string): boolean {
    const recognizedKeys = ['Enter', 'Backspace', '\n', '\r'];
    const isExplicitlyRecognized = recognizedKeys.includes(key);
    const isSingleCharacter = key.length === 1;
    return !isSingleCharacter && !isExplicitlyRecognized;
  }

  private calculateMaxPatternLength(): number {
    let maxLength = 0;
    for (const rule of this.rules) {
      maxLength = Math.max(maxLength, rule.pattern.length);
    }
    return maxLength;
  }
}
