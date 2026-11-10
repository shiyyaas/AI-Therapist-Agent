import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthPanel } from '../components/AuthPanel';
import { DisclaimerBanner } from '../components/DisclaimerBanner';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-paper flex flex-col justify-between">
      <DisclaimerBanner />

      <main className="flex-1 flex flex-col items-center justify-center p-4">
        <div className="text-center mb-8">
          <div className="inline-flex w-16 h-16 rounded-card bg-sky text-midnight font-bold text-2xl items-center justify-center mb-4">
            AI
          </div>
          <h1 className="text-3xl md:text-5xl font-bold text-midnight tracking-tight mb-2">
            AI Wellness Companion
          </h1>
          <p className="text-ink/70 text-base md:text-lg max-w-md mx-auto">
            A gentle, empathetic space for reflection and coping exercises.
          </p>
        </div>

        <AuthPanel onSuccess={() => navigate('/chat')} />
      </main>

      <footer className="py-4 text-center text-xs text-midnight/40">
        AI Wellness Companion &bull; Safe, private, and confidential
      </footer>
    </div>
  );
};
