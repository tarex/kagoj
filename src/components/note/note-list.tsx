import React from 'react';

interface Note {
  content: string;
  date: string;
}

interface NoteListProps {
  notes: Note[];
  selectedNoteIndex: number | null;
  onSelect: (index: number) => void;
  onDelete: (index: number) => void;
}

export const NoteList = React.memo<NoteListProps>(({
  notes,
  selectedNoteIndex,
  onSelect,
  onDelete,
}) => {
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

  return (
    <div>
      {notes.map((note, index) => {
        // Generate proper empty note naming in Bangla
        const emptyNoteNumber = notes.slice(0, index + 1)
          .filter(n => !n.content || n.content.trim() === '').length;
        const displayContent = note.content || `খালি কাগজ ${emptyNoteNumber}`;
        
        return (
          <div
            key={index}
            className={`note-item ${index === selectedNoteIndex ? 'selected' : ''}`}
            onClick={() => onSelect(index)}
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
            
            <div className="note-preview">
              {displayContent}
            </div>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(index);
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