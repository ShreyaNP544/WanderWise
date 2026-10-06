import { Router } from 'express';
import { z } from 'zod';
import { preferencesSchema } from '../domain/schemas.js';
import { aiLimiter } from '../middleware/rateLimit.js';
import * as trips from '../services/tripService.js';

export const tripsRouter = Router();

const idSchema = z.string().regex(/^[A-Za-z0-9_-]{6,32}$/);
const modifySchema = z.union([
  z.object({ instruction: z.string().trim().min(3, 'Tell us what to change.').max(300) }),
  z.object({ optionId: z.string().trim().min(1).max(4) }),
]);

tripsRouter.post('/', aiLimiter, async (req, res) => {
  const prefs = preferencesSchema.parse(req.body?.preferences);
  res.status(201).json({ trip: await trips.generateTrip(prefs) });
});

// Must come before /:id
tripsRouter.post('/demo', async (req, res) => {
  res.status(201).json({ trip: await trips.createDemoTrip() });
});

tripsRouter.get('/:id', async (req, res) => {
  res.json({ trip: await trips.getTrip(idSchema.parse(req.params.id)) });
});

tripsRouter.post('/:id/modify', aiLimiter, async (req, res) => {
  const body = modifySchema.parse(req.body ?? {});
  res.json(await trips.modifyTrip(idSchema.parse(req.params.id), body));
});

tripsRouter.post('/:id/undo', async (req, res) => {
  res.json({ trip: await trips.undoTrip(idSchema.parse(req.params.id)) });
});

tripsRouter.post('/:id/dismiss-conflict', async (req, res) => {
  res.json({ trip: await trips.dismissConflict(idSchema.parse(req.params.id)) });
});
