import React from 'react';
import { AlertCircle } from 'lucide-react';

export const DisclaimerBanner: React.FC = () => {
  return (
    <div
      role="alert"
      className="w-full bg-daylight border-b border-gray-100 px-4 py-2.5 flex items-center justify-center gap-2 text-center text-xs md:text-sm text-ink"
    >
      <AlertCircle className="w-4 h-4 text-midnight shrink-0" aria-hidden="true" />
      <span>
        This AI companion is not a therapist and does not provide medical advice. In an emergency, contact local emergency services.
      </span>
    </div>
  );
};
