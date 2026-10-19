# plan.md

## Instructions for the AI

1. Read `AGENTS.md`, `spec.md`, `architecture.md` and `design/taste-skill.md`.
2. These documents are the source of truth and have been updated together. Do not reintroduce removed queue/inventory/AI functionality.
3. Work one milestone at a time.
4. At the end of each milestone, report what changed, what was tested and anything deferred.
5. Do not move to the next milestone until the current milestone passes typecheck, lint and tests.
6. Do not rewrite working modules unnecessarily.
7. Inspect the current repository before changing files.
8. Preserve working order, kitchen, cashier and real-time logic where possible, but refactor it when it conflicts with the new MVP.

## Milestones

0. [DONE] Repository audit and migration preparation
1. [DONE] PostgreSQL + schema migration
2. [DONE] Authentication and roles
3. [DONE] Tables and QR
4. [DONE] Reservations and sessions
5. [DONE] Menu
6. [DONE] Ordering and multiple order rounds
7. [DONE] Kitchen
8. [DONE] Billing, discount and payments
9. [DONE] Feedback and reports
10. [DONE] Staff management
11. [DONE] UI/UX redesign
12. [DONE] Validation, security and end-to-end testing
13. [DONE] Documentation cleanup

Each milestone must leave the application runnable, typechecked and tested.

---

## Milestone 0: Repository audit

### Goal

Understand the existing project before changing it.

### Tasks

- Inspect frontend and backend structure.
- Find all routes, services, repositories, schemas and Socket.IO events.
- Find all current queue references.
- Find all SQLite/better-sqlite3 references.
- Find all browser `prompt()` and `confirm()` calls.
- Find hardcoded/mock dashboard data.
- Find buttons without real handlers.
- Find routes that do not have matching backend endpoints.
- Find API calls that do not have matching frontend usage.
- Identify broken imports and TypeScript errors.
- Create a migration/refactor plan based on the current code.

### Done when

- Current architecture and risks are documented.
- No code is changed until the audit is understood.

---

## Milestone 1: PostgreSQL and schema migration

### Goal

Make the actual implementation match the documented PERN stack.

### Tasks

- Replace better-sqlite3 with PostgreSQL.
- Configure Drizzle PostgreSQL dialect.
- Add `DATABASE_URL`.
- Generate and run migrations.
- Preserve existing data where practical.
- Add schemas for:
  - users
  - tables
  - reservations
  - table_sessions
  - menu_categories
  - menu_items
  - orders
  - order_items
  - payments
  - feedback
- Add required indexes and constraints.
- Remove queue schema and queue-specific migrations if no longer needed.
- Add seed data:
  - admin
  - waiter
  - kitchen
  - cashier
  - demo customer
  - 6 tables
  - 3 categories
  - about 10 menu items

### Tests

- DB connection.
- Migration succeeds.
- Seed succeeds.
- Unique table number.
- Unique user email.
- One active session per table.

---

## Milestone 2: Authentication and roles

### Goal

Implement secure role-based authentication.

### Roles

CUSTOMER
WAITER
KITCHEN
CASHIER
ADMIN

### Tasks

- Keep existing working authentication if sound.
- Ensure passwords are hashed.
- JWT remains in httpOnly cookie.
- Add role middleware.
- Add active/inactive staff handling.
- Customer signup always creates CUSTOMER.
- Staff roles cannot be selected during public signup.
- Redirect users to the correct role area.

### Tests

- Invalid login rejected.
- Wrong role rejected.
- Customer cannot access admin endpoints.
- Kitchen cannot access payment endpoints.
- Waiter cannot manage staff.
- Admin can access management areas.

---

## Milestone 3: Tables and QR

### Goal

Provide reliable table management.

### Tasks

- Keep table CRUD.
- Table states:
  - available
  - reserved
  - occupied
  - billing
- Generate static QR token per table.
- Display actual QR code.
- Add download/print QR.
- Customer scanning QR identifies the table automatically.
- Remove queue-related table states.

### UI

Admin table page:

Table number
Capacity
Status
QR
Edit
Delete

### Tests

- Duplicate table number rejected.
- QR points to correct table.
- Invalid QR returns 404.
- Deleted/invalid table cannot be seated.

---

## Milestone 4: Reservations and sessions

### Goal

Replace the old queue workflow with proper reservations.

### Reservation flow

Customer:

1. Select date.
2. Select time.
3. Select guest count.
4. View suitable tables.
5. Select table.
6. Confirm reservation.
7. View/cancel reservation.

Admin:

- View reservations.
- Confirm.
- Cancel.
- Mark seated.
- Mark completed.

### Rules

- No overlapping active reservations for the same table.
- Reservation status and table status remain separate.
- QR seating remains the normal walk-in seating mechanism.
- Waiter may create a session for a walk-in customer.

### Session flow

`active -> closed`

Close reasons:

`paid`
`force_closed`

### Tests

- Double booking prevented.
- Cancel works.
- Confirm works.
- Seated reservation creates/links a session correctly.
- Payment closes session.
- Table becomes available after closure.

---

## Milestone 5: Menu

### Goal

Complete the menu system.

### Tasks

- Categories.
- Items.
- Price.
- Description.
- Image URL.
- Availability.
- Admin CRUD.
- Availability toggle.
- Real-time menu availability updates.

### UI

Replace all browser prompts with proper dialogs.

Menu card:

Image
Name
Description
Price
Availability
Add to order

### Tests

- Invalid price rejected.
- Empty name rejected.
- Only admin can modify menu.
- Unavailable items cannot be ordered.

---

## Milestone 6: Ordering and multiple rounds

### Goal

