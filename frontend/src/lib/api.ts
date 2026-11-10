import { auth } from './firebase';
import { ChatApiResponse, Session, SessionSummary } from '../types/chat';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
const DEFAULT_TIMEOUT_MS = 25000;

export class ApiError extends Error {
  status: number;
  retryAfter?: number;

  constructor(message: string, status: number = 500, retryAfter?: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.retryAfter = retryAfter;
  }
}

export async function getAuthToken(): Promise<string> {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new ApiError('You are not currently signed in. Please sign in to continue.', 401);
  }
  try {
    return await currentUser.getIdToken(true);
  } catch {
    return await currentUser.getIdToken();
  }
}

async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs = DEFAULT_TIMEOUT_MS): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(id);
    return response;
  } catch (error: any) {
    clearTimeout(id);
    if (error?.name === 'AbortError') {
      throw new ApiError('The request timed out. Please check your connection and try again.', 408);
    }
    throw new ApiError('Unable to connect to the server. Please check your internet connection.', 0);
  }
}

function handleResponseError(status: number, data: any): never {
  let message = data?.error;

  if (status === 401) {
    message = 'Your session has expired. Please sign in again.';
  } else if (status === 403) {
    message = 'You do not have permission to access or modify this conversation.';
  } else if (status === 404) {
    message = 'The requested conversation was not found.';
  } else if (status === 429) {
    const retryAfter = data?.retryAfter || 60;
    message = data?.error || `Too many requests. Please wait a moment before trying again.`;
    throw new ApiError(message, 429, retryAfter);
  } else if (status === 502) {
    message = data?.error || 'The AI service is temporarily unavailable. Your message was preserved. Please retry.';
  } else if (status >= 500) {
    message = 'A temporary server error occurred. Please try again shortly.';
  }

  throw new ApiError(message || 'An unexpected error occurred. Please try again.', status);
}

export async function sendChatMessage(
  sessionId: string,
  message: string
): Promise<ChatApiResponse> {
  const token = await getAuthToken();

  const response = await fetchWithTimeout(`${API_BASE_URL}/api/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ sessionId, message }),
  });

  let data: any = {};
  try {
    data = await response.json();
  } catch {
    throw new ApiError('Received an unexpected server response format.', response.status);
  }

  if (!response.ok) {
    handleResponseError(response.status, data);
  }

  return data;
}

export async function renameSessionApi(
  sessionId: string,
  title: string
): Promise<Session> {
  const token = await getAuthToken();

  const response = await fetchWithTimeout(`${API_BASE_URL}/api/chat/sessions/${sessionId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ title }),
  });

  let data: any = {};
  try {
    data = await response.json();
  } catch {
    throw new ApiError('Received an unexpected server response format.', response.status);
  }

  if (!response.ok) {
    handleResponseError(response.status, data);
  }
  return data;
}

export async function deleteSessionApi(sessionId: string): Promise<void> {
  const token = await getAuthToken();

  const response = await fetchWithTimeout(`${API_BASE_URL}/api/chat/sessions/${sessionId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  let data: any = {};
  try {
    data = await response.json();
  } catch {
    throw new ApiError('Received an unexpected server response format.', response.status);
  }

  if (!response.ok) {
    handleResponseError(response.status, data);
  }
}

export async function generateSessionSummaryApi(sessionId: string): Promise<SessionSummary> {
  const token = await getAuthToken();

  const response = await fetchWithTimeout(`${API_BASE_URL}/api/chat/sessions/${sessionId}/summary`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }, 45000);

  let data: any = {};
  try {
    data = await response.json();
  } catch {
    throw new ApiError('Received an unexpected server response format.', response.status);
  }

  if (!response.ok) {
    handleResponseError(response.status, data);
  }
  return data;
}

export async function getSessionSummaryApi(sessionId: string): Promise<SessionSummary | null> {
  const token = await getAuthToken();

  const response = await fetchWithTimeout(`${API_BASE_URL}/api/chat/sessions/${sessionId}/summary`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (response.status === 404) {
    return null;
  }

  let data: any = {};
  try {
    data = await response.json();
  } catch {
    throw new ApiError('Received an unexpected server response format.', response.status);
  }

  if (!response.ok) {
    handleResponseError(response.status, data);
  }
  return data;
}
