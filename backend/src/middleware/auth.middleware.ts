import { Request, Response, NextFunction } from 'express';
import { adminAuth } from '../config/firebase-admin.js';

export interface AuthenticatedRequest extends Request {
  user?: {
    uid: string;
    email?: string | null;
    isAnonymous?: boolean;
  };
}

export async function authenticateFirebaseUser(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      error: 'Unauthorized: Missing or malformed Authorization header.',
    });
    return;
  }

  const idToken = authHeader.split('Bearer ')[1].trim();

  if (!idToken) {
    res.status(401).json({
      error: 'Unauthorized: Empty token provided.',
    });
    return;
  }

  try {
    if (!adminAuth) {
      throw new Error('Firebase Admin Auth is not initialized.');
    }
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email || null,
      isAnonymous: decodedToken.firebase?.sign_in_provider === 'anonymous',
    };
    next();
  } catch {
    res.status(401).json({
      error: 'Unauthorized: Invalid or expired Firebase ID token.',
    });
  }
}
