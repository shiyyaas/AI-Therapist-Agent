import React from 'react';
import { Phone, MessageSquare, ExternalLink, Users, AlertTriangle, X } from 'lucide-react';

interface UrgentHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UrgentHelpModal: React.FC<UrgentHelpModalProps> = ({ isOpen, onClose }) => {
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
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full hover:bg-daylight text-midnight/70 hover:text-midnight transition-colors"
          aria-label="Close urgent help dialog"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-tangerine/20 flex items-center justify-center text-tangerine">
            <AlertTriangle className="w-6 h-6 text-tangerine" />
          </div>
          <div>
            <h2 id="urgent-help-title" className="text-xl font-bold tracking-tight text-midnight">
              Immediate Crisis Support
            </h2>
            <p className="text-xs text-ink/70">
              Free, confidential help is available 24/7. You don't have to be alone.
            </p>
          </div>
        </div>

        <div className="space-y-3 my-6">
          <a
            href="tel:988"
            className="flex items-center justify-between p-4 rounded-2xl bg-daylight hover:bg-sky/20 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-midnight text-daylight flex items-center justify-center">
                <Phone className="w-5 h-5" />
              </div>
              <div className="text-left">
                <p className="font-bold text-sm text-midnight">Call 988 (U.S. & Canada)</p>
                <p className="text-xs text-ink/70">Suicide & Crisis Lifeline • 24/7 Voice</p>
              </div>
            </div>
            <span className="text-xs font-semibold bg-midnight text-daylight px-3 py-1.5 rounded-pill">
              Call now
            </span>
          </a>

          <a
            href="sms:988"
            className="flex items-center justify-between p-4 rounded-2xl bg-daylight hover:bg-sky/20 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-midnight text-daylight flex items-center justify-center">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div className="text-left">
                <p className="font-bold text-sm text-midnight">Text 988 (U.S. & Canada)</p>
                <p className="text-xs text-ink/70">Crisis Text Lifeline • 24/7 Message</p>
              </div>
            </div>
            <span className="text-xs font-semibold bg-midnight text-daylight px-3 py-1.5 rounded-pill">
              Text now
            </span>
          </a>

          <a
            href="https://988lifeline.org/chat/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-4 rounded-2xl bg-daylight hover:bg-sky/20 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-midnight text-daylight flex items-center justify-center">
                <ExternalLink className="w-5 h-5" />
              </div>
              <div className="text-left">
                <p className="font-bold text-sm text-midnight">Chat Online at 988 Lifeline</p>
                <p className="text-xs text-ink/70">Secure, confidential web chat</p>
              </div>
            </div>
            <span className="text-xs font-semibold text-midnight/80 group-hover:text-midnight flex items-center gap-1">
              Visit ↗
            </span>
          </a>

          <a
            href="tel:911"
            className="flex items-center justify-between p-4 rounded-2xl bg-bubblegum/20 hover:bg-bubblegum/30 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-midnight text-daylight flex items-center justify-center">
                <Phone className="w-5 h-5" />
              </div>
              <div className="text-left">
                <p className="font-bold text-sm text-midnight">Call Local Emergency Services (911)</p>
                <p className="text-xs text-ink/70">If you are in immediate danger of injury</p>
              </div>
            </div>
            <span className="text-xs font-bold text-midnight bg-paper px-3 py-1.5 rounded-pill">
              911
            </span>
          </a>

          <div className="p-4 rounded-2xl bg-daylight flex items-start gap-3">
            <Users className="w-5 h-5 text-midnight shrink-0 mt-0.5" />
            <div className="text-xs text-ink/80 leading-relaxed">
              <p className="font-bold text-midnight mb-0.5">Reach out to a trusted person</p>
              <p>
                Contact a family member, close friend, trusted mentor, or doctor right now.
                Please avoid staying completely alone when feeling overwhelmed.
              </p>
            </div>
          </div>
        </div>

        <div className="p-3 bg-midnight/5 rounded-2xl text-[11px] text-ink/70 text-center leading-normal mb-4">
          <strong>Important reminder:</strong> This application is an AI wellness companion, not a human, licensed therapist, medical provider, or crisis emergency service.
        </div>

        <button
          onClick={onClose}
          className="w-full bg-midnight text-daylight hover:bg-midnight/90 py-3 rounded-pill font-semibold text-sm transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
};
