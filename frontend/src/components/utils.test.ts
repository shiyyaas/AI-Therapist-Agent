import { describe, it, expect } from 'vitest';
import { formatSessionTitle } from '../hooks/useChatSession';
import { formatRelativeDate } from '../components/SessionSidebar';

describe('formatSessionTitle', () => {
  it('returns "New Chat" when given empty string', () => {
    expect(formatSessionTitle('')).toBe('New Chat');
  });

  it('keeps short titles unchanged', () => {
    expect(formatSessionTitle('Anxiety about work')).toBe('Anxiety about work');
  });

  it('truncates titles exceeding max length to 50 characters', () => {
    const long = 'This is an extremely long user query that talks about daily stress and coping mechanisms in detail';
    const truncated = formatSessionTitle(long, 50);
    expect(truncated.length).toBeLessThanOrEqual(50);
    expect(truncated).toBe('This is an extremely long user query that talks ab');
  });
});

describe('formatRelativeDate', () => {
  it('returns Today for current date', () => {
    const now = new Date();
    expect(formatRelativeDate(now)).toBe('Today');
  });

  it('returns Yesterday for yesterday date', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    expect(formatRelativeDate(yesterday)).toBe('Yesterday');
  });

  it('returns day and month for earlier dates', () => {
    const date = new Date(2025, 2, 12);
    expect(formatRelativeDate(date)).toContain('12');
    expect(formatRelativeDate(date)).toContain('Mar');
  });
});
