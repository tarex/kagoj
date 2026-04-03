import { renderHook, act } from '@testing-library/react';
import { useNotes } from '../components/note/use-notes';

// localStorage mock
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
    get _store() { return store; },
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

beforeEach(() => {
  localStorageMock.clear();
});

// Helper: seed localStorage with notes and optional selectedNoteIndex
function seedNotes(notes: Array<{ content: string; title: string; date?: string }>, selectedIndex?: number) {
  const fullNotes = notes.map(n => ({
    content: n.content,
    title: n.title,
    date: n.date ?? new Date().toISOString(),
  }));
  localStorageMock.setItem('notes', JSON.stringify(fullNotes));
  if (selectedIndex !== undefined) {
    localStorageMock.setItem('selectedNoteIndex', String(selectedIndex));
  }
}

describe('useNotes', () => {
  // =====================================================
  // BUG REGRESSION: editing existing note must NOT create a new note
  // =====================================================

  describe('note duplication bug regression', () => {
    it('saveCurrentNote updates existing note when selectedNoteIndex is set', () => {
      seedNotes([
        { content: 'note 0', title: 'title 0' },
        { content: 'note 1', title: 'title 1' },
      ], 1);

      const { result } = renderHook(() => useNotes());

      // After init, selectedNoteIndex should be restored
      expect(result.current.selectedNoteIndex).toBe(1);

      // Simulate typing
      act(() => { result.current.setCurrentNote('edited content'); });

      // Save should update, NOT create
      act(() => { result.current.saveCurrentNote(); });

      expect(result.current.notes).toHaveLength(2); // no new note
      expect(result.current.notes[1].content).toBe('edited content');
    });

    it('selectedNoteIndex persists across hook re-init (simulated page refresh)', () => {
      seedNotes([
        { content: 'note 0', title: 'title 0' },
        { content: 'note 1', title: 'title 1' },
      ], 1);
      localStorageMock.setItem('currentNote', 'in-progress edit');
      localStorageMock.setItem('currentTitle', 'title 1');

      const { result } = renderHook(() => useNotes());

      // selectedNoteIndex must be restored from localStorage
      expect(result.current.selectedNoteIndex).toBe(1);
      expect(result.current.currentNote).toBe('in-progress edit');

      // saveCurrentNote should update note 1, not create note 2
      act(() => { result.current.saveCurrentNote(); });
      expect(result.current.notes).toHaveLength(2);
      expect(result.current.notes[1].content).toBe('in-progress edit');
    });

    it('saveCurrentNote creates new note only when selectedNoteIndex is null', () => {
      seedNotes([{ content: 'existing', title: 'existing title' }]);
      // No selectedNoteIndex in localStorage

      const { result } = renderHook(() => useNotes());
      expect(result.current.selectedNoteIndex).toBeNull();

      act(() => { result.current.setCurrentNote('brand new'); });
      act(() => { result.current.saveCurrentNote(); });

      // NOW it should create a new note (total 2)
      expect(result.current.notes).toHaveLength(2);
    });

    it('updateCurrentNote (setCurrentNote) updates in-place when editing existing note', () => {
      seedNotes([
        { content: 'aaa', title: 'A' },
        { content: 'bbb', title: 'B' },
      ], 0);

      const { result } = renderHook(() => useNotes());
      expect(result.current.selectedNoteIndex).toBe(0);

      act(() => { result.current.setCurrentNote('aaa updated'); });

      // notes[0] should be updated in-place, no new note
      expect(result.current.notes).toHaveLength(2);
      expect(result.current.notes[0].content).toBe('aaa updated');
      expect(result.current.notes[1].content).toBe('bbb');
    });

    it('full scenario: refresh page, type on existing note, auto-save does NOT duplicate', () => {
      // Simulate: user was editing note 1, page refreshes
      seedNotes([
        { content: 'note 0 content', title: 'Zero' },
        { content: 'note 1 original', title: 'One' },
        { content: 'note 2 content', title: 'Two' },
      ], 1);
      localStorageMock.setItem('currentNote', 'note 1 original');
      localStorageMock.setItem('currentTitle', 'One');

      // "Page loads" - hook initializes
      const { result } = renderHook(() => useNotes());

      expect(result.current.selectedNoteIndex).toBe(1);
      expect(result.current.notes).toHaveLength(3);

      // User types more content
      act(() => { result.current.setCurrentNote('note 1 edited by user'); });

      // Auto-save fires (like the 2-second timeout in index.tsx)
      act(() => { result.current.saveCurrentNote(); });

      // CRITICAL: must still be 3 notes, not 4
      expect(result.current.notes).toHaveLength(3);
      expect(result.current.notes[1].content).toBe('note 1 edited by user');
      // Other notes untouched
      expect(result.current.notes[0].content).toBe('note 0 content');
      expect(result.current.notes[2].content).toBe('note 2 content');
    });

    it('full scenario: refresh with NO selectedNoteIndex, type, auto-save creates exactly one new note', () => {
      // Edge case: selectedNoteIndex was lost (old version of code, or manual localStorage clear)
      seedNotes([
        { content: 'existing note', title: 'Existing' },
      ]);
      // NO selectedNoteIndex persisted
      localStorageMock.setItem('currentNote', 'orphaned content');
      localStorageMock.setItem('currentTitle', 'orphaned title');

      const { result } = renderHook(() => useNotes());

      expect(result.current.selectedNoteIndex).toBeNull();

      // Auto-save fires
      act(() => { result.current.saveCurrentNote(); });

      // Should create exactly one new note (total 2), not more
      expect(result.current.notes).toHaveLength(2);
      expect(result.current.notes[0].content).toBe('orphaned content');
      // After creation, selectedNoteIndex should point to the new note
      expect(result.current.selectedNoteIndex).toBe(0);
    });

    it('multiple rapid saves do not create duplicate notes', () => {
      seedNotes([
        { content: 'original', title: 'Title' },
      ], 0);

      const { result } = renderHook(() => useNotes());

      // Simulate rapid typing + multiple saves
      act(() => { result.current.setCurrentNote('edit 1'); });
      act(() => { result.current.saveCurrentNote(); });
      act(() => { result.current.setCurrentNote('edit 2'); });
      act(() => { result.current.saveCurrentNote(); });
      act(() => { result.current.setCurrentNote('edit 3'); });
      act(() => { result.current.saveCurrentNote(); });

      // Must still be exactly 1 note
      expect(result.current.notes).toHaveLength(1);
      expect(result.current.notes[0].content).toBe('edit 3');
    });
  });

  // =====================================================
  // selectedNoteIndex persistence
  // =====================================================

  describe('selectedNoteIndex persistence', () => {
    it('persists selectedNoteIndex to localStorage on selectNote', () => {
      seedNotes([
        { content: 'a', title: 'A' },
        { content: 'b', title: 'B' },
      ]);

      const { result } = renderHook(() => useNotes());

      act(() => { result.current.selectNote(1); });
      expect(localStorageMock.getItem('selectedNoteIndex')).toBe('1');
    });

    it('clears selectedNoteIndex from localStorage when set to null (delete selected note)', () => {
      seedNotes([
        { content: 'a', title: 'A' },
        { content: 'b', title: 'B' },
      ], 0);

      const { result } = renderHook(() => useNotes());

      act(() => { result.current.deleteNote(0); });
      expect(localStorageMock.getItem('selectedNoteIndex')).toBeNull();
      expect(result.current.selectedNoteIndex).toBeNull();
    });

    it('does not restore out-of-bounds selectedNoteIndex', () => {
      seedNotes([{ content: 'only one', title: 'one' }]);
      localStorageMock.setItem('selectedNoteIndex', '5'); // out of bounds

      const { result } = renderHook(() => useNotes());
      expect(result.current.selectedNoteIndex).toBeNull();
      expect(localStorageMock.getItem('selectedNoteIndex')).toBeNull();
    });

    it('does not restore NaN selectedNoteIndex', () => {
      seedNotes([{ content: 'one', title: 'one' }]);
      localStorageMock.setItem('selectedNoteIndex', 'garbage');

      const { result } = renderHook(() => useNotes());
      expect(result.current.selectedNoteIndex).toBeNull();
    });

    it('adjusts selectedNoteIndex when deleting a note before the selected one', () => {
      seedNotes([
        { content: 'a', title: 'A' },
        { content: 'b', title: 'B' },
        { content: 'c', title: 'C' },
      ], 2);

      const { result } = renderHook(() => useNotes());
      expect(result.current.selectedNoteIndex).toBe(2);

      // Delete note at index 0 (before selected)
      act(() => { result.current.deleteNote(0); });
      expect(result.current.selectedNoteIndex).toBe(1);
      expect(localStorageMock.getItem('selectedNoteIndex')).toBe('1');
    });
  });

  // =====================================================
  // Core hook behavior
  // =====================================================

  describe('title update regression', () => {
    it('updateCurrentTitle updates in-place when editing existing note', () => {
      seedNotes([
        { content: 'content', title: 'Original Title' },
      ], 0);

      const { result } = renderHook(() => useNotes());

      act(() => { result.current.setCurrentTitle('Updated Title'); });

      expect(result.current.notes).toHaveLength(1);
      expect(result.current.notes[0].title).toBe('Updated Title');
    });

    it('title + content save after refresh does not duplicate', () => {
      seedNotes([
        { content: 'c', title: 't' },
      ], 0);
      localStorageMock.setItem('currentNote', 'c');
      localStorageMock.setItem('currentTitle', 't');

      const { result } = renderHook(() => useNotes());

      act(() => { result.current.setCurrentTitle('new title'); });
      act(() => { result.current.setCurrentNote('new content'); });
      act(() => { result.current.saveCurrentNote(); });

      expect(result.current.notes).toHaveLength(1);
      expect(result.current.notes[0].title).toBe('new title');
      expect(result.current.notes[0].content).toBe('new content');
    });
  });

  describe('createNewNote', () => {
    it('creates empty note when no current content', () => {
      const { result } = renderHook(() => useNotes());

      act(() => { result.current.createNewNote(); });

      expect(result.current.notes).toHaveLength(1);
      expect(result.current.notes[0].content).toBe('');
      expect(result.current.selectedNoteIndex).toBe(0);
    });

    it('saves current content then creates new empty note on createNewNote', () => {
      const { result } = renderHook(() => useNotes());

      // Type some content first (no selected note)
      act(() => { result.current.setCurrentNote('hello'); });
      act(() => { result.current.setCurrentTitle('world'); });
      act(() => { result.current.createNewNote(); });

      // Content saved as a note + new empty note created at front
      expect(result.current.notes).toHaveLength(2);
      expect(result.current.notes[0].content).toBe(''); // new empty note
      expect(result.current.notes[1].content).toBe('hello'); // saved content
      expect(result.current.notes[1].title).toBe('world');
      expect(result.current.currentNote).toBe('');
      expect(result.current.currentTitle).toBe('');
      expect(result.current.selectedNoteIndex).toBe(0); // selects the new empty note
    });
  });

  describe('createNewNote while editing existing', () => {
    it('saves current note in-place and creates new empty note in sidebar', () => {
      seedNotes([
        { content: 'first', title: 'First' },
        { content: 'second', title: 'Second' },
      ], 0);

      const { result } = renderHook(() => useNotes());

      // Edit note 0
      act(() => { result.current.setCurrentNote('first edited'); });

      // Press "new note" button
      act(() => { result.current.createNewNote(); });

      // Should save edits to note 0 AND create a new empty note at front
      expect(result.current.notes).toHaveLength(3);
      expect(result.current.notes[0].content).toBe(''); // new empty note
      expect(result.current.notes[1].content).toBe('first edited'); // saved edit
      expect(result.current.notes[2].content).toBe('second'); // untouched
      expect(result.current.currentNote).toBe('');
      expect(result.current.currentTitle).toBe('');
      expect(result.current.selectedNoteIndex).toBe(0); // selects the new note
    });

    it('switching between notes preserves content of each note', () => {
      seedNotes([
        { content: 'aaa', title: 'A' },
        { content: 'bbb', title: 'B' },
      ], 0);

      const { result } = renderHook(() => useNotes());

      // Edit note 0
      act(() => { result.current.setCurrentNote('aaa edited'); });

      // Switch to note 1
      act(() => { result.current.selectNote(1); });

      // Note 0 should have been updated by setCurrentNote
      expect(result.current.notes[0].content).toBe('aaa edited');
      // Editor now shows note 1
      expect(result.current.currentNote).toBe('bbb');

      // Edit note 1
      act(() => { result.current.setCurrentNote('bbb edited'); });

      // Switch back to note 0
      act(() => { result.current.selectNote(0); });

      // Both notes should have their edits preserved
      expect(result.current.notes[0].content).toBe('aaa edited');
      expect(result.current.notes[1].content).toBe('bbb edited');
      expect(result.current.notes).toHaveLength(2); // no duplicates
    });
  });

  describe('selectNote', () => {
    it('loads selected note content into editor', () => {
      seedNotes([
        { content: 'first', title: 'First' },
        { content: 'second', title: 'Second' },
      ]);

      const { result } = renderHook(() => useNotes());

      act(() => { result.current.selectNote(1); });

      expect(result.current.currentNote).toBe('second');
      expect(result.current.currentTitle).toBe('Second');
      expect(result.current.selectedNoteIndex).toBe(1);
    });
  });

  describe('localStorage data integrity', () => {
    it('selectedNoteIndex in localStorage matches state after selectNote', () => {
      seedNotes([
        { content: 'a', title: 'A' },
        { content: 'b', title: 'B' },
        { content: 'c', title: 'C' },
      ]);

      const { result } = renderHook(() => useNotes());

      act(() => { result.current.selectNote(2); });
      expect(localStorageMock.getItem('selectedNoteIndex')).toBe('2');

      act(() => { result.current.selectNote(0); });
      expect(localStorageMock.getItem('selectedNoteIndex')).toBe('0');
    });

    it('createNewNote updates selectedNoteIndex in localStorage to 0', () => {
      seedNotes([
        { content: 'existing', title: 'E' },
      ], 0);

      const { result } = renderHook(() => useNotes());

      act(() => { result.current.createNewNote(); });
      expect(localStorageMock.getItem('selectedNoteIndex')).toBe('0');
    });

    it('negative selectedNoteIndex in localStorage is rejected', () => {
      seedNotes([{ content: 'a', title: 'A' }]);
      localStorageMock.setItem('selectedNoteIndex', '-1');

      const { result } = renderHook(() => useNotes());
      expect(result.current.selectedNoteIndex).toBeNull();
    });

    it('currentNote and currentTitle persist to localStorage on change', () => {
      const { result } = renderHook(() => useNotes());

      act(() => { result.current.setCurrentNote('persisted content'); });
      act(() => { result.current.setCurrentTitle('persisted title'); });

      // Wait for effect to run
      expect(localStorageMock.getItem('currentNote')).toBe('persisted content');
      expect(localStorageMock.getItem('currentTitle')).toBe('persisted title');
    });
  });

  describe('deleteNote', () => {
    it('removes note from list', () => {
      seedNotes([
        { content: 'a', title: 'A' },
        { content: 'b', title: 'B' },
      ]);

      const { result } = renderHook(() => useNotes());

      act(() => { result.current.deleteNote(0); });

      expect(result.current.notes).toHaveLength(1);
      expect(result.current.notes[0].content).toBe('b');
    });
  });

  // =====================================================
  // REGRESSION: "new page" must always add a note to sidebar
  // =====================================================

  describe('new page always appears in sidebar', () => {
    it('createNewNote with selected note adds new entry to sidebar', () => {
      seedNotes([
        { content: 'existing', title: 'Existing' },
      ], 0);

      const { result } = renderHook(() => useNotes());
      expect(result.current.notes).toHaveLength(1);

      act(() => { result.current.createNewNote(); });

      // Must have 2 notes now: the new empty one + the existing one
      expect(result.current.notes).toHaveLength(2);
      expect(result.current.notes[0].content).toBe('');
      expect(result.current.notes[0].title).toBe('');
      expect(result.current.selectedNoteIndex).toBe(0);
    });

    it('createNewNote with no notes creates first note in sidebar', () => {
      const { result } = renderHook(() => useNotes());
      expect(result.current.notes).toHaveLength(0);

      act(() => { result.current.createNewNote(); });

      expect(result.current.notes).toHaveLength(1);
      expect(result.current.selectedNoteIndex).toBe(0);
    });

    it('createNewNote preserves all existing notes', () => {
      seedNotes([
        { content: 'a', title: 'A' },
        { content: 'b', title: 'B' },
        { content: 'c', title: 'C' },
      ], 1);

      const { result } = renderHook(() => useNotes());

      act(() => { result.current.setCurrentNote('b edited'); });
      act(() => { result.current.createNewNote(); });

      // 3 original + 1 new = 4
      expect(result.current.notes).toHaveLength(4);
      expect(result.current.notes[0].content).toBe(''); // new empty
      expect(result.current.notes[1].content).toBe('a');
      expect(result.current.notes[2].content).toBe('b edited'); // saved in-place
      expect(result.current.notes[3].content).toBe('c');
    });

    it('rapid createNewNote calls each add a note', () => {
      const { result } = renderHook(() => useNotes());

      act(() => { result.current.createNewNote(); });
      act(() => { result.current.createNewNote(); });
      act(() => { result.current.createNewNote(); });

      expect(result.current.notes).toHaveLength(3);
      expect(result.current.selectedNoteIndex).toBe(0);
    });
  });

  // =====================================================
  // REGRESSION: auto-create note when typing without selection
  // =====================================================

  describe('auto-create note on typing without selection', () => {
    it('typing content with no selected note creates a note in sidebar', () => {
      const { result } = renderHook(() => useNotes());
      expect(result.current.notes).toHaveLength(0);
      expect(result.current.selectedNoteIndex).toBeNull();

      act(() => { result.current.setCurrentNote('hello'); });

      expect(result.current.notes).toHaveLength(1);
      expect(result.current.notes[0].content).toBe('hello');
      expect(result.current.selectedNoteIndex).toBe(0);
    });

    it('typing title with no selected note creates a note in sidebar', () => {
      const { result } = renderHook(() => useNotes());

      act(() => { result.current.setCurrentTitle('my title'); });

      expect(result.current.notes).toHaveLength(1);
      expect(result.current.notes[0].title).toBe('my title');
      expect(result.current.selectedNoteIndex).toBe(0);
    });

    it('whitespace-only content does not auto-create a note', () => {
      const { result } = renderHook(() => useNotes());

      act(() => { result.current.setCurrentNote('   '); });

      expect(result.current.notes).toHaveLength(0);
      expect(result.current.selectedNoteIndex).toBeNull();
    });

    it('pasting content with no selected note creates a note immediately', () => {
      seedNotes([{ content: 'existing', title: 'E' }]);
      // No selectedNoteIndex -- simulates fresh state after deleting selection

      const { result } = renderHook(() => useNotes());
      expect(result.current.selectedNoteIndex).toBeNull();

      // Simulate paste
      act(() => { result.current.setCurrentNote('pasted text'); });

      expect(result.current.notes).toHaveLength(2);
      expect(result.current.notes[0].content).toBe('pasted text');
      expect(result.current.selectedNoteIndex).toBe(0);
    });

    it('auto-created note is editable without duplication', () => {
      const { result } = renderHook(() => useNotes());

      // First keystroke auto-creates
      act(() => { result.current.setCurrentNote('h'); });
      expect(result.current.notes).toHaveLength(1);

      // Subsequent keystrokes update in-place
      act(() => { result.current.setCurrentNote('he'); });
      act(() => { result.current.setCurrentNote('hel'); });
      act(() => { result.current.setCurrentNote('hello'); });

      expect(result.current.notes).toHaveLength(1);
      expect(result.current.notes[0].content).toBe('hello');
    });
  });
});
