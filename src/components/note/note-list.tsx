import React, { useMemo } from 'react';

interface Note {
  content: string;
  date: string;
  title: string;
}

interface NoteListProps {
  notes: Note[];
  selectedNoteIndex: number | null;
  searchQuery?: string;
  onSelect: (index: number) => void;
  onDelete: (index: number) => void;
}

export const NoteList = React.memo<NoteListProps>(({
  notes,
  selectedNoteIndex,
  searchQuery = '',
  onSelect,
  onDelete,
}) => {
  const filteredNotes = useMemo(() => {
    if (!searchQuery.trim()) {
      return notes.map((note, index) => ({ note, originalIndex: index }));
    }
    const query = searchQuery.trim().toLowerCase();
    return notes
      .map((note, index) => ({ note, originalIndex: index }))
      .filter(({ note }) =>
        note.title.toLowerCase().includes(query) ||
        note.content.toLowerCase().includes(query)
      );
  }, [notes, searchQuery]);

  if (notes.length === 0) {
    return (
      <div className="empty-state">
        <svg className="empty-state-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <div className="empty-state-text">
          <p>কোনো নোট নেই</p>
          <p style={{ fontSize: '12px', marginTop: '4px' }}>
            নতুন নোট তৈরি করতে উপরের বাটনে ক্লিক করুন
          </p>
        </div>
      </div>
    );
  }

  if (filteredNotes.length === 0 && searchQuery.trim()) {
    return (
      <div className="empty-state">
        <div className="empty-state-text">
          <p>কোনো ফলাফল পাওয়া যায়নি</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {filteredNotes.map(({ note, originalIndex }) => {
        const hasTitle = note.title && note.title.trim() !== '';

        return (
          <div
            key={originalIndex}
            className={`note-item ${originalIndex === selectedNoteIndex ? 'selected' : ''}`}
            onClick={() => onSelect(originalIndex)}
          >
            <div className="note-date">
              {new Date(note.date).toLocaleDateString('bn-BD', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </div>

            <div className={`note-title-label ${hasTitle ? '' : 'untitled'}`}>
              {hasTitle ? note.title : 'শিরোনামহীন'}
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(originalIndex);
              }}
              className="note-delete"
              aria-label="Delete note"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        );
      })}
    </div>
  );
});

NoteList.displayName = 'NoteList';
