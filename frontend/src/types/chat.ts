export interface UserProfile {
  uid: string;
  email: string | null;
  isAnonymous: boolean;
  createdAt?: string;
}

export interface Session {
  id: string;
  uid: string;
  title: string;
  status: 'active' | 'ended';
  createdAt: any;
  updatedAt: any;
  messageCount: number;
}

export interface ChatMessage {
  id?: string;
  role: 'user' | 'assistant';
  text: string;
  createdAt?: any;
  pending?: boolean;
  error?: boolean;
}

export interface ChatApiResponse {
  role: 'assistant';
  text: string;
  createdAt: string;
}
