import { Router } from 'express';
import { authenticate, requireRole } from '../../middleware/auth';
import { AppError } from '../../middleware/error';
import { CreateReservationSchema, Role, ReservationStatus, UpdateReservationStatusSchema } from '@/contracts';
import { reservationRepository } from './repository';
import { tableRepository } from '../tables/repository';
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

reservationsRouter.patch('/:id/status', requireRole([Role.ADMIN]), async (req, res, next) => {
  try {
    const data = UpdateReservationStatusSchema.parse(req.body);
    const reservation = await reservationRepository.findById(String(req.params.id));
    if (!reservation) throw new AppError('NOT_FOUND', 404, 'Reservation not found');
    if (data.status === ReservationStatus.PENDING && reservation.status !== ReservationStatus.PENDING) {
      throw new AppError('CONFLICT', 409, 'Invalid reservation transition');
    }
    const updated = await reservationRepository.updateStatus(reservation.id, data.status);
    await recordAudit({ actorUserId: req.user!.userId, action: 'RESERVATION_STATUS_CHANGED', entityType: 'RESERVATION', entityId: reservation.id, metadata: { status: data.status } });
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
