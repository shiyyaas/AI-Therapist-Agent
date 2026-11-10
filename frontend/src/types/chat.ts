export interface UserProfile {
  uid: string;
  email: string | null;
  isAnonymous: boolean;
  createdAt?: string;
}

export type RiskLevel = 'none' | 'elevated' | 'crisis';

export interface Session {
  id: string;
  uid: string;
  title: string;
  status: 'active' | 'ended';
  riskLevel?: RiskLevel;
  endedAt?: any;
  createdAt: any;
  updatedAt: any;
  messageCount: number;
}

export interface ChatMessage {
  id?: string;
  role: 'user' | 'assistant';
  text: string;
  safetyFlag?: boolean;
  crisisType?: string | null;
  riskLevel?: RiskLevel;
  createdAt?: any;
  pending?: boolean;
  error?: boolean;
}

export interface ChatApiResponse {
  role: 'assistant';
  text: string;
  safetyFlag?: boolean;
  crisisType?: string | null;
  riskLevel?: RiskLevel;
  createdAt: string;
}

export interface SessionSummary {
  overview: string;
  emotionalThemes: string[];
  strengths: string[];
  copingSteps: string[];
  followUp: string;
  riskNote: string;
  generatedAt?: any;
}
