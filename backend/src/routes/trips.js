import { Router } from 'express';
import { preferencesSchema } from '../domain/schemas.js';
import { AppError } from '../middleware/errors.js';
import { aiLimiter } from '../middleware/rateLimit.js';

export const tripsRouter = Router();

tripsRouter.post('/', aiLimiter, (req, res) => {
  // Validate now so the form contract is already enforced end-to-end.
  preferencesSchema.parse(req.body?.preferences);
  throw new AppError(501, 'NOT_IMPLEMENTED', 'Your details look good! Gemma trip planning is being connected next.');
});
