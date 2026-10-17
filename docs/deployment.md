# Deployment Guide

## Tech Stack
*   Frontend: React (Vite)
*   Backend: Node.js (Express)
*   Database: Supabase (PostgreSQL)
*   ORM: Drizzle

## Prerequisites
*   Node.js v18+
*   Supabase Account

## Environment Variables
Create a `.env` file in `apps/server`:
```
DATABASE_URL=postgres://postgres:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true
JWT_SECRET=your_jwt_secret
CLIENT_ORIGIN=http://localhost:5173
```

## Database Setup
1. Run migrations:
   ```bash
   cd apps/server
   npm run db:generate
   npm run db:migrate
   ```
2. (Optional) Seed data:
   ```bash
   npm run db:seed
   ```

## Running the App
1. Start Backend:
   ```bash
   cd apps/server
   npm run dev
   ```
2. Start Frontend:
   ```bash
   cd apps/web
   npm run dev
   ```
