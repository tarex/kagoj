'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';

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

interface MappingItem {
  type: string;
  bangla: string;
  hint?: string;
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

// Barga table: 5 rows x 5 cols - the traditional Bangla consonant grid
const BARGA_TABLE: { label: string; items: MappingItem[] }[] = [
  {
    label: 'ক',
    items: [
      { type: 'k', bangla: 'ক' },
      { type: 'kh', bangla: 'খ' },
      { type: 'g', bangla: 'গ' },
      { type: 'gh', bangla: 'ঘ' },
      { type: 'Ng', bangla: 'ঙ' },
    ],
  },
  {
    label: 'চ',
    items: [
      { type: 'c', bangla: 'চ' },
      { type: 'ch', bangla: 'ছ' },
      { type: 'j', bangla: 'জ' },
      { type: 'jh', bangla: 'ঝ' },
      { type: 'NG', bangla: 'ঞ' },
    ],
  },
  {
    label: 'ট',
    items: [
      { type: 'T', bangla: 'ট' },
      { type: 'Th', bangla: 'ঠ' },
      { type: 'D', bangla: 'ড' },
      { type: 'Dh', bangla: 'ঢ' },
      { type: 'N', bangla: 'ণ' },
    ],
  },
  {
    label: 'ত',
    items: [
      { type: 't', bangla: 'ত' },
      { type: 'th', bangla: 'থ' },
      { type: 'd', bangla: 'দ' },
      { type: 'dh', bangla: 'ধ' },
      { type: 'n', bangla: 'ন' },
    ],
  },
  {
    label: 'প',
    items: [
      { type: 'p', bangla: 'প' },
      { type: 'ph', bangla: 'ফ' },
      { type: 'b', bangla: 'ব' },
      { type: 'bh', bangla: 'ভ' },
      { type: 'm', bangla: 'ম' },
    ],
  },
];

const VOWELS: MappingItem[] = [
  { type: 'o', bangla: 'অ' },
  { type: 'a', bangla: 'আ' },
  { type: 'i', bangla: 'ই' },
  { type: 'I', bangla: 'ঈ', hint: 'ee' },
  { type: 'u', bangla: 'উ' },
  { type: 'U', bangla: 'ঊ' },
  { type: 'rri', bangla: 'ঋ' },
  { type: 'e', bangla: 'এ' },
  { type: 'OI', bangla: 'ঐ' },
  { type: 'O', bangla: 'ও' },
  { type: 'OU', bangla: 'ঔ' },
];

const OTHER_CONSONANTS: MappingItem[] = [
  { type: 'z', bangla: 'য' },
  { type: 'r', bangla: 'র' },
  { type: 'l', bangla: 'ল' },
  { type: 'S', bangla: 'শ' },
  { type: 'sh', bangla: 'ষ', hint: 'Sh' },
  { type: 's', bangla: 'স' },
  { type: 'h', bangla: 'হ' },
  { type: 'R', bangla: 'ড়' },
  { type: 'Rh', bangla: 'ঢ়' },
  { type: 'y', bangla: 'য়' },
  { type: 'x', bangla: 'ক্স' },
];

const SPECIALS: MappingItem[] = [
  { type: 'ng', bangla: 'ং' },
  { type: "t`", bangla: 'ৎ', hint: 'খণ্ড ত' },
  { type: ',,', bangla: '্', hint: 'হসন্ত' },
  { type: '^', bangla: 'ঁ', hint: 'চন্দ্রবিন্দু' },
  { type: ':', bangla: 'ঃ' },
  { type: '.', bangla: '।', hint: 'দাঁড়ি' },
  { type: '\\.', bangla: '.', hint: 'ডট' },
  { type: '$', bangla: '৳', hint: 'টাকা' },
  { type: '`', bangla: '', hint: 'ভাঙে' },
];

// Flatten all items for search
const ALL_ITEMS: (MappingItem & { group: string })[] = [
  ...VOWELS.map((item) => ({ ...item, group: 'স্বরবর্ণ' })),
  ...BARGA_TABLE.flatMap((row) =>
    row.items.map((item) => ({ ...item, group: 'ব্যঞ্জনবর্ণ' }))
  ),
  ...OTHER_CONSONANTS.map((item) => ({ ...item, group: 'অন্যান্য ব্যঞ্জন' })),
  ...SPECIALS.map((item) => ({ ...item, group: 'চিহ্ন ও বিশেষ' })),
];

type TabId = 'shortcuts' | 'mapping';

export const KeyboardShortcutsPanel: React.FC<KeyboardShortcutsPanelProps> = ({
  isOpen,
  onClose,
}) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<TabId>('mapping');
  const [search, setSearch] = useState('');

