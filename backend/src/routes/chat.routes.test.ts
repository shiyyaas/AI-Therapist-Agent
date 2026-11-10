import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import * as firestoreService from '../services/firestore.service.js';
import * as geminiService from '../services/gemini.service.js';
import * as firebaseAdminConfig from '../config/firebase-admin.js';
import * as geminiClassifier from '../safety/gemini-classifier.js';

describe('Chat Routes Integration', () => {
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

  describe('Health Checks', () => {
    it('returns status ok on GET /healthz without revealing server details', async () => {
      const res = await request(app).get('/healthz');
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ status: 'ok' });
      expect(res.body.version).toBeUndefined();
      expect(res.body.key).toBeUndefined();
    });

    it('returns status ok on legacy GET /health', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
    });
  });

  describe('POST /api/chat - Input Validation & Rate Limiting', () => {
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

    it('rejects whitespace-only messages', async () => {
      const res = await request(app)
        .post('/api/chat')
        .set('Authorization', 'Bearer valid-token')
        .send({ sessionId: 'session-1', message: '    \n   ' });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('cannot be empty');
    });

    it('rejects messages exceeding 4,000 characters', async () => {
      const hugeMessage = 'A'.repeat(4001);
      const res = await request(app)
        .post('/api/chat')
        .set('Authorization', 'Bearer valid-token')
        .send({ sessionId: 'session-1', message: hugeMessage });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('exceeds maximum allowed length');
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

    it('successfully processes safe message and generates response', async () => {
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
      vi.spyOn(geminiClassifier, 'classifyCrisisWithGemini').mockResolvedValue({
        riskLevel: 'none',
        reason: 'Normal conversation',
        categories: [],
      });

      const res = await request(app)
        .post('/api/chat')
        .set('Authorization', 'Bearer valid-token')
        .send({ sessionId: 'session-123', message: 'I feel stressed' });

      expect(res.status).toBe(200);
      expect(res.body.role).toBe('assistant');
      expect(res.body.text).toBe('I hear you, and it is completely normal to feel this way.');
      expect(res.body.safetyFlag).toBe(false);

      expect(saveMessageMock).toHaveBeenCalledWith('session-123', 'user', 'I feel stressed', {
        safetyFlag: false,
        crisisType: null,
      });
      expect(saveMessageMock).toHaveBeenCalledWith(
        'session-123',
        'assistant',
        'I hear you, and it is completely normal to feel this way.',
        { safetyFlag: false, crisisType: null }
      );
      expect(updateSessionMetaMock).toHaveBeenCalledWith('session-123', 2, 'I feel stressed', 'none');
    });
  });

  describe('POST /api/chat - Crisis Escalation', () => {
    it('intercepts crisis messages, returns fixed response, flags session, and skips AI therapist generation', async () => {
      vi.spyOn(firestoreService, 'getSession').mockResolvedValue({
        id: 'session-123',
        uid: 'test-user-1',
        title: 'New Chat',
        status: 'active',
        createdAt: {} as any,
        updatedAt: {} as any,
        messageCount: 0,
      });

      const saveMessageMock = vi.spyOn(firestoreService, 'saveMessage').mockResolvedValue('msg-id-crisis');
      const updateRiskMock = vi.spyOn(firestoreService, 'updateSessionRiskLevel').mockResolvedValue();
      const updateMetaMock = vi.spyOn(firestoreService, 'updateSessionMeta').mockResolvedValue();
      const therapistGenMock = vi.spyOn(geminiService, 'generateTherapistResponse');

      const res = await request(app)
        .post('/api/chat')
        .set('Authorization', 'Bearer valid-token')
        .send({ sessionId: 'session-123', message: 'I want to kill myself' });

      expect(res.status).toBe(200);
      expect(res.body.safetyFlag).toBe(true);
      expect(res.body.riskLevel).toBe('crisis');
      expect(res.body.text).toContain('988');
      expect(res.body.text).toContain('emergency');

      expect(therapistGenMock).not.toHaveBeenCalled();

      expect(saveMessageMock).toHaveBeenCalledWith('session-123', 'user', 'I want to kill myself', {
        safetyFlag: true,
        crisisType: 'suicide',
      });
      expect(updateRiskMock).toHaveBeenCalledWith('session-123', 'crisis');
      expect(updateMetaMock).toHaveBeenCalledWith('session-123', 2, 'I want to kill myself', 'crisis');
    });

    it('intercepts crisis identified by Gemini classifier even if regex is none', async () => {
      vi.spyOn(firestoreService, 'getSession').mockResolvedValue({
        id: 'session-123',
        uid: 'test-user-1',
        title: 'Active Session',
        status: 'active',
        createdAt: {} as any,
        updatedAt: {} as any,
        messageCount: 2,
      });

      vi.spyOn(firestoreService, 'saveMessage').mockResolvedValue('msg-id-crisis-2');
      vi.spyOn(firestoreService, 'updateSessionRiskLevel').mockResolvedValue();
      vi.spyOn(firestoreService, 'updateSessionMeta').mockResolvedValue();
      const therapistGenMock = vi.spyOn(geminiService, 'generateTherapistResponse');

      vi.spyOn(geminiClassifier, 'classifyCrisisWithGemini').mockResolvedValue({
        riskLevel: 'crisis',
        reason: 'Disclosed active plan to self-harm in subtle phrasing',
        categories: ['self_harm'],
      });

      const res = await request(app)
        .post('/api/chat')
        .set('Authorization', 'Bearer valid-token')
        .send({ sessionId: 'session-123', message: 'I have hidden the razor in my room for tonight' });

      expect(res.status).toBe(200);
      expect(res.body.safetyFlag).toBe(true);
      expect(res.body.riskLevel).toBe('crisis');
      expect(res.body.crisisType).toBe('self_harm');
      expect(therapistGenMock).not.toHaveBeenCalled();
    });
  });

  describe('Session Management (Rename, Delete, Search)', () => {
    it('renames a session belonging to user', async () => {
      vi.spyOn(firestoreService, 'getSession').mockResolvedValueOnce({
        id: 'session-rename',
        uid: 'test-user-1',
        title: 'Old Title',
        status: 'active',
        createdAt: {} as any,
        updatedAt: {} as any,
        messageCount: 2,
      }).mockResolvedValueOnce({
        id: 'session-rename',
        uid: 'test-user-1',
        title: 'Renamed Title',
        status: 'active',
        createdAt: {} as any,
        updatedAt: {} as any,
        messageCount: 2,
      });

      const renameMock = vi.spyOn(firestoreService, 'renameSession').mockResolvedValue();

      const res = await request(app)
        .patch('/api/chat/sessions/session-rename')
        .set('Authorization', 'Bearer valid-token')
        .send({ title: 'Renamed Title' });

      expect(res.status).toBe(200);
      expect(res.body.title).toBe('Renamed Title');
      expect(renameMock).toHaveBeenCalledWith('session-rename', 'Renamed Title');
    });

    it('rejects title longer than 100 characters', async () => {
      const res = await request(app)
        .patch('/api/chat/sessions/session-rename')
        .set('Authorization', 'Bearer valid-token')
        .send({ title: 'B'.repeat(101) });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('cannot exceed 100 characters');
    });

    it('rejects renaming an unauthorized session with 403', async () => {
      vi.spyOn(firestoreService, 'getSession').mockResolvedValue({
        id: 'session-other',
        uid: 'other-user',
        title: 'Other Title',
        status: 'active',
        createdAt: {} as any,
        updatedAt: {} as any,
        messageCount: 2,
      });

      const res = await request(app)
        .patch('/api/chat/sessions/session-other')
        .set('Authorization', 'Bearer valid-token')
        .send({ title: 'Hacked Title' });

      expect(res.status).toBe(403);
    });

    it('deletes a session and cascading messages for the owner', async () => {
      vi.spyOn(firestoreService, 'getSession').mockResolvedValue({
        id: 'session-del',
        uid: 'test-user-1',
        title: 'To Delete',
        status: 'active',
        createdAt: {} as any,
        updatedAt: {} as any,
        messageCount: 3,
      });

      const deleteMock = vi.spyOn(firestoreService, 'deleteSessionAndMessages').mockResolvedValue();

      const res = await request(app)
        .delete('/api/chat/sessions/session-del')
        .set('Authorization', 'Bearer valid-token');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(deleteMock).toHaveBeenCalledWith('session-del');
    });

    it('rejects deleting someone else session with 403', async () => {
      vi.spyOn(firestoreService, 'getSession').mockResolvedValue({
        id: 'session-del-other',
        uid: 'other-user',
        title: 'Other User Session',
        status: 'active',
        createdAt: {} as any,
        updatedAt: {} as any,
        messageCount: 1,
      });

      const res = await request(app)
        .delete('/api/chat/sessions/session-del-other')
        .set('Authorization', 'Bearer valid-token');

      expect(res.status).toBe(403);
    });

    it('searches sessions passing query parameter', async () => {
      const mockList = vi.spyOn(firestoreService, 'listUserSessions').mockResolvedValue([
        {
          id: 'session-found',
          uid: 'test-user-1',
          title: 'Anxiety grounding',
          status: 'active',
          createdAt: {} as any,
          updatedAt: {} as any,
          messageCount: 4,
        },
      ]);

      const res = await request(app)
        .get('/api/chat/sessions?search=grounding')
        .set('Authorization', 'Bearer valid-token');

      expect(res.status).toBe(200);
      expect(res.body.sessions).toHaveLength(1);
      expect(mockList).toHaveBeenCalledWith('test-user-1', 'grounding');
    });

    it('rejects search query longer than 100 characters', async () => {
      const res = await request(app)
        .get(`/api/chat/sessions?search=${'c'.repeat(101)}`)
        .set('Authorization', 'Bearer valid-token');

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('search query cannot exceed 100 characters');
    });
  });

  describe('End Session & Summary Flow', () => {
    it('generates, saves, and returns end-of-session summary', async () => {
      vi.spyOn(firestoreService, 'getSession').mockResolvedValue({
        id: 'session-summary',
        uid: 'test-user-1',
        title: 'Work Stress',
        status: 'active',
        createdAt: {} as any,
        updatedAt: {} as any,
        messageCount: 2,
      });

      vi.spyOn(firestoreService, 'getAllMessages').mockResolvedValue([
        { role: 'user', text: 'I feel exhausted at work', createdAt: {} as any },
        { role: 'assistant', text: 'That sounds really heavy', createdAt: {} as any },
      ]);

      const mockSummary = {
        overview: 'Session focused on workplace burnout and boundary setting.',
        emotionalThemes: ['Burnout', 'Workplace fatigue'],
        strengths: ['Self-awareness'],
        copingSteps: ['Set work cutoff at 6pm', 'Paced breathing before meetings'],
        followUp: 'Consider speaking with a counselor if distress persists.',
        riskNote: 'This AI summary does not replace professional medical care.',
      };

      vi.spyOn(geminiService, 'generateSessionSummary').mockResolvedValue(mockSummary);
      const endMock = vi.spyOn(firestoreService, 'endSessionAndSaveSummary').mockResolvedValue({
        ...mockSummary,
        generatedAt: new Date() as any,
      });

      const res = await request(app)
        .post('/api/chat/sessions/session-summary/summary')
        .set('Authorization', 'Bearer valid-token');

      expect(res.status).toBe(200);
      expect(res.body.overview).toBe(mockSummary.overview);
      expect(res.body.copingSteps).toEqual(mockSummary.copingSteps);
      expect(endMock).toHaveBeenCalledWith('session-summary', mockSummary);
    });

    it('returns 502 with preserved transcript if Gemini summary generation fails', async () => {
      vi.spyOn(firestoreService, 'getSession').mockResolvedValue({
        id: 'session-summary-err',
        uid: 'test-user-1',
        title: 'Work Stress',
        status: 'active',
        createdAt: {} as any,
        updatedAt: {} as any,
        messageCount: 2,
      });

      vi.spyOn(firestoreService, 'getAllMessages').mockResolvedValue([
        { role: 'user', text: 'Hello', createdAt: {} as any },
      ]);

      vi.spyOn(geminiService, 'generateSessionSummary').mockRejectedValue(
        new Error('Gemini quota exceeded')
      );

      const res = await request(app)
        .post('/api/chat/sessions/session-summary-err/summary')
        .set('Authorization', 'Bearer valid-token');

      expect(res.status).toBe(502);
      expect(res.body.error).toContain('Failed to generate session summary');
    });
  });
});
