import admin from 'firebase-admin';
import { adminDb } from '../config/firebase-admin.js';

export interface UserDoc {
  uid: string;
  email: string | null;
  isAnonymous: boolean;
  createdAt: admin.firestore.FieldValue | admin.firestore.Timestamp;
}

export type RiskLevel = 'none' | 'elevated' | 'crisis';

export interface SessionDoc {
  id?: string;
  uid: string;
  title: string;
  status: 'active' | 'ended';
  riskLevel?: RiskLevel;
  endedAt?: admin.firestore.FieldValue | admin.firestore.Timestamp | null;
  createdAt: admin.firestore.FieldValue | admin.firestore.Timestamp;
  updatedAt: admin.firestore.FieldValue | admin.firestore.Timestamp;
  messageCount: number;
}

export interface MessageDoc {
  id?: string;
  role: 'user' | 'assistant';
  text: string;
  safetyFlag?: boolean;
  crisisType?: string | null;
  createdAt: admin.firestore.FieldValue | admin.firestore.Timestamp;
}

export interface SessionSummaryDoc {
  overview: string;
  emotionalThemes: string[];
  strengths: string[];
  copingSteps: string[];
  followUp: string;
  riskNote: string;
  generatedAt: admin.firestore.FieldValue | admin.firestore.Timestamp;
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
    riskLevel: 'none',
    endedAt: null,
    createdAt: now,
    updatedAt: now,
    messageCount: 0,
  });
  return sessionRef.id;
}

export async function listUserSessions(uid: string, searchQuery?: string): Promise<SessionDoc[]> {
  const snapshot = await adminDb
    .collection('sessions')
    .where('uid', '==', uid)
    .orderBy('updatedAt', 'desc')
    .get();

  const sessions = snapshot.docs.map((doc) => ({
    ...(doc.data() as SessionDoc),
    id: doc.id,
  }));

  if (!searchQuery || !searchQuery.trim()) {
    return sessions;
  }

  const query = searchQuery.trim().toLowerCase();
  const matchedSessionIds = new Set<string>();
  const filteredSessions: SessionDoc[] = [];

  // Match title directly
  for (const session of sessions) {
    if (session.title?.toLowerCase().includes(query)) {
      matchedSessionIds.add(session.id!);
      filteredSessions.push(session);
    }
  }

  // Check message content for sessions not yet matched
  for (const session of sessions) {
    if (matchedSessionIds.has(session.id!)) continue;

    const messagesSnapshot = await adminDb
      .collection('sessions')
      .doc(session.id!)
      .collection('messages')
      .get();

    const matchesMessage = messagesSnapshot.docs.some((msgDoc) => {
      const text = msgDoc.data()?.text;
      return typeof text === 'string' && text.toLowerCase().includes(query);
    });

    if (matchesMessage) {
      matchedSessionIds.add(session.id!);
      filteredSessions.push(session);
    }
  }

  return filteredSessions;
}

export async function renameSession(sessionId: string, newTitle: string): Promise<void> {
  const sessionRef = adminDb.collection('sessions').doc(sessionId);
  await sessionRef.update({
    title: truncateTitle(newTitle, 50),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
}

export async function deleteSessionAndMessages(sessionId: string): Promise<void> {
  const sessionRef = adminDb.collection('sessions').doc(sessionId);

  // Batch delete messages
  const messagesSnapshot = await sessionRef.collection('messages').get();
  const batch = adminDb.batch();

  for (const doc of messagesSnapshot.docs) {
    batch.delete(doc.ref);
  }

  // Delete summary doc if present at sessions/{sessionId}/summary
  const summaryRef = sessionRef.collection('summary').doc('latest');
  batch.delete(summaryRef);

  // Delete session doc
  batch.delete(sessionRef);

  await batch.commit();
}

export async function saveMessage(
  sessionId: string,
  role: 'user' | 'assistant',
  text: string,
  safetyMeta?: { safetyFlag?: boolean; crisisType?: string | null }
): Promise<string> {
  const messageRef = adminDb
    .collection('sessions')
    .doc(sessionId)
    .collection('messages')
    .doc();

  const data: Record<string, any> = {
    role,
    text,
    safetyFlag: safetyMeta?.safetyFlag ?? false,
    crisisType: safetyMeta?.crisisType ?? null,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  await messageRef.set(data);
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

export async function getAllMessages(sessionId: string): Promise<MessageDoc[]> {
  const snapshot = await adminDb
    .collection('sessions')
    .doc(sessionId)
    .collection('messages')
    .orderBy('createdAt', 'asc')
    .get();

  return snapshot.docs.map((doc) => ({
    ...(doc.data() as MessageDoc),
    id: doc.id,
  }));
}

export async function updateSessionMeta(
  sessionId: string,
  incrementCount: number = 1,
  title?: string,
  riskLevel?: RiskLevel
): Promise<void> {
  const sessionRef = adminDb.collection('sessions').doc(sessionId);
  const updateData: Record<string, any> = {
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    messageCount: admin.firestore.FieldValue.increment(incrementCount),
  };

  if (title) {
    updateData.title = truncateTitle(title, 50);
  }

  if (riskLevel) {
    updateData.riskLevel = riskLevel;
  }

  await sessionRef.update(updateData);
}

export async function updateSessionRiskLevel(sessionId: string, riskLevel: RiskLevel): Promise<void> {
  const sessionRef = adminDb.collection('sessions').doc(sessionId);
  await sessionRef.update({
    riskLevel,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
}

export async function endSessionAndSaveSummary(
  sessionId: string,
  summary: Omit<SessionSummaryDoc, 'generatedAt'>
): Promise<SessionSummaryDoc> {
  const now = admin.firestore.FieldValue.serverTimestamp();
  const summaryData: SessionSummaryDoc = {
    ...summary,
    generatedAt: now,
  };

  const batch = adminDb.batch();

  // Save summary in sessions/{sessionId}/summary/latest (document in subcollection)
  const summaryRef = adminDb
    .collection('sessions')
    .doc(sessionId)
    .collection('summary')
    .doc('latest');

  batch.set(summaryRef, summaryData);

  // Update session status to ended
  const sessionRef = adminDb.collection('sessions').doc(sessionId);
  batch.update(sessionRef, {
    status: 'ended',
    endedAt: now,
    updatedAt: now,
  });

  await batch.commit();

  return summaryData;
}

export async function getSessionSummary(sessionId: string): Promise<SessionSummaryDoc | null> {
  const summaryRef = adminDb
    .collection('sessions')
    .doc(sessionId)
    .collection('summary')
    .doc('latest');

  const doc = await summaryRef.get();
  if (!doc.exists) {
    return null;
  }

  return doc.data() as SessionSummaryDoc;
}
