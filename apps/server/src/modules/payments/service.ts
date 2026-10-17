import { sessionRepository } from '../sessions/repository';
import { computeBill } from '../billing/index';
import { SessionCloseReason, PaymentMethod } from '@/contracts';

export class PaymentService {
  /**
   * Simulates a payment gateway transaction.
   * Returns true if payment "succeeds".
   */
  async processDummyPayment(sessionId: string, amount: number): Promise<{ success: boolean; transactionId: string }> {
    console.log(`[PAYMENT] Initiating payment for session ${sessionId} of amount ${amount / 100} units...`);

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // For dummy logic: Any payment where amount > 0 is "successful"
    const success = amount > 0;
    const transactionId = `TXN_${Math.random().toString(36).substring(7).toUpperCase()}`;

    if (success) {
      console.log(`[PAYMENT] Success! Transaction ID: ${transactionId}`);
    } else {
      console.log(`[PAYMENT] Payment failed.`);
    }

    return { success, transactionId };
  }

  /**
   * Handles the workflow of paying a bill and closing the session.
   */
  async handleSessionPayment(sessionId: string, paymentMethod: PaymentMethod, discountPercent: number = 0) {
    const session = await sessionRepository.getById(sessionId);
    if (!session) throw new Error('Session not found');
    if (session.status === 'closed') throw new Error('Session already closed');

    const bill = await computeBill(sessionId, discountPercent);

    const result = await this.processDummyPayment(sessionId, bill.totalCents);

    if (result.success) {
      // Close the session via transaction
      await sessionRepository.closeSessionTransaction(sessionId, {
          closeReason: SessionCloseReason.PAID,
          paymentMethod: paymentMethod,
          subtotalCents: bill.subtotalCents,
          cgstCents: bill.cgstCents,
          sgstCents: bill.sgstCents,
          totalCents: bill.totalCents,
          discountCents: bill.discountCents,
          discountPercent: discountPercent,
          transactionId: result.transactionId
      });

      return { success: true, transactionId: result.transactionId };
    }

    return { success: false, error: 'Payment failed' };
  }
}
