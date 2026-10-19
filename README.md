# Restaurant Management System (RMS)

A modern, fast, and accessible Restaurant Management System built with a monorepo setup (Turborepo), Express (Server), and React (Web client). The application uses a minimalist editorial UI with a paper-based palette (#f3eadf background).

## Tech Stack
- **Frontend**: React 18, Vite, Tailwind CSS, TanStack Query (React Query), GSAP for animations
- **Backend**: Node.js, Express, Drizzle ORM, Supabase (PostgreSQL), Socket.IO for real-time updates
- **Security**: JWT-based auth (httpOnly cookies), Argon2 password hashing, Express Rate Limit
- **Shared**: Zod for validation schemas and API contracts
- **Testing**: Vitest, Supertest for E2E flow verification

## Prerequisites
- Node.js (v18 or higher)
- npm
- Supabase instance (PostgreSQL)

## Setup & Run Instructions

1. **Install Dependencies**
   From the root of the project, run:
   ```bash
   npm install
   ```

2. **Environment Configuration**
   Create a `.env` file in `apps/server` with:
   ```
   DATABASE_URL=postgres://postgres:[PASSWORD]@[HOST]:6543/postgres?pgbouncer=true
   JWT_SECRET=your_secret
   PORT=3000
   ```

3. **Database Setup**
   Push the schema to the Supabase database:
   ```bash
   cd apps/server
   npm run db:push
   npm run db:seed
   ```

4. **Start the Development Servers**
   Run both the frontend and backend servers concurrently from the root:
   ```bash
   npm run dev
   ```
   
   - The React frontend will run on [http://localhost:5173](http://localhost:5173)
   - The Express backend will run on [http://localhost:3000](http://localhost:3000)

## Seeded Logins

You can test different role functionalities using the following seeded accounts. All passwords are `password123`.

| Role | Email | Password | Description |
|---|---|---|---|
| Admin | `admin@rms.local` | `password123` | Full system access, staff management, reports |
| Kitchen | `kitchen@rms.local` | `password123` | Order status management, inventory |
| Cashier | `cashier@rms.local` | `password123` | Billing, payment recording, session closure |
| Waiter | `waiter@rms.local` | `password123` | Seating, ordering, status updates |
| Customer | `customer@rms.local` | `password123` | Reservations, QR ordering, feedback |

## Product Interface

The public landing page and authentication entry screens use a light restaurant-tech world with editorial typography, restrained emerald accents, and GSAP motion for a table-to-kitchen-to-bill story. Operational pages retain their task-focused layouts and status hierarchy. Staff pages also include an admin-only audit log for important operational actions.

## Features

- **Authentication & RBAC**: Secure JWT-based authentication with role-based access control.
- **Table & QR Management**: Dynamic table status tracking and static QR code generation for ordering.
- **Reservations**: Customer-facing reservation system with real-time table availability.
- **Digital Menu**: Category-based menu with availability toggles.
- **Smart Ordering**: Multi-round ordering for both customers (via QR) and waiters.
- **Kitchen Display System (KDS)**: Real-time ticket management with validated state transitions.
- **Billing & Payments**: Consolidated billing with percentage discounts and manual payment recording.
- **Feedback & Reports**: Post-payment customer reviews and comprehensive sales dashboards.
- **Staff Management**: Admin interface for managing staff roles and access.
- **Real-time Updates**: Instant notifications across all roles using Socket.IO.
- **Production Ready**: Rate limiting, cascaded database cleanups for testing, and Zod validation.

## Project Structure
- `apps/web`: React front-end application
- `apps/server`: Express REST API & WebSockets server
- `apps/server/src/contracts`: Shared Zod schemas and TypeScript interfaces
- `apps/server/src/modules`: Feature-based backend modules (auth, orders, etc.)
- `docs/`: Comprehensive project documentation (spec, architecture, plan)
