'use client';

import { useEffect } from 'react';

export function ConsoleGreeting() {
  useEffect(() => {
    console.log(
      '%c কাগজ ',
      'font-size:48px;font-weight:bold;color:#1a8bf5;text-shadow:2px 2px 0 #edf5ff'
    );
    console.log(
      '%c সহজে বাংলা লিখুন ',
      'font-size:14px;color:#888'
    );
  }, []);

  return null;
}
