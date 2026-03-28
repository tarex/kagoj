import { useRef, useState, useCallback } from 'react';
import { toPng } from 'html-to-image';

interface UseShareImageReturn {
  captureRef: React.RefObject<HTMLDivElement | null>;
  captureAndDownload: (title: string) => Promise<void>;
  isCapturing: boolean;
}

function slugify(text: string): string {
  return text
    .replace(/[^a-zA-Z0-9\u0980-\u09FF]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50) || 'note';
}

export function useShareImage(): UseShareImageReturn {
  const captureRef = useRef<HTMLDivElement>(null);
  const [isCapturing, setIsCapturing] = useState<boolean>(false);

  const captureAndDownload = useCallback(async (title: string): Promise<void> => {
    if (captureRef.current === null) return;

    try {
      setIsCapturing(true);

      // Font pre-check: wait for fonts to load, then add delay for race condition
      await document.fonts.ready;
      const fontLoaded = document.fonts.check('400 16px "Noto Sans Bengali"');
      if (!fontLoaded) {
        console.warn('Noto Sans Bengali font not detected, proceeding with fallback rendering');
      }
      // 150ms delay required — race condition exists even after fonts.ready settles
      await new Promise<void>((resolve) => setTimeout(resolve, 150));

      let dataUrl: string;
      try {
        dataUrl = await toPng(captureRef.current, {
          pixelRatio: Math.max(window.devicePixelRatio, 2),
          cacheBust: true,
          filter: (node: HTMLElement) => {
            return node.tagName !== 'SCRIPT';
          },
        });
      } catch (toPngError) {
        // Firefox crash workaround for html-to-image Issue #508:
        // rule.style.fontFamily access throws in some Firefox versions >= 1.11.12
        const errorMessage = toPngError instanceof Error ? toPngError.message : String(toPngError);
        if (errorMessage.includes('fontFamily') || errorMessage.includes('style')) {
          // Retry without filter option
          dataUrl = await toPng(captureRef.current, {
            pixelRatio: Math.max(window.devicePixelRatio, 2),
            cacheBust: true,
          });
        } else {
          throw toPngError;
        }
      }

      const filename = `kagoj-${slugify(title)}-${Date.now()}.png`;
      const anchor = document.createElement('a');
      anchor.href = dataUrl;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
    } catch (error) {
      console.error('Capture failed:', error);
    } finally {
      setIsCapturing(false);
    }
  }, []);

  return { captureRef, captureAndDownload, isCapturing };
}
