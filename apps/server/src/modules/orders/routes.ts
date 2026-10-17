import { Router } from 'express';
import { authenticate, requireRole } from '../../middleware/auth';
import { AppError } from '../../middleware/error';
import { OrderStatus, SocketEvents, CreateOrderSchema, Role, UpdateOrderStatusSchema, canTransitionOrderStatus, PaySessionSchema, SessionCloseReason } from '@/contracts';
import { orderRepository } from './repository';
import { sessionRepository } from '../sessions/repository';
import { computeBill } from '../billing';
import { recordAudit } from '../audit/service';
import { PaymentService } from '../payments/service';

export const ordersRouter = Router();
const paymentService = new PaymentService();

ordersRouter.use(authenticate);

// ... (existing routes)

// POST /orders/me/pay
ordersRouter.post('/me/pay', async (req, res, next) => {
  try {
    const activeSession = await sessionRepository.findActiveByCustomerId(req.user!.userId);
    if (!activeSession) {
      throw new AppError('FORBIDDEN', 403, 'NO_ACTIVE_SESSION');
    }

    const data = PaySessionSchema.parse(req.body);

    // Use PaymentService to handle the workflow
    const result = await paymentService.handleSessionPayment(
      activeSession.id,
      data.method,
      0 // Customers don't apply their own discounts
    );

    if (result.success) {
      req.app.get('io')?.emit(SocketEvents.SESSION_UPDATED, { sessionId: activeSession.id, status: 'closed' });
      res.json({ message: 'Payment successful', transactionId: result.transactionId });
    } else {
      res.status(400).json({ error: result.error });
    }
  } catch (err) {
    next(err);
  }
});

// POST /orders
ordersRouter.post('/', async (req, res, next) => {
  try {
    const data = CreateOrderSchema.parse(req.body);
    const activeSession = req.user!.role === Role.WAITER && data.sessionId
      ? await sessionRepository.getById(data.sessionId)
      : await sessionRepository.findActiveByCustomerId(req.user!.userId);
    
    if (!activeSession || activeSession.status !== 'active') {
      throw new AppError('FORBIDDEN', 403, 'NO_ACTIVE_SESSION');
    }

    try {
      const order = await orderRepository.createOrderTransaction(activeSession.id, activeSession.customerId, data);
      req.app.get('io')?.emit(SocketEvents.ORDER_CREATED, { orderId: order.id });
      res.status(201).json({ order });
    } catch (e: any) {
      if (e.message.startsWith('ITEM_UNAVAILABLE')) {
        throw new AppError('CONFLICT', 409, 'ITEM_UNAVAILABLE');
      }
      throw e;
    }
  } catch (err) {
    next(err);
  }
});

// GET /orders/me
ordersRouter.get('/me', async (req, res, next) => {
  try {
    const activeSession = await sessionRepository.findActiveByCustomerId(req.user!.userId);
    if (!activeSession) {
      return res.json({ orders: [] });
    }

    const orders = await orderRepository.getOrdersBySession(activeSession.id);
    res.json({ orders });
  } catch (err) {
    next(err);
  }
});

// GET /orders/me/bill
ordersRouter.get('/me/bill', async (req, res, next) => {
  try {
    const activeSession = await sessionRepository.findActiveByCustomerId(req.user!.userId);
    if (!activeSession) {
      throw new AppError('FORBIDDEN', 403, 'NO_ACTIVE_SESSION');
    }

    const bill = await computeBill(activeSession.id);
    res.json({ bill });
  } catch (err) {
    next(err);
  }
});

// GET /orders/history
ordersRouter.get('/history', async (req, res, next) => {
  try {
    const orders = await orderRepository.getOrdersByCustomerId(req.user!.userId);
    res.json({ orders });
  } catch (err) {
    next(err);
  }
});

// POST /orders/:id/cancel
ordersRouter.post('/:id/cancel', async (req, res, next) => {
  try {
    const orderId = req.params.id as string;
    const order = await orderRepository.getOrderById(orderId);
    if (!order) {
      throw new AppError('NOT_FOUND', 404, 'Order not found');
    }

    // Role-based cancellation logic
    const isCustomer = req.user!.role === Role.CUSTOMER;
    const isKitchen = req.user!.role === Role.KITCHEN;
    const isAdmin = req.user!.role === Role.ADMIN;

    if (isCustomer) {
      if (order.customerId !== req.user!.userId) {
        throw new AppError('FORBIDDEN', 403, 'Cannot cancel another customer order');
      }
      if (order.status !== OrderStatus.PLACED) {
        throw new AppError('CONFLICT', 409, 'Order is already being prepared and cannot be cancelled by customer');
      }
    } else if (isKitchen) {
       if (order.status !== OrderStatus.PLACED && order.status !== OrderStatus.PREPARING) {
         throw new AppError('CONFLICT', 409, 'Kitchen can only cancel orders that are placed or preparing');
       }
    } else if (!isAdmin) {
      throw new AppError('FORBIDDEN', 403, 'Insufficient permissions to cancel order');
    }

    const updated = await orderRepository.cancelOrder(order.id);
    await recordAudit({ actorUserId: req.user!.userId, action: 'ORDER_CANCELLED', entityType: 'ORDER', entityId: order.id });
    req.app.get('io')?.emit(SocketEvents.ORDER_STATUS_CHANGED, { orderId: order.id, status: updated.status });
    res.json({ order: updated });
  } catch (err) {
    next(err);
  }
});

// GET /orders (Kitchen & Admin)
ordersRouter.get('/', requireRole([Role.KITCHEN, Role.ADMIN, Role.WAITER]), async (req, res, next) => {
  try {
    const orders = await orderRepository.getActiveOrders();
    res.json({ orders });
  } catch (err) {
    next(err);
  }
});

// PATCH /orders/:id/status (Kitchen, Waiter, Runner & Admin)
ordersRouter.patch('/:id/status', requireRole([Role.KITCHEN, Role.ADMIN, Role.WAITER, Role.RUNNER]), async (req, res, next) => {
  try {
    const data = UpdateOrderStatusSchema.parse(req.body);
    const orderId = req.params.id as string;
    const order = await orderRepository.getOrderById(orderId);
    if (!order) {
      throw new AppError('NOT_FOUND', 404, 'Order not found');
    }

    if (!canTransitionOrderStatus(order.status, data.status)) {
      throw new AppError('CONFLICT', 409, `Invalid status transition from ${order.status} to ${data.status}`);
    }

    // Role-based restrictions on transitions
    if (data.status === OrderStatus.SERVED && ![Role.WAITER, Role.RUNNER, Role.ADMIN, Role.KITCHEN].includes(req.user!.role)) {
      throw new AppError('FORBIDDEN', 403, 'Only staff can mark orders as served');
    }

    if ([OrderStatus.PREPARING, OrderStatus.READY].includes(data.status) && ![Role.KITCHEN, Role.ADMIN].includes(req.user!.role)) {
      throw new AppError('FORBIDDEN', 403, 'Only kitchen staff can update preparation status');
    }

    const updated = await orderRepository.updateOrderStatus(order.id, data.status);
    await recordAudit({ actorUserId: req.user!.userId, action: 'ORDER_STATUS_CHANGED', entityType: 'ORDER', entityId: order.id, metadata: { status: data.status } });
    req.app.get('io')?.emit(SocketEvents.ORDER_STATUS_CHANGED, { orderId: order.id, status: updated.status });
    res.json({ order: updated });
  } catch (err) {
    next(err);
  }
});
