'use client';

import { useEffect, useState, useCallback } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISS_KEY = 'pwa-install-dismissed';

export function PWARegister() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }

    if (localStorage.getItem(DISMISS_KEY)) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
      setShowBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const dismiss = useCallback((persist: boolean) => {
    setIsExiting(true);
    setTimeout(() => {
      setShowBanner(false);
      setInstallPrompt(null);
      setIsExiting(false);
      if (persist) localStorage.setItem(DISMISS_KEY, '1');
    }, 280);
  }, []);

  const handleInstall = useCallback(async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') dismiss(true);
  }, [installPrompt, dismiss]);

  const handleDismiss = useCallback(() => {
    dismiss(true);
  }, [dismiss]);

  if (!showBanner) return null;

  return (
    <div
      className={`pwa-banner-wrapper ${isExiting ? 'pwa-banner-exit' : ''}`}
      role="dialog"
      aria-label="Install app"
    >
      <div className="pwa-banner">
        {/* Decorative top rule */}
        <div className="pwa-banner-rule" />

        <div className="pwa-banner-content">
          <div className="pwa-banner-icon">ক</div>
          <div className="pwa-banner-text">
            <p className="pwa-banner-title">কাগজ ইনস্টল করুন</p>
            <p className="pwa-banner-subtitle">হোম স্ক্রিনে যোগ করে অফলাইনে লিখুন</p>
          </div>
        </div>

        <div className="pwa-banner-actions">
          <button
            onClick={handleDismiss}
            className="pwa-banner-btn-dismiss"
          >
            পরে
          </button>
          <button
            onClick={handleInstall}
            className="pwa-banner-btn-install"
          >
            ইনস্টল
          </button>
        </div>
      </div>
    </div>
  );
}
