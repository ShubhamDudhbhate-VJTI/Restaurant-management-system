import { Router } from 'express';
import { authenticate, requireRole } from '../../middleware/auth';
import { AppError } from '../../middleware/error';
import { CreateFeedbackSchema, Role, SessionStatus } from '@/contracts';
import { feedbackRepository } from './repository';
import { sessionRepository } from '../sessions/repository';

export const feedbackRouter = Router();
feedbackRouter.use(authenticate);

feedbackRouter.get('/', requireRole([Role.ADMIN]), async (_req, res, next) => {
  try {
    res.json({ feedback: await feedbackRepository.list() });
  } catch (error) {
    next(error);
  }
});

feedbackRouter.post('/', requireRole([Role.CUSTOMER]), async (req, res, next) => {
  try {
    const data = CreateFeedbackSchema.parse(req.body);
    const session = await sessionRepository.getById(data.sessionId);
    if (!session || session.status !== SessionStatus.CLOSED || session.customerId !== req.user!.userId) {
      throw new AppError('FORBIDDEN', 403, 'Feedback is only available for your completed session');
    }
    if (await feedbackRepository.findBySession(data.sessionId)) {
      throw new AppError('CONFLICT', 409, 'Feedback has already been submitted');
    }
    res.status(201).json({ feedback: await feedbackRepository.create(req.user!.userId, data) });
  } catch (error) {
    next(error);
  }
});
