import React from 'react';
import { AlertOctagon, Phone, MessageSquare, ExternalLink, Heart } from 'lucide-react';

interface UrgentSafetyPanelProps {
  crisisType?: string | null;
  onOpenUrgentHelp?: () => void;
}

export const UrgentSafetyPanel: React.FC<UrgentSafetyPanelProps> = ({
  crisisType,
  onOpenUrgentHelp,
}) => {
  return (
    <div className="mb-6 p-5 md:p-6 bg-tangerine/15 rounded-card text-midnight">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-2xl bg-tangerine flex items-center justify-center shrink-0 text-paper">
          <AlertOctagon className="w-6 h-6" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h3 className="font-bold text-base text-midnight">
              Your safety and life matter
            </h3>
            {crisisType && crisisType !== 'unspecified' && (
              <span className="text-[11px] font-semibold bg-paper/80 text-midnight px-2 py-0.5 rounded-pill uppercase tracking-wider">
                Support: {crisisType.replace('_', ' ')}
              </span>
            )}
          </div>
          <p className="text-sm text-ink/85 leading-relaxed mb-4">
            If you are in immediate danger, having thoughts of harming yourself, or cannot keep yourself safe, please step away from this AI and connect with real human support right now.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
            <a
              href="tel:988"
              className="flex items-center justify-center gap-2 bg-midnight text-daylight hover:bg-midnight/90 py-2.5 px-4 rounded-pill font-semibold text-xs transition-colors"
            >
              <Phone className="w-4 h-4" />
              <span>Call 988 Lifeline</span>
            </a>
            <a
              href="sms:988"
              className="flex items-center justify-center gap-2 bg-paper text-midnight hover:bg-daylight py-2.5 px-4 rounded-pill font-semibold text-xs transition-colors"
            >
              <MessageSquare className="w-4 h-4 text-midnight" />
              <span>Text 988 (Free, 24/7)</span>
            </a>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-ink/75 pt-2 border-t border-midnight/10">
            <span className="flex items-center gap-1.5 font-medium">
              <Heart className="w-3.5 h-3.5 text-tangerine fill-tangerine" />
              Please avoid being alone. Reach out to a loved one.
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
                  onClick={onOpenUrgentHelp}
                  className="font-bold text-midnight underline hover:text-midnight/70"
                >
                  All Crisis Options
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
