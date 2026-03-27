'use client';

import React, { useState, useCallback, useEffect } from 'react';
import './onboarding.css';

const ONBOARDING_KEY = 'kagoj_onboarding_seen';

interface Slide {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  description: string;
  demo: React.ReactNode;
}

const TypingDemo = () => {
  const [text, setText] = useState('');
  const full = 'ami banglay gan gai';
  const bangla = 'আমি বাংলায় গান গাই';

  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      if (i <= full.length) {
        setText(full.slice(0, i));
        i++;
      } else {
        clearInterval(interval);
      }
    }, 120);
    return () => clearInterval(interval);
  }, []);

  const progress = text.length / full.length;
  const banglaShown = bangla.slice(0, Math.floor(progress * bangla.length));

  return (
    <div className="onboarding-demo-typing">
      <div className="onboarding-demo-input">
        <span className="onboarding-demo-label">Roman</span>
        <span className="onboarding-demo-text-roman">{text}<span className="onboarding-cursor">|</span></span>
      </div>
      <div className="onboarding-demo-arrow">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 5v14" /><path d="m19 12-7 7-7-7" />
        </svg>
      </div>
      <div className="onboarding-demo-output">
        <span className="onboarding-demo-label">বাংলা</span>
        <span className="onboarding-demo-text-bangla">{banglaShown}</span>
      </div>
    </div>
  );
};

const SpellCheckDemo = () => (
  <div className="onboarding-demo-spellcheck">
    <span>আমি </span>
    <span className="onboarding-demo-error">
      পরিক্ষা
      <span className="onboarding-demo-correction">পরীক্ষা</span>
    </span>
    <span> দিচ্ছি</span>
  </div>
);

const HighlightDemo = () => (
  <div className="onboarding-demo-highlight">
    <span>আমার </span>
    <span className="onboarding-demo-selected">ভালো</span>
    <span> লাগে</span>
    <div className="onboarding-demo-suggestions">
      <div className="onboarding-demo-suggestion-item">ভাঙো</div>
      <div className="onboarding-demo-suggestion-item">ভাসো</div>
      <div className="onboarding-demo-suggestion-item">ভাবো</div>
    </div>
  </div>
);

const GhostTextDemo = () => (
  <div className="onboarding-demo-ghost">
    <span>আজ আকাশে </span>
    <span className="onboarding-demo-ghost-text">মেঘ করেছে</span>
    <div className="onboarding-demo-tab-hint">
      <kbd>Tab</kbd> গ্রহণ করুন
    </div>
  </div>
);

const KeyboardDemo = () => (
  <div className="onboarding-demo-keyboard">
    <div className="onboarding-demo-shortcut-row">
      <div className="onboarding-demo-shortcut">
        <kbd>Ctrl</kbd><span>+</span><kbd>Shift</kbd><span>+</span><kbd>B</kbd>
        <span className="onboarding-demo-shortcut-label">বাংলা/English</span>
      </div>
      <div className="onboarding-demo-shortcut">
        <kbd>Tab</kbd>
        <span className="onboarding-demo-shortcut-label">সাজেশন গ্রহণ</span>
      </div>
    </div>
    <div className="onboarding-demo-shortcut-row">
      <div className="onboarding-demo-shortcut">
        <kbd>Ctrl</kbd><span>+</span><kbd>B</kbd>
        <span className="onboarding-demo-shortcut-label">Bold</span>
      </div>
      <div className="onboarding-demo-shortcut">
        <kbd>Ctrl</kbd><span>+</span><kbd>I</kbd>
        <span className="onboarding-demo-shortcut-label">Italic</span>
      </div>
    </div>
  </div>
);

const NotesDemo = () => (
  <div className="onboarding-demo-notes">
    <div className="onboarding-demo-note-card onboarding-demo-note-active">
      <div className="onboarding-demo-note-title">আমার ডায়েরি</div>
      <div className="onboarding-demo-note-preview">আজকে আকাশ খুব সুন্দর...</div>
    </div>
    <div className="onboarding-demo-note-card">
      <div className="onboarding-demo-note-title">কবিতা</div>
      <div className="onboarding-demo-note-preview">ফুল ফুটেছে বনে বনে...</div>
    </div>
    <div className="onboarding-demo-note-card">
      <div className="onboarding-demo-note-title">গল্পের আইডিয়া</div>
      <div className="onboarding-demo-note-preview">একটা ছোট্ট গ্রামে...</div>
    </div>
  </div>
);

