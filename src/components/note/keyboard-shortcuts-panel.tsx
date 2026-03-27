'use client';

import React, { useEffect, useRef } from 'react';

interface KeyboardShortcutsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ShortcutItem {
  keys: string[];
  description: string;
}

interface ShortcutGroup {
  title: string;
  items: ShortcutItem[];
}

const SHORTCUT_GROUPS: ShortcutGroup[] = [
  {
    title: 'নোট',
    items: [
      { keys: ['Ctrl', 'N'], description: 'নতুন নোট' },
      { keys: ['Ctrl', 'S'], description: 'সেভ করুন' },
      { keys: ['Ctrl', 'Shift', 'D'], description: 'নোট মুছুন' },
      { keys: ['Ctrl', 'Z'], description: 'আনডু' },
      { keys: ['Ctrl', 'Shift', 'Z'], description: 'রিডু' },
      { keys: ['Ctrl', 'P'], description: 'প্রিন্ট' },
    ],
  },
  {
    title: 'লেখা',
    items: [
      { keys: ['Ctrl', 'Shift', 'B'], description: 'বাংলা/English টগল' },
      { keys: ['Ctrl', 'Shift', 'T'], description: 'থিম টগল' },
      { keys: ['Tab'], description: 'সাজেশন গ্রহণ' },
      { keys: ['Escape'], description: 'সাজেশন বাতিল' },
      { keys: ['Ctrl', '/'], description: 'শর্টকাট প্যানেল' },
    ],
  },
  {
    title: 'ফরম্যাটিং',
    items: [
      { keys: ['Ctrl', 'B'], description: 'বোল্ড' },
      { keys: ['Ctrl', 'I'], description: 'ইটালিক' },
      { keys: ['Ctrl', 'U'], description: 'আন্ডারলাইন' },
      { keys: ['Ctrl', 'D'], description: 'স্ট্রাইকথ্রু' },
      { keys: ['Ctrl', 'E'], description: 'কোড' },
      { keys: ['Ctrl', 'H'], description: 'হাইলাইট' },
    ],
  },
];

export const KeyboardShortcutsPanel: React.FC<KeyboardShortcutsPanelProps> = ({
  isOpen,
  onClose,
}) => {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="shortcuts-panel" ref={panelRef}>
      <div className="shortcuts-panel-title">
        <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75} style={{ color: 'var(--accent-primary)', flexShrink: 0 }}>
          <rect x="2" y="6" width="20" height="13" rx="2" />
          <path strokeLinecap="round" d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M8 14h8M6 14h.01M18 14h.01" />
        </svg>
        কীবোর্ড শর্টকাট
      </div>
      {SHORTCUT_GROUPS.map((group) => (
        <div className="shortcuts-group" key={group.title}>
          <div className="shortcuts-group-title">{group.title}</div>
          {group.items.map((item) => (
            <div className="shortcut-row" key={item.description}>
              <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                {item.keys.map((key, i) => (
                  <React.Fragment key={key}>
                    <kbd>{key}</kbd>
                    {i < item.keys.length - 1 && (
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>+</span>
                    )}
                  </React.Fragment>
                ))}
              </div>
              <span>{item.description}</span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};
