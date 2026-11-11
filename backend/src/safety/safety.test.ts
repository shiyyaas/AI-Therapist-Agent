import { describe, it, expect, vi, beforeEach } from 'vitest';
import { detectCrisisRisk, FIXED_CRISIS_RESPONSE } from './crisis-detector.js';
import {
  parseClassifierResponse,
  validateClassifierJson,
  classifyCrisisWithGemini,
} from './gemini-classifier.js';
import * as geminiService from '../services/gemini.service.js';

describe('Crisis Detector (Deterministic regex)', () => {
  it('detects clear suicidal ideation', () => {
    const examples = [
      'I want to kill myself',
      'I am going to end my life tonight',
      'I feel like I am better off dead',
      'I have no reason to live anymore',
      'I am ready to end it all',
    ];

    for (const text of examples) {
      const res = detectCrisisRisk(text);
      expect(res.riskLevel, `Failed on: "${text}"`).toBe('crisis');
      expect(res.matchedCategories).toContain('suicide');
    }
  });

  it('detects clear self-harm language', () => {
    const examples = [
      'I have a strong urge to cut myself',
      'I am about to burn myself',
      'I cannot stop cutting myself',
    ];

    for (const text of examples) {
      const res = detectCrisisRisk(text);
      expect(res.riskLevel, `Failed on: "${text}"`).toBe('crisis');
      expect(res.matchedCategories).toContain('self_harm');
    }
  });

  it('detects overdose and poisoning intent', () => {
    const examples = [
      'I just swallowed a bottle of painkillers',
      'I am taking a lethal amount of pills',
      'I took a bunch of pills to end it',
    ];

    for (const text of examples) {
      const res = detectCrisisRisk(text);
      expect(res.riskLevel, `Failed on: "${text}"`).toBe('crisis');
      expect(res.matchedCategories).toContain('overdose');
    }
  });

  it('detects immediate danger and violence toward others', () => {
    const danger = 'I am in immediate danger right now';
    expect(detectCrisisRisk(danger).riskLevel).toBe('crisis');

    const violence = 'I am going to kill my boss tomorrow';
    const violenceRes = detectCrisisRisk(violence);
    expect(violenceRes.riskLevel).toBe('crisis');
    expect(violenceRes.matchedCategories).toContain('violence');

    const abuse = 'My partner is beating me right now';
    const abuseRes = detectCrisisRisk(abuse);
    expect(abuseRes.riskLevel).toBe('crisis');
    expect(abuseRes.matchedCategories).toContain('abuse');
  });

  it('does NOT falsely flag benign, neutral or common phrases', () => {
    const safeExamples = [
      'My feet are killing me after that walk',
      'I am so stressed out with school deadlines',
      'My head hurts really badly today',
      'I died laughing at that comedy video',
      'The battery on my phone is dead',
      'It hurt my feelings when they said that',
      'I need to kill some time before the meeting',
      'This workout is going to kill me',
      'Can you help me breathe through my stress?',
      "I'm dying to see that movie.",
      'This deadline is killing me.',
    ];

    for (const text of safeExamples) {
      const res = detectCrisisRisk(text);
      expect(res.riskLevel, `Falsely flagged: "${text}"`).toBe('none');
      expect(res.matchedCategories).toEqual([]);
    }
  });

  it('detects specified true positive crisis prompt phrases', () => {
    const tp1 = detectCrisisRisk('I have a plan to end my life tonight.');
    expect(tp1.riskLevel).toBe('crisis');
    expect(tp1.matchedCategories).toContain('suicide');

    const tp2 = detectCrisisRisk("I'm going to hurt someone when they get home.");
    expect(tp2.riskLevel).toBe('crisis');
    expect(tp2.matchedCategories).toContain('violence');
  });

  it('includes key emergency resources in FIXED_CRISIS_RESPONSE', () => {
    expect(FIXED_CRISIS_RESPONSE).toContain('988');
    expect(FIXED_CRISIS_RESPONSE).toContain('988lifeline.org');
    expect(FIXED_CRISIS_RESPONSE).toContain('emergency');
    expect(FIXED_CRISIS_RESPONSE).toContain('not a human, licensed therapist');
  });
});

describe('Gemini Risk Classifier', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('correctly parses valid JSON response', () => {
    const raw = JSON.stringify({
      riskLevel: 'crisis',
      reason: 'User expressed immediate intent to harm self',
      categories: ['suicide'],
    });

    const parsed = parseClassifierResponse(raw);
    expect(parsed).not.toBeNull();
    expect(parsed?.riskLevel).toBe('crisis');
    expect(parsed?.categories).toEqual(['suicide']);
  });

  it('handles markdown code fence wrapping cleanly', () => {
    const fenced = '```json\n{"riskLevel": "none", "reason": "Everyday stress", "categories": []}\n```';
    const parsed = parseClassifierResponse(fenced);
    expect(parsed).not.toBeNull();
    expect(parsed?.riskLevel).toBe('none');
  });

  it('rejects invalid or malformed JSON safely', () => {
    expect(parseClassifierResponse('Not valid JSON')).toBeNull();
    expect(validateClassifierJson({ riskLevel: 'unknown_value' })).toBeNull();
    expect(validateClassifierJson(null)).toBeNull();
  });

  it('falls back to deterministic result when Gemini fails or returns error', async () => {
    vi.spyOn(geminiService, 'getGeminiClient').mockReturnValue({
      models: {
        generateContent: vi.fn().mockRejectedValue(new Error('Network timeout')),
      },
    } as any);

    const deterministic = { riskLevel: 'crisis' as const, matchedCategories: ['suicide'] };
    const result = await classifyCrisisWithGemini('I want to kill myself', deterministic);

    expect(result.riskLevel).toBe('crisis');
    expect(result.categories).toContain('suicide');
  });

  it('never downgrades a deterministic crisis even if Gemini classifier returns none', async () => {
    vi.spyOn(geminiService, 'getGeminiClient').mockReturnValue({
      models: {
        generateContent: vi.fn().mockResolvedValue({
          text: JSON.stringify({
            riskLevel: 'none',
            reason: 'Misclassified',
            categories: [],
          }),
        }),
      },
    } as any);

    const deterministic = { riskLevel: 'crisis' as const, matchedCategories: ['suicide'] };
    const result = await classifyCrisisWithGemini('I want to end my life', deterministic);

    expect(result.riskLevel).toBe('crisis');
    expect(result.categories).toContain('suicide');
  });
});
