import { GoogleGenAI } from '@google/genai';
import { env } from '../config/env.js';
import { THERAPIST_SYSTEM_PROMPT } from '../prompts/therapist.system-prompt.js';
import { MessageDoc } from './firestore.service.js';

let aiClient: GoogleGenAI | null = null;

export function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    if (!env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY environment variable is not configured.');
    }
    aiClient = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
  }
  return aiClient;
}

export function setGeminiClient(client: GoogleGenAI | null): void {
  aiClient = client;
}

export async function generateTherapistResponse(
  history: MessageDoc[],
  newMessage: string
): Promise<string> {
  const client = getGeminiClient();
  const modelName = env.GEMINI_MODEL || 'gemini-2.5-flash';

  const contents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];

  for (const msg of history) {
    if (!msg.text) continue;
    contents.push({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.text }],
    });
  }

  const lastMsg = contents[contents.length - 1];
  if (!lastMsg || lastMsg.role !== 'user' || lastMsg.parts[0]?.text !== newMessage) {
    contents.push({
      role: 'user',
      parts: [{ text: newMessage }],
    });
  }

  try {
    const response = await client.models.generateContent({
      model: modelName,
      contents,
      config: {
        systemInstruction: THERAPIST_SYSTEM_PROMPT,
      },
    });

    const replyText = response.text?.trim();

    if (!replyText) {
      throw new Error('Gemini API returned an empty response.');
    }

    return replyText;
  } catch (error: any) {
    const message = error?.message || 'Error communicating with Gemini service';
    throw new Error(`Gemini service error: ${message}`);
  }
}
