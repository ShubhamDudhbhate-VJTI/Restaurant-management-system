# RMS API Endpoints Documentation

## Base URL
`/api`

## Authentication
*   `POST /auth/signup`: Create a new customer account.
*   `POST /auth/login`: Authenticate and receive a JWT cookie.
*   `POST /auth/logout`: Clear the authentication cookie.
*   `GET /auth/me`: Get current user details.

## Tables
*   `GET /tables`: List all tables (Staff/Admin).
*   `POST /tables`: Create a new table (Admin).
*   `PATCH /tables/:id`: Update table details (Admin).

## Menu
*   `GET /menu`: Get full menu categorized.
*   `POST /menu/categories`: Create category (Admin).
*   `POST /menu/items`: Create menu item (Admin).

## Orders
*   `POST /orders`: Place a new order for the active session.
*   `GET /orders/me`: Get current session orders.
*   `GET /orders`: List active orders for kitchen/staff.
*   `PATCH /orders/:id/status`: Update order status (Staff).

## Payments & Billing
*   `GET /orders/me/bill`: Compute current bill for the session.
*   `POST /payments/pay/:sessionId`: Process payment and close session.

## Staff (Admin Only)
*   `GET /staff`: List all staff members.
*   `POST /staff`: Create a new staff account.
*   `PATCH /staff/:id/role`: Change staff role.
*   `PATCH /staff/:id/status`: Activate/Deactivate staff member.
