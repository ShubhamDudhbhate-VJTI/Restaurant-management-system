# AGENTS.md

Rules for any AI coding tool working on this repo.

## Read first

1. `spec.md`: what we are building.
2. `architecture.md`: how we build it.
3. `plan.md`: milestones and implementation plan.
4. `design/taste-skill.md`: UI design rules.

These files are the source of truth and have been updated together.

## Workflow

- Inspect the existing repository before changing code.
- Resolve ambiguity by checking the four project documents.
- Do not silently reintroduce features removed from the MVP.
- Work one milestone at a time.
- At the end of each milestone, report what changed, tests run and anything deferred.
- Do not proceed to the next milestone until the current milestone passes its checks.

## Hard rules

- Stay in scope.
- The MVP does NOT include inventory, AI recommendations or queue/waiting-list management.
- Reservations are included.
- Waiter ordering is included.
- Customer self-ordering is included.
- Feedback and basic reports are included.
- Staff management is included at a basic level.
- Real payment gateways are not included.
- The database is PostgreSQL. Do not silently switch back to SQLite.
- TypeScript everywhere with `strict: true`.
- No `any`.
- No `@ts-ignore` without a documented reason.
- Validate every API body, query and param with Zod.
- State changes must follow the state machines in `spec.md`.
- Multi-row state changes must run in one database transaction.
- Backend layering is `routes -> services -> repositories`.
- Routes contain no business logic.
- Only repositories touch Drizzle.
- Never trust user IDs, roles, table IDs or session IDs sent by the client.
- Derive the authenticated user from the auth cookie.
- Derive the customer's session from authenticated context.
- Staff permissions are checked on the backend, not only in the frontend.
- Money is stored as integer paise.
- Tax rates come from configuration.
- Never commit secrets.
- Keep `.env.example` current.
- Do not use browser `prompt()` or `confirm()`.
- Do not leave dead buttons or fake data.
- Do not add unnecessary dependencies.
- Do not rewrite working code just for stylistic reasons.
- Keep API contracts aligned between frontend and backend.

## Security

- Passwords and password hashes must never be returned to the client.
- Customer endpoints must enforce ownership.
- Admin/staff endpoints must enforce role.
- Validate reservation overlap server-side.
- Validate order availability server-side.
- Validate order state transitions server-side.
- Validate payment/session state server-side.

## Database

- PostgreSQL through Drizzle.
- Use transactions for:
  - seating
  - reservation state changes where multiple rows change
  - payment
  - force-close
  - session closure
- Use indexes for common lookups.
- Do not use floating-point values for money.

## Real-time

Socket.IO is used for:

- table updates
- reservation updates where useful
- new orders
- order status
- session closure
- menu availability

Emit events only after successful database commit.

On reconnect, refetch/invalidate relevant TanStack Query caches.

## Design

- Follow `design/taste-skill.md`.
- Use minimalist UI.
- Light theme only for MVP.
- One restrained brand accent.
- shadcn/ui + Tailwind.
- No marketing UI patterns.
- No excessive glassmorphism, gradients, glow or oversized rounded containers.
- Customer is mobile-first.
- Kitchen/cashier are tablet-first.
- Admin is desktop-first.
- Status uses text badges and never color alone.
- Every list has loading, empty and error states.
- Use proper dialogs for forms and destructive actions.

## Definition of done

For every milestone:

- `npm run typecheck` passes.
- `npm run lint` passes.
- `npm test` passes.
- `npm run build` passes when applicable.
- `npm run dev` starts web and server.
- `npm run db:migrate` works.
- `npm run db:seed` works.
- Milestone acceptance criteria are met.
- No known broken imports or dead actions remain.
- Any deferred work is documented.

## Final acceptance flow

The completed system must support:

Reservation or walk-in
-> Table
-> QR or Waiter
-> Menu
-> Cart
-> Order
-> Kitchen
-> Preparing
-> Ready
-> Served
-> Additional order rounds
-> Combined bill
-> Discount
-> Tax
-> Payment
-> Feedback
-> Admin reports

The final documentation must match the actual implementation.
