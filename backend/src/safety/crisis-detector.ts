export type RiskLevel = 'none' | 'elevated' | 'crisis';

export interface CrisisDetectionResult {
  riskLevel: RiskLevel;
  matchedCategories: string[];
}

// 1. Immediate Danger / Imminent Action Response
export const FIXED_IMMEDIATE_DANGER_RESPONSE = `Your safety is the absolute priority right now.

If you are in immediate danger, feel you cannot keep yourself safe, or have taken action to harm yourself:
• Call your local emergency services (such as 911 in the U.S.) or go to the nearest emergency room immediately.
• If you cannot speak out loud, text 911 (available in many U.S. areas) or text 988.
• Free, confidential 24/7 crisis support: Call or text 988 (U.S. & Canada) or visit https://988lifeline.org
• International emergency support: https://findahelpline.com

Please move to a safer location, step away from anything dangerous, and contact a trusted person to be with you right now.

Important: This application is an AI wellness companion, not a human, emergency dispatch, licensed therapist, or medical service.`;

// 2. Urgent Distress / Suicidal Ideation without Imminent Danger Response
export const FIXED_SUICIDAL_DISTRESS_RESPONSE = `Your safety matters, and you do not have to carry this alone.

If you are struggling with thoughts of ending your life or intense emotional distress, compassionate human support is available 24/7:
• In the U.S. and Canada: Call or text 988, or chat online at https://988lifeline.org
• The Trevor Project (LGBTQ youth): Call 1-866-488-7386 or text START to 678-678
• Veterans Crisis Line: Call 988 and press 1, or text 838255
• International resources: Find free, confidential support worldwide at https://findahelpline.com

Please reach out to a trusted person—a friend, family member, mentor, or healthcare professional—and try not to be alone right now.

Important: This app is an AI companion, not a human, licensed therapist, doctor, or emergency crisis service.`;

// 3. Risk of Harm to Another Person / Violence Response
export const FIXED_VIOLENCE_HARM_OTHERS_RESPONSE = `Your well-being and the safety of everyone involved are critically important.

If there is immediate danger of physical violence or someone may be harmed right now:
• Please create safe physical distance immediately.
• Contact local emergency services (such as 911 in the U.S.) if anyone's safety is in immediate jeopardy.
• For confidential de-escalation, guidance, and crisis intervention: Call or text 988 (U.S. & Canada) or contact the Crisis Text Line by texting HOME to 741741.
• Outside the U.S.: Find emergency support worldwide at https://findahelpline.com

Please pause, take space from the situation, and reach out to a professional counselor or trusted crisis counselor right now.

Important: This app is an AI companion, not a human, mediator, medical provider, or emergency service.`;

// Default / fallback crisis response
export const FIXED_CRISIS_RESPONSE = FIXED_SUICIDAL_DISTRESS_RESPONSE;

export function getFixedCrisisResponse(category?: string | null): string {
  if (!category) return FIXED_CRISIS_RESPONSE;
  const cat = category.toLowerCase();
  if (cat === 'immediate_danger' || cat === 'overdose' || cat === 'abuse') {
    return FIXED_IMMEDIATE_DANGER_RESPONSE;
  }
  if (cat === 'violence' || cat === 'harm_others') {
    return FIXED_VIOLENCE_HARM_OTHERS_RESPONSE;
  }
  return FIXED_SUICIDAL_DISTRESS_RESPONSE;
}

interface PatternDef {
  category: string;
  level: RiskLevel;
  pattern: RegExp;
}

const CRISIS_PATTERNS: PatternDef[] = [
  // 1. Suicide & Suicidal Ideation
  {
    category: 'suicide',
    level: 'crisis',
    pattern: /\b(want to|going to|plan to|gonna|ready to|thinking of|thinking about|contemplating|have a plan to)\s+(kill myself|end my life|die by suicide|hang myself|shoot myself)\b/i,
  },
  {
    category: 'suicide',
    level: 'crisis',
    pattern: /\b(better off dead|don'?t want to live anymore|wish i (was|were) dead|i want to disappear forever|no reason to live|ready to end it all|end my life tonight|have a plan to end my life)\b/i,
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
    pattern: /\b(want to|going to|plan to|gonna)\s+(kill|murder|stab|shoot|strangle|hunt down|hurt)\s+(my\s+)?(boss|partner|wife|husband|coworker|friend|parents|them|him|her|someone|people)\b/i,
  },
  {
    category: 'violence',
    level: 'crisis',
    pattern: /\b(going to hurt someone|gonna hurt someone|bringing a (gun|weapon|knife|bomb) to\s+(school|work|office|mall))\b/i,
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
