import React, { useState } from 'react';
import {
  Sparkles,
  Heart,
  CheckCircle2,
  Copy,
  Check,
  RotateCcw,
  ShieldAlert,
  ArrowRight,
  X,
} from 'lucide-react';
import { SessionSummary } from '../types/chat';

interface SessionSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  summary: SessionSummary | null;
  isLoading: boolean;
  errorMessage: string | null;
  onRetry: () => void;
}

export const SessionSummaryModal: React.FC<SessionSummaryModalProps> = ({
  isOpen,
  onClose,
  summary,
  isLoading,
  errorMessage,
  onRetry,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = async () => {
    if (!summary) return;
    const textToCopy = `AI Wellness Companion - Session Summary
Generated: ${new Date().toLocaleDateString()}

WHAT WE DISCUSSED:
${summary.overview}

EMOTIONAL THEMES:
${summary.emotionalThemes.map((t) => `• ${t}`).join('\n')}

STRENGTHS & INSIGHTS:
${summary.strengths.map((s) => `• ${s}`).join('\n')}

PRACTICAL COPING STEPS:
${summary.copingSteps.map((c, i) => `${i + 1}. ${c}`).join('\n')}

NEXT STEPS & SUPPORT:
${summary.followUp}

NOTE:
${summary.riskNote}

Disclaimer: This summary is AI-generated for reflection and does not constitute medical advice or psychiatric diagnosis.`;

    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore clipboard error
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-midnight/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="summary-title"
    >
      <div className="bg-paper rounded-slab max-w-2xl w-full p-6 md:p-8 relative text-midnight overflow-y-auto max-h-[92vh]">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full hover:bg-daylight text-midnight/70 hover:text-midnight transition-colors"
          aria-label="Close summary modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-grass/20 flex items-center justify-center text-midnight">
            <Sparkles className="w-6 h-6 text-midnight" />
          </div>
          <div>
            <h2 id="summary-title" className="text-xl font-bold tracking-tight text-midnight">
              Session Reflection & Summary
            </h2>
            <p className="text-xs text-ink/70">
              A gentle takeaway of your conversation and personal takeaways
            </p>
          </div>
        </div>

        {isLoading && (
          <div className="py-16 text-center space-y-4">
            <div className="inline-block p-4 rounded-full bg-daylight animate-pulse">
              <Sparkles className="w-8 h-8 text-midnight" />
            </div>
            <p className="font-semibold text-sm text-midnight">
              Synthesizing your conversation themes and coping steps...
            </p>
            <p className="text-xs text-ink/60">This may take a few seconds.</p>
          </div>
        )}

        {errorMessage && !isLoading && (
          <div className="p-6 bg-bubblegum/20 rounded-2xl text-center space-y-4 my-6">
            <p className="text-sm font-semibold text-midnight">{errorMessage}</p>
            <p className="text-xs text-ink/70">
              Your transcript is safe and was not lost.
            </p>
            <button
              onClick={onRetry}
              className="inline-flex items-center gap-2 bg-midnight text-daylight px-5 py-2.5 rounded-pill font-semibold text-xs hover:bg-midnight/90 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Retry Summary</span>
            </button>
          </div>
        )}

        {summary && !isLoading && (
          <div className="space-y-4 my-4">
            {/* Card 1: What we discussed */}
            <div className="p-4 rounded-2xl bg-daylight">
              <h3 className="text-xs font-bold text-midnight uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <span>💬</span> What we discussed
              </h3>
              <p className="text-sm text-ink/85 leading-relaxed">{summary.overview}</p>
            </div>

            {/* Card 2: Emotional themes */}
            {summary.emotionalThemes?.length > 0 && (
              <div className="p-4 rounded-2xl bg-daylight">
                <h3 className="text-xs font-bold text-midnight uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Heart className="w-3.5 h-3.5 text-midnight" /> Emotional themes
                </h3>
                <div className="flex flex-wrap gap-2">
                  {summary.emotionalThemes.map((theme, i) => (
                    <span
                      key={i}
                      className="bg-paper px-3 py-1 rounded-pill text-xs font-semibold text-midnight"
                    >
                      {theme}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Card 3: Strengths */}
            {summary.strengths?.length > 0 && (
              <div className="p-4 rounded-2xl bg-daylight">
                <h3 className="text-xs font-bold text-midnight uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-midnight" /> Strengths & Insights
                </h3>
                <ul className="space-y-1 text-sm text-ink/85">
                  {summary.strengths.map((s, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-midnight font-bold">•</span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Card 4: Practical coping steps */}
            {summary.copingSteps?.length > 0 && (
              <div className="p-4 rounded-2xl bg-sky/20">
                <h3 className="text-xs font-bold text-midnight uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-midnight" /> Coping steps to try
                </h3>
                <ol className="space-y-2 text-sm text-ink/90">
                  {summary.copingSteps.map((step, i) => (
                    <li key={i} className="flex items-start gap-2 bg-paper/80 p-2.5 rounded-xl">
                      <span className="font-bold text-xs bg-midnight text-daylight w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      <span className="leading-relaxed">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {/* Card 5: Next steps */}
            {summary.followUp && (
              <div className="p-4 rounded-2xl bg-daylight">
                <h3 className="text-xs font-bold text-midnight uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <ArrowRight className="w-3.5 h-3.5 text-midnight" /> Next steps
                </h3>
                <p className="text-sm text-ink/85 leading-relaxed">{summary.followUp}</p>
              </div>
            )}

            {/* Risk / Safety note */}
            {summary.riskNote && (
              <div className="p-3 bg-tangerine/15 rounded-xl text-xs text-ink/80 flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 text-tangerine shrink-0 mt-0.5" />
                <p>{summary.riskNote}</p>
              </div>
            )}

            {/* Prominent Disclaimer */}
            <div className="p-3 bg-midnight/5 rounded-xl text-[11px] text-ink/65 text-center leading-normal">
              <strong>Medical Disclaimer:</strong> This summary is generated by artificial intelligence for your personal reflection. It does not constitute medical, psychiatric, or psychological advice, diagnosis, or treatment.
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={handleCopy}
                className="flex-1 bg-daylight hover:bg-sky/30 text-midnight py-3 rounded-pill font-semibold text-sm flex items-center justify-center gap-2 transition-colors"
              >
                {copied ? <Check className="w-4 h-4 text-grass" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Copied to clipboard' : 'Copy summary'}</span>
              </button>
              <button
                onClick={onClose}
                className="flex-1 bg-midnight text-daylight hover:bg-midnight/90 py-3 rounded-pill font-semibold text-sm transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
