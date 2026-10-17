import { Router } from 'express';
import { PaymentService } from './service';
import { authenticate } from '../../middleware/auth';
import { PaySessionSchema } from '@/contracts';

const router = Router();
const paymentService = new PaymentService();

/**
 * @route POST /api/payments/pay/:sessionId
 * @desc Pay for a session and close it.
 * @access Private (Customer or Staff)
 */
router.post('/pay/:sessionId', authenticate, async (req, res) => {
  try {
    const { sessionId } = req.params;
    if (!sessionId || typeof sessionId !== 'string') {
        return res.status(400).json({ error: 'Invalid sessionId' });
    }
    const body = PaySessionSchema.parse(req.body);

    const result = await paymentService.handleSessionPayment(
        sessionId,
        body.method,
        body.discountPercent
    );

    if (result.success) {
      res.json({ message: 'Payment successful', transactionId: result.transactionId });
    } else {
      res.status(400).json({ error: result.error });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
