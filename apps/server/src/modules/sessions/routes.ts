import { Router, Request, Response, NextFunction } from 'express';
import { authenticate, requireRole } from '../../middleware/auth';
import { Role, SessionStatus, SocketEvents, SessionCloseReason, PaySessionSchema, PaymentMethod } from '@/contracts';
import { sessionRepository } from './repository';
import { tableRepository } from '../tables/repository';
import { orderRepository } from '../orders/repository';
import { computeBill } from '../billing';
import { AppError } from '../../middleware/error';
import { recordAudit } from '../audit/service';

export const sessionsRouter = Router();

sessionsRouter.use(authenticate);

// GET /sessions/me
sessionsRouter.get('/me', requireRole([Role.CUSTOMER]), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const session = await sessionRepository.findActiveByCustomerId(req.user!.userId);
    res.json({ session });
  } catch (err) {
    next(err);
  }
});

// POST /sessions/:id/cancel
sessionsRouter.post('/:id/cancel', requireRole([Role.CUSTOMER]), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const session = await sessionRepository.getById(req.params.id as string);
    if (!session || session.status !== SessionStatus.ACTIVE || session.customerId !== req.user!.userId) {
      throw new AppError('NOT_FOUND', 404, 'Active customer session not found');
    }

    const orders = await orderRepository.getOrdersBySession(session.id);
    const hasStartedOrder = orders.some((order) => order.status !== 'cancelled');
    if (hasStartedOrder) {
      throw new AppError('CONFLICT', 409, 'This table cannot be cancelled after an order has been placed');
    }

    const bill = await computeBill(session.id, 0);
    const updatedSession = await sessionRepository.closeSessionTransaction(session.id, {
      closeReason: SessionCloseReason.CANCELLED,
      paymentMethod: null,
      discountPercent: 0,
      ...bill
    });
    await recordAudit({
      actorUserId: req.user!.userId,
      action: 'SESSION_CANCELLED',
      entityType: 'SESSION',
      entityId: session.id,
      metadata: { tableId: session.tableId }
    });
    req.app.get('io')?.emit(SocketEvents.SESSION_UPDATED, { sessionId: session.id, status: SessionStatus.CLOSED });
    res.json({ session: updatedSession });
  } catch (err) {
    next(err);
  }
});

// GET /sessions
sessionsRouter.get('/', requireRole([Role.CASHIER, Role.ADMIN, Role.WAITER]), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const activeSessions = await sessionRepository.getActiveSessions();
    const result = [];
    for (const session of activeSessions) {
      const table = await tableRepository.findById(session.tableId);
      const orders = await orderRepository.getOrdersBySession(session.id);
      let unservedCount = 0;
      for (const order of orders) {
        if (order.status !== 'served' && order.status !== 'cancelled') {
          unservedCount++;
        }
      }
      const bill = await computeBill(session.id, session.discountPercent || 0);
      result.push({
        ...session,
        tableName: table?.name || 'Unknown',
        unservedCount,
        bill
      });
    }
    res.json({ sessions: result });
  } catch (err) {
    next(err);
  }
});

async function handleCloseSession(req: Request, res: Response, closeReason: SessionCloseReason, paymentMethod?: PaymentMethod, discountPercent = 0) {
  const sessionId = req.params.id as string;
  const session = await sessionRepository.getById(sessionId);
  if (!session || session.status !== SessionStatus.ACTIVE) {
    throw new AppError('NOT_FOUND', 404, 'Active session not found');
  }

  const bill = await computeBill(session.id, paymentMethod ? discountPercent : 0);
  const updatedSession = await sessionRepository.closeSessionTransaction(session.id, {
    closeReason,
    paymentMethod,
    discountPercent,
    ...bill
  });
  await recordAudit({
    actorUserId: req.user!.userId,
    action: closeReason === SessionCloseReason.PAID ? 'PAYMENT_RECORDED' : 'SESSION_FORCE_CLOSED',
    entityType: 'SESSION',
    entityId: session.id,
    metadata: { paymentMethod, discountPercent, totalCents: bill.totalCents },
  });

  req.app.get('io')?.emit(SocketEvents.SESSION_UPDATED, { sessionId: session.id, status: SessionStatus.CLOSED });

  res.json({ session: updatedSession });
}

// POST /sessions/:id/pay
sessionsRouter.post('/:id/pay', requireRole([Role.CASHIER, Role.ADMIN]), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = PaySessionSchema.parse(req.body);
    await handleCloseSession(req, res, SessionCloseReason.PAID, data.method, data.discountPercent);
  } catch (err) {
    next(err);
  }
});

// POST /sessions/:id/force-close
sessionsRouter.post('/:id/force-close', requireRole([Role.CASHIER, Role.ADMIN]), async (req: Request, res: Response, next: NextFunction) => {
  try {
    await handleCloseSession(req, res, SessionCloseReason.FORCE_CLOSED);
  } catch (err) {
    next(err);
  }
});
