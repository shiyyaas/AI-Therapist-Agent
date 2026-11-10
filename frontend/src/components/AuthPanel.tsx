import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { ArrowRight, UserCheck, Mail, Lock } from 'lucide-react';

interface AuthPanelProps {
  onSuccess?: () => void;
}

export const AuthPanel: React.FC<AuthPanelProps> = ({ onSuccess }) => {
  const { loginAnonymously, loginWithEmail, signUpWithEmail, loading, authError, setAuthError } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleAnonymousSignIn = async () => {
    try {
      await loginAnonymously();
      onSuccess?.();
    } catch {
      // Handled by hook
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setAuthError('Please enter both email and password.');
      return;
    }

    try {
      if (mode === 'signin') {
        await loginWithEmail(email, password);
      } else {
        await signUpWithEmail(email, password);
      }
      onSuccess?.();
    } catch {
      // Handled by hook
    }
  };

  return (
    <div className="w-full max-w-md bg-daylight rounded-card p-8 text-ink">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-midnight tracking-tight mb-2">
          {mode === 'signin' ? 'Welcome Back' : 'Create an Account'}
        </h2>
        <p className="text-sm text-ink/70">
          A calm, non-judgmental space to reflect and find grounding.
        </p>
      </div>

      {authError && (
        <div className="mb-4 p-3 bg-bubblegum/20 text-midnight text-xs rounded-xl font-medium">
          {authError}
        </div>
      )}

      <button
        type="button"
        onClick={handleAnonymousSignIn}
        disabled={loading}
        className="w-full bg-midnight text-daylight rounded-pill py-3.5 px-6 font-semibold flex items-center justify-center gap-2 hover:bg-midnight/90 transition-colors disabled:opacity-50 mb-6"
      >
        <UserCheck className="w-5 h-5" />
        <span>Continue without account</span>
      </button>

      <div className="relative flex py-2 items-center mb-6">
        <div className="flex-grow border-t border-midnight/10"></div>
        <span className="flex-shrink mx-4 text-xs font-semibold text-midnight/50 uppercase tracking-wider">
          or with email
        </span>
        <div className="flex-grow border-t border-midnight/10"></div>
      </div>

      <form onSubmit={handleEmailAuth} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-midnight mb-1" htmlFor="email-input">
            Email address
          </label>
          <div className="relative flex items-center">
            <Mail className="absolute left-4 w-4 h-4 text-midnight/40" />
            <input
              id="email-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="w-full pl-11 pr-4 py-3 bg-paper rounded-pill text-sm text-midnight border-none focus:outline-none focus:ring-2 focus:ring-sky placeholder:text-midnight/30"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-midnight mb-1" htmlFor="password-input">
            Password
          </label>
          <div className="relative flex items-center">
            <Lock className="absolute left-4 w-4 h-4 text-midnight/40" />
            <input
              id="password-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
              className="w-full pl-11 pr-4 py-3 bg-paper rounded-pill text-sm text-midnight border-none focus:outline-none focus:ring-2 focus:ring-sky placeholder:text-midnight/30"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-sky text-midnight rounded-pill py-3.5 px-6 font-bold flex items-center justify-center gap-2 hover:bg-sky/90 transition-colors disabled:opacity-50 mt-2"
        >
          <span>{mode === 'signin' ? 'Sign In' : 'Create Account'}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </form>

      <div className="mt-6 text-center text-xs">
        {mode === 'signin' ? (
          <p className="text-midnight/70">
            Don't have an account?{' '}
            <button
              type="button"
              onClick={() => {
                setMode('signup');
                setAuthError(null);
              }}
              className="font-bold text-midnight underline hover:text-sky"
            >
              Sign up
            </button>
          </p>
        ) : (
          <p className="text-midnight/70">
            Already have an account?{' '}
            <button
              type="button"
              onClick={() => {
                setMode('signin');
                setAuthError(null);
              }}
              className="font-bold text-midnight underline hover:text-sky"
            >
              Sign in
            </button>
          </p>
        )}
      </div>
    </div>
  );
};
