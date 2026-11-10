import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DisclaimerBanner } from './DisclaimerBanner';
import { ChatInput } from './ChatInput';
import { MessageBubble } from './MessageBubble';
import { UrgentHelpModal } from './UrgentHelpModal';
import { UrgentSafetyPanel } from './UrgentSafetyPanel';
import { SessionSummaryModal } from './SessionSummaryModal';

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

describe('UrgentHelpModal', () => {
  it('renders emergency resources when open', () => {
    render(<UrgentHelpModal isOpen={true} onClose={vi.fn()} />);

    expect(screen.getByText(/Call 988/i)).toBeInTheDocument();
    expect(screen.getByText(/Text 988/i)).toBeInTheDocument();
    expect(screen.getByText(/Chat Online at 988 Lifeline/i)).toBeInTheDocument();
    expect(screen.getByText(/Local Emergency Services/i)).toBeInTheDocument();
    expect(screen.getByText(/Reach out to a trusted person/i)).toBeInTheDocument();
  });

  it('does not render when isOpen is false', () => {
    const { container } = render(<UrgentHelpModal isOpen={false} onClose={vi.fn()} />);
    expect(container).toBeEmptyDOMElement();
  });
});

describe('UrgentSafetyPanel', () => {
  it('renders crisis resources and category label', () => {
    render(<UrgentSafetyPanel crisisType="self_harm" />);
    expect(screen.getByText(/Your safety and life matter/i)).toBeInTheDocument();
    expect(screen.getByText(/Support: self harm/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Call 988 Lifeline/i })).toBeInTheDocument();
  });
});

describe('SessionSummaryModal', () => {
  const sampleSummary = {
    overview: 'Discussed grounding exercises for stress reduction.',
    emotionalThemes: ['Overwhelm', 'Fatigue'],
    strengths: ['Curiosity', 'Openness to breathwork'],
    copingSteps: ['Box breathing 4-4-4-4', '5-minute evening walk', 'Limiting screen time'],
    followUp: 'Consider checking in with a healthcare professional if fatigue persists.',
    riskNote: 'AI-generated summary for personal reflection.',
  };

  it('renders structured cards for summary', () => {
    render(
      <SessionSummaryModal
        isOpen={true}
        onClose={vi.fn()}
        summary={sampleSummary}
        isLoading={false}
        errorMessage={null}
        onRetry={vi.fn()}
      />
    );

    expect(screen.getByText(/What we discussed/i)).toBeInTheDocument();
    expect(screen.getByText(sampleSummary.overview)).toBeInTheDocument();
    expect(screen.getByText(/Emotional themes/i)).toBeInTheDocument();
    expect(screen.getByText('Overwhelm')).toBeInTheDocument();
    expect(screen.getByText(/Coping steps to try/i)).toBeInTheDocument();
    expect(screen.getByText(/Box breathing 4-4-4-4/i)).toBeInTheDocument();
    expect(screen.getByText(/Medical Disclaimer:/i)).toBeInTheDocument();
  });

  it('renders retry button on summary error', () => {
    const handleRetry = vi.fn();
    render(
      <SessionSummaryModal
        isOpen={true}
        onClose={vi.fn()}
        summary={null}
        isLoading={false}
        errorMessage="Quota exceeded"
        onRetry={handleRetry}
      />
    );

    expect(screen.getByText('Quota exceeded')).toBeInTheDocument();
    const retryBtn = screen.getByRole('button', { name: /Retry Summary/i });
    fireEvent.click(retryBtn);
    expect(handleRetry).toHaveBeenCalled();
  });
});
