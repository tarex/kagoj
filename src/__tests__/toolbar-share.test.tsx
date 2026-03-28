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
  onCopyToClipboard: vi.fn(),
  isBanglaMode: true,
  fontSize: 24,
  onFontSizeChange: vi.fn(),
};

describe('Toolbar - Share Image button', () => {
  it('renders share image button', () => {
    render(<Toolbar {...defaultProps} />);
    expect(screen.getByLabelText('Share as image')).toBeInTheDocument();
  });

  it('calls onShareImage when share button clicked', () => {
    const onShareImage = vi.fn();
    render(<Toolbar {...defaultProps} onShareImage={onShareImage} />);
    fireEvent.click(screen.getByLabelText('Share as image'));
    expect(onShareImage).toHaveBeenCalledOnce();
  });

  it('share button is always enabled (modal handles state)', () => {
    render(<Toolbar {...defaultProps} />);
    expect(screen.getByLabelText('Share as image')).not.toBeDisabled();
  });
});