Support the complete ordering flow.

### Customer

- Browse menu.
- Add to cart.
- Quantity.
- Notes.
- Place order.
- View status.
- Place additional order rounds.

### Waiter

- Select table/session.
- Create order.
- Add items.
- Add notes.
- Send to kitchen.
- Add additional order rounds.

### Important

A session can have multiple orders:

Session

- Order 1
- Order 2
- Order 3

The final bill combines all non-cancelled orders.

### Tests

- Customer without active session cannot order.
- Unavailable menu item cannot be ordered.
- Existing order keeps original price after menu price change.
- Customer cannot access another customer's orders.
- Multiple rounds appear in one session.

---

## Milestone 7: Kitchen

### Goal

Make kitchen workflow fast and readable.

### State machine

`placed -> preparing -> ready -> served`

`placed -> cancelled` only where allowed.

No skipping and no backwards transitions.

### UI

Three columns:

PLACED
PREPARING
READY

Ticket:

TABLE 05
Order #1024
2 x Margherita Pizza
1 x Garlic Bread
Notes
Elapsed time

One primary action per ticket.

Use Socket.IO for instant order arrival and status changes.

### Tests

- Valid transitions succeed.
- Invalid transitions return 409.
- New order appears without refresh.
- Customer sees status updates.

---

## Milestone 8: Billing, discount and payments

### Goal

Create reliable consolidated billing.

### Bill

Subtotal
Discount
CGST
SGST
Total

### Discount

Support percentage discount for MVP.

Example:

Subtotal ₹1000
Discount 10% = ₹100
CGST 2.5%
SGST 2.5%

Tax rates remain configurable.

### Payment

Cash
Card
UPI

This is payment recording only. No payment gateway.

### Closing

Payment transaction must atomically:

1. Compute final bill.
2. Record payment.
3. Close session.
4. Set table to available.
5. Emit events after commit.

Force-close remains available to cashier/admin as a secondary destructive action.

### Tests

- Correct bill calculation.
- Correct rounding.
- Discount cannot produce invalid totals.
- Payment closes session.
- Already closed session rejected.
- Table becomes available.
- Force-close does not create a fake payment.

---

## Milestone 9: Feedback and reports

### Feedback

After payment, customer can submit:

Rating 1-5
Comment

Admin sees:

Average rating
Recent feedback
Ratings

### Reports

Implement only:

- Daily sales.
- Weekly sales.
- Monthly sales.
- Number of orders.
- Best-selling dishes.

Use real database queries.

No forecasting or AI.

---

## Milestone 10: Staff management

### Goal

Simple staff management for Admin.

Display:

Name
Email
Role
Active status

Actions:

Add staff
Change role
Activate/deactivate

Do not add payroll, attendance, shifts or salary.

---

## Milestone 11: UI/UX redesign

### Goal

Rebuild the frontend visual hierarchy without rewriting business logic.

Follow `design/taste-skill.md`.

### Global

- Light theme.
- One restrained brand accent.
- Neutral gray background.
- White surfaces.
- Thin borders.
- Consistent radius.
- Strong typography.
- Minimal shadows.
- No excessive gradients.
- No glassmorphism.
- No glow effects.
- No excessive rounded pills.
- No excessive uppercase text.
- No decorative UI that competes with actions.

### Shared components

Create/reuse:

Button
Input
Select
Dialog
Sheet
Card
Badge
Table
StatCard
Toast
Skeleton
EmptyState
ErrorState
ConfirmDialog

### Customer

Mobile-first.
Food images.
Category tabs.
Sticky cart.
44px+ touch targets.

### Waiter

Fast table/order workflow.
Large action buttons.
Minimal navigation.

### Kitchen

High contrast.
Large table number.
Large order cards.
Three status columns.
Minimal decoration.

### Cashier

Session list.
Detail panel.
Large total.
Mark paid primary.
Force-close secondary.

### Admin

Sidebar.
Dashboard.
Tables.
Reservations.
Menu.
Staff.
Reports.
Feedback.

### Navigation

Staff sidebar:

Dashboard
Tables
Reservations
Orders
Kitchen
Billing
Menu
Staff
Reports
Feedback
Settings
Logout

Customer navigation:

Home
Menu
Orders
Reservations
Profile

### Responsive checks

Test:

390px customer viewport
1024px kitchen/cashier viewport
Desktop admin viewport

No horizontal scrolling.

---

## Milestone 12: Security, validation and testing

### Backend

- Zod validation for all body/query/params.
- Role checks on every protected endpoint.
- Never trust client user/session IDs.
- Money as integer paise.
- No secrets committed.
- No password/hash returned to frontend.
- Transactions for multi-row state changes.

### Frontend

- No `prompt()`.
- No `confirm()`.
- No dead buttons.
- No hardcoded fake data.
- Loading states.
- Empty states.
- Error states.
- Toast feedback.
- Form validation.

### Tests

At minimum:

- Auth and roles.
- Reservation overlap.
- Table seating race.
- Session closure.
- Order ownership.
- Order state machine.
- Price snapshot.
- Discount/bill rounding.
- Payment.
- Feedback.
- Report queries.

---

## Milestone 13: Documentation cleanup [COMPLETED]

### Goal

Update all project documentation so it matches the actual implementation.

### Done

- Updated `README.md` with final tech stack, features, and structure.
- Updated `agent.md` to reflect the completed state and scope.
- Verified all core flows (Reservation -> Seating -> Ordering -> Kitchen -> Payment -> Feedback -> Reports).
- Documented role descriptions and environment requirements.
- Finalized E2E test suite.
- Rate limiting integrated.
- Database cascaded cleanup for testing.
