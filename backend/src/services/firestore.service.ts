import admin from 'firebase-admin';
import { adminDb } from '../config/firebase-admin.js';

export interface UserDoc {
  uid: string;
  email: string | null;
  isAnonymous: boolean;
  createdAt: admin.firestore.FieldValue | admin.firestore.Timestamp;
}

export interface SessionDoc {
  id?: string;
  uid: string;
  title: string;
  status: 'active' | 'ended';
  createdAt: admin.firestore.FieldValue | admin.firestore.Timestamp;
  updatedAt: admin.firestore.FieldValue | admin.firestore.Timestamp;
  messageCount: number;
}

export interface MessageDoc {
  id?: string;
  role: 'user' | 'assistant';
  text: string;
  createdAt: admin.firestore.FieldValue | admin.firestore.Timestamp;
}

export function truncateTitle(text: string, maxLength: number = 50): string {
  if (!text) return 'New Chat';
  const trimmed = text.trim();
  if (trimmed.length <= maxLength) return trimmed;
  return trimmed.slice(0, maxLength).trim();
}

export async function syncUserDocument(
  uid: string,
  email: string | null = null,
  isAnonymous: boolean = false
): Promise<void> {
  const userRef = adminDb.collection('users').doc(uid);
  const doc = await userRef.get();
  if (!doc.exists) {
    await userRef.set({
      uid,
      email,
      isAnonymous,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }
}

export async function getSession(sessionId: string): Promise<SessionDoc | null> {
  const sessionRef = adminDb.collection('sessions').doc(sessionId);
  const doc = await sessionRef.get();
  if (!doc.exists) {
    return null;
  }
  const data = doc.data() as SessionDoc;
  return {
    ...data,
    id: doc.id,
  };
}

export async function createSession(uid: string, initialTitle: string = 'New Chat'): Promise<string> {
  const sessionRef = adminDb.collection('sessions').doc();
  const now = admin.firestore.FieldValue.serverTimestamp();
  await sessionRef.set({
    uid,
    title: truncateTitle(initialTitle, 50),
    status: 'active',
    createdAt: now,
    updatedAt: now,
    messageCount: 0,
  });
  return sessionRef.id;
}

export async function listUserSessions(uid: string): Promise<SessionDoc[]> {
  const snapshot = await adminDb
    .collection('sessions')
    .where('uid', '==', uid)
    .orderBy('updatedAt', 'desc')
    .get();

  return snapshot.docs.map((doc) => ({
    ...(doc.data() as SessionDoc),
    id: doc.id,
  }));
}

export async function saveMessage(
  sessionId: string,
  role: 'user' | 'assistant',
  text: string
): Promise<string> {
  const messageRef = adminDb
    .collection('sessions')
    .doc(sessionId)
    .collection('messages')
    .doc();

  await messageRef.set({
    role,
    text,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  return messageRef.id;
}

export async function getLastMessages(
  sessionId: string,
  limitCount: number = 20
): Promise<MessageDoc[]> {
  const snapshot = await adminDb
    .collection('sessions')
    .doc(sessionId)
    .collection('messages')
    .orderBy('createdAt', 'desc')
    .limit(limitCount)
    .get();

  const messages = snapshot.docs.map((doc) => ({
    ...(doc.data() as MessageDoc),
    id: doc.id,
  }));

  return messages.reverse();
}

export async function updateSessionMeta(
  sessionId: string,
  incrementCount: number = 1,
  title?: string
): Promise<void> {
  const sessionRef = adminDb.collection('sessions').doc(sessionId);
  const updateData: Record<string, any> = {
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    messageCount: admin.firestore.FieldValue.increment(incrementCount),
  };

  if (title) {
    updateData.title = truncateTitle(title, 50);
  }

  await sessionRef.update(updateData);
}
