import React, { useEffect, useRef } from 'react';
import { Shield, Lock, Trash2, HeartHandshake, X } from 'lucide-react';

interface PrivacyNoticeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PrivacyNoticeModal: React.FC<PrivacyNoticeModalProps> = ({ isOpen, onClose }) => {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      triggerRef.current = document.activeElement as HTMLElement;
      closeButtonRef.current?.focus();

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose();
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        window.removeEventListener('keydown', handleKeyDown);
        triggerRef.current?.focus();
      };
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-midnight/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="privacy-notice-title"
    >
      <div className="bg-paper rounded-slab max-w-lg w-full p-6 md:p-8 relative text-midnight overflow-y-auto max-h-[90vh]">
        <button
          ref={closeButtonRef}
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full hover:bg-daylight text-midnight/70 hover:text-midnight transition-colors focus:outline-none focus:ring-2 focus:ring-sky"
          aria-label="Close privacy notice"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-sky/20 flex items-center justify-center text-midnight shrink-0">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h2 id="privacy-notice-title" className="text-xl font-bold tracking-tight text-midnight">
              Privacy & Data Notice
            </h2>
            <p className="text-xs text-ink/70">
              Clear, transparent information about how your conversations are handled
            </p>
          </div>
        </div>

        <div className="space-y-4 my-6 text-xs text-ink/85 leading-relaxed">
          <div className="p-3.5 bg-daylight rounded-2xl flex items-start gap-3">
            <Lock className="w-4 h-4 text-midnight shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-midnight mb-0.5">What account data is stored</p>
              <p>
                When using guest mode, only a temporary anonymous identifier is stored. For registered accounts, we store your email address and authentication timestamp in Firestore.
              </p>
            </div>
          </div>

          <div className="p-3.5 bg-daylight rounded-2xl flex items-start gap-3">
            <Shield className="w-4 h-4 text-midnight shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-midnight mb-0.5">Conversation storage</p>
              <p>
                Your session messages and generated reflections are saved in Cloud Firestore protected by user-level security rules. Only your authenticated user account can view or query them.
              </p>
            </div>
          </div>

          <div className="p-3.5 bg-daylight rounded-2xl flex items-start gap-3">
            <Trash2 className="w-4 h-4 text-midnight shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-midnight mb-0.5">Complete deletion control</p>
              <p>
                You have full control to permanently delete any conversation at any time. Deleting a chat cascades to permanently purge all underlying messages and summaries from the database.
              </p>
            </div>
          </div>

          <div className="p-3.5 bg-tangerine/15 rounded-2xl flex items-start gap-3">
            <HeartHandshake className="w-4 h-4 text-tangerine shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-midnight mb-0.5">Not confidential clinical therapy</p>
              <p>
                This application is an automated wellness companion, not a licensed medical provider, therapist, psychiatrist, or emergency clinic. It is not covered by HIPAA or doctor-patient privilege.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full bg-midnight text-daylight hover:bg-midnight/90 py-3 rounded-pill font-semibold text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-sky"
        >
          Understood
        </button>
      </div>
    </div>
  );
};
