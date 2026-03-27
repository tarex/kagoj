import { useCallback, useRef } from 'react';

interface HistoryEntry {
  text: string;
  title: string;
  cursorPos: number;
  timestamp: number;
}

const MAX_HISTORY = 100;
/** Minimum ms between snapshots to avoid flooding on rapid typing */
const DEBOUNCE_MS = 300;

/**
 * Custom undo/redo stack for the note editor.
 *
 * The browser's native undo is broken by BanglaInputHandler's programmatic
 * DOM manipulation (preventDefault + direct value assignment). This hook
 * maintains an explicit history stack so Ctrl+Z / Ctrl+Shift+Z work
 * reliably across both Bangla and English modes.
 */
export function useUndoRedo() {
  const undoStack = useRef<HistoryEntry[]>([]);
  const redoStack = useRef<HistoryEntry[]>([]);
  const lastSnapshotTime = useRef(0);

  /** Push a snapshot onto the undo stack. Call on every meaningful text change. */
  const pushSnapshot = useCallback(
    (text: string, title: string, cursorPos: number) => {
      const now = Date.now();

      // Dedupe: skip if text+title unchanged from top of stack
      const top = undoStack.current[undoStack.current.length - 1];
      if (top && top.text === text && top.title === title) return;

      // Debounce rapid keystrokes — merge into latest entry instead
      if (
        top &&
        now - lastSnapshotTime.current < DEBOUNCE_MS &&
        undoStack.current.length > 1
      ) {
        top.text = text;
        top.title = title;
        top.cursorPos = cursorPos;
        top.timestamp = now;
        lastSnapshotTime.current = now;
        return;
      }

      undoStack.current.push({ text, title, cursorPos, timestamp: now });
      if (undoStack.current.length > MAX_HISTORY) {
        undoStack.current.shift();
      }

      // Any new edit clears the redo future
      redoStack.current = [];
      lastSnapshotTime.current = now;
    },
    [],
  );

  /** Undo — returns the previous snapshot or null if nothing to undo. */
  const undo = useCallback((): HistoryEntry | null => {
    if (undoStack.current.length <= 1) return null;

    // Move current state to redo stack
    const current = undoStack.current.pop()!;
    redoStack.current.push(current);

    // Return the previous state
    return undoStack.current[undoStack.current.length - 1] ?? null;
  }, []);

  /** Redo — returns the next snapshot or null if nothing to redo. */
  const redo = useCallback((): HistoryEntry | null => {
    if (redoStack.current.length === 0) return null;

    const entry = redoStack.current.pop()!;
    undoStack.current.push(entry);
    return entry;
  }, []);

  const canUndo = useCallback(() => undoStack.current.length > 1, []);
  const canRedo = useCallback(() => redoStack.current.length > 0, []);

  /** Reset history (e.g. when switching notes). */
  const resetHistory = useCallback(
    (text: string, title: string, cursorPos: number) => {
      undoStack.current = [
        { text, title, cursorPos, timestamp: Date.now() },
      ];
      redoStack.current = [];
      lastSnapshotTime.current = 0;
    },
    [],
  );

  return { pushSnapshot, undo, redo, canUndo, canRedo, resetHistory };
}
