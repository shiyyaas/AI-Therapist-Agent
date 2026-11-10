import { Router, Response } from 'express';
import { AuthenticatedRequest, authenticateFirebaseUser } from '../middleware/auth.middleware.js';
import {
  getSession,
  createSession,
  listUserSessions,
  saveMessage,
  getLastMessages,
  updateSessionMeta,
  syncUserDocument,
} from '../services/firestore.service.js';
import { generateTherapistResponse } from '../services/gemini.service.js';

export const chatRouter = Router();

chatRouter.use(authenticateFirebaseUser);

chatRouter.post('/', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const user = req.user!;
  const { sessionId, message } = req.body;

  if (!sessionId || typeof sessionId !== 'string') {
    res.status(400).json({ error: 'Validation error: sessionId is required and must be a string.' });
    return;
  }

  if (!message || typeof message !== 'string' || !message.trim()) {
    res.status(400).json({ error: 'Validation error: message is required and cannot be empty.' });
    return;
  }

  const trimmedMessage = message.trim();

  try {
    const session = await getSession(sessionId);

    if (!session) {
      res.status(404).json({ error: 'Session not found.' });
      return;
    }

    if (session.uid !== user.uid) {
      res.status(403).json({ error: 'Forbidden: You do not have access to this session.' });
      return;
    }

    await saveMessage(sessionId, 'user', trimmedMessage);

    const shouldUpdateTitle = session.messageCount === 0 || session.title === 'New Chat';
    const newTitle = shouldUpdateTitle ? trimmedMessage : undefined;

    const contextMessages = await getLastMessages(sessionId, 20);

    let assistantText: string;
    try {
      assistantText = await generateTherapistResponse(contextMessages, trimmedMessage);
    } catch (geminiError: any) {
      res.status(502).json({
        error: 'The AI companion is currently unavailable. Your message was saved. Please try again.',
        details: geminiError?.message,
      });
      return;
    }

    await saveMessage(sessionId, 'assistant', assistantText);
    await updateSessionMeta(sessionId, 2, newTitle);

    res.status(200).json({
      role: 'assistant',
      text: assistantText,
      createdAt: new Date().toISOString(),
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'An internal server error occurred while processing your message.',
      details: error?.message,
    });
  }
});

chatRouter.post('/sessions', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const user = req.user!;
  const { title } = req.body || {};

  try {
    await syncUserDocument(user.uid, user.email, user.isAnonymous);
    const sessionId = await createSession(user.uid, title || 'New Chat');
    const session = await getSession(sessionId);
    res.status(201).json(session);
  } catch (error: any) {
    res.status(500).json({
      error: 'Failed to create session.',
      details: error?.message,
    });
  }
});

chatRouter.get('/sessions', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const user = req.user!;

  try {
    const sessions = await listUserSessions(user.uid);
    res.status(200).json({ sessions });
  } catch (error: any) {
    res.status(500).json({
      error: 'Failed to retrieve sessions.',
      details: error?.message,
    });
  }
});

chatRouter.get('/sessions/:sessionId/messages', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const user = req.user!;
  const { sessionId } = req.params;

  try {
    const session = await getSession(sessionId);
    if (!session) {
      res.status(404).json({ error: 'Session not found.' });
      return;
    }

    if (session.uid !== user.uid) {
      res.status(403).json({ error: 'Forbidden: You do not have access to this session.' });
      return;
    }

    const messages = await getLastMessages(sessionId, 100);
    res.status(200).json({ messages });
  } catch (error: any) {
    res.status(500).json({
      error: 'Failed to retrieve messages.',
      details: error?.message,
    });
  }
});
