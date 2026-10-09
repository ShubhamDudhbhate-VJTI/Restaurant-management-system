# Restaurant Management System (RMS)

A modern, fast, and accessible Restaurant Management System built with a monorepo setup (Turborepo), Express (Server), and React (Web client). The application uses the Ethereal Glass dark aesthetic.

## Tech Stack
- **Frontend**: React, Vite, GSAP (animations), Tailwind CSS, React Query
- **Backend**: Express, Drizzle ORM, SQLite
- **Shared**: Zod for validation schemas

## Prerequisites
- Node.js (v18 or higher)
- npm

## Setup & Run Instructions

1. **Install Dependencies**
   From the root of the project, run:
   ```bash
   npm install
   ```

2. **Database Setup**
   Push the schema to the SQLite database and seed initial data:
   ```bash
   npm run db:push
   npm run db:seed
   ```

3. **Start the Development Servers**
   Run both the frontend and backend servers concurrently:
   ```bash
   npm run dev
   ```
   
   - The React frontend will run on [http://localhost:5173](http://localhost:5173)
   - The Express backend will run on [http://localhost:3000](http://localhost:3000)

## Seeded Logins

You can test different role functionalities using the following seeded accounts. All passwords are `password123`.

| Role | Email | Password |
|---|---|---|
| Admin | `admin@rms.local` | `password123` |
| Kitchen | `kitchen@rms.local` | `password123` |
| Cashier | `cashier@rms.local` | `password123` |
| Waiter | `waiter@rms.local` | `password123` |
| Customer | `customer@rms.local` | `password123` |

## Product Interface

The public landing page and authentication entry screens use a light restaurant-tech world with editorial typography, restrained emerald accents, and GSAP motion for a table-to-kitchen-to-bill story. Operational pages retain their task-focused layouts and status hierarchy. Staff pages also include an admin-only audit log for important operational actions.

## Project Structure
- `apps/web`: React front-end application
- `apps/server`: Express REST API & WebSockets server
- `apps/server/src/contracts`: Server API contracts, enums, and Zod schemas
- `apps/web/src/contracts`: Frontend copy of the API contracts used by the web client
