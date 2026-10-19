# architecture.md

How the Restaurant Management System is built. Read `spec.md` for what it does.

## 1. Tech stack

Use stable versions at project setup and pin them in `package.json`.

| Area             | Choice                                                                       |
| ---------------- | ---------------------------------------------------------------------------- |
| Language         | TypeScript (strict) everywhere                                               |
| Database         | PostgreSQL                                                                   |
| ORM / migrations | Drizzle ORM + drizzle-kit                                                    |
| Backend          | Node.js + Express                                                            |
| Validation       | Zod                                                                          |
| Auth             | Email + password hashed with argon2, JWT in an httpOnly cookie               |
| Real-time        | Socket.IO                                                                    |
| Frontend         | React + Vite                                                                 |
| Routing / data   | React Router, TanStack Query                                                 |
| Styling          | Tailwind CSS + shadcn/ui                                                     |
| Animation        | GSAP, used sparingly                                                         |
| UI design rules  | `design/taste-skill.md`                                                      |
| QR codes         | `nanoid` based static tokens                                                 |
| Tooling          | npm workspaces, ESLint, oxlint, `tsx` for dev, Vitest for tests              |

The final project uses PostgreSQL so the architecture matches the stated PERN stack.

## 2. Config

Validate configuration with Zod at boot and fail fast.

| Variable           | Default               | Purpose                               |
| ------------------ | --------------------- | ------------------------------------- |
| `PORT`             | 4000                  | Server port                           |
| `CLIENT_ORIGIN`    | http://localhost:5173 | CORS and base URL encoded in QR codes |
| `DATABASE_URL`     | none                  | PostgreSQL connection string          |
| `JWT_SECRET`       | none (required)       | Cookie signing                        |
| `TAX_CGST_PERCENT` | 2.5                   | CGST rate                             |
| `TAX_SGST_PERCENT` | 2.5                   | SGST rate                             |

Keep `.env.example` in sync with this table.

## 3. Repo layout

```text
/
├── apps/
│   ├── server/
│   │   └── src/
│   │       ├── index.ts
│   │       ├── app.ts
│   │       ├── config.ts
│   │       ├── db/
│   │       │   ├── client.ts
│   │       │   ├── schema.ts
│   │       │   ├── migrations/
│   │       │   └── seed.ts
│   │       ├── middleware/
│   │       ├── modules/
│   │       │   ├── auth/
│   │       │   ├── tables/
│   │       │   ├── reservations/
│   │       │   ├── scan/
│   │       │   ├── sessions/
│   │       │   ├── menu/
│   │       │   ├── orders/
│   │       │   ├── kitchen/
│   │       │   ├── billing/
│   │       │   ├── payments/
│   │       │   ├── feedback/
│   │       │   ├── reports/
│   │       │   └── staff/
│   │       └── realtime/
│   └── web/
│       └── src/
│           ├── main.tsx
│           ├── routes/
│           ├── components/
│           │   ├── ui/
│           │   └── shared/
│           ├── features/
│           │   ├── auth/
│           │   ├── tables/
│           │   ├── reservations/
│           │   ├── scan/
│           │   ├── menu/
│           │   ├── cart/
│           │   ├── orders/
│           │   ├── kitchen/
│           │   ├── cashier/
│           │   ├── feedback/
│           │   ├── reports/
│           │   └── staff/
│           ├── lib/
│           └── styles/
├── packages/
│   └── shared/
│       └── src/
├── AGENTS.md
├── spec.md
├── architecture.md
├── plan.md
├── design/
│   └── taste-skill.md
└── package.json
```

Root scripts:

`dev`, `build`, `typecheck`, `lint`, `test`, `db:generate`, `db:migrate`, `db:seed`.

## 4. Backend layering

`route -> service -> repository -> Drizzle`

- Routes parse and validate input with Zod and call services.
- Services contain business rules, state-machine checks and transactions.
- Repositories are the only layer that imports Drizzle queries.
- Errors use `AppError(code, status, message)`.
- Error middleware returns `{ "error": { "code": "...", "message": "..." } }`.
- PostgreSQL transactions must be used for multi-row state changes such as seating, reservation confirmation, payment and session closure.
- Do not put business logic in routes.
- Emit Socket.IO events only after a successful database commit.
- Inject a clock where time-dependent reservation/expiry behaviour needs deterministic tests.

