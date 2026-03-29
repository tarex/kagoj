import { Transliterator } from '../core/transliterator';
import type { BanglaInputOptions, TransliterationRule } from '../core/types';

/**
 * Framework-agnostic Bangla input adapter.
 * Attaches to any HTMLTextAreaElement or HTMLInputElement and handles
 * phonetic transliteration via native DOM events.
 */
export class BanglaInput {
  private element: HTMLTextAreaElement | HTMLInputElement;
  private transliterator: Transliterator;
  private enabled: boolean;
  private options: BanglaInputOptions;

  // Bound handlers for cleanup
  private handleKeyDown: EventListener;
  private handleBeforeInput: EventListener;

  constructor(element: HTMLTextAreaElement | HTMLInputElement, options?: BanglaInputOptions) {
    this.element = element;
    this.options = options ?? {};
    this.enabled = this.options.enabled ?? true;
    this.transliterator = new Transliterator(this.options.rules);

    if (this.enabled) {
      this.transliterator.enable();
    }

    this.handleKeyDown = (e: Event) => this.onKeyDown(e as KeyboardEvent);
    this.handleBeforeInput = (e: Event) => this.onBeforeInput(e as InputEvent);

    this.element.addEventListener('keydown', this.handleKeyDown);
    this.element.addEventListener('beforeinput', this.handleBeforeInput);
  }

  public enable(): void {
    this.enabled = true;
    this.transliterator.enable();
  }

  public disable(): void {
    this.enabled = false;
    this.transliterator.disable();
  }

  public toggle(): boolean {
    if (this.enabled) {
      this.disable();
    } else {
      this.enable();
    }
    return this.enabled;
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  /** Get the underlying transliterator for advanced usage */
  public getTransliterator(): Transliterator {
    return this.transliterator;
  }

  /** Remove all event listeners and clean up */
  public destroy(): void {
    this.element.removeEventListener('keydown', this.handleKeyDown);
    this.element.removeEventListener('beforeinput', this.handleBeforeInput);
  }

  private onKeyDown(e: KeyboardEvent): void {
    if (!this.enabled) return;

    // Let modifier combos pass through
    if (e.metaKey || e.ctrlKey || e.altKey) return;

    // Skip mobile virtual keyboard events (handled by beforeinput)
    if (e.key === 'Unidentified' || e.key === 'Process') return;

    e.preventDefault();

    const cursorPosition = this.element.selectionStart ?? 0;
    const text = this.element.value;
    const typedChar = e.key;

    const beforeCursor = text.slice(0, cursorPosition);
    const afterCursor = text.slice(cursorPosition);

    const convertedText = this.transliterator.handleKeyPress(beforeCursor, typedChar);
    const finalText = convertedText + afterCursor;

    const newPosition = cursorPosition + (convertedText.length - beforeCursor.length);

    // Update the element value and dispatch input event for framework bindings
    this.element.value = finalText;
    this.element.dispatchEvent(new Event('input', { bubbles: true }));

    requestAnimationFrame(() => {
      this.element.selectionStart = newPosition;
      this.element.selectionEnd = newPosition;
    });

    this.options.onChange?.(finalText);
  }

  private onBeforeInput(e: InputEvent): void {
    if (!this.enabled) return;
    if (e.inputType !== 'insertText' || !e.data) return;

    e.preventDefault();

    const cursorPosition = this.element.selectionStart ?? 0;
    const text = this.element.value;
    const char = e.data;

    const beforeCursor = text.slice(0, cursorPosition);
    const afterCursor = text.slice(cursorPosition);

    const convertedText = this.transliterator.handleKeyPress(beforeCursor, char);
    const finalText = convertedText + afterCursor;

    const newPosition = cursorPosition + (convertedText.length - beforeCursor.length);

    this.element.value = finalText;
    this.element.dispatchEvent(new Event('input', { bubbles: true }));

    requestAnimationFrame(() => {
      this.element.selectionStart = newPosition;
      this.element.selectionEnd = newPosition;
    });

    this.options.onChange?.(finalText);
  }
}
