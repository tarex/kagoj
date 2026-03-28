import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useShareImage } from '../hooks/useShareImage';

// Mock html-to-image
vi.mock('html-to-image', () => ({
  toBlob: vi.fn(),
}));

import { toBlob } from 'html-to-image';
const mockToBlob = vi.mocked(toBlob);

// Save original createElement for use in mocks
const originalCreateElement = document.createElement.bind(document);

describe('useShareImage', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    mockToBlob.mockReset();

    // Mock document.fonts
    Object.defineProperty(document, 'fonts', {
      value: {
        ready: Promise.resolve(),
        check: vi.fn().mockReturnValue(true),
      },
      configurable: true,
    });

    // Mock ClipboardItem and navigator.clipboard
    const mockClipboardItem = vi.fn();
    (globalThis as Record<string, unknown>).ClipboardItem = mockClipboardItem;
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        write: vi.fn().mockResolvedValue(undefined),
      },
      configurable: true,
      writable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('returns expected interface', () => {
    const { result } = renderHook(() => useShareImage());
    expect(result.current).toHaveProperty('captureRef');
    expect(result.current).toHaveProperty('captureAndDownload');
    expect(result.current).toHaveProperty('captureAndCopy');
    expect(result.current).toHaveProperty('isCapturing');
    expect(result.current).toHaveProperty('copyStatus');
  });

  it('starts with idle copyStatus and not capturing', () => {
    const { result } = renderHook(() => useShareImage());
    expect(result.current.isCapturing).toBe(false);
    expect(result.current.copyStatus).toBe('idle');
  });

  it('captureAndDownload does nothing when ref is null', async () => {
    const { result } = renderHook(() => useShareImage());
    await act(async () => {
      await result.current.captureAndDownload('test');
    });
    expect(mockToBlob).not.toHaveBeenCalled();
  });

  it('captureAndCopy does nothing when ref is null', async () => {
    const { result } = renderHook(() => useShareImage());
    await act(async () => {
      await result.current.captureAndCopy('test');
    });
    expect(mockToBlob).not.toHaveBeenCalled();
  });

  it('captureAndDownload triggers anchor download', async () => {
    const mockBlob = new Blob(['test'], { type: 'image/png' });
    mockToBlob.mockResolvedValueOnce(mockBlob);

    const { result } = renderHook(() => useShareImage());

    const div = originalCreateElement('div');
    Object.defineProperty(result.current.captureRef, 'current', {
      value: div,
      writable: true,
    });

    // Track anchor clicks by spying on body.appendChild
    let downloadFilename = '';
    const appendChildSpy = vi.spyOn(document.body, 'appendChild').mockImplementation((node) => {
      if (node instanceof HTMLAnchorElement && node.download) {
        downloadFilename = node.download;
      }
      return node;
    });
    const removeChildSpy = vi.spyOn(document.body, 'removeChild').mockImplementation((node) => node);

    await act(async () => {
      await result.current.captureAndDownload('Test Note');
    });

    expect(downloadFilename).toMatch(/^kagoj-.*\.png$/);
    expect(result.current.copyStatus).toBe('downloaded');

    appendChildSpy.mockRestore();
    removeChildSpy.mockRestore();
  });

  it('captureAndCopy uses ClipboardItem when available', async () => {
    const mockBlob = new Blob(['test'], { type: 'image/png' });
    mockToBlob.mockResolvedValueOnce(mockBlob);

    const { result } = renderHook(() => useShareImage());

    const div = originalCreateElement('div');
    Object.defineProperty(result.current.captureRef, 'current', {
      value: div,
      writable: true,
    });

    await act(async () => {
      await result.current.captureAndCopy('Test');
    });

    expect(navigator.clipboard.write).toHaveBeenCalled();
    expect(result.current.copyStatus).toBe('copied');
  });

  it('captureAndCopy falls back to download when ClipboardItem unavailable', async () => {
    // Remove ClipboardItem to simulate Firefox
    delete (globalThis as Record<string, unknown>).ClipboardItem;

    const mockBlob = new Blob(['test'], { type: 'image/png' });
    mockToBlob.mockResolvedValueOnce(mockBlob);

    const { result } = renderHook(() => useShareImage());

    const div = originalCreateElement('div');
    Object.defineProperty(result.current.captureRef, 'current', {
      value: div,
      writable: true,
    });

    const appendChildSpy = vi.spyOn(document.body, 'appendChild').mockImplementation((node) => node);
    const removeChildSpy = vi.spyOn(document.body, 'removeChild').mockImplementation((node) => node);

    await act(async () => {
      await result.current.captureAndCopy('Test');
    });

    expect(result.current.copyStatus).toBe('fallback');

    appendChildSpy.mockRestore();
    removeChildSpy.mockRestore();
  });

  it('resets copyStatus to idle after 2 seconds', async () => {
    const mockBlob = new Blob(['test'], { type: 'image/png' });
    mockToBlob.mockResolvedValueOnce(mockBlob);

    const { result } = renderHook(() => useShareImage());

    const div = originalCreateElement('div');
    Object.defineProperty(result.current.captureRef, 'current', {
      value: div,
      writable: true,
    });

    await act(async () => {
      await result.current.captureAndCopy('Test');
    });

    expect(result.current.copyStatus).toBe('copied');

    await act(async () => {
      vi.advanceTimersByTime(2100);
    });

    expect(result.current.copyStatus).toBe('idle');
  });

  it('sets isCapturing during capture and resets after', async () => {
    const mockBlob = new Blob(['test'], { type: 'image/png' });
    mockToBlob.mockResolvedValueOnce(mockBlob);

    const { result } = renderHook(() => useShareImage());

    const div = originalCreateElement('div');
    Object.defineProperty(result.current.captureRef, 'current', {
      value: div,
      writable: true,
    });

    const appendChildSpy = vi.spyOn(document.body, 'appendChild').mockImplementation((node) => node);
    const removeChildSpy = vi.spyOn(document.body, 'removeChild').mockImplementation((node) => node);

    await act(async () => {
      await result.current.captureAndDownload('Test');
    });

    expect(result.current.isCapturing).toBe(false);

    appendChildSpy.mockRestore();
    removeChildSpy.mockRestore();
  });

  it('handles capture error gracefully', async () => {
    mockToBlob.mockRejectedValueOnce(new Error('Canvas tainted'));

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const { result } = renderHook(() => useShareImage());

    const div = originalCreateElement('div');
    Object.defineProperty(result.current.captureRef, 'current', {
      value: div,
      writable: true,
    });

    await act(async () => {
      await result.current.captureAndDownload('Test');
    });

    expect(result.current.isCapturing).toBe(false);
    expect(result.current.copyStatus).toBe('idle');
    expect(consoleSpy).toHaveBeenCalledWith('Capture failed:', expect.any(Error));

    consoleSpy.mockRestore();
  });

  it('retries without filter on Firefox fontFamily error', async () => {
    const mockBlob = new Blob(['test'], { type: 'image/png' });
    mockToBlob
      .mockRejectedValueOnce(new Error('Cannot read property fontFamily of undefined'))
      .mockResolvedValueOnce(mockBlob);

    const { result } = renderHook(() => useShareImage());

    const div = originalCreateElement('div');
    Object.defineProperty(result.current.captureRef, 'current', {
      value: div,
      writable: true,
    });

    const appendChildSpy = vi.spyOn(document.body, 'appendChild').mockImplementation((node) => node);
    const removeChildSpy = vi.spyOn(document.body, 'removeChild').mockImplementation((node) => node);

    await act(async () => {
      await result.current.captureAndDownload('Test');
    });

    // toBlob should have been called twice (first with filter, retry without)
    expect(mockToBlob).toHaveBeenCalledTimes(2);
    expect(result.current.copyStatus).toBe('downloaded');

    appendChildSpy.mockRestore();
    removeChildSpy.mockRestore();
  });
});
