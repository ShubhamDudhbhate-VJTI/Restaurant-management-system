import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { Role, TableStatus, SessionStatus, OrderStatus, SessionCloseReason, PaymentMethod, ReservationStatus } from '@/contracts';
import { nanoid } from 'nanoid';

export const users = sqliteTable('users', {
  id: text('id').$defaultFn(() => nanoid()).primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role: text('role').notNull().$type<Role>(),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  createdAt: integer('created_at').notNull().$defaultFn(() => Date.now()),
});

export const tables = sqliteTable('tables', {
  id: text('id').$defaultFn(() => nanoid()).primaryKey(),
  name: text('name').notNull(),
  qrToken: text('qr_token').notNull().unique().$defaultFn(() => nanoid(10)),
  seats: integer('seats').notNull(),
  status: text('status').notNull().$type<TableStatus>().$defaultFn(() => TableStatus.AVAILABLE),
});

export const sessions = sqliteTable('sessions', {
  id: text('id').$defaultFn(() => nanoid()).primaryKey(),
  tableId: text('table_id').notNull().references(() => tables.id),
  customerId: text('customer_id').notNull().references(() => users.id),
  status: text('status').notNull().$type<SessionStatus>().$defaultFn(() => SessionStatus.ACTIVE),
  startedAt: integer('started_at').notNull().$defaultFn(() => Date.now()),
  endedAt: integer('ended_at'),
  closeReason: text('close_reason').$type<SessionCloseReason>(),
  paymentMethod: text('payment_method').$type<PaymentMethod>(),
  subtotalCents: integer('subtotal_cents'),
  cgstCents: integer('cgst_cents'),
  sgstCents: integer('sgst_cents'),
  totalCents: integer('total_cents'),
  discountCents: integer('discount_cents'),
  discountPercent: integer('discount_percent'),
});

export const reservations = sqliteTable('reservations', {
  id: text('id').$defaultFn(() => nanoid()).primaryKey(),
  customerId: text('customer_id').notNull().references(() => users.id),
  tableId: text('table_id').notNull().references(() => tables.id),
  reservationDate: text('reservation_date').notNull(),
  startTime: text('start_time').notNull(),
  endTime: text('end_time').notNull(),
  guestCount: integer('guest_count').notNull(),
  status: text('status').notNull().$type<ReservationStatus>().$defaultFn(() => ReservationStatus.PENDING),
  createdAt: integer('created_at').notNull().$defaultFn(() => Date.now()),
});

export const feedback = sqliteTable('feedback', {
  id: text('id').$defaultFn(() => nanoid()).primaryKey(),
  sessionId: text('session_id').notNull().references(() => sessions.id),
  customerId: text('customer_id').notNull().references(() => users.id),
  rating: integer('rating').notNull(),
  comment: text('comment'),
  createdAt: integer('created_at').notNull().$defaultFn(() => Date.now()),
});

export const auditLogs = sqliteTable('audit_logs', {
  id: text('id').$defaultFn(() => nanoid()).primaryKey(),
  actorUserId: text('actor_user_id').notNull().references(() => users.id),
  action: text('action').notNull(),
  entityType: text('entity_type').notNull(),
  entityId: text('entity_id').notNull(),
  metadata: text('metadata'),
  createdAt: integer('created_at').notNull().$defaultFn(() => Date.now()),
});

export const categories = sqliteTable('categories', {
  id: text('id').$defaultFn(() => nanoid()).primaryKey(),
  name: text('name').notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
});

export const menuItems = sqliteTable('menu_items', {
  id: text('id').$defaultFn(() => nanoid()).primaryKey(),
  categoryId: text('category_id').notNull().references(() => categories.id),
  name: text('name').notNull(),
  description: text('description'),
  priceCents: integer('price_cents').notNull(),
  imageUrl: text('image_url'),
  isAvailable: integer('is_available', { mode: 'boolean' }).notNull().default(true),
  sortOrder: integer('sort_order').notNull().default(0),
});

export const orders = sqliteTable('orders', {
  id: text('id').$defaultFn(() => nanoid()).primaryKey(),
  sessionId: text('session_id').notNull().references(() => sessions.id),
  customerId: text('customer_id').notNull().references(() => users.id),
  status: text('status').notNull().$type<OrderStatus>().$defaultFn(() => OrderStatus.PLACED),
  createdAt: integer('created_at').notNull().$defaultFn(() => Date.now()),
  updatedAt: integer('updated_at').notNull().$defaultFn(() => Date.now()),
});

export const orderItems = sqliteTable('order_items', {
  id: text('id').$defaultFn(() => nanoid()).primaryKey(),
  orderId: text('order_id').notNull().references(() => orders.id),
  menuItemId: text('menu_item_id').notNull().references(() => menuItems.id),
  name: text('name').notNull(),
  priceCents: integer('price_cents').notNull(),
  quantity: integer('quantity').notNull().default(1),
});