## 5. Database schema

IDs are text (nanoid or uuid). Timestamps are integer unix ms. Enums are text validated by Zod and database constraints. Money is integer minor units (paise).

### users

`id, name, email (unique), password_hash, role ('customer'|'waiter'|'kitchen'|'cashier'|'admin'), active, created_at`

### tables

`id, number (unique int), capacity (int), status ('available'|'reserved'|'occupied'|'billing'), qr_token (unique uuid), created_at`

Table status represents the current physical/operational state. It must not be used as a substitute for reservation status.

### reservations

`id, customer_id -> users, table_id -> tables, reservation_date, start_time, end_time, guest_count, status ('pending'|'confirmed'|'seated'|'cancelled'|'completed'), created_at`

Prevent overlapping active reservations for the same table.

### table_sessions

`id, table_id -> tables, customer_id -> users (nullable), status ('active'|'closed'), started_at, closed_at, close_reason ('paid'|'force_closed', nullable), payment_method ('cash'|'card'|'upi', nullable), subtotal, discount, tax_cgst, tax_sgst, total, closed_by -> users (nullable)`

Only one active session may exist per table.

### menu_categories

`id, name, sort_order`

### menu_items

`id, category_id -> menu_categories, name, description, price, image_url (nullable), is_available, sort_order`

### orders

`id, session_id -> table_sessions, table_id -> tables, status ('placed'|'preparing'|'ready'|'served'|'cancelled'), note (nullable), created_at, preparing_at, ready_at, served_at`

A session can contain multiple orders. Each order represents one order round.

### order_items

`id, order_id -> orders, menu_item_id -> menu_items, name_snapshot, unit_price, quantity, note (nullable)`

Name and price are copied when the order is placed so later menu edits never alter old bills.

### payments

`id, session_id -> table_sessions, amount, method ('cash'|'card'|'upi'), status ('paid'), paid_at, recorded_by -> users`

### feedback

`id, session_id -> table_sessions, customer_id -> users, rating (1-5), comment, created_at`

Indexes should cover reservations by table/date, orders by status/created_at and session_id, sessions by status, menu category ordering and feedback by created_at.

## 6. REST API

Base path `/api`, JSON in/out, auth via cookie.

### Auth

| Method | Path           | Role   | Notes            |
| ------ | -------------- | ------ | ---------------- |
| POST   | `/api/auth/signup` | public | creates customer |
| POST   | `/api/auth/login`  | public | sets cookie      |
| POST   | `/api/auth/logout` | any    | clears cookie    |
| GET    | `/api/auth/me`     | any    | current user     |

### Tables

| Method | Path             | Role          | Notes                     |
| ------ | ---------------- | ------------- | ------------------------- |
| GET    | `/api/tables`        | authenticated | current table status      |
| POST   | `/api/tables`        | admin         | create table and QR token |
| PATCH  | `/api/tables/:id`    | admin         | edit table                |
| DELETE | `/api/tables/:id`    | admin         | delete if safe            |
| GET    | `/api/tables/:id/qr` | admin         | PNG/SVG QR                |

### Reservations

| Method | Path                       | Role           | Notes                           |
| ------ | -------------------------- | -------------- | ------------------------------- |
| GET    | `/api/reservations`            | admin, cashier | list reservations               |
| GET    | `/api/reservations/me`         | customer       | own reservations                |
| POST   | `/api/reservations`            | customer       | create reservation              |
| PATCH  | `/api/reservations/:id/status` | admin          | confirm/cancel/complete/seated  |
| DELETE | `/api/reservations/:id`        | customer       | cancel own eligible reservation |

### Scan / Sessions