  const filteredItems = useMemo(() => {
    if (!search.trim()) return null;
    const q = search.trim().toLowerCase();
    return ALL_ITEMS.filter(
      (item) =>
        item.type.toLowerCase().includes(q) ||
        item.bangla.includes(q) ||
        (item.hint && item.hint.toLowerCase().includes(q))
    );
  }, [search]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Focus search when switching to mapping tab
  useEffect(() => {
    if (activeTab === 'mapping' && searchRef.current) {
      const t = setTimeout(() => searchRef.current?.focus(), 200);
      return () => clearTimeout(t);
    }
  }, [activeTab]);

  // Reset search when panel closes
  useEffect(() => {
    if (!isOpen) {
      setSearch('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Running cell index for stagger animation
  let cellIndex = 0;

  const renderCell = (item: MappingItem) => {
    const idx = cellIndex++;
    return (
      <div
        className="sp-cell"
        key={item.type}
        style={{ '--cell-i': idx } as React.CSSProperties}
      >
        <span className="sp-cell-bangla">{item.bangla || '\u00A0'}</span>
        <kbd className="sp-cell-key">{item.type}</kbd>
        {item.hint && <span className="sp-cell-hint">{item.hint}</span>}
      </div>
    );
  };

  return (
    <>
      {/* Backdrop */}
      <div className="sp-backdrop" onClick={onClose} />

      {/* Panel */}
      <div className="shortcuts-panel" ref={panelRef}>
        {/* Header */}
        <div className="sp-header">
          <div className="sp-tabs">
            <button
              className={`sp-tab ${activeTab === 'mapping' ? 'sp-tab-active' : ''}`}
              onClick={() => setActiveTab('mapping')}
            >
              <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
              </svg>
              টাইপিং গাইড
            </button>
            <button
              className={`sp-tab ${activeTab === 'shortcuts' ? 'sp-tab-active' : ''}`}
              onClick={() => setActiveTab('shortcuts')}
            >
              <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
                <rect x="2" y="6" width="20" height="13" rx="2" />
                <path strokeLinecap="round" d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M8 14h8" />
              </svg>
              শর্টকাট
            </button>
          </div>
          <button className="sp-close" onClick={onClose} aria-label="Close">
            <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Shortcuts Tab */}
        {activeTab === 'shortcuts' && (
          <div className="sp-tab-content sp-shortcuts-body">
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
        )}

        {/* Mapping Tab */}
        {activeTab === 'mapping' && (
          <div className="sp-tab-content sp-mapping-body">
            {/* Search */}
            <div className="sp-search-wrap">
              <svg className="sp-search-icon" width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <circle cx="11" cy="11" r="8" />
                <path strokeLinecap="round" d="m21 21-4.35-4.35" />
              </svg>
              <input
                ref={searchRef}
                className="sp-search"
                type="text"
                placeholder="খুঁজুন... (k, ক, kh...)"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoComplete="off"
                spellCheck={false}
              />
              {search && (
                <button
                  className="sp-search-clear"
                  onClick={() => setSearch('')}
                  aria-label="Clear search"
                >
                  <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                    <path strokeLinecap="round" d="M18 6 6 18M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            {/* Scrollable content */}
            <div className="sp-mapping-scroll">
              {/* Search Results */}
              {filteredItems !== null ? (
                <div className="sp-section">
                  <div className="sp-section-label">
                    {filteredItems.length > 0
                      ? `${filteredItems.length}টি ফলাফল`
                      : 'কোনো ফলাফল নেই'}
                  </div>
                  {filteredItems.length > 0 && (
                    <div className="sp-grid">
                      {filteredItems.map(renderCell)}
                    </div>
                  )}
                </div>
              ) : (
                <>
                  {/* Vowels */}
                  <div className="sp-section">
                    <div className="sp-section-label">স্বরবর্ণ</div>
                    <div className="sp-grid">
                      {VOWELS.map(renderCell)}
                    </div>
                  </div>

                  {/* Barga Table */}
                  <div className="sp-section">
                    <div className="sp-section-label">ব্যঞ্জনবর্ণ (বর্গ)</div>
                    <div className="sp-barga">
                      {BARGA_TABLE.map((row, rowIdx) => (
                        <div
                          className="sp-barga-row"
                          key={row.label}
                          style={{ '--row-i': rowIdx } as React.CSSProperties}
                        >
                          <span className="sp-barga-label">{row.label}</span>
                          {row.items.map((item) => {
                            const idx = cellIndex++;
                            return (
                              <div
                                className="sp-cell sp-cell-compact"
                                key={item.type}
                                style={{ '--cell-i': idx } as React.CSSProperties}
                              >
                                <span className="sp-cell-bangla">{item.bangla}</span>
                                <kbd className="sp-cell-key">{item.type}</kbd>
                              </div>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Other consonants */}
                  <div className="sp-section">
                    <div className="sp-section-label">অন্যান্য ব্যঞ্জন</div>
                    <div className="sp-grid">
                      {OTHER_CONSONANTS.map(renderCell)}
                    </div>
                  </div>

                  {/* Special characters */}
                  <div className="sp-section">
                    <div className="sp-section-label">চিহ্ন ও বিশেষ</div>
                    <div className="sp-grid">
                      {SPECIALS.map(renderCell)}
                    </div>
                  </div>

                  {/* Numbers */}
                  <div className="sp-section sp-section-inline">
                    <div className="sp-section-label">সংখ্যা</div>
                    <span className="sp-num-note">0-9 &rarr; ০-৯</span>
                  </div>

                  {/* Tips */}
                  <div className="sp-tips">
                    <div className="sp-tip-row">
                      <kbd>Shift</kbd>
                      <span>বড় হাতের = মহাপ্রাণ/মূর্ধন্য (<kbd>T</kbd> = ট, <kbd>t</kbd> = ত)</span>
                    </div>
                    <div className="sp-tip-row">
                      <kbd>`</kbd>
                      <span>যুক্তাক্ষর ভাঙতে ব্যবহার করুন</span>
                    </div>
                    <div className="sp-tip-row">
                      <kbd>,,</kbd>
                      <span>হসন্ত (্) যোগ করে যুক্তাক্ষর তৈরি করুন</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
};
