import { useState, useEffect, useCallback, useRef } from 'react';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  addDoc,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Session, ChatMessage, SessionSummary } from '../types/chat';
import {
  sendChatMessage,
  renameSessionApi,
  deleteSessionApi,
  generateSessionSummaryApi,
  getSessionSummaryApi,
} from '../lib/api';

export function formatSessionTitle(text: string, maxLength: number = 50): string {
  if (!text) return 'New Chat';
  const trimmed = text.trim();
  if (trimmed.length <= maxLength) return trimmed;
  return trimmed.slice(0, maxLength).trim();
}

const ACTIVE_SESSION_STORAGE_KEY = 'ai_wellness_active_session_id';

export function useChatSession(userId: string | undefined) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(() => {
    return localStorage.getItem(ACTIVE_SESSION_STORAGE_KEY) || null;
  });
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingSessions, setLoadingSessions] = useState<boolean>(true);
  const [loadingMessages, setLoadingMessages] = useState<boolean>(false);
  const [isSending, setIsSending] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loadError, setLoadError] = useState<string | null>(null);

  const [currentSummary, setCurrentSummary] = useState<SessionSummary | null>(null);
  const [isSummaryLoading, setIsSummaryLoading] = useState<boolean>(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [summaryModalOpen, setSummaryModalOpen] = useState<boolean>(false);

  const activeSessionIdRef = useRef<string | null>(null);
  activeSessionIdRef.current = activeSessionId;

  useEffect(() => {
    if (activeSessionId) {
      localStorage.setItem(ACTIVE_SESSION_STORAGE_KEY, activeSessionId);
    } else {
      localStorage.removeItem(ACTIVE_SESSION_STORAGE_KEY);
    }
  }, [activeSessionId]);

  useEffect(() => {
    if (!userId) {
      setSessions([]);
      setActiveSessionId(null);
      setLoadingSessions(false);
      return;
    }

    setLoadingSessions(true);
    setLoadError(null);
    const sessionsQuery = query(
      collection(db, 'sessions'),
      where('uid', '==', userId),
      orderBy('updatedAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      sessionsQuery,
      (snapshot) => {
        const list: Session[] = snapshot.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<Session, 'id'>),
        }));
        setSessions(list);
        setLoadingSessions(false);

        const currentActive = activeSessionIdRef.current;
        const exists = list.some((s) => s.id === currentActive);
        if (!exists && list.length > 0) {
          setActiveSessionId(list[0].id);
        } else if (list.length === 0) {
          setActiveSessionId(null);
        }
      },
      (err) => {
        setLoadingSessions(false);
        setLoadError('Unable to sync conversations. Please check your network connection.');
        console.error('[FIRESTORE_SESSION_LISTEN_ERROR]', err?.message);
      }
    );

    return () => unsubscribe();
  }, [userId]);

  useEffect(() => {
    if (!activeSessionId) {
      setMessages([]);
      setCurrentSummary(null);
      return;
    }

    setLoadingMessages(true);
    const messagesQuery = query(
      collection(db, 'sessions', activeSessionId, 'messages'),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(
      messagesQuery,
      (snapshot) => {
        const msgs: ChatMessage[] = snapshot.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<ChatMessage, 'id'>),
        }));
        setMessages(msgs);
        setLoadingMessages(false);
      },
      (err) => {
        setLoadingMessages(false);
        setErrorMessage('Unable to load message history. Please check connection.');
        console.error('[FIRESTORE_MSG_LISTEN_ERROR]', err?.message);
      }
    );

    getSessionSummaryApi(activeSessionId)
      .then((existing) => setCurrentSummary(existing))
      .catch(() => setCurrentSummary(null));

    return () => unsubscribe();
  }, [activeSessionId]);

  const createNewSession = useCallback(async (initialTitle: string = 'New Chat'): Promise<string> => {
    if (!userId) throw new Error('Cannot create session: User not authenticated');

    const newDocRef = await addDoc(collection(db, 'sessions'), {
      uid: userId,
      title: formatSessionTitle(initialTitle),
      status: 'active',
      riskLevel: 'none',
      endedAt: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      messageCount: 0,
    });

    setActiveSessionId(newDocRef.id);
    setMessages([]);
    setCurrentSummary(null);
    setErrorMessage(null);
    return newDocRef.id;
  }, [userId]);

  const selectSession = useCallback((sessionId: string) => {
    setActiveSessionId(sessionId);
    setErrorMessage(null);
  }, []);

  const renameSession = useCallback(async (sessionId: string, newTitle: string) => {
    const trimmed = formatSessionTitle(newTitle);
    const previousSessions = [...sessions];
    setSessions((prev) =>
      prev.map((s) => (s.id === sessionId ? { ...s, title: trimmed } : s))
    );
    try {
      await renameSessionApi(sessionId, trimmed);
    } catch (err: any) {
      setSessions(previousSessions);
      setErrorMessage(err?.message || 'Failed to rename session.');
      throw err;
    }
  }, [sessions]);

  const deleteSession = useCallback(async (sessionId: string) => {
    const previousSessions = [...sessions];
    const previousActive = activeSessionId;

    setSessions((prev) => prev.filter((s) => s.id !== sessionId));

    if (activeSessionId === sessionId) {
      const remaining = previousSessions.filter((s) => s.id !== sessionId);
      setActiveSessionId(remaining.length > 0 ? remaining[0].id : null);
    }

    try {
      await deleteSessionApi(sessionId);
    } catch (err: any) {
      setSessions(previousSessions);
      setActiveSessionId(previousActive);
      setErrorMessage(err?.message || 'Failed to delete session. Changes have been restored.');
    }
  }, [sessions, activeSessionId]);

  const endSessionAndGenerateSummary = useCallback(async () => {
    if (!activeSessionId) return;

    setIsSummaryLoading(true);
    setSummaryError(null);
    setSummaryModalOpen(true);

    try {
      const summary = await generateSessionSummaryApi(activeSessionId);
      setCurrentSummary(summary);
      setSessions((prev) =>
        prev.map((s) => (s.id === activeSessionId ? { ...s, status: 'ended' } : s))
      );
    } catch (err: any) {
      setSummaryError(
        err?.message || 'Could not generate session summary. Your chat is safe. You can retry.'
      );
    } finally {
      setIsSummaryLoading(false);
    }
  }, [activeSessionId]);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isSending) return;
      if (!userId) {
        setErrorMessage('You must be signed in to send a message.');
        return;
      }

      setErrorMessage(null);
      setIsSending(true);

      let targetSessionId = activeSessionId;

      if (!targetSessionId) {
        try {
          targetSessionId = await createNewSession(trimmed);
        } catch {
          setIsSending(false);
          setErrorMessage('Failed to initialize a new conversation. Please try again.');
          return;
        }
      }

      const tempUserMsgId = `temp-${Date.now()}`;
      const optimisticUserMsg: ChatMessage = {
        id: tempUserMsgId,
        role: 'user',
        text: trimmed,
        createdAt: new Date(),
      };

      setMessages((prev) => [...prev, optimisticUserMsg]);

      try {
        const response = await sendChatMessage(targetSessionId, trimmed);

        const currentSession = sessions.find((s) => s.id === targetSessionId);
        if (currentSession && (currentSession.messageCount === 0 || currentSession.title === 'New Chat')) {
          const sessionRef = doc(db, 'sessions', targetSessionId);
          await updateDoc(sessionRef, {
            title: formatSessionTitle(trimmed),
          }).catch(() => {});
        }

        setMessages((prev) => {
          const exists = prev.some((m) => m.role === 'assistant' && m.text === response.text);
          if (!exists) {
            return [
              ...prev.filter((m) => m.id !== tempUserMsgId),
              optimisticUserMsg,
              {
                id: `assistant-${Date.now()}`,
                role: 'assistant',
                text: response.text,
                safetyFlag: response.safetyFlag,
                crisisType: response.crisisType,
                riskLevel: response.riskLevel,
                createdAt: new Date(response.createdAt),
              },
            ];
          }
          return prev;
        });
      } catch (err: any) {
        setMessages((prev) => prev.filter((m) => m.id !== tempUserMsgId));
        setErrorMessage(
          err?.message || 'Could not reach the AI companion. Your text was preserved. Please click retry.'
        );
      } finally {
        setIsSending(false);
      }
    },
    [activeSessionId, isSending, userId, createNewSession, sessions]
  );

  const filteredSessions = searchQuery.trim()
    ? sessions.filter((s) =>
        s.title?.toLowerCase().includes(searchQuery.trim().toLowerCase())
      )
    : sessions;

  const currentSession = sessions.find((s) => s.id === activeSessionId);

  return {
    sessions: filteredSessions,
    rawSessions: sessions,
    activeSessionId,
    currentSession,
    messages,
    loadingSessions,
    loadingMessages,
    isSending,
    errorMessage,
    setErrorMessage,
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
  };
}
