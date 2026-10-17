import { reservationRepository } from './repository';
import { tableRepository } from '../tables/repository';
import { sessionRepository } from '../sessions/repository';
import { recordAudit } from '../audit/service';
import { AppError } from '../../middleware/error';
import {
  CreateReservationInput,
  ReservationStatus,
  TableStatus,
  Role
} from '@/contracts';

export class ReservationService {
  async getReservations(userId: string, role: Role, date?: string) {
    if (role === Role.CUSTOMER) {
      return reservationRepository.findForCustomer(userId);
    }
    const targetDate = date || new Date().toISOString().slice(0, 10);
    return reservationRepository.findForDate(targetDate);
  }

  async createReservation(userId: string, data: CreateReservationInput) {
    const table = await tableRepository.findById(data.tableId);
    if (!table) throw new AppError('NOT_FOUND', 404, 'Table not found');
    if (data.guestCount > table.seats) {
      throw new AppError('CONFLICT', 409, 'Guest count exceeds table capacity');
    }

    try {
      const reservation = await reservationRepository.create(userId, data);
      await recordAudit({
        actorUserId: userId,
        action: 'RESERVATION_CREATED',
        entityType: 'RESERVATION',
        entityId: reservation.id,
        metadata: { tableId: data.tableId, reservationDate: data.reservationDate }
      });
      return reservation;
    } catch (error) {
      if (error instanceof Error && error.message === 'INVALID_TIME_RANGE') {
        throw new AppError('VALIDATION_ERROR', 400, 'End time must be after start time');
      }
      if (error instanceof Error && error.message === 'TABLE_ALREADY_RESERVED') {
        throw new AppError('CONFLICT', 409, 'Table is already reserved for that time');
      }
      throw error;
    }
  }

  async updateStatus(userId: string, reservationId: string, newStatus: ReservationStatus) {
    const reservation = await reservationRepository.findById(reservationId);
    if (!reservation) throw new AppError('NOT_FOUND', 404, 'Reservation not found');

    if (newStatus === ReservationStatus.SEATED) {
      if (reservation.status !== ReservationStatus.CONFIRMED && reservation.status !== ReservationStatus.PENDING) {
        throw new AppError('CONFLICT', 409, 'Only confirmed or pending reservations can be seated');
      }

      const table = await tableRepository.findById(reservation.tableId);
      if (!table || table.status !== TableStatus.AVAILABLE) {
        throw new AppError('CONFLICT', 409, 'Table is not available for seating');
      }

      const existingSession = await sessionRepository.findActiveByCustomerId(reservation.customerId);
      if (existingSession) {
        throw new AppError('CONFLICT', 409, 'Customer already has an active session');
      }

      const session = await sessionRepository.createSessionTransaction(reservation.tableId, reservation.customerId, reservation.id);
      const updated = await reservationRepository.updateStatus(reservation.id, ReservationStatus.SEATED);

      await recordAudit({
        actorUserId: userId,
        action: 'RESERVATION_SEATED',
        entityType: 'RESERVATION',
        entityId: reservation.id,
        metadata: { sessionId: session.id, tableId: reservation.tableId }
      });

      return { reservation: updated, session };
    }

    const updated = await reservationRepository.updateStatus(reservation.id, newStatus);
    await recordAudit({
      actorUserId: userId,
      action: 'RESERVATION_STATUS_CHANGED',
      entityType: 'RESERVATION',
      entityId: reservation.id,
      metadata: { status: newStatus }
    });

    return { reservation: updated };
  }

  async cancelReservation(userId: string, role: Role, reservationId: string) {
    const reservation = await reservationRepository.findById(reservationId);
    if (!reservation) throw new AppError('NOT_FOUND', 404, 'Reservation not found');

    if (reservation.customerId !== userId && role !== Role.ADMIN) {
      throw new AppError('FORBIDDEN', 403, 'Cannot cancel this reservation');
    }

    if (reservation.status === ReservationStatus.SEATED || reservation.status === ReservationStatus.COMPLETED) {
      throw new AppError('CONFLICT', 409, 'Reservation can no longer be cancelled');
    }

    const updated = await reservationRepository.updateStatus(reservation.id, ReservationStatus.CANCELLED);
    await recordAudit({
      actorUserId: userId,
      action: 'RESERVATION_CANCELLED',
      entityType: 'RESERVATION',
      entityId: reservation.id
    });

    return updated;
  }
}

export const reservationService = new ReservationService();
