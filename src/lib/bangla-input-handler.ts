import { RefObject } from 'react';
import { Transliterator } from 'kagoj-input';

/**
 * React-specific wrapper around the framework-agnostic Transliterator.
 * Keeps the existing singleton + React event API so components don't change.
 */
export class BanglaInputHandler {
  private transliterator: Transliterator;
  private static instance: BanglaInputHandler;

  private constructor() {
    this.transliterator = new Transliterator();
  }

  public static getInstance(): BanglaInputHandler {
    if (!BanglaInputHandler.instance) {
      BanglaInputHandler.instance = new BanglaInputHandler();
    }
    return BanglaInputHandler.instance;
  }

  public enable(): void {
    this.transliterator.enable();
  }

  public disable(): void {
    this.transliterator.disable();
  }

  public isActive(): boolean {
    return this.transliterator.isActive();
  }

  public processInputKeyPress(
    inputRef: RefObject<HTMLInputElement | HTMLTextAreaElement>,
    currentValue: string,
    setCurrentValue: (value: string) => void,
    e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>
  ): void {
    if (e.metaKey || e.ctrlKey || e.altKey) {
      return;
    }

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

    const convertedText: string = this.transliterator.handleKeyPress(beforeCursor, typedChar);
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

  public processCharInput(
    inputRef: RefObject<HTMLInputElement | HTMLTextAreaElement>,
    currentValue: string,
    setCurrentValue: (value: string) => void,
    char: string
  ): { text: string; cursorPosition: number } | null {
    if (!this.transliterator.isActive()) return null;

    const inputElement = inputRef.current;
    if (!inputElement) return null;

    const cursorPosition: number = inputElement.selectionStart || 0;
    const text: string = currentValue;

    const beforeCursor: string = text.slice(0, cursorPosition);
    const afterCursor: string = text.slice(cursorPosition);

    const convertedText: string = this.transliterator.handleKeyPress(beforeCursor, char);
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

    return { text: finalText, cursorPosition: newPosition };
  }

  public transliterateChar(textBeforeCursor: string, char: string): string {
    return this.transliterator.handleKeyPress(textBeforeCursor, char);
  }
}
