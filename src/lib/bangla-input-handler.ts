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
  private readonly maxPatternLength: number; // Store max pattern length
  private static instance: BanglaInputHandler;

  private constructor() {
    this.rules = contextPatterns;
    this.maxPatternLength = this.calculateMaxPatternLength(); // Calculate once
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

  public processInputKeyPress(
    inputRef: RefObject<HTMLInputElement | HTMLTextAreaElement>,
    currentValue: string,
    setCurrentValue: (value: string) => void,
    e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>
  ): void {
    // If user is holding down a modifier key (Cmd/Ctrl/Alt),
    // let the default behavior handle the key.
    if (e.metaKey || e.ctrlKey || e.altKey) {
      return;
    }

    // On mobile keyboards, e.key is often "Unidentified" or "Process".
    // Skip and let beforeinput/processCharInput handle it instead.
    if (e.key === 'Unidentified' || e.key === 'Process') {
      return;
    }

    e.preventDefault();

    const inputElement = inputRef.current;
    if (!inputElement) {
      return;
    }

    const cursorPosition: number = inputElement.selectionStart || 0;
    const text: string = currentValue;
    const typedChar: string = e.key;

    const beforeCursor: string = text.slice(0, cursorPosition);
    const afterCursor: string = text.slice(cursorPosition);

    const convertedText: string = this.handleKeyPress(beforeCursor, typedChar);
    const finalText: string = convertedText + afterCursor;
    setCurrentValue(finalText);

    const newPosition: number =
      cursorPosition + (convertedText.length - beforeCursor.length);

    requestAnimationFrame(() => {
      if (inputRef.current) {
        inputRef.current.selectionStart = newPosition;
        inputRef.current.selectionEnd = newPosition;
      }
    });
  }

  /**
   * Process a character directly (used by beforeinput on mobile).
   * Takes the raw character instead of reading from KeyboardEvent.
   */
  public processCharInput(
    inputRef: RefObject<HTMLInputElement | HTMLTextAreaElement>,
    currentValue: string,
    setCurrentValue: (value: string) => void,
    char: string
  ): void {
    if (!this.active) return;

    const inputElement = inputRef.current;
    if (!inputElement) return;

    const cursorPosition: number = inputElement.selectionStart || 0;
    const text: string = currentValue;

    const beforeCursor: string = text.slice(0, cursorPosition);
    const afterCursor: string = text.slice(cursorPosition);

    const convertedText: string = this.handleKeyPress(beforeCursor, char);
    const finalText: string = convertedText + afterCursor;
    setCurrentValue(finalText);

    const newPosition: number =
      cursorPosition + (convertedText.length - beforeCursor.length);

    requestAnimationFrame(() => {
      if (inputRef.current) {
        inputRef.current.selectionStart = newPosition;
        inputRef.current.selectionEnd = newPosition;
      }
    });
  }

  private handleKeyPress(text: string, typedChar: string): string {
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
