import React, { useState } from 'react';
import {
  Plus,
  MessageSquare,
  LogOut,
  User as UserIcon,
  Search,
  MoreVertical,
  Edit2,
  Trash2,
  Check,
  X,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { Session } from '../types/chat';

interface SessionSidebarProps {
  sessions: Session[];
  activeSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  onRenameSession: (id: string, newTitle: string) => Promise<void>;
  onDeleteSession: (id: string) => Promise<void>;
  searchQuery: string;
  onSearchChange: (query: string) => void;
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
  onRenameSession,
  onDeleteSession,
  searchQuery,
  onSearchChange,
  userEmail,
  isAnonymous,
  onLogout,
  isOpen,
  onCloseMobile,
}) => {
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [menuOpenSessionId, setMenuOpenSessionId] = useState<string | null>(null);
  const [sessionPendingDelete, setSessionPendingDelete] = useState<Session | null>(null);

  const startEditing = (session: Session, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingSessionId(session.id);
    setEditTitle(session.title || 'New Chat');
    setMenuOpenSessionId(null);
  };

  const handleSaveRename = async (sessionId: string, e: React.FormEvent) => {
    e.preventDefault();
    if (!editTitle.trim()) return;
    try {
      await onRenameSession(sessionId, editTitle.trim());
      setEditingSessionId(null);
    } catch {
      // handled by caller
    }
  };

  const confirmDelete = async () => {
    if (!sessionPendingDelete) return;
    const toDeleteId = sessionPendingDelete.id;
    setSessionPendingDelete(null);
    await onDeleteSession(toDeleteId);
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-midnight/30 z-30 md:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Delete Confirmation Modal */}
      {sessionPendingDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-midnight/60 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-paper rounded-slab max-w-sm w-full p-6 text-midnight">
            <div className="w-12 h-12 rounded-2xl bg-tangerine/20 text-tangerine flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg mb-2 text-midnight">Delete conversation?</h3>
            <p className="text-xs text-ink/75 mb-6 leading-relaxed">
              This will permanently delete "{sessionPendingDelete.title}" and all its saved messages. This action cannot be undone.
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSessionPendingDelete(null)}
                className="flex-1 bg-daylight hover:bg-sky/30 text-midnight py-2.5 rounded-pill font-semibold text-xs transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 bg-tangerine text-paper hover:bg-tangerine/90 py-2.5 rounded-pill font-semibold text-xs transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <aside
        className={`fixed md:static inset-y-0 left-0 z-40 w-80 bg-daylight flex flex-col justify-between p-4 transition-transform duration-300 ease-in-out md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between mb-4 px-2 shrink-0">
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
            className="w-full bg-midnight text-daylight hover:bg-midnight/90 py-3 px-4 rounded-pill font-semibold text-sm flex items-center justify-center gap-2 transition-colors mb-3 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>New chat</span>
          </button>

          {/* Search bar */}
          <div className="relative mb-3 px-1 shrink-0">
            <Search className="w-3.5 h-3.5 text-midnight/40 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full bg-paper text-midnight text-xs rounded-pill pl-9 pr-3 py-2 border-none focus:outline-none focus:ring-2 focus:ring-sky/50 placeholder:text-midnight/40"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-midnight/40 hover:text-midnight text-xs"
              >
                ✕
              </button>
            )}
          </div>

          <div className="space-y-1 overflow-y-auto flex-1 pr-1">
            <div className="px-2 py-1 text-[11px] font-semibold text-midnight/40 uppercase tracking-wider">
              {searchQuery ? 'Search Results' : 'Conversations'}
            </div>
            {sessions.length === 0 ? (
              <div className="px-3 py-6 text-center text-xs text-midnight/50">
                {searchQuery ? 'No matching conversations.' : 'No conversations yet. Start a new chat!'}
              </div>
            ) : (
              sessions.map((session) => {
                const isActive = session.id === activeSessionId;
                const isEnded = session.status === 'ended';
                const isEditing = editingSessionId === session.id;

                if (isEditing) {
                  return (
                    <form
                      key={session.id}
                      onSubmit={(e) => handleSaveRename(session.id, e)}
                      className="p-2 bg-paper rounded-2xl flex items-center gap-1.5"
                    >
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        autoFocus
                        className="flex-1 text-xs bg-daylight px-2 py-1.5 rounded-lg border-none focus:outline-none text-midnight"
                      />
                      <button
                        type="submit"
                        className="p-1 hover:bg-daylight text-grass rounded-full"
                        title="Save"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingSessionId(null)}
                        className="p-1 hover:bg-daylight text-midnight/50 rounded-full"
                        title="Cancel"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </form>
                  );
                }

                return (
                  <div
                    key={session.id}
                    onClick={() => {
                      onSelectSession(session.id);
                      setMenuOpenSessionId(null);
                      onCloseMobile?.();
                    }}
                    className={`group relative w-full text-left p-3 rounded-2xl flex items-start justify-between gap-2 transition-colors text-sm cursor-pointer ${
                      isActive
                        ? 'bg-sky text-midnight font-semibold'
                        : 'hover:bg-paper text-midnight/80'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <MessageSquare className="w-4 h-4 shrink-0 opacity-70" />
                      <div className="truncate flex-1">
                        <span className="truncate block" title={session.title}>
                          {session.title || 'New Chat'}
                        </span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          {isEnded ? (
                            <span className="text-[10px] font-semibold text-grass flex items-center gap-0.5">
                              <CheckCircle2 className="w-2.5 h-2.5" /> Ended
                            </span>
                          ) : (
                            <span className="text-[10px] text-midnight/50">Active</span>
                          )}
                          {session.riskLevel === 'crisis' && (
                            <span className="text-[9px] font-bold bg-tangerine text-paper px-1.5 py-0.2 rounded-pill uppercase">
                              Crisis
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <span className="text-[11px] opacity-60 font-normal">
                        {formatRelativeDate(session.updatedAt || session.createdAt)}
                      </span>

                      <div className="relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setMenuOpenSessionId(
                              menuOpenSessionId === session.id ? null : session.id
                            );
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-paper/50 rounded-full transition-opacity"
                          title="Options"
                        >
                          <MoreVertical className="w-3.5 h-3.5" />
                        </button>

                        {menuOpenSessionId === session.id && (
                          <div
                            className="absolute right-0 top-6 z-50 bg-paper rounded-xl shadow-lg border border-midnight/5 p-1 w-32"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              onClick={(e) => startEditing(session, e)}
                              className="w-full text-left px-3 py-1.5 text-xs text-midnight hover:bg-daylight rounded-lg flex items-center gap-2"
                            >
                              <Edit2 className="w-3 h-3 text-midnight/60" /> Rename
                            </button>
                            <button
                              onClick={() => {
                                setSessionPendingDelete(session);
                                setMenuOpenSessionId(null);
                              }}
                              className="w-full text-left px-3 py-1.5 text-xs text-tangerine hover:bg-tangerine/10 rounded-lg flex items-center gap-2"
                            >
                              <Trash2 className="w-3 h-3 text-tangerine" /> Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="border-t border-midnight/10 pt-4 px-2 shrink-0">
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
