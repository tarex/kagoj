import { useRef, useState, useCallback } from 'react';
import { toBlob } from 'html-to-image';

export type CopyStatus = 'idle' | 'capturing' | 'copied' | 'downloaded' | 'fallback';

interface UseShareImageReturn {
  captureRef: React.RefObject<HTMLDivElement | null>;
  captureAndDownload: (title: string) => Promise<void>;
  captureAndCopy: (title: string) => Promise<void>;
  isCapturing: boolean;
  copyStatus: CopyStatus;
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
  const [copyStatus, setCopyStatus] = useState<CopyStatus>('idle');

  /** Shared helper: font pre-check + capture to Blob */
  const captureToBlob = useCallback(async (): Promise<Blob> => {
    if (captureRef.current === null) {
      throw new Error('captureRef is not attached');
    }

    // Font pre-check: wait for fonts to load, then add delay for race condition
    await document.fonts.ready;
    const fontLoaded = document.fonts.check('400 16px "Noto Sans Bengali"');
    if (!fontLoaded) {
      console.warn('Noto Sans Bengali font not detected, proceeding with fallback rendering');
    }
    // 150ms delay required — race condition exists even after fonts.ready settles
    await new Promise<void>((resolve) => setTimeout(resolve, 150));

    const options = {
      pixelRatio: Math.max(window.devicePixelRatio, 2),
      cacheBust: true,
      backgroundColor: '#1a1a1a',
      style: {
        // Override position so the clone renders in-flow for capture
        position: 'static' as const,
        left: 'auto',
      },
    };

    let blob: Blob | null;
    try {
      blob = await toBlob(captureRef.current, options);
    } catch (toBlobError) {
      // Firefox crash workaround for html-to-image Issue #508:
      // rule.style.fontFamily access throws in some Firefox versions >= 1.11.12
      const errorMessage = toBlobError instanceof Error ? toBlobError.message : String(toBlobError);
      if (errorMessage.includes('fontFamily') || errorMessage.includes('style')) {
        blob = await toBlob(captureRef.current, {
          ...options,
          cacheBust: false,
        });
      } else {
        throw toBlobError;
      }
    }

    if (!blob) {
      throw new Error('toBlob returned null');
    }
    return blob;
  }, []);

  const captureAndDownload = useCallback(async (title: string): Promise<void> => {
    if (captureRef.current === null) return;

    try {
      setIsCapturing(true);
      setCopyStatus('capturing');

      const blob = await captureToBlob();

      // Convert blob to data URL for anchor download
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(blob);
      });

      const filename = `kagoj-${slugify(title)}-${Date.now()}.png`;
      const anchor = document.createElement('a');
      anchor.href = dataUrl;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);

      setCopyStatus('downloaded');
      setTimeout(() => setCopyStatus('idle'), 2000);
    } catch (error) {
      console.error('Capture failed:', error);
      setCopyStatus('idle');
    } finally {
      setIsCapturing(false);
    }
  }, [captureToBlob]);

  const captureAndCopy = useCallback(async (title: string): Promise<void> => {
    if (captureRef.current === null) return;

    try {
      setIsCapturing(true);
      setCopyStatus('capturing');

      if (typeof ClipboardItem !== 'undefined') {
        // Chrome / Safari — use Promise-based ClipboardItem pattern
        // Safari requires passing the unresolved Promise directly (not the resolved Blob)
        const clipboardItem = new ClipboardItem({
          'image/png': captureToBlob(),
        });
        await navigator.clipboard.write([clipboardItem]);
        setCopyStatus('copied');
      } else {
        // Firefox — no ClipboardItem support, fall back to download
        const blob = await captureToBlob();
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => reject(reader.error);
          reader.readAsDataURL(blob);
        });

        const filename = `kagoj-${slugify(title)}-${Date.now()}.png`;
        const anchor = document.createElement('a');
        anchor.href = dataUrl;
        anchor.download = filename;
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);

        setCopyStatus('fallback');
      }

      setTimeout(() => setCopyStatus('idle'), 2000);
    } catch (error) {
      console.error('Clipboard copy failed:', error);
      setCopyStatus('idle');
    } finally {
      setIsCapturing(false);
    }
  }, [captureToBlob]);

  return { captureRef, captureAndDownload, captureAndCopy, isCapturing, copyStatus };
}
