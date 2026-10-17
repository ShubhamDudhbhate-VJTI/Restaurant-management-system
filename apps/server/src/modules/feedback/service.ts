import { Role, CreateFeedbackInput } from '@/contracts';
import { feedbackRepository } from './repository';
import { sessionRepository } from '../sessions/repository';
import { AppError } from '../../middleware/error';

export class FeedbackService {
  async createFeedback(customerId: string, data: CreateFeedbackInput) {
    // Check if session belongs to customer and is closed
    const session = await sessionRepository.getById(data.sessionId);
    if (!session || session.customerId !== customerId) {
      throw new AppError('FORBIDDEN', 403, 'Session not found or not yours');
    }

    if (session.status !== 'closed') {
      throw new AppError('CONFLICT', 409, 'Feedback can only be submitted after payment');
    }

    // Check if feedback already exists
    const existing = await feedbackRepository.getBySession(data.sessionId);
    if (existing) {
      throw new AppError('CONFLICT', 409, 'Feedback already submitted for this session');
    }

    return feedbackRepository.create(customerId, data);
  }

  async getFeedbackStats() {
    const list = await feedbackRepository.getAllDetailed();
    const stats = await feedbackRepository.getStats();
    return { list, stats };
  }
}

export const feedbackService = new FeedbackService();
