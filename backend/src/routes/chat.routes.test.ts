import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import * as firestoreService from '../services/firestore.service.js';
import * as geminiService from '../services/gemini.service.js';
import * as firebaseAdminConfig from '../config/firebase-admin.js';

describe('POST /api/chat Integration', () => {
  let app: any;

  beforeEach(() => {
    vi.clearAllMocks();

    vi.spyOn(firebaseAdminConfig, 'adminAuth', 'get').mockReturnValue({
      verifyIdToken: vi.fn().mockImplementation(async (token: string) => {
        if (token === 'valid-token') {
          return { uid: 'test-user-1', email: 'test@example.com' };
        }
        if (token === 'other-user-token') {
          return { uid: 'other-user', email: 'other@example.com' };
        }
        throw new Error('Invalid token');
      }),
    } as any);

    app = createApp();
  });

  it('rejects unauthenticated requests with 401', async () => {
    const res = await request(app)
      .post('/api/chat')
      .send({ sessionId: 'session-1', message: 'Hello' });

    expect(res.status).toBe(401);
  });

  it('validates required payload fields', async () => {
    const res = await request(app)
      .post('/api/chat')
      .set('Authorization', 'Bearer valid-token')
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('sessionId is required');
  });

  it('prevents user from accessing a session belonging to someone else', async () => {
    vi.spyOn(firestoreService, 'getSession').mockResolvedValue({
      id: 'session-999',
      uid: 'other-user',
      title: 'Their session',
      status: 'active',
      createdAt: {} as any,
      updatedAt: {} as any,
      messageCount: 1,
    });

    const res = await request(app)
      .post('/api/chat')
      .set('Authorization', 'Bearer valid-token')
      .send({ sessionId: 'session-999', message: 'Hi' });

    expect(res.status).toBe(403);
    expect(res.body.error).toContain('Forbidden');
  });

  it('successfully saves message, calls Gemini, and returns assistant message', async () => {
    vi.spyOn(firestoreService, 'getSession').mockResolvedValue({
      id: 'session-123',
      uid: 'test-user-1',
      title: 'New Chat',
      status: 'active',
      createdAt: {} as any,
      updatedAt: {} as any,
      messageCount: 0,
    });

    const saveMessageMock = vi.spyOn(firestoreService, 'saveMessage').mockResolvedValue('msg-id-1');
    const updateSessionMetaMock = vi.spyOn(firestoreService, 'updateSessionMeta').mockResolvedValue();
    vi.spyOn(firestoreService, 'getLastMessages').mockResolvedValue([]);
    vi.spyOn(geminiService, 'generateTherapistResponse').mockResolvedValue(
      'I hear you, and it is completely normal to feel this way.'
    );

    const res = await request(app)
      .post('/api/chat')
      .set('Authorization', 'Bearer valid-token')
      .send({ sessionId: 'session-123', message: 'I feel stressed' });

    expect(res.status).toBe(200);
    expect(res.body.role).toBe('assistant');
    expect(res.body.text).toBe('I hear you, and it is completely normal to feel this way.');

    expect(saveMessageMock).toHaveBeenCalledWith('session-123', 'user', 'I feel stressed');
    expect(saveMessageMock).toHaveBeenCalledWith('session-123', 'assistant', 'I hear you, and it is completely normal to feel this way.');
    expect(updateSessionMetaMock).toHaveBeenCalledWith('session-123', 2, 'I feel stressed');
  });

  it('returns 502 without saving assistant message when Gemini fails', async () => {
    vi.spyOn(firestoreService, 'getSession').mockResolvedValue({
      id: 'session-123',
      uid: 'test-user-1',
      title: 'Stress Chat',
      status: 'active',
      createdAt: {} as any,
      updatedAt: {} as any,
      messageCount: 2,
    });

    const saveMessageMock = vi.spyOn(firestoreService, 'saveMessage').mockResolvedValue('msg-id-user');
    vi.spyOn(firestoreService, 'getLastMessages').mockResolvedValue([]);
    vi.spyOn(geminiService, 'generateTherapistResponse').mockRejectedValue(
      new Error('Gemini service error: 503 Service Unavailable')
    );

    const res = await request(app)
      .post('/api/chat')
      .set('Authorization', 'Bearer valid-token')
      .send({ sessionId: 'session-123', message: 'Are you there?' });

    expect(res.status).toBe(502);
    expect(res.body.error).toContain('AI companion is currently unavailable');

    expect(saveMessageMock).toHaveBeenCalledWith('session-123', 'user', 'Are you there?');
    expect(saveMessageMock).not.toHaveBeenCalledWith('session-123', 'assistant', expect.anything());
  });
});
