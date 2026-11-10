import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth.middleware.js';

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

export function createRateLimiter(options: {
  windowMs: number;
  maxRequests: number;
  message?: string;
  keyGenerator?: (req: Request) => string;
}) {
  const hits = new Map<string, RateLimitRecord>();

  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of hits.entries()) {
      if (record.resetAt <= now) {
        hits.delete(key);
      }
    }
  }, 60000).unref();

  return (req: Request, res: Response, next: NextFunction): void => {
    const key = options.keyGenerator
      ? options.keyGenerator(req)
      : (req as AuthenticatedRequest).user?.uid || req.ip || 'global';

    const now = Date.now();
    let record = hits.get(key);

    if (!record || record.resetAt <= now) {
      record = {
        count: 1,
        resetAt: now + options.windowMs,
      };
      hits.set(key, record);
    } else {
      record.count += 1;
    }

    const remaining = Math.max(0, options.maxRequests - record.count);
    const retryAfterSeconds = Math.ceil((record.resetAt - now) / 1000);

    res.setHeader('X-RateLimit-Limit', options.maxRequests);
    res.setHeader('X-RateLimit-Remaining', remaining);
    res.setHeader('X-RateLimit-Reset', Math.ceil(record.resetAt / 1000));

    if (record.count > options.maxRequests) {
      res.setHeader('Retry-After', retryAfterSeconds);
      res.status(429).json({
        error:
          options.message ||
          'Too many requests. Please pause a moment before trying again.',
        retryAfter: retryAfterSeconds,
      });
      return;
    }

    next();
  };
}

// Limits chat messages: max 30 messages per minute per user/IP
export const chatRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 30,
  message: 'Chat rate limit reached. Please wait a moment before sending another message.',
});

// Limits summary generation: max 5 summaries per 5 minutes per user
export const summaryRateLimiter = createRateLimiter({
  windowMs: 5 * 60 * 1000,
  maxRequests: 5,
  message: 'Session summary rate limit reached. Please wait before requesting another summary.',
});
