import { Router, Request, Response, NextFunction } from 'express';
import { authenticate, requireRole } from '../../middleware/auth';
import { Role, SessionStatus, SocketEvents, SessionCloseReason, PaySessionSchema, PaymentMethod, TableStatus } from '@/contracts';
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

// POST /sessions/request-bill
// Transition table to BILLING status
sessionsRouter.post('/request-bill', requireRole([Role.CUSTOMER, Role.WAITER, Role.ADMIN]), async (req: Request, res: Response, next: NextFunction) => {
  try {
    let session;
    if (req.user!.role === Role.CUSTOMER) {
      session = await sessionRepository.findActiveByCustomerId(req.user!.userId);
    } else {
      const { sessionId, tableId } = req.body;
      if (sessionId) {
        session = await sessionRepository.getById(sessionId);
      } else if (tableId) {
        const activeSessions = await sessionRepository.getActiveSessions();
        session = activeSessions.find(s => s.tableId === tableId);
      }
    }

    if (!session || session.status !== SessionStatus.ACTIVE) {
      throw new AppError('NOT_FOUND', 404, 'No active session found for this request');
    }

    const table = await tableRepository.updateStatus(session.tableId, TableStatus.BILLING);
    req.app.get('io')?.emit(SocketEvents.TABLE_UPDATED, { table });
    req.app.get('io')?.emit(SocketEvents.SESSION_UPDATED, { sessionId: session.id, status: session.status });

    res.json({ message: 'Bill requested', tableStatus: table.status });
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

// GET /sessions/:id/orders
sessionsRouter.get('/:id/orders', requireRole([Role.WAITER, Role.CASHIER, Role.ADMIN]), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orders = await orderRepository.getOrdersBySession(req.params.id as string);
    res.json({ orders });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /sessions
 * Staff seating a walk-in customer
 */
sessionsRouter.post('/', requireRole([Role.WAITER, Role.CASHIER, Role.ADMIN]), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { tableId, customerId } = req.body;
    if (!tableId || !customerId) {
        throw new AppError('VALIDATION_ERROR', 400, 'Table ID and Customer ID are required');
    }

    const table = await tableRepository.findById(tableId);
    if (!table || table.status !== TableStatus.AVAILABLE) {
        throw new AppError('CONFLICT', 409, 'Table is not available');
    }

    const session = await sessionRepository.createSessionTransaction(tableId, customerId);
    const updatedTable = await tableRepository.findById(tableId);

    // Broadcast update
    if (updatedTable) {
      req.app.get('io')?.emit(SocketEvents.TABLE_UPDATED, { table: updatedTable });
    }

    res.status(201).json({ session });
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

  const updatedTable = await tableRepository.findById(session.tableId);

  await recordAudit({
    actorUserId: req.user!.userId,
    action: closeReason === SessionCloseReason.PAID ? 'PAYMENT_RECORDED' : 'SESSION_FORCE_CLOSED',
    entityType: 'SESSION',
    entityId: session.id,
    metadata: { paymentMethod, discountPercent, totalCents: bill.totalCents },
  });

  req.app.get('io')?.emit(SocketEvents.SESSION_UPDATED, { sessionId: session.id, status: SessionStatus.CLOSED });
  if (updatedTable) {
    req.app.get('io')?.emit(SocketEvents.TABLE_UPDATED, { table: updatedTable });
  }

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
