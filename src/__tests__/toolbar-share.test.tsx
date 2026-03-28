import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Toolbar } from '../components/note/toolbar';

const defaultProps = {
  onFormatBold: vi.fn(),
  onFormatItalic: vi.fn(),
  onFormatUnderline: vi.fn(),
  onFormatStrikethrough: vi.fn(),
  onFormatCode: vi.fn(),
  onFormatHighlight: vi.fn(),
  onInsertBullet: vi.fn(),
  onInsertNumberedList: vi.fn(),
  onPrint: vi.fn(),
  onShareImage: vi.fn(),
  onCopyImage: vi.fn(),
  onCopyToClipboard: vi.fn(),
  isBanglaMode: true,
  fontSize: 24,
  onFontSizeChange: vi.fn(),
  isCapturing: false,
  copyStatus: 'idle' as const,
};

describe('Toolbar - Share Image buttons', () => {
  it('renders share image button', () => {
    render(<Toolbar {...defaultProps} />);
    expect(screen.getByLabelText('Save as image')).toBeInTheDocument();
  });

  it('renders copy image button', () => {
    render(<Toolbar {...defaultProps} />);
    expect(screen.getByLabelText('Copy as image')).toBeInTheDocument();
  });

  it('calls onShareImage when share button clicked', () => {
    const onShareImage = vi.fn();
    render(<Toolbar {...defaultProps} onShareImage={onShareImage} />);
    fireEvent.click(screen.getByLabelText('Save as image'));
    expect(onShareImage).toHaveBeenCalledOnce();
  });

  it('calls onCopyImage when copy button clicked', () => {
    const onCopyImage = vi.fn();
    render(<Toolbar {...defaultProps} onCopyImage={onCopyImage} />);
    fireEvent.click(screen.getByLabelText('Copy as image'));
    expect(onCopyImage).toHaveBeenCalledOnce();
  });

  it('disables both buttons when isCapturing is true', () => {
    render(<Toolbar {...defaultProps} isCapturing={true} />);
    expect(screen.getByLabelText('Save as image')).toBeDisabled();
    expect(screen.getByLabelText('Copy as image')).toBeDisabled();
  });

  it('enables both buttons when isCapturing is false', () => {
    render(<Toolbar {...defaultProps} isCapturing={false} />);
    expect(screen.getByLabelText('Save as image')).not.toBeDisabled();
    expect(screen.getByLabelText('Copy as image')).not.toBeDisabled();
  });

  it('shows "Copied!" when copyStatus is copied', () => {
    render(<Toolbar {...defaultProps} copyStatus="copied" />);
    expect(screen.getByText('Copied!')).toBeInTheDocument();
  });

  it('shows "Saved!" when copyStatus is downloaded', () => {
    render(<Toolbar {...defaultProps} copyStatus="downloaded" />);
    expect(screen.getByText('Saved!')).toBeInTheDocument();
  });

  it('shows fallback message when copyStatus is fallback', () => {
    render(<Toolbar {...defaultProps} copyStatus="fallback" />);
    expect(screen.getByText('Downloaded (clipboard unavailable)')).toBeInTheDocument();
  });

  it('shows no status message when copyStatus is idle', () => {
    render(<Toolbar {...defaultProps} copyStatus="idle" />);
    expect(screen.queryByText('Copied!')).not.toBeInTheDocument();
    expect(screen.queryByText('Saved!')).not.toBeInTheDocument();
    expect(screen.queryByText('Downloaded (clipboard unavailable)')).not.toBeInTheDocument();
  });
});
