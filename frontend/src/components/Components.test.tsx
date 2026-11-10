import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DisclaimerBanner } from './DisclaimerBanner';
import { ChatInput } from './ChatInput';
import { MessageBubble } from './MessageBubble';

describe('DisclaimerBanner', () => {
  it('renders the mandatory non-therapy emergency warning', () => {
    render(<DisclaimerBanner />);
    expect(
      screen.getByText(/This AI companion is not a therapist and does not provide medical advice/i)
    ).toBeInTheDocument();
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });
});

describe('MessageBubble', () => {
  it('renders user message', () => {
    render(<MessageBubble message={{ role: 'user', text: 'I feel anxious' }} />);
    expect(screen.getByText('I feel anxious')).toBeInTheDocument();
  });

  it('renders assistant message', () => {
    render(<MessageBubble message={{ role: 'assistant', text: 'Let us take a deep breath.' }} />);
    expect(screen.getByText('Let us take a deep breath.')).toBeInTheDocument();
  });
});

describe('ChatInput', () => {
  it('calls onSendMessage when Enter is pressed without Shift', () => {
    const handleSend = vi.fn();
    render(<ChatInput onSendMessage={handleSend} disabled={false} />);

    const textarea = screen.getByPlaceholderText(/Type what is on your mind/i);
    fireEvent.change(textarea, { target: { value: 'Hello companion' } });
    fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: false });

    expect(handleSend).toHaveBeenCalledWith('Hello companion');
  });

  it('does not send message on Shift+Enter', () => {
    const handleSend = vi.fn();
    render(<ChatInput onSendMessage={handleSend} disabled={false} />);

    const textarea = screen.getByPlaceholderText(/Type what is on your mind/i);
    fireEvent.change(textarea, { target: { value: 'Multiline\nmessage' } });
    fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: true });

    expect(handleSend).not.toHaveBeenCalled();
  });

  it('disables send button when disabled prop is true', () => {
    render(<ChatInput onSendMessage={vi.fn()} disabled={true} />);
    const button = screen.getByRole('button', { name: /send message/i });
    expect(button).toBeDisabled();
  });
});
