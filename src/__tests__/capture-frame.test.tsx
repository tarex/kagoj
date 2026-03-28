import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { CaptureFrame } from '../components/note/capture-frame';

describe('CaptureFrame', () => {
  it('renders content text', () => {
    const ref = createRef<HTMLDivElement>();
    render(
      <CaptureFrame content="hello world" title="Test" fontSize={24} captureRef={ref} />
    );
    expect(screen.getByText('hello world')).toBeInTheDocument();
  });

  it('renders title when provided', () => {
    const ref = createRef<HTMLDivElement>();
    render(
      <CaptureFrame content="body" title="My Title" fontSize={24} captureRef={ref} />
    );
    expect(screen.getByText('My Title')).toBeInTheDocument();
  });

  it('does not render title when empty', () => {
    const ref = createRef<HTMLDivElement>();
    const { container } = render(
      <CaptureFrame content="body" title="" fontSize={24} captureRef={ref} />
    );
    // Only the content div should exist, no title div
    const children = container.querySelector('[class="capture-frame dark"]')?.children;
    expect(children?.length).toBe(1);
  });

  it('is positioned off-screen', () => {
    const ref = createRef<HTMLDivElement>();
    const { container } = render(
      <CaptureFrame content="text" title="" fontSize={24} captureRef={ref} />
    );
    const frame = container.querySelector('.capture-frame');
    expect(frame).toHaveStyle({ position: 'fixed', left: '-9999px' });
  });

  it('has dark background color', () => {
    const ref = createRef<HTMLDivElement>();
    const { container } = render(
      <CaptureFrame content="text" title="" fontSize={24} captureRef={ref} />
    );
    const frame = container.querySelector('.capture-frame');
    expect(frame).toHaveStyle({ backgroundColor: '#1a1a1a' });
  });

  it('has aria-hidden true', () => {
    const ref = createRef<HTMLDivElement>();
    const { container } = render(
      <CaptureFrame content="text" title="" fontSize={24} captureRef={ref} />
    );
    const frame = container.querySelector('.capture-frame');
    expect(frame).toHaveAttribute('aria-hidden', 'true');
  });

  it('attaches captureRef to the root div', () => {
    const ref = createRef<HTMLDivElement>();
    render(
      <CaptureFrame content="text" title="" fontSize={24} captureRef={ref} />
    );
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
    expect(ref.current?.classList.contains('capture-frame')).toBe(true);
  });

  it('has dark class for CSS variable inheritance', () => {
    const ref = createRef<HTMLDivElement>();
    const { container } = render(
      <CaptureFrame content="text" title="" fontSize={24} captureRef={ref} />
    );
    const frame = container.querySelector('.capture-frame');
    expect(frame?.classList.contains('dark')).toBe(true);
  });

  it('has correct width of 860px', () => {
    const ref = createRef<HTMLDivElement>();
    const { container } = render(
      <CaptureFrame content="text" title="" fontSize={24} captureRef={ref} />
    );
    const frame = container.querySelector('.capture-frame');
    expect(frame).toHaveStyle({ width: '860px' });
  });

  it('has 32px padding', () => {
    const ref = createRef<HTMLDivElement>();
    const { container } = render(
      <CaptureFrame content="text" title="" fontSize={24} captureRef={ref} />
    );
    const frame = container.querySelector('.capture-frame');
    expect(frame).toHaveStyle({ padding: '32px' });
  });

  it('uses pre-wrap whitespace for text formatting', () => {
    const ref = createRef<HTMLDivElement>();
    const { container } = render(
      <CaptureFrame content="line1\nline2" title="" fontSize={24} captureRef={ref} />
    );
    const frame = container.querySelector('.capture-frame');
    expect(frame).toHaveStyle({ whiteSpace: 'pre-wrap' });
  });
});
