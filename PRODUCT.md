# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Restaurant customers, waiters, kitchen staff, cashiers, and administrators use the system during a live dining service. Customers need a fast mobile ordering and reservation experience; staff need clear operational views for tables, orders, kitchen status, billing, and reporting.

## Product Purpose

RMS connects the dining workflow from reservation or walk-in seating through table QR or waiter ordering, kitchen preparation, additional order rounds, combined billing, payment recording, feedback, and basic reports.

## Positioning

The product presents one shared operational flow for every table, so customer, waiter, kitchen, cashier, and admin actions stay attached to the same session and order history.

## Operating Context

The system runs as a React/Vite frontend over an Express API with Supabase PostgreSQL and Drizzle ORM. Socket.IO supports live order and table updates. Staff authenticate with role-based access, while customers use a lightweight authenticated account flow.

## Capabilities and Constraints

Confirmed capabilities include table management, reservations with overlap protection, table QR codes, digital menus, customer and waiter ordering, multiple order rounds, kitchen status transitions, combined bills, percentage discounts, configurable tax, payment recording for cash/card/UPI, feedback, staff management, audit logs, and basic sales reports.

Inventory management, ingredient tracking, AI recommendations, complex waiting queues, payroll, real payment gateways, advanced BI, notifications infrastructure, and multi-restaurant support are out of scope.

## Brand Commitments

The product name is Restaurant Management System (RMS). The public landing page should feel like a premium restaurant technology product while remaining practical, restrained, and grounded in the actual MVP.

## Evidence on Hand

The working product screens are in `apps/web/src/pages`. Product truth is documented in `docs/SPEC.md`, `docs/ARCHITECTURE.md`, and `docs/PLAN.md`. No testimonials, customer logos, external awards, or performance claims are available and must not be fabricated.

## Product Principles

- Keep the entire table journey connected.
- Make live service states clear at a glance.
- Prefer real operational data over decorative claims.
- Keep actions fast for customers and staff.
- Make the system understandable without animation.

## Accessibility & Inclusion

Use semantic HTML, keyboard-accessible controls, visible focus states, WCAG AA contrast, responsive layouts, and reduced-motion fallbacks. The landing page must remain understandable and usable when motion is reduced.