const slides: Slide[] = [
  {
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 20h9" /><path d="M16.376 3.622a1 1 0 0 1 3.002 3.002L7.368 18.635a2 2 0 0 1-.855.506l-2.872.838a.5.5 0 0 1-.62-.62l.838-2.872a2 2 0 0 1 .506-.854z" />
      </svg>
    ),
    title: 'ফোনেটিক টাইপিং',
    subtitle: 'Roman হরফে বাংলা লিখুন',
    description: 'ইংরেজি কীবোর্ডে টাইপ করুন, স্বয়ংক্রিয়ভাবে বাংলায় রূপান্তর হবে। "ami" লিখলে "আমি" হয়ে যায়।',
    demo: <TypingDemo />,
  },
  {
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="m12 3-4 14" /><path d="m16 3-4 14" /><path d="M6 10h12" /><path d="M3 21h4" /><path d="M17 21l2-2 4 4" />
      </svg>
    ),
    title: 'বানান পরীক্ষা',
    subtitle: 'ভুল বানান স্বয়ংক্রিয়ভাবে ধরা পড়ে',
    description: 'লেখা থামানোর পর ভুল বানানের নিচে লাল ঢেউ দেখাবে। ক্লিক করে সংশোধন করুন।',
    demo: <SpellCheckDemo />,
  },
  {
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" /><path d="M7 7h10" /><path d="M7 12h4" />
      </svg>
    ),
    title: 'শব্দ পরিবর্তন',
    subtitle: 'যেকোনো শব্দ সিলেক্ট করে বিকল্প দেখুন',
    description: 'যেকোনো বাংলা শব্দ হাইলাইট করলে কাছাকাছি শব্দের তালিকা দেখাবে। ক্লিক করে পরিবর্তন করুন।',
    demo: <HighlightDemo />,
  },
  {
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
    title: 'লেখা সম্পূর্ণকরণ',
    subtitle: 'পরবর্তী শব্দের ইঙ্গিত পান',
    description: 'লেখার সময় ধূসর টেক্সটে পরবর্তী শব্দ বা বাক্যাংশের পরামর্শ দেখাবে। Tab চেপে গ্রহণ করুন।',
    demo: <GhostTextDemo />,
  },
  {
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="4" width="20" height="16" rx="2" /><path d="M6 8h.01" /><path d="M10 8h.01" /><path d="M14 8h.01" /><path d="M18 8h.01" /><path d="M8 12h.01" /><path d="M12 12h.01" /><path d="M16 12h.01" /><path d="M7 16h10" />
      </svg>
    ),
    title: 'কীবোর্ড শর্টকাট',
    subtitle: 'দ্রুত কাজ করুন',
    description: 'সাধারণ ফরম্যাটিং, ভাষা পরিবর্তন এবং সাজেশন গ্রহণের জন্য শর্টকাট ব্যবহার করুন।',
    demo: <KeyboardDemo />,
  },
  {
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7z" /><path d="M14 2v5h5" /><path d="M10 13l-2 2 2 2" /><path d="M14 17l2-2-2-2" />
      </svg>
    ),
    title: 'নোট ব্যবস্থাপনা',
    subtitle: 'সব লেখা সংরক্ষিত থাকে',
    description: 'একাধিক নোট তৈরি করুন। সব লেখা স্বয়ংক্রিয়ভাবে সংরক্ষিত হয়। বাম পাশের সাইডবার থেকে নোট বাছাই করুন।',
    demo: <NotesDemo />,
  },
];

export const Onboarding: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [direction, setDirection] = useState<'next' | 'prev'>('next');
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const seen = localStorage.getItem(ONBOARDING_KEY);
    if (!seen) {
      setIsOpen(true);
    }
  }, []);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    localStorage.setItem(ONBOARDING_KEY, 'true');
  }, []);

  const goToSlide = useCallback((index: number) => {
    if (isAnimating || index === currentSlide) return;
    setDirection(index > currentSlide ? 'next' : 'prev');
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentSlide(index);
      setIsAnimating(false);
    }, 250);
  }, [currentSlide, isAnimating]);

  const handleNext = useCallback(() => {
    if (currentSlide < slides.length - 1) {
      goToSlide(currentSlide + 1);
    } else {
      handleClose();
    }
  }, [currentSlide, goToSlide, handleClose]);

  const handlePrev = useCallback(() => {
    if (currentSlide > 0) {
      goToSlide(currentSlide - 1);
    }
  }, [currentSlide, goToSlide]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'Enter') handleNext();
      else if (e.key === 'ArrowLeft') handlePrev();
      else if (e.key === 'Escape') handleClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleNext, handlePrev, handleClose]);

  if (!isOpen) return null;

  const slide = slides[currentSlide];
  const isLast = currentSlide === slides.length - 1;

  return (
    <div className="onboarding-backdrop" onClick={handleClose}>
      <div className="onboarding-modal" onClick={(e) => e.stopPropagation()}>
        {/* Page edge decoration */}
        <div className="onboarding-page-edge" />

        {/* Close button */}
        <button className="onboarding-close" onClick={handleClose} aria-label="Close">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M18 6 6 18" /><path d="m6 6 12 12" />
          </svg>
        </button>

        {/* Step indicator */}
        <div className="onboarding-step-label">
          {currentSlide + 1} / {slides.length}
        </div>

        {/* Content */}
        <div className={`onboarding-content ${isAnimating ? `onboarding-exit-${direction}` : 'onboarding-enter'}`}>
          <div className="onboarding-icon">{slide.icon}</div>
          <h2 className="onboarding-title">{slide.title}</h2>
          <p className="onboarding-subtitle">{slide.subtitle}</p>
          <div className="onboarding-demo-container">
            {slide.demo}
          </div>
          <p className="onboarding-description">{slide.description}</p>
        </div>

        {/* Navigation */}
        <div className="onboarding-nav">
          <div className="onboarding-dots">
            {slides.map((_, i) => (
              <button
                key={i}
                className={`onboarding-dot ${i === currentSlide ? 'active' : ''}`}
                onClick={() => goToSlide(i)}
                aria-label={`Slide ${i + 1}`}
              />
            ))}
          </div>
          <div className="onboarding-buttons">
            {currentSlide > 0 && (
              <button className="onboarding-btn-secondary" onClick={handlePrev}>
                পেছনে
              </button>
            )}
            <button className="onboarding-btn-primary" onClick={handleNext}>
              {isLast ? 'শুরু করুন' : 'পরবর্তী'}
              {!isLast && (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m9 18 6-6-6-6" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
