import { RefObject } from 'react';
import { contextPatterns } from './context-pattern';

interface TransliterationRule {
  pattern: string;
  contextPattern?: string;
  replacement: string;
}

/**
 * Modern implementation of Bangla Input Method Editor
 * Handles phonetic typing conversion from English to Bangla characters
 */
export class BanglaInputHandler {
  private context = '';
  private active = false;
  private readonly rules: TransliterationRule[];
  private static instance: BanglaInputHandler;

  private constructor() {
    this.rules = this.parseRules(contextPatterns);
  }

  public static getInstance(): BanglaInputHandler {
    if (!BanglaInputHandler.instance) {
      BanglaInputHandler.instance = new BanglaInputHandler();
    }
    return BanglaInputHandler.instance;
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

  public handleTextInput(
    textareaRef: RefObject<HTMLTextAreaElement>,
    currentNote: string,
    setCurrentNote: (note: string) => void,
    e: React.KeyboardEvent<HTMLTextAreaElement>
  ): void {
    e.preventDefault();

    const textarea = textareaRef.current;
    if (!textarea) return;

    const cursorPosition = textarea.selectionStart;
    const text = currentNote;
    const typedChar = e.key;

    const beforeCursor = text.slice(0, cursorPosition);
    const afterCursor = text.slice(cursorPosition);

    const convertedText = this.handleKeyPress(beforeCursor, typedChar);
    const finalText = convertedText + afterCursor;
    setCurrentNote(finalText);

    const newPosition =
      cursorPosition + (convertedText.length - beforeCursor.length);

    requestAnimationFrame(() => {
      if (textareaRef.current) {
        textareaRef.current.selectionStart = newPosition;
        textareaRef.current.selectionEnd = newPosition;
      }
    });
  }

  private parseRules(patterns: Array<string[]>): TransliterationRule[] {
    return patterns.map((pattern) => ({
      pattern: pattern[0],
      ...(pattern.length === 3 && { contextPattern: pattern[1] }),
      replacement: pattern[pattern.length - 1],
    }));
  }

  private handleKeyPress(text: string, typedChar: string): string {
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

  private shouldPassThrough(char: string): boolean {
    return char === 'Enter' || char === '\n' || char === '\r' || char === '\b';
  }

  private handleSpecialChar(text: string, char: string): string {
    if (char === '\b') return text;
    return text + (char === 'Enter' ? '\n' : char);
  }

  private getTextSegmentToProcess(text: string, char: string) {
    const startIndex = Math.max(0, text.length - this.rules[0].pattern.length);
    return {
      startIndex,
      text: text.slice(startIndex) + char,
    };
  }

  private updateContext(text: string): void {
    this.context = text;
    const maxLength = this.rules[0].pattern.length;
    if (this.context.length > maxLength) {
      this.context = this.context.slice(-maxLength);
    }
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
}
