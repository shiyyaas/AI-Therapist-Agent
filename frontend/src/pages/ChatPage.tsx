import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useChatSession } from '../hooks/useChatSession';
import { DisclaimerBanner } from '../components/DisclaimerBanner';
import { SessionSidebar } from '../components/SessionSidebar';
import { ChatWindow } from '../components/ChatWindow';
import { UrgentHelpModal } from '../components/UrgentHelpModal';
import { SessionSummaryModal } from '../components/SessionSummaryModal';
import { Menu, ShieldAlert, Sparkles, CheckCircle2, Shield } from 'lucide-react';
import { PrivacyNoticeModal } from '../components/PrivacyNoticeModal';

export const ChatPage: React.FC = () => {
  const { user, profile, logout } = useAuth();
  const {
    sessions,
    activeSessionId,
    currentSession,
    messages,
    isSending,
    errorMessage,
    searchQuery,
    setSearchQuery,
    loadError,
    createNewSession,
    selectSession,
    renameSession,
    deleteSession,
    sendMessage,
    currentSummary,
    isSummaryLoading,
    summaryError,
    summaryModalOpen,
    setSummaryModalOpen,
    endSessionAndGenerateSummary,
  } = useChatSession(user?.uid);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [urgentHelpOpen, setUrgentHelpOpen] = useState(false);
  const [confirmEndOpen, setConfirmEndOpen] = useState(false);
  const [privacyNoticeOpen, setPrivacyNoticeOpen] = useState(false);

  const handleConfirmEndSession = async () => {
    setConfirmEndOpen(false);
    await endSessionAndGenerateSummary();
  };

  const isCurrentSessionEnded = currentSession?.status === 'ended';

  return (
    <div className="flex flex-col h-screen bg-paper overflow-hidden">
      <DisclaimerBanner />

      <div className="flex-1 flex overflow-hidden relative">
        <SessionSidebar
          sessions={sessions}
          activeSessionId={activeSessionId}
          onSelectSession={selectSession}
          onNewChat={() => createNewSession()}
          onRenameSession={renameSession}
          onDeleteSession={deleteSession}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          userEmail={profile?.email || user?.email || null}
          isAnonymous={profile?.isAnonymous ?? user?.isAnonymous ?? false}
          onLogout={logout}
          isOpen={mobileMenuOpen}
          onCloseMobile={() => setMobileMenuOpen(false)}
          loadError={loadError}
        />

        <div className="flex-1 flex flex-col h-full overflow-hidden">
          {/* Top chat bar */}
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-midnight/5 bg-daylight">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="md:hidden p-1.5 text-midnight hover:bg-paper rounded-full"
                aria-label="Open conversation menu"
              >
                <Menu className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-2">
                <span className="font-bold text-midnight text-sm hidden sm:inline">
                  {currentSession?.title || 'AI Wellness Companion'}
                </span>
                {isCurrentSessionEnded && (
                  <span className="text-[11px] font-semibold bg-grass/20 text-midnight px-2.5 py-0.5 rounded-pill flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-grass" /> Ended
                  </span>
                )}
              </div>
            </div>

            {/* Always-visible urgent help button + End Session button */}
            <div className="flex items-center gap-2">
              {activeSessionId && !isCurrentSessionEnded && messages.length > 0 && (
                <button
                  onClick={() => setConfirmEndOpen(true)}
                  className="bg-paper hover:bg-grass/20 text-midnight py-1.5 px-3 rounded-pill text-xs font-semibold flex items-center gap-1.5 transition-colors border border-midnight/10"
                >
                  <Sparkles className="w-3.5 h-3.5 text-midnight" />
                  <span>End session</span>
                </button>
              )}

              {isCurrentSessionEnded && currentSummary && (
                <button
                  onClick={() => setSummaryModalOpen(true)}
                  className="bg-grass/30 hover:bg-grass/40 text-midnight py-1.5 px-3 rounded-pill text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5 text-midnight" />
                  <span>View summary</span>
                </button>
              )}

              <button
                onClick={() => setPrivacyNoticeOpen(true)}
                className="hidden lg:flex items-center gap-1.5 text-xs text-midnight/70 hover:text-midnight bg-paper px-2.5 py-1.5 rounded-pill border border-midnight/10 transition-colors"
                aria-label="Privacy notice"
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Privacy</span>
              </button>

              <button
                onClick={() => setUrgentHelpOpen(true)}
                className="bg-tangerine text-paper hover:bg-tangerine/90 py-1.5 px-3.5 rounded-pill text-xs font-bold flex items-center gap-1.5 transition-colors focus:outline-none focus:ring-2 focus:ring-tangerine"
                aria-label="I need urgent help now"
              >
                <ShieldAlert className="w-4 h-4 text-paper" />
                <span>I need urgent help now</span>
              </button>
            </div>
          </div>

          <ChatWindow
            messages={messages}
            isSending={isSending}
            errorMessage={errorMessage}
            onSendMessage={sendMessage}
            sessionRiskLevel={currentSession?.riskLevel}
            onOpenUrgentHelp={() => setUrgentHelpOpen(true)}
          />
        </div>
      </div>

      {/* Urgent Help Modal (always accessible) */}
      <UrgentHelpModal
        isOpen={urgentHelpOpen}
        onClose={() => setUrgentHelpOpen(false)}
      />

      {/* Confirmation dialog for ending session */}
      {confirmEndOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-midnight/60 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-paper rounded-slab max-w-sm w-full p-6 text-midnight">
            <div className="w-12 h-12 rounded-2xl bg-grass/20 text-midnight flex items-center justify-center mb-4">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg mb-2 text-midnight">End session?</h3>
            <p className="text-xs text-ink/75 mb-6 leading-relaxed">
              End this session and generate a summary? You will receive key themes, personal strengths, and practical coping steps.
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setConfirmEndOpen(false)}
                className="flex-1 bg-daylight hover:bg-sky/30 text-midnight py-2.5 rounded-pill font-semibold text-xs transition-colors"
              >
                Continue chatting
              </button>
              <button
                onClick={handleConfirmEndSession}
                className="flex-1 bg-midnight text-daylight hover:bg-midnight/90 py-2.5 rounded-pill font-semibold text-xs transition-colors"
              >
                End & Summarize
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Summary View Modal */}
      <SessionSummaryModal
        isOpen={summaryModalOpen}
        onClose={() => setSummaryModalOpen(false)}
        summary={currentSummary}
        isLoading={isSummaryLoading}
        errorMessage={summaryError}
        onRetry={endSessionAndGenerateSummary}
      />

      {/* Privacy Notice Modal */}
      <PrivacyNoticeModal
        isOpen={privacyNoticeOpen}
        onClose={() => setPrivacyNoticeOpen(false)}
      />
    </div>
  );
};
