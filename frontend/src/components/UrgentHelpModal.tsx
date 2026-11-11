import React, { useEffect, useRef } from 'react';
import { Phone, MessageSquare, ExternalLink, Users, AlertTriangle, X, Globe, Shield } from 'lucide-react';

interface UrgentHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UrgentHelpModal: React.FC<UrgentHelpModalProps> = ({ isOpen, onClose }) => {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const triggerElementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      triggerElementRef.current = document.activeElement as HTMLElement;
      closeButtonRef.current?.focus();

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose();
        }
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => {
        window.removeEventListener('keydown', handleKeyDown);
        triggerElementRef.current?.focus();
      };
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-midnight/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="urgent-help-title"
    >
      <div className="bg-paper rounded-slab max-w-lg w-full p-6 md:p-8 relative text-midnight overflow-y-auto max-h-[90vh]">
        <button
          ref={closeButtonRef}
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full hover:bg-daylight text-midnight/70 hover:text-midnight transition-colors focus:outline-none focus:ring-2 focus:ring-sky"
          aria-label="Close urgent help dialog"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-tangerine/20 flex items-center justify-center text-tangerine shrink-0" aria-hidden="true">
            <AlertTriangle className="w-6 h-6 text-tangerine" />
          </div>
          <div>
            <h2 id="urgent-help-title" className="text-xl font-bold tracking-tight text-midnight">
              Immediate Crisis Support
            </h2>
            <p className="text-xs text-ink/70">
              Free, confidential help is available 24/7. You do not have to go through this alone.
            </p>
          </div>
        </div>

        <div className="mb-4 p-4 rounded-2xl bg-bubblegum/20 flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-midnight text-daylight flex items-center justify-center shrink-0 mt-0.5">
              <Shield className="w-5 h-5" />
            </div>
            <div className="text-left text-xs">
              <p className="font-bold text-sm text-midnight">Immediate Physical Danger or Medical Emergency</p>
              <p className="text-ink/80 mt-0.5">
                Call local emergency services (<strong>911</strong> in the U.S.) or go to the nearest emergency room immediately. Move to a safe location right away.
              </p>
            </div>
          </div>
          <a
            href="tel:911"
            className="text-xs font-bold text-midnight bg-paper px-3 py-1.5 rounded-pill shrink-0 hover:bg-daylight transition-colors"
          >
            Call 911
          </a>
        </div>

        <div className="space-y-2.5 my-4">
          <a
            href="tel:988"
            className="flex items-center justify-between p-3.5 rounded-2xl bg-daylight hover:bg-sky/20 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-midnight text-daylight flex items-center justify-center shrink-0">
                <Phone className="w-5 h-5" />
              </div>
              <div className="text-left">
                <p className="font-bold text-sm text-midnight">Call 988 Lifeline (U.S. & Canada)</p>
                <p className="text-xs text-ink/70">Free, confidential 24/7 voice support</p>
              </div>
            </div>
            <span className="text-xs font-semibold bg-midnight text-daylight px-3 py-1.5 rounded-pill">
              Call 988
            </span>
          </a>

          <a
            href="sms:988"
            className="flex items-center justify-between p-3.5 rounded-2xl bg-daylight hover:bg-sky/20 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-midnight text-daylight flex items-center justify-center shrink-0">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div className="text-left">
                <p className="font-bold text-sm text-midnight">Text 988 Lifeline (U.S. & Canada)</p>
                <p className="text-xs text-ink/70">Free, confidential 24/7 text support</p>
              </div>
            </div>
            <span className="text-xs font-semibold bg-midnight text-daylight px-3 py-1.5 rounded-pill">
              Text 988
            </span>
          </a>

          <a
            href="https://988lifeline.org/chat/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-3.5 rounded-2xl bg-daylight hover:bg-sky/20 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-midnight text-daylight flex items-center justify-center shrink-0">
                <ExternalLink className="w-5 h-5" />
              </div>
              <div className="text-left">
                <p className="font-bold text-sm text-midnight">Chat Online at 988 Lifeline</p>
                <p className="text-xs text-ink/70">Secure, encrypted web chat (browser)</p>
              </div>
            </div>
            <span className="text-xs font-semibold text-midnight/80 group-hover:text-midnight flex items-center gap-1">
              Open chat ↗
            </span>
          </a>

          <div className="p-3.5 rounded-2xl bg-daylight flex items-start gap-3">
            <Users className="w-5 h-5 text-midnight shrink-0 mt-0.5" />
            <div className="text-xs text-ink/80 leading-relaxed">
              <p className="font-bold text-midnight mb-0.5">Reach out to a trusted person</p>
              <p>
                Please contact a family member, trusted friend, physician, or mentor right now and move to a safer location where you are not alone.
              </p>
            </div>
          </div>
        </div>

        <div className="p-3 bg-sky/15 rounded-2xl text-[11px] text-ink/80 flex items-start gap-2.5 mb-4">
          <Globe className="w-4 h-4 text-midnight shrink-0 mt-0.5" />
          <p>
            <strong>Outside the United States?</strong> Emergency numbers and 988 availability differ internationally. Find verified, free crisis lines worldwide at{' '}
            <a
              href="https://findahelpline.com"
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold underline text-midnight"
            >
              findahelpline.com
            </a>.
          </p>
        </div>

        <div className="p-3 bg-midnight/5 rounded-2xl text-[11px] text-ink/70 text-center leading-normal mb-4">
          <strong>Important reminder:</strong> This web application is an AI wellness companion, not a human, licensed therapist, medical provider, or emergency service.
        </div>

        <button
          onClick={onClose}
          className="w-full bg-midnight text-daylight hover:bg-midnight/90 py-3 rounded-pill font-semibold text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-sky"
        >
          Return to companion
        </button>
      </div>
    </div>
  );
};
