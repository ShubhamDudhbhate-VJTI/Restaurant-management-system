import { Router } from 'express';
import { authenticate, requireRole } from '../../middleware/auth';
import { Role, CreateFeedbackSchema } from '@/contracts';
import { feedbackService } from './service';

export const feedbackRouter = Router();

feedbackRouter.use(authenticate);

// POST /feedback
feedbackRouter.post('/', requireRole([Role.CUSTOMER]), async (req, res, next) => {
  try {
    const data = CreateFeedbackSchema.parse(req.body);
    const item = await feedbackService.createFeedback(req.user!.userId, data);
    res.status(201).json({ feedback: item });
  } catch (err) {
    next(err);
  }
});

// GET /feedback (Admin only)
feedbackRouter.get('/', requireRole([Role.ADMIN]), async (req, res, next) => {
  try {
    const { list, stats } = await feedbackService.getFeedbackStats();
    res.json({ feedback: list, stats });
  } catch (err) {
    next(err);
  }
});
