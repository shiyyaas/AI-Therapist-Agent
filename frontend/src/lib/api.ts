import { auth } from './firebase';
import { ChatApiResponse, Session, SessionSummary } from '../types/chat';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

export async function getAuthToken(): Promise<string> {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('User is not authenticated.');
  }
  return await currentUser.getIdToken();
}

export async function sendChatMessage(
  sessionId: string,
  message: string
): Promise<ChatApiResponse> {
  const token = await getAuthToken();

  const response = await fetch(`${API_BASE_URL}/api/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ sessionId, message }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to send message to AI companion.');
  }

  return data;
}

export async function renameSessionApi(
  sessionId: string,
  title: string
): Promise<Session> {
  const token = await getAuthToken();

  const response = await fetch(`${API_BASE_URL}/api/chat/sessions/${sessionId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ title }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Failed to rename session.');
  }
  return data;
}

export async function deleteSessionApi(sessionId: string): Promise<void> {
  const token = await getAuthToken();

  const response = await fetch(`${API_BASE_URL}/api/chat/sessions/${sessionId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Failed to delete session.');
  }
}

export async function generateSessionSummaryApi(sessionId: string): Promise<SessionSummary> {
  const token = await getAuthToken();

  const response = await fetch(`${API_BASE_URL}/api/chat/sessions/${sessionId}/summary`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Failed to generate session summary.');
  }
  return data;
}

export async function getSessionSummaryApi(sessionId: string): Promise<SessionSummary | null> {
  const token = await getAuthToken();

  const response = await fetch(`${API_BASE_URL}/api/chat/sessions/${sessionId}/summary`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (response.status === 404) {
    return null;
  }

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Failed to fetch session summary.');
  }
  return data;
}
