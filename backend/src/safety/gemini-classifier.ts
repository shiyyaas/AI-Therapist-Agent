import { getGeminiClient } from '../services/gemini.service.js';
import { env } from '../config/env.js';
import { CrisisDetectionResult, RiskLevel } from './crisis-detector.js';

export interface ClassifierResult {
  riskLevel: RiskLevel;
  reason: string;
  categories: string[];
}

const CLASSIFIER_PROMPT = `You are a strict, conservative safety risk classifier for a wellness companion application.
Your job is to assess if a user message indicates immediate crisis, elevated distress requiring human help, or no crisis risk.

CRISIS CRITERIA:
- Explicit suicidal ideation, intent, plan, preparation, or rehearsal
- Active or planned self-harm / cutting / burning / intentional bodily injury
- Overdose or intentional poisoning
- Immediate physical danger, severe violence, or credible threats against self or others
- Ongoing domestic abuse, assault, or captivity

ELEVATED CRITERIA:
- Passive death wishes without intent/plan ("sometimes I wish I never woke up", "wondering what it feels like to die")
- Discussion of past resolved self-harm or past suicidal ideation without current risk
- Intense emotional distress without risk of harm

NONE CRITERIA:
- Everyday stressors (work, school, family, breakups)
- Colloquial expressions ("my feet are killing me", "I died laughing", "that test was brutal", "it hurt my feelings")
- Discussing stress, sadness, anxiety, burnout in a non-crisis way

You must respond ONLY with a valid JSON object matching this schema and nothing else:
{
  "riskLevel": "none" | "elevated" | "crisis",
  "reason": "brief explanation under 25 words",
  "categories": ["self_harm", "suicide", "violence", "abuse", "other"]
}

User Message to classify:
`;

export function validateClassifierJson(data: any): ClassifierResult | null {
  if (!data || typeof data !== 'object') return null;

  const validLevels: RiskLevel[] = ['none', 'elevated', 'crisis'];
  if (!validLevels.includes(data.riskLevel)) {
    return null;
  }

  const reason = typeof data.reason === 'string' ? data.reason.trim() : '';
  const categories = Array.isArray(data.categories)
    ? data.categories.filter((c: unknown) => typeof c === 'string')
    : [];

  return {
    riskLevel: data.riskLevel,
    reason,
    categories,
  };
}

export function parseClassifierResponse(responseText: string): ClassifierResult | null {
  if (!responseText) return null;

  let cleaned = responseText.trim();
  // Strip Markdown code fences if present (e.g. ```json ... ```)
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  }

  try {
    const parsed = JSON.parse(cleaned);
    return validateClassifierJson(parsed);
  } catch {
    return null;
  }
}

export async function classifyCrisisWithGemini(
  text: string,
  deterministicFallback: CrisisDetectionResult
): Promise<ClassifierResult> {
  const modelName = env.GEMINI_MODEL || 'gemini-2.5-flash';

  try {
    const client = getGeminiClient();
    const response = await client.models.generateContent({
      model: modelName,
      contents: [
        {
          role: 'user',
          parts: [{ text: `${CLASSIFIER_PROMPT}\n"${text}"` }],
        },
      ],
      config: {
        responseMimeType: 'application/json',
      },
    });

    const reply = response.text?.trim() || '';
    const parsed = parseClassifierResponse(reply);

    if (parsed) {
      // If deterministic detection detected crisis, NEVER downgrade below crisis
      if (deterministicFallback.riskLevel === 'crisis' && parsed.riskLevel !== 'crisis') {
        return {
          riskLevel: 'crisis',
          reason: 'Deterministic keyword/regex safety override',
          categories: Array.from(new Set([...parsed.categories, ...deterministicFallback.matchedCategories])),
        };
      }
      return parsed;
    }

    // Fall back to deterministic result
    return {
      riskLevel: deterministicFallback.riskLevel,
      reason: 'Classifier response invalid, deterministic fallback applied',
      categories: deterministicFallback.matchedCategories,
    };
  } catch (error) {
    // Never let classifier failure silently bypass safety checks
    return {
      riskLevel: deterministicFallback.riskLevel,
      reason: `Classifier call failed (${(error as any)?.message || 'unknown'}), deterministic fallback applied`,
      categories: deterministicFallback.matchedCategories,
    };
  }
}
