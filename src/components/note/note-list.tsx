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

export const NoteList: React.FC<NoteListProps> = ({
  notes,
  selectedNoteIndex,
  onSelect,
  onDelete,
}) => {
  return (
    <div className="notes-list">
      {notes.map((note, index) => (
        <div
          key={index}
          className={`note-item ${
            index === selectedNoteIndex ? 'selected' : ''
          }`}
          onClick={() => onSelect(index)}
        >
          <div className="note-date">
            {new Date(note.date).toLocaleString()}
          </div>
          <div className="note-content-preview">
            {note.content ? note.content.slice(0, 30) + '...' : 'Empty note'}
          </div>
          <div className="note-actions">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(index);
              }}
              className="delete-button"
            >
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};
