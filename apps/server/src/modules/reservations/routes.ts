import { Router } from 'express';
import { authenticate, requireRole } from '../../middleware/auth';
import { AppError } from '../../middleware/error';
import { CreateReservationSchema, Role, ReservationStatus, UpdateReservationStatusSchema, TableStatus, SocketEvents } from '@/contracts';
import { reservationRepository } from './repository';
import { tableRepository } from '../tables/repository';
import { sessionRepository } from '../sessions/repository';
import { recordAudit } from '../audit/service';

export const reservationsRouter = Router();
reservationsRouter.use(authenticate);

reservationsRouter.get('/', async (req, res, next) => {
  try {
    const reservations = req.user!.role === Role.CUSTOMER
      ? await reservationRepository.findForCustomer(req.user!.userId)
      : await reservationRepository.findForDate(typeof req.query.date === 'string'
        ? req.query.date
        : new Date().toISOString().slice(0, 10));
    res.json({ reservations });
  } catch (error) {
    next(error);
  }
});

reservationsRouter.post('/', requireRole([Role.CUSTOMER]), async (req, res, next) => {
  try {
    const data = CreateReservationSchema.parse(req.body);
    const table = await tableRepository.findById(data.tableId);
    if (!table) throw new AppError('NOT_FOUND', 404, 'Table not found');
    if (data.guestCount > table.seats) throw new AppError('CONFLICT', 409, 'Guest count exceeds table capacity');

    try {
      const reservation = await reservationRepository.create(req.user!.userId, data);
      await recordAudit({ actorUserId: req.user!.userId, action: 'RESERVATION_CREATED', entityType: 'RESERVATION', entityId: reservation.id, metadata: { tableId: data.tableId, reservationDate: data.reservationDate } });
      res.status(201).json({ reservation });
    } catch (error) {
      if (error instanceof Error && error.message === 'INVALID_TIME_RANGE') {
        throw new AppError('VALIDATION_ERROR', 400, 'End time must be after start time');
      }
      if (error instanceof Error && error.message === 'TABLE_ALREADY_RESERVED') {
        throw new AppError('CONFLICT', 409, 'Table is already reserved for that time');
      }
      throw error;
    }
  } catch (error) {
    next(error);
  }
});

reservationsRouter.patch('/:id/status', requireRole([Role.ADMIN, Role.WAITER]), async (req, res, next) => {
  try {
    const data = UpdateReservationStatusSchema.parse(req.body);
    const reservation = await reservationRepository.findById(String(req.params.id));
    if (!reservation) throw new AppError('NOT_FOUND', 404, 'Reservation not found');

    // Validate transition
    if (data.status === ReservationStatus.SEATED) {
      if (reservation.status !== ReservationStatus.CONFIRMED && reservation.status !== ReservationStatus.PENDING) {
        throw new AppError('CONFLICT', 409, 'Only confirmed or pending reservations can be seated');
      }

      // Check if table is available
      const table = await tableRepository.findById(reservation.tableId);
      if (!table || table.status !== TableStatus.AVAILABLE) {
        throw new AppError('CONFLICT', 409, 'Table is not available for seating');
      }

      // Check if customer already has an active session
      const existingSession = await sessionRepository.findActiveByCustomerId(reservation.customerId);
      if (existingSession) {
        throw new AppError('CONFLICT', 409, 'Customer already has an active session');
      }

      // Perform seating: Create session and update reservation status
      // Note: sessionRepository.createSessionTransaction updates the table status to OCCUPIED
      const session = await sessionRepository.createSessionTransaction(reservation.tableId, reservation.customerId, reservation.id);
      const updated = await reservationRepository.updateStatus(reservation.id, ReservationStatus.SEATED);

      await recordAudit({
        actorUserId: req.user!.userId,
        action: 'RESERVATION_SEATED',
        entityType: 'RESERVATION',
        entityId: reservation.id,
        metadata: { sessionId: session.id, tableId: reservation.tableId }
      });

      req.app.get('io')?.emit(SocketEvents.TABLE_UPDATED, { tableId: reservation.tableId, status: TableStatus.OCCUPIED });

      return res.json({ reservation: updated, session });
    }

    if (data.status === ReservationStatus.PENDING && reservation.status !== ReservationStatus.PENDING) {
      throw new AppError('CONFLICT', 409, 'Invalid reservation transition');
    }

    const updated = await reservationRepository.updateStatus(reservation.id, data.status);
    await recordAudit({ actorUserId: req.user!.userId, action: 'RESERVATION_STATUS_CHANGED', entityType: 'RESERVATION', entityId: reservation.id, metadata: { status: data.status } });

    // If completed, ensure table is available?
    // Usually a reservation is COMPLETED when the session ends.

    res.json({ reservation: updated });
  } catch (error) {
    next(error);
  }
});

reservationsRouter.post('/:id/cancel', async (req, res, next) => {
  try {
    const reservation = await reservationRepository.findById(String(req.params.id));
    if (!reservation) throw new AppError('NOT_FOUND', 404, 'Reservation not found');
    if (reservation.customerId !== req.user!.userId && req.user!.role !== Role.ADMIN) {
      throw new AppError('FORBIDDEN', 403, 'Cannot cancel this reservation');
    }
    if (reservation.status === ReservationStatus.SEATED || reservation.status === ReservationStatus.COMPLETED) {
      throw new AppError('CONFLICT', 409, 'Reservation can no longer be cancelled');
    }
    const updated = await reservationRepository.updateStatus(reservation.id, ReservationStatus.CANCELLED);
    await recordAudit({ actorUserId: req.user!.userId, action: 'RESERVATION_CANCELLED', entityType: 'RESERVATION', entityId: reservation.id });
    res.json({ reservation: updated });
  } catch (error) {
    next(error);
  }
});
