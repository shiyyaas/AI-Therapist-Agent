import dotenv from 'dotenv';

dotenv.config();

export interface EnvConfig {
  PORT: number;
  GEMINI_API_KEY: string;
  GEMINI_MODEL: string;
  FIREBASE_PROJECT_ID?: string;
  FIREBASE_CLIENT_EMAIL?: string;
  FIREBASE_PRIVATE_KEY?: string;
}

export function loadEnv(): EnvConfig {
  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 8080;
  const geminiApiKey = process.env.GEMINI_API_KEY || '';
  const geminiModel = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  const firebaseProjectId = process.env.FIREBASE_PROJECT_ID;
  const firebaseClientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  let firebasePrivateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (firebasePrivateKey) {
    firebasePrivateKey = firebasePrivateKey.replace(/\\n/g, '\n');
  }

  return {
    PORT: isNaN(port) ? 8080 : port,
    GEMINI_API_KEY: geminiApiKey,
    GEMINI_MODEL: geminiModel,
    FIREBASE_PROJECT_ID: firebaseProjectId,
    FIREBASE_CLIENT_EMAIL: firebaseClientEmail,
    FIREBASE_PRIVATE_KEY: firebasePrivateKey,
  };
}

export const env = loadEnv();
