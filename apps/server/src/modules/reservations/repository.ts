import { and, eq, ne } from 'drizzle-orm';
import { db } from '../../db/client';
import { reservations, tables } from '../../db/schema';
import { CreateReservationInput, ReservationStatus } from '@/contracts';

export const reservationRepository = {
  async findForCustomer(customerId: string) {
    const list = await db.select().from(reservations).where(eq(reservations.customerId, customerId));
    return list.map(r => ({ ...r, createdAt: r.createdAt.getTime() }));
  },

  async findForDate(reservationDate: string) {
    const list = await db.select({
      id: reservations.id,
      customerId: reservations.customerId,
      tableId: reservations.tableId,
      reservationDate: reservations.reservationDate,
      startTime: reservations.startTime,
      endTime: reservations.endTime,
      guestCount: reservations.guestCount,
      status: reservations.status,
      createdAt: reservations.createdAt,
      tableName: tables.name,
      tableSeats: tables.seats,
    })
      .from(reservations)
      .innerJoin(tables, eq(reservations.tableId, tables.id))
      .where(eq(reservations.reservationDate, reservationDate));
    return list.map(r => ({ ...r, createdAt: r.createdAt.getTime() }));
  },

  async findById(id: string) {
    const [reservation] = await db.select().from(reservations).where(eq(reservations.id, id)).limit(1);
    if (!reservation) return null;
    return { ...reservation, createdAt: reservation.createdAt.getTime() };
  },

  async create(customerId: string, data: CreateReservationInput) {
    return db.transaction(async (tx) => {
      if (data.endTime <= data.startTime) {
        throw new Error('INVALID_TIME_RANGE');
      }

      const conflicts = await tx.select().from(reservations).where(and(
        eq(reservations.tableId, data.tableId),
        eq(reservations.reservationDate, data.reservationDate),
        ne(reservations.status, ReservationStatus.CANCELLED),
        ne(reservations.status, ReservationStatus.COMPLETED),
      ));

      const overlaps = conflicts.some((reservation) =>
        data.startTime < reservation.endTime && data.endTime > reservation.startTime
      );
      if (overlaps) {
        throw new Error('TABLE_ALREADY_RESERVED');
      }

      const [reservation] = await tx.insert(reservations).values({
        customerId,
        tableId: data.tableId,
        reservationDate: data.reservationDate,
        startTime: data.startTime,
        endTime: data.endTime,
        guestCount: data.guestCount,
      }).returning();
      return { ...reservation, createdAt: reservation.createdAt.getTime() };
    });
  },

  async updateStatus(id: string, status: ReservationStatus) {
    const [reservation] = await db.update(reservations)
      .set({ status })
      .where(eq(reservations.id, id))
      .returning();
    if (!reservation) return null;
    return { ...reservation, createdAt: reservation.createdAt.getTime() };
  },
};
