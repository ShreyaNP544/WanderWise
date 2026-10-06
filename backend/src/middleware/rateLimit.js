import rateLimit from 'express-rate-limit';

function limiter(limit, { skipFailedRequests = false } = {}) {
  return rateLimit({
    windowMs: 60_000,
    limit,
    skipFailedRequests,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    handler: (req, res) =>
      res.status(429).json({
        error: { code: 'RATE_LIMITED', message: 'Too many requests. Please wait a minute and try again.', retryable: true },
      }),
  });
}

export const apiLimiter = limiter(400);
// AI calls are slow and quota-limited, so they get a much tighter budget.
// Rejected requests (typos, validation errors) don't count: they never reach Gemma.
export const aiLimiter = limiter(12, { skipFailedRequests: true });
