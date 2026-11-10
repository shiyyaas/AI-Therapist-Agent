import { describe, it, expect, vi } from 'vitest';
import { authenticateFirebaseUser, AuthenticatedRequest } from './auth.middleware.js';
import * as firebaseAdminConfig from '../config/firebase-admin.js';

describe('Auth Middleware', () => {
  it('returns 401 when Authorization header is missing', async () => {
    const req = { headers: {} } as any;
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    } as any;
    const next = vi.fn();

    await authenticateFirebaseUser(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.stringContaining('Missing or malformed') }));
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 when Authorization header does not start with Bearer', async () => {
    const req = { headers: { authorization: 'Basic 12345' } } as any;
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    } as any;
    const next = vi.fn();

    await authenticateFirebaseUser(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('attaches user to request and calls next when token is valid', async () => {
    const mockVerifyIdToken = vi.fn().mockResolvedValue({
      uid: 'user-123',
      email: 'user@example.com',
      firebase: { sign_in_provider: 'password' },
    });

    vi.spyOn(firebaseAdminConfig, 'adminAuth', 'get').mockReturnValue({
      verifyIdToken: mockVerifyIdToken,
    } as any);

    const req = { headers: { authorization: 'Bearer valid-token-abc' } } as AuthenticatedRequest;
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    } as any;
    const next = vi.fn();

    await authenticateFirebaseUser(req, res, next);

    expect(req.user).toEqual({
      uid: 'user-123',
      email: 'user@example.com',
      isAnonymous: false,
    });
    expect(next).toHaveBeenCalledTimes(1);
  });
});
