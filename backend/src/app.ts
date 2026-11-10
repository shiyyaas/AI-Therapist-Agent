import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import { chatRouter } from './routes/chat.routes.js';

export function createApp(): Express {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get('/health', (_req: Request, res: Response) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  app.use('/api/chat', chatRouter);

  app.use((_req: Request, res: Response) => {
    res.status(404).json({ error: 'Endpoint not found.' });
  });

  return app;
}

export const app = createApp();
