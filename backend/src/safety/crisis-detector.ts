export type RiskLevel = 'none' | 'elevated' | 'crisis';

export interface CrisisDetectionResult {
  riskLevel: RiskLevel;
  matchedCategories: string[];
}

export const FIXED_CRISIS_RESPONSE = `Your safety matters, and you do not have to carry this alone.

If you are in immediate danger or feel you cannot stay safe right now, please call your local emergency services (such as 911 in the U.S.) or go to the nearest emergency room immediately.

Emergency support is free, confidential, and available 24/7:
• In the U.S. and Canada: Call or text 988, or chat online at https://988lifeline.org
• The Trevor Project (LGBTQ youth): Call 1-866-488-7386 or text START to 678-678
• Veterans Crisis Line: Call 988 and press 1, or text 838255
• International resources: Find free, confidential support worldwide at https://findahelpline.com

Please reach out to a trusted person—a friend, family member, or healthcare professional—and try not to be alone right now.

Important: This app is an AI companion, not a human, licensed therapist, doctor, or emergency crisis service.`;

interface PatternDef {
  category: string;
  level: RiskLevel;
  pattern: RegExp;
}

// Configurable patterns covering:
// - Suicide and suicidal ideation
// - Self-harm and self-injury
// - Overdose or poisoning intent
// - Immediate danger or fear for safety
// - Violence or intent to harm another person
// - Abuse, coercion, or immediate threats
//
// Designed to avoid false positives for benign expressions such as:
// "that dead workout killed me", "my head hurts", "I'm stressed out"
const CRISIS_PATTERNS: PatternDef[] = [
  // 1. Suicide & Suicidal Ideation
  {
    category: 'suicide',
    level: 'crisis',
    pattern: /\b(want to|going to|plan to|gonna|ready to|thinking of|thinking about|contemplating)\s+(kill myself|end my life|die by suicide|hang myself|shoot myself)\b/i,
  },
  {
    category: 'suicide',
    level: 'crisis',
    pattern: /\b(better off dead|don'?t want to live anymore|wish i (was|were) dead|i want to disappear forever|no reason to live|ready to end it all)\b/i,
  },
  {
    category: 'suicide',
    level: 'crisis',
    pattern: /\b(suicide note|saying goodbye to everyone|writing my goodbye note|give away my belongings because i'?m ending it)\b/i,
  },

  // 2. Self-Harm & Self-Injury
  {
    category: 'self_harm',
    level: 'crisis',
    pattern: /\b(want to|going to|planning to|urge to|about to)\s+(cut myself|burn myself|slit my wrists|hurt myself physically|harm myself|injure myself)\b/i,
  },
  {
    category: 'self_harm',
    level: 'crisis',
    pattern: /\b(bleeding out on purpose|relapsed and cutting deep|can'?t stop cutting myself|cannot stop cutting myself)\b/i,
  },

  // 3. Overdose or Poisoning Intent
  {
    category: 'overdose',
    level: 'crisis',
    pattern: /\b(took|take|swallow|taking|swallowed|downing)\s+(a\s+)?(bottle of|all (my|the)|bunch of|handful of|lethal amount of)\s+(pills|painkillers|tylenol|aspirin|medication|bleach|poison)\b/i,
  },
  {
    category: 'overdose',
    level: 'crisis',
    pattern: /\b(intentional(ly)? overdose|overdosing right now|trying to overdose)\b/i,
  },

  // 4. Immediate Danger or Fear for Safety
  {
    category: 'immediate_danger',
    level: 'crisis',
    pattern: /\b(in immediate danger|someone is trying to kill me|break-in in progress|fear for my life right now|trapped and cannot escape)\b/i,
  },

  // 5. Violence or Intent to Harm Another Person
  {
    category: 'violence',
    level: 'crisis',
    pattern: /\b(want to|going to|plan to|gonna)\s+(kill|murder|stab|shoot|strangle|hunt down)\s+(my\s+)?(boss|partner|wife|husband|coworker|friend|parents|them|him|her|someone|people)\b/i,
  },
  {
    category: 'violence',
    level: 'crisis',
    pattern: /\b(bringing a (gun|weapon|knife|bomb) to\s+(school|work|office|mall))\b/i,
  },

  // 6. Abuse, Coercion, or Immediate Threats
  {
    category: 'abuse',
    level: 'crisis',
    pattern: /\b(partner is beating me right now|being held hostage|being abused right now|locked in a room and can'?t leave|they threatened to kill me if i tell)\b/i,
  },

  // Elevated risk patterns (not immediate crisis but heightened concern)
  {
    category: 'elevated_ideation',
    level: 'elevated',
    pattern: /\b(struggling with thoughts of death|passive suicidal thoughts|frequent thoughts of not waking up|intense self-harm urges)\b/i,
  },
];

export function detectCrisisRisk(text: string): CrisisDetectionResult {
  if (!text || typeof text !== 'string') {
    return { riskLevel: 'none', matchedCategories: [] };
  }

  const matchedCategories = new Set<string>();
  let highestRisk: RiskLevel = 'none';

  for (const { category, level, pattern } of CRISIS_PATTERNS) {
    if (pattern.test(text)) {
      matchedCategories.add(category);
      if (level === 'crisis') {
        highestRisk = 'crisis';
      } else if (level === 'elevated' && highestRisk !== 'crisis') {
        highestRisk = 'elevated';
      }
    }
  }

  return {
    riskLevel: highestRisk,
    matchedCategories: Array.from(matchedCategories),
  };
}
