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
import { Session, ChatMessage } from '../types/chat';
import { sendChatMessage } from '../lib/api';

export function formatSessionTitle(text: string, maxLength: number = 50): string {
  if (!text) return 'New Chat';
  const trimmed = text.trim();
  if (trimmed.length <= maxLength) return trimmed;
  return trimmed.slice(0, maxLength).trim();
}

export function useChatSession(userId: string | undefined) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingSessions, setLoadingSessions] = useState<boolean>(true);
  const [loadingMessages, setLoadingMessages] = useState<boolean>(false);
  const [isSending, setIsSending] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const activeSessionIdRef = useRef<string | null>(null);
  activeSessionIdRef.current = activeSessionId;

  useEffect(() => {
    if (!userId) {
      setSessions([]);
      setActiveSessionId(null);
      setLoadingSessions(false);
      return;
    }

    setLoadingSessions(true);
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

        if (!activeSessionIdRef.current && list.length > 0) {
          setActiveSessionId(list[0].id);
        }
      },
      (_err) => {
        setLoadingSessions(false);
      }
    );

    return () => unsubscribe();
  }, [userId]);

  useEffect(() => {
    if (!activeSessionId) {
      setMessages([]);
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
      (_err) => {
        setLoadingMessages(false);
      }
    );

    return () => unsubscribe();
  }, [activeSessionId]);

  const createNewSession = useCallback(async (initialTitle: string = 'New Chat'): Promise<string> => {
    if (!userId) throw new Error('Cannot create session: User not authenticated');

    const newDocRef = await addDoc(collection(db, 'sessions'), {
      uid: userId,
      title: formatSessionTitle(initialTitle),
      status: 'active',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      messageCount: 0,
    });

    setActiveSessionId(newDocRef.id);
    setMessages([]);
    setErrorMessage(null);
    return newDocRef.id;
  }, [userId]);

  const selectSession = useCallback((sessionId: string) => {
    setActiveSessionId(sessionId);
    setErrorMessage(null);
  }, []);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isSending) return;
      if (!userId) {
        setErrorMessage('You must be signed in to send a message.');
        return;
      }

      setErrorMessage(null);
      setIsSending(true);

      let targetSessionId = activeSessionId;

      if (!targetSessionId) {
        try {
          targetSessionId = await createNewSession(text);
        } catch {
          setIsSending(false);
          setErrorMessage('Failed to initialize a new session.');
          return;
        }
      }

      const tempUserMsgId = `temp-${Date.now()}`;
      const optimisticUserMsg: ChatMessage = {
        id: tempUserMsgId,
        role: 'user',
        text: text.trim(),
        createdAt: new Date(),
      };

      setMessages((prev) => [...prev, optimisticUserMsg]);

      try {
        const response = await sendChatMessage(targetSessionId, text.trim());

        const currentSession = sessions.find((s) => s.id === targetSessionId);
        if (currentSession && (currentSession.messageCount === 0 || currentSession.title === 'New Chat')) {
          const sessionRef = doc(db, 'sessions', targetSessionId);
          await updateDoc(sessionRef, {
            title: formatSessionTitle(text),
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
                createdAt: new Date(response.createdAt),
              },
            ];
          }
          return prev;
        });
      } catch (err: any) {
        setErrorMessage(
          err?.message || 'Could not communicate with the companion. Your message is saved. Please try again.'
        );
      } finally {
        setIsSending(false);
      }
    },
    [activeSessionId, isSending, userId, createNewSession, sessions]
  );

  return {
    sessions,
    activeSessionId,
    messages,
    loadingSessions,
    loadingMessages,
    isSending,
    errorMessage,
    setErrorMessage,
    createNewSession,
    selectSession,
    sendMessage,
  };
}
