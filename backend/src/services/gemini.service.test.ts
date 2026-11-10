import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateTherapistResponse, setGeminiClient } from './gemini.service.js';

describe('Gemini Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('generates a response using the client', async () => {
    const mockGenerateContent = vi.fn().mockResolvedValue({
      text: 'I hear how difficult things have been for you. What is one small thing that brought you comfort recently?',
    });

    const mockClient = {
      models: {
        generateContent: mockGenerateContent,
      },
    } as any;

    setGeminiClient(mockClient);

    const history = [
      { role: 'user' as const, text: 'Hello', createdAt: {} as any },
      { role: 'assistant' as const, text: 'Hi there, how can I support you today?', createdAt: {} as any },
    ];

    const result = await generateTherapistResponse(history, 'I am feeling overwhelmed');
    expect(result).toContain('I hear how difficult things have been');
    expect(mockGenerateContent).toHaveBeenCalledTimes(1);
  });

  it('throws an error if Gemini returns empty text', async () => {
    const mockGenerateContent = vi.fn().mockResolvedValue({
      text: '   ',
    });

    const mockClient = {
      models: {
        generateContent: mockGenerateContent,
      },
    } as any;

    setGeminiClient(mockClient);

    await expect(
      generateTherapistResponse([], 'Help me')
    ).rejects.toThrow('Gemini API returned an empty response.');
  });

  it('wraps and re-throws API errors', async () => {
    const mockGenerateContent = vi.fn().mockRejectedValue(new Error('Quota exceeded or network timeout'));

    const mockClient = {
      models: {
        generateContent: mockGenerateContent,
      },
    } as any;

    setGeminiClient(mockClient);

    await expect(
      generateTherapistResponse([], 'I need help')
    ).rejects.toThrow('Gemini service error: Quota exceeded or network timeout');
  });
});
