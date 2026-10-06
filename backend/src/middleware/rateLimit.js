import rateLimit from 'express-rate-limit';

function limiter(limit) {
  return rateLimit({
    windowMs: 60_000,
    limit,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    handler: (req, res) =>
      res.status(429).json({
        error: { code: 'RATE_LIMITED', message: 'Too many requests. Please wait a minute and try again.', retryable: true },
      }),
  });
}

export const apiLimiter = limiter(120);
// AI calls are slow and quota-limited, so they get a much tighter budget.
export const aiLimiter = limiter(12);
