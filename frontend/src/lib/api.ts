import { auth } from './firebase';
import { ChatApiResponse } from '../types/chat';

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
