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

export interface SummaryOutput {
  overview: string;
  emotionalThemes: string[];
  strengths: string[];
  copingSteps: string[];
  followUp: string;
  riskNote: string;
}

const SUMMARY_SYSTEM_PROMPT = `You are a compassionate, thoughtful wellness summary generator for an AI companion app.
Your task is to summarize the user's completed wellness session.

Strict requirements:
- Use a compassionate, warm, non-clinical tone.
- DO NOT diagnose conditions, label pathology, or prescribe treatments.
- DO NOT invent events, feelings, or problems that were not discussed in the transcript.
- Identify 2 to 4 recurring emotional themes ONLY when clearly supported by the transcript.
- Identify 1 to 3 personal strengths, insights, or positive efforts the user demonstrated.
- Include 3 to 5 practical, evidence-informed coping steps (such as 4-7-8 breathing, grounding 5-4-3-2-1, journaling, a walk, reaching out to a friend).
- In the "followUp" field, include a caring recommendation to seek professional support (therapist, physician, or counselor) if distress is persistent, severe, or affects daily functioning.
- In the "riskNote" field:
  - If any crisis or self-harm indicators were present in the transcript, state clearly that the user should connect immediately with human emergency resources (e.g. 988 Lifeline).
  - If no crisis indicators were present, provide a gentle reminder that this summary is AI-generated for reflection and does not replace professional mental health care.

Respond ONLY with a valid JSON object matching this schema:
{
  "overview": "string",
  "emotionalThemes": ["string"],
  "strengths": ["string"],
  "copingSteps": ["string"],
  "followUp": "string",
  "riskNote": "string"
}`;

export function validateSummaryJson(data: any): SummaryOutput | null {
  if (!data || typeof data !== 'object') return null;

  if (typeof data.overview !== 'string' || !data.overview.trim()) return null;
  if (!Array.isArray(data.emotionalThemes) || data.emotionalThemes.length === 0) return null;
  if (!Array.isArray(data.strengths)) return null;
  if (!Array.isArray(data.copingSteps) || data.copingSteps.length < 1) return null;
  if (typeof data.followUp !== 'string' || !data.followUp.trim()) return null;
  if (typeof data.riskNote !== 'string' || !data.riskNote.trim()) return null;

  return {
    overview: data.overview.trim(),
    emotionalThemes: data.emotionalThemes.map((s: any) => String(s).trim()).filter(Boolean),
    strengths: data.strengths.map((s: any) => String(s).trim()).filter(Boolean),
    copingSteps: data.copingSteps.map((s: any) => String(s).trim()).filter(Boolean),
    followUp: data.followUp.trim(),
    riskNote: data.riskNote.trim(),
  };
}

export function parseSummaryResponse(responseText: string): SummaryOutput | null {
  if (!responseText) return null;
  let cleaned = responseText.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  }

  try {
    const parsed = JSON.parse(cleaned);
    return validateSummaryJson(parsed);
  } catch {
    return null;
  }
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

export async function generateSessionSummary(
  transcript: MessageDoc[]
): Promise<SummaryOutput> {
  if (!transcript || transcript.length === 0) {
    throw new Error('Cannot generate summary for an empty session.');
  }

  const client = getGeminiClient();
  const modelName = env.GEMINI_MODEL || 'gemini-2.5-flash';

  const transcriptText = transcript
    .map((m) => `${m.role === 'user' ? 'User' : 'Companion'}: ${m.text}`)
    .join('\n');

  try {
    const response = await client.models.generateContent({
      model: modelName,
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: `${SUMMARY_SYSTEM_PROMPT}\n\nSession Transcript:\n${transcriptText}`,
            },
          ],
        },
      ],
      config: {
        responseMimeType: 'application/json',
      },
    });

    const reply = response.text?.trim() || '';
    const parsed = parseSummaryResponse(reply);

    if (!parsed) {
      throw new Error('AI summary generation produced malformed response format.');
    }

    return parsed;
  } catch (error: any) {
    const msg = error?.message || 'Summary service failure';
    throw new Error(`Gemini summary error: ${msg}`);
  }
}
