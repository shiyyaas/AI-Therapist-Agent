import React from 'react';
import { Plus, MessageSquare, LogOut, User as UserIcon } from 'lucide-react';
import { Session } from '../types/chat';

interface SessionSidebarProps {
  sessions: Session[];
  activeSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  userEmail: string | null;
  isAnonymous: boolean;
  onLogout: () => void;
  isOpen: boolean;
  onCloseMobile?: () => void;
}

export function formatRelativeDate(timestamp: any): string {
  if (!timestamp) return 'Today';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const now = new Date();

  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  if (isToday) return 'Today';

  const yesterday = new Date();
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear();

  if (isYesterday) return 'Yesterday';

  const day = date.getDate();
  const month = date.toLocaleString('default', { month: 'short' });
  return `${day} ${month}`;
}

export const SessionSidebar: React.FC<SessionSidebarProps> = ({
  sessions,
  activeSessionId,
  onSelectSession,
  onNewChat,
  userEmail,
  isAnonymous,
  onLogout,
  isOpen,
  onCloseMobile,
}) => {
  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-midnight/30 z-30 md:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`fixed md:static inset-y-0 left-0 z-40 w-72 bg-daylight flex flex-col justify-between p-4 transition-transform duration-300 ease-in-out md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div>
          <div className="flex items-center justify-between mb-6 px-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-sky flex items-center justify-center font-bold text-midnight text-sm">
                AI
              </div>
              <span className="font-bold text-midnight tracking-tight text-lg">
                Companion
              </span>
            </div>
            {onCloseMobile && (
              <button
                onClick={onCloseMobile}
                className="md:hidden text-midnight/60 hover:text-midnight text-sm font-semibold"
              >
                ✕
              </button>
            )}
          </div>

          <button
            onClick={() => {
              onNewChat();
              onCloseMobile?.();
            }}
            className="w-full bg-midnight text-daylight hover:bg-midnight/90 py-3 px-4 rounded-pill font-semibold text-sm flex items-center justify-center gap-2 transition-colors mb-6"
          >
            <Plus className="w-4 h-4" />
            <span>New chat</span>
          </button>

          <div className="space-y-1 overflow-y-auto max-h-[calc(100vh-280px)] pr-1">
            <div className="px-2 py-1 text-xs font-semibold text-midnight/40 uppercase tracking-wider">
              Conversations
            </div>
            {sessions.length === 0 ? (
              <div className="px-3 py-6 text-center text-xs text-midnight/50">
                No conversations yet. Start a new chat!
              </div>
            ) : (
              sessions.map((session) => {
                const isActive = session.id === activeSessionId;
                return (
                  <button
                    key={session.id}
                    onClick={() => {
                      onSelectSession(session.id);
                      onCloseMobile?.();
                    }}
                    className={`w-full text-left p-3 rounded-2xl flex items-start justify-between gap-2 transition-colors text-sm ${
                      isActive
                        ? 'bg-sky text-midnight font-semibold'
                        : 'hover:bg-paper text-midnight/80'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <MessageSquare className="w-4 h-4 shrink-0 opacity-70" />
                      <span className="truncate block" title={session.title}>
                        {session.title || 'New Chat'}
                      </span>
                    </div>
                    <span className="text-[11px] opacity-60 shrink-0 font-normal">
                      {formatRelativeDate(session.updatedAt || session.createdAt)}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>

        <div className="border-t border-midnight/10 pt-4 px-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 overflow-hidden mr-2">
              <div className="w-7 h-7 rounded-full bg-midnight/10 flex items-center justify-center shrink-0">
                <UserIcon className="w-4 h-4 text-midnight/70" />
              </div>
              <div className="truncate text-xs">
                <p className="font-semibold text-midnight truncate">
                  {isAnonymous ? 'Guest User' : userEmail || 'User'}
                </p>
                <p className="text-[10px] text-midnight/50">
                  {isAnonymous ? 'Temporary session' : 'Account active'}
                </p>
              </div>
            </div>
            <button
              onClick={onLogout}
              title="Sign out"
              className="p-2 hover:bg-paper rounded-full text-midnight/70 hover:text-midnight transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