| Method | Path                        | Role           | Notes                          |
| ------ | --------------------------- | -------------- | ------------------------------ |
| GET    | `/api/t/:qrToken`               | customer       | returns table information      |
| POST   | `/api/t/:qrToken/seat`          | customer       | seats customer at a free table |
| GET    | `/api/sessions/me`              | customer       | own active session             |
| GET    | `/api/sessions`                 | cashier, admin | active sessions                |
| POST   | `/api/payments/pay/:sessionId`  | cashier, admin | close paid session             |
| POST   | `/api/sessions/:id/force-close` | cashier, admin | close abandoned session        |

A table can be seated through its QR code or through a waiter-created session for a walk-in customer.

### Menu

| Method            | Path                               | Role          |
| ----------------- | ---------------------------------- | ------------- |
| GET               | `/api/menu`                            | authenticated |
| POST/PATCH/DELETE | `/api/menu/categories` / `/api/menu/items` | admin         |
| PATCH             | `/api/menu/items/:id/availability`     | admin         |

### Orders

| Method | Path                 | Role                            | Notes                                  |
| ------ | -------------------- | ------------------------------- | -------------------------------------- |
| POST   | `/api/orders`            | customer, waiter                | creates an order for an active session |
| GET    | `/api/orders/me`         | customer                        | own session orders                     |
| GET    | `/api/orders`            | kitchen, cashier, admin, waiter | relevant active orders                 |
| POST   | `/api/orders/:id/cancel` | customer owner, admin           | only while placed                      |
| PATCH  | `/api/orders/:id/status` | kitchen, admin                  | validated state transition             |

### Billing / Payments

`GET /api/sessions/:id/bill` for cashier/admin and customer-owned active session.

`POST /api/payments/pay/:sessionId` records the payment and closes the session in one transaction.

Discount is part of the MVP and must be included in bill calculation.

### Feedback

| Method | Path        | Role     |
| ------ | ----------- | -------- |
| POST   | `/api/feedback` | customer |
| GET    | `/api/feedback` | admin    |

### Reports

| Method | Path                            | Role  |
| ------ | ------------------------------- | ----- |
| GET    | `/api/reports/sales?period=daily`   | admin |
| GET    | `/api/reports/sales?period=weekly`  | admin |
| GET    | `/api/reports/sales?period=monthly` | admin |
| GET    | `/api/reports/top-items`            | admin |

### Staff

| Method | Path         | Role  |
| ------ | ------------ | ----- |
| GET    | `/api/staff`     | admin |
| POST   | `/api/staff`     | admin |
| PATCH  | `/api/staff/:id` | admin |

No inventory endpoints, AI endpoints or queue endpoints are part of the MVP.

## 7. Real-time

Socket.IO authenticates using the same cookie.

Rooms:

`role:<role>`, `user:<userId>`, `tables`.

Events:

- `table:updated`
- `reservation:updated`
- `session:updated`
- `order:created`
- `order:status_changed`
- `menu:updated`
- `feedback:created`

Clients treat events as signals to refetch or patch state. REST remains the source of truth.

On reconnect, invalidate relevant TanStack Query caches.

## 8. Frontend route map

### Customer

`/`, `/menu`, `/orders`, `/reservations`, `/feedback`, `/t/:qrToken`

### Waiter

`/waiter`, `/waiter/tables`, `/waiter/orders`

### Kitchen

`/kitchen`

### Cashier

`/cashier`

### Admin

`/admin`, `/admin/tables`, `/admin/reservations`, `/admin/menu`, `/admin/staff`, `/admin/reports`, `/admin/feedback`

After login, redirect based on role.

## 9. UI rules

Follow `design/taste-skill.md`.

- Light theme only.
- Minimalist product UI, not a marketing site.
- One restrained brand accent, non-purple.
- shadcn/ui primitives.
- Customer screens are mobile-first.
- Kitchen and cashier are tablet/desktop-first.
- Use text badges for status.
- Use a consistent radius system.
- No excessive glassmorphism, glow, gradients or oversized rounded cards.
- No browser `prompt()` or `confirm()`.
- All forms use proper dialogs or pages.
- All lists have loading, empty and error states.
- Primary actions have clear hierarchy.
- Touch targets are at least 44px.
- Kitchen table number is the largest element on each ticket.
- Use GSAP sparingly and respect reduced motion.
- Do not use color alone to communicate status.
