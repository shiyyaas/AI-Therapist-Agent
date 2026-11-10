import { Router, Response } from 'express';
import { AuthenticatedRequest, authenticateFirebaseUser } from '../middleware/auth.middleware.js';
import {
  getSession,
  createSession,
  listUserSessions,
  saveMessage,
  getLastMessages,
  getAllMessages,
  updateSessionMeta,
  syncUserDocument,
  renameSession,
  deleteSessionAndMessages,
  endSessionAndSaveSummary,
  getSessionSummary,
  updateSessionRiskLevel,
} from '../services/firestore.service.js';
import {
  generateTherapistResponse,
  generateSessionSummary,
} from '../services/gemini.service.js';
import {
  detectCrisisRisk,
  FIXED_CRISIS_RESPONSE,
} from '../safety/crisis-detector.js';
import { classifyCrisisWithGemini } from '../safety/gemini-classifier.js';

export const chatRouter = Router();

chatRouter.use(authenticateFirebaseUser);

// POST /api/chat - Send message and receive response (with crisis safety layer)
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

    // Safety Step 1: Deterministic keyword/regex detection
    const deterministicResult = detectCrisisRisk(trimmedMessage);

    // Safety Step 2: Gemini classification (with deterministic fallback)
    const classification = await classifyCrisisWithGemini(trimmedMessage, deterministicResult);

    const isCrisis =
      deterministicResult.riskLevel === 'crisis' || classification.riskLevel === 'crisis';

    // Log operational metadata only (NEVER raw crisis text)
    console.info('[CHAT_REQUEST]', {
      sessionId,
      riskLevel: isCrisis ? 'crisis' : classification.riskLevel,
      shownCrisisResources: isCrisis,
    });

    if (isCrisis) {
      const primaryCategory =
        classification.categories[0] ||
        deterministicResult.matchedCategories[0] ||
        'unspecified';

      // 1. Save user message with safety metadata
      await saveMessage(sessionId, 'user', trimmedMessage, {
        safetyFlag: true,
        crisisType: primaryCategory,
      });

      // 2. Update session doc riskLevel to crisis
      await updateSessionRiskLevel(sessionId, 'crisis');

      // 3. Save fixed safety response as assistant message
      await saveMessage(sessionId, 'assistant', FIXED_CRISIS_RESPONSE, {
        safetyFlag: true,
        crisisType: primaryCategory,
      });

      // 4. Update session message count & title if first message
      const shouldUpdateTitle = session.messageCount === 0 || session.title === 'New Chat';
      const newTitle = shouldUpdateTitle ? trimmedMessage : undefined;
      await updateSessionMeta(sessionId, 2, newTitle, 'crisis');

      // 5. Return fixed safety response
      res.status(200).json({
        role: 'assistant',
        text: FIXED_CRISIS_RESPONSE,
        safetyFlag: true,
        crisisType: primaryCategory,
        riskLevel: 'crisis',
        createdAt: new Date().toISOString(),
      });
      return;
    }

    // Safe path: save user message
    await saveMessage(sessionId, 'user', trimmedMessage, {
      safetyFlag: false,
      crisisType: null,
    });

    const shouldUpdateTitle = session.messageCount === 0 || session.title === 'New Chat';
    const newTitle = shouldUpdateTitle ? trimmedMessage : undefined;

    const contextMessages = await getLastMessages(sessionId, 20);

    let assistantText: string;
    try {
      assistantText = await generateTherapistResponse(contextMessages, trimmedMessage);
    } catch (geminiError: any) {
      console.error('[GEMINI_ERROR]', {
        sessionId,
        errorType: geminiError?.name || 'GenerationError',
      });
      res.status(502).json({
        error: 'The AI companion is currently unavailable. Your message was saved. Please try again.',
        details: geminiError?.message,
      });
      return;
    }

    await saveMessage(sessionId, 'assistant', assistantText, {
      safetyFlag: false,
      crisisType: null,
    });
    await updateSessionMeta(sessionId, 2, newTitle, classification.riskLevel);

    res.status(200).json({
      role: 'assistant',
      text: assistantText,
      safetyFlag: false,
      riskLevel: classification.riskLevel,
      createdAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('[SERVER_ERROR]', {
      sessionId,
      errorType: error?.name || 'InternalError',
    });
    res.status(500).json({
      error: 'An internal server error occurred while processing your message.',
      details: error?.message,
    });
  }
});

// POST /api/chat/sessions - Create session
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

// GET /api/chat/sessions?search=<query> - List sessions with optional search
chatRouter.get('/sessions', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const user = req.user!;
  const searchQuery = typeof req.query.search === 'string' ? req.query.search : undefined;

  try {
    const sessions = await listUserSessions(user.uid, searchQuery);
    res.status(200).json({ sessions });
  } catch (error: any) {
    res.status(500).json({
      error: 'Failed to retrieve sessions.',
      details: error?.message,
    });
  }
});

// PATCH /api/chat/sessions/:sessionId - Rename session
chatRouter.patch('/sessions/:sessionId', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const user = req.user!;
  const { sessionId } = req.params;
  const { title } = req.body || {};

  if (!title || typeof title !== 'string' || !title.trim()) {
    res.status(400).json({ error: 'Title is required and must be a non-empty string.' });
    return;
  }

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

    await renameSession(sessionId, title.trim());
    const updated = await getSession(sessionId);
    res.status(200).json(updated);
  } catch (error: any) {
    res.status(500).json({
      error: 'Failed to update session.',
      details: error?.message,
    });
  }
});

// DELETE /api/chat/sessions/:sessionId - Delete session and its messages
chatRouter.delete('/sessions/:sessionId', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
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

    await deleteSessionAndMessages(sessionId);
    res.status(200).json({ success: true, message: 'Session deleted successfully.' });
  } catch (error: any) {
    res.status(500).json({
      error: 'Failed to delete session.',
      details: error?.message,
    });
  }
});

// GET /api/chat/sessions/:sessionId/messages - List messages
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

// POST /api/chat/sessions/:sessionId/summary - End session & generate AI summary
chatRouter.post('/sessions/:sessionId/summary', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
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

    const transcript = await getAllMessages(sessionId);
    if (transcript.length === 0) {
      res.status(400).json({ error: 'Cannot summarize a session with no messages.' });
      return;
    }

    let summaryData;
    try {
      summaryData = await generateSessionSummary(transcript);
    } catch (summaryErr: any) {
      console.error('[SUMMARY_ERROR]', {
        sessionId,
        errorType: summaryErr?.name || 'SummaryGenError',
      });
      res.status(502).json({
        error: 'Failed to generate session summary. The transcript is preserved. You can try again.',
        details: summaryErr?.message,
      });
      return;
    }

    const savedSummary = await endSessionAndSaveSummary(sessionId, summaryData);
    res.status(200).json(savedSummary);
  } catch (error: any) {
    res.status(500).json({
      error: 'Failed to end session and generate summary.',
      details: error?.message,
    });
  }
});

// GET /api/chat/sessions/:sessionId/summary - Fetch existing summary
chatRouter.get('/sessions/:sessionId/summary', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
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

    const summary = await getSessionSummary(sessionId);
    if (!summary) {
      res.status(404).json({ error: 'Summary not found for this session.' });
      return;
    }

    res.status(200).json(summary);
  } catch (error: any) {
    res.status(500).json({
      error: 'Failed to retrieve session summary.',
      details: error?.message,
    });
  }
});
