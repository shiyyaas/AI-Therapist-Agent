import React, { useState } from 'react';
import { AlertOctagon, Phone, MessageSquare, ExternalLink, Heart, Check } from 'lucide-react';

interface UrgentSafetyPanelProps {
  crisisType?: string | null;
  onOpenUrgentHelp?: () => void;
}

export const UrgentSafetyPanel: React.FC<UrgentSafetyPanelProps> = ({
  crisisType,
  onOpenUrgentHelp,
}) => {
  const [acknowledged, setAcknowledged] = useState(false);

  if (acknowledged) {
    return (
      <aside
        aria-label="Safety status reminder"
        className="mb-4 p-3 bg-tangerine/15 rounded-2xl flex items-center justify-between gap-3 text-xs text-midnight"
      >
        <div className="flex items-center gap-2">
          <Heart className="w-4 h-4 text-tangerine fill-tangerine shrink-0" aria-hidden="true" />
          <span className="font-medium">
            Crisis support resources remain available anytime: <strong>Call or text 988</strong> or <strong>911</strong>.
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {onOpenUrgentHelp && (
            <button
              onClick={onOpenUrgentHelp}
              className="bg-midnight text-daylight px-3 py-1 rounded-pill font-semibold text-[11px] hover:bg-midnight/90 transition-colors"
            >
              View crisis options
            </button>
          )}
          <button
            onClick={() => setAcknowledged(false)}
            className="text-[11px] font-semibold underline text-midnight/70 hover:text-midnight"
          >
            Show full panel
          </button>
        </div>
      </aside>
    );
  }

  const isViolence = crisisType === 'violence' || crisisType === 'harm_others';
  const isImmediate = crisisType === 'immediate_danger' || crisisType === 'overdose' || crisisType === 'abuse';

  return (
    <aside
      role="region"
      aria-label="Urgent Safety and Crisis Resources"
      className="mb-6 p-5 md:p-6 bg-tangerine/15 rounded-card text-midnight border border-tangerine/30"
    >
      <div className="flex items-start gap-3">
        <div
          className="w-10 h-10 rounded-2xl bg-tangerine flex items-center justify-center shrink-0 text-paper"
          aria-hidden="true"
        >
          <AlertOctagon className="w-6 h-6" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h3 className="font-bold text-base text-midnight">
              {isViolence
                ? 'Safety and de-escalation support'
                : isImmediate
                ? 'Immediate safety assistance is available'
                : 'Your safety and life matter'}
            </h3>
            {crisisType && crisisType !== 'unspecified' && (
              <span className="text-[11px] font-semibold bg-paper text-midnight px-2 py-0.5 rounded-pill uppercase tracking-wider">
                Support: {crisisType.replace('_', ' ')}
              </span>
            )}
          </div>
          <p className="text-sm text-ink/85 leading-relaxed mb-4">
            {isViolence
              ? 'If there is immediate danger of physical harm, please step back safely and reach out to local emergency services or a crisis counselor right now.'
              : isImmediate
              ? 'If you have taken action to harm yourself or are in immediate physical danger, please call 911 (or local emergency dispatch) or go to an emergency room now.'
              : 'If you are struggling with thoughts of suicide, self-harm, or overwhelming distress, please step away from this AI and connect with free, 24/7 human crisis support.'}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
            <a
              href="tel:988"
              className="flex items-center justify-center gap-2 bg-midnight text-daylight hover:bg-midnight/90 py-2.5 px-4 rounded-pill font-semibold text-xs transition-colors focus:outline-none focus:ring-2 focus:ring-sky"
            >
              <Phone className="w-4 h-4" />
              <span>Call 988 Lifeline (24/7 Voice)</span>
            </a>
            <a
              href="sms:988"
              className="flex items-center justify-center gap-2 bg-paper text-midnight hover:bg-daylight py-2.5 px-4 rounded-pill font-semibold text-xs transition-colors focus:outline-none focus:ring-2 focus:ring-sky"
            >
              <MessageSquare className="w-4 h-4 text-midnight" />
              <span>Text 988 Lifeline (24/7 SMS)</span>
            </a>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-ink/75 pt-3 border-t border-midnight/10">
            <span className="flex items-center gap-1.5 font-medium">
              <Heart className="w-3.5 h-3.5 text-tangerine fill-tangerine" aria-hidden="true" />
              Please avoid being alone. Reach out to a loved one or safe contact.
            </span>
            <div className="flex items-center gap-3">
              <a
                href="https://988lifeline.org"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-midnight hover:underline flex items-center gap-1"
              >
                988lifeline.org <ExternalLink className="w-3 h-3" />
              </a>
              {onOpenUrgentHelp && (
                <button
                  type="button"
                  onClick={onOpenUrgentHelp}
                  className="font-bold text-midnight underline hover:text-midnight/70"
                >
                  All options
                </button>
              )}
              <button
                type="button"
                onClick={() => setAcknowledged(true)}
                className="inline-flex items-center gap-1 bg-paper/90 hover:bg-paper text-midnight font-semibold px-3 py-1.5 rounded-pill border border-midnight/10 text-[11px] transition-colors focus:outline-none focus:ring-2 focus:ring-sky"
              >
                <Check className="w-3.5 h-3.5 text-grass" />
                <span>I understand</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};
