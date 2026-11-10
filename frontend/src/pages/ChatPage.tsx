import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useChatSession } from '../hooks/useChatSession';
import { DisclaimerBanner } from '../components/DisclaimerBanner';
import { SessionSidebar } from '../components/SessionSidebar';
import { ChatWindow } from '../components/ChatWindow';
import { Menu } from 'lucide-react';

export const ChatPage: React.FC = () => {
  const { user, profile, logout } = useAuth();
  const {
    sessions,
    activeSessionId,
    messages,
    isSending,
    errorMessage,
    createNewSession,
    selectSession,
    sendMessage,
  } = useChatSession(user?.uid);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex flex-col h-screen bg-paper overflow-hidden">
      <DisclaimerBanner />

      <div className="flex-1 flex overflow-hidden relative">
        <SessionSidebar
          sessions={sessions}
          activeSessionId={activeSessionId}
          onSelectSession={selectSession}
          onNewChat={() => createNewSession()}
          userEmail={profile?.email || user?.email || null}
          isAnonymous={profile?.isAnonymous ?? user?.isAnonymous ?? false}
          onLogout={logout}
          isOpen={mobileMenuOpen}
          onCloseMobile={() => setMobileMenuOpen(false)}
        />

        <div className="flex-1 flex flex-col h-full overflow-hidden">
          <div className="md:hidden flex items-center justify-between px-4 py-3 border-b border-midnight/5 bg-daylight">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 -ml-2 text-midnight hover:bg-paper rounded-full"
              aria-label="Open conversation menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <span className="font-bold text-midnight text-sm">
              AI Wellness Companion
            </span>
            <div className="w-7"></div>
          </div>

          <ChatWindow
            messages={messages}
            isSending={isSending}
            errorMessage={errorMessage}
            onSendMessage={sendMessage}
          />
        </div>
      </div>
    </div>
  );
};
