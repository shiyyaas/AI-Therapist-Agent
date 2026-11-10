import { describe, it, expect } from 'vitest';
import { truncateTitle } from './firestore.service.js';

describe('truncateTitle', () => {
  it('defaults to "New Chat" when given empty string', () => {
    expect(truncateTitle('')).toBe('New Chat');
  });

  it('preserves short titles within max length', () => {
    expect(truncateTitle('I feel anxious today')).toBe('I feel anxious today');
  });

  it('truncates strings longer than 50 characters', () => {
    const longInput = 'This is a very long user message explaining that everything is completely overwhelming and stressful.';
    const result = truncateTitle(longInput, 50);
    expect(result.length).toBeLessThanOrEqual(50);
    expect(result).toBe('This is a very long user message explaining that e');
  });

  it('trims whitespace around input and truncated boundary', () => {
    const padded = '   Hello there!   ';
    expect(truncateTitle(padded)).toBe('Hello there!');
  });
});
