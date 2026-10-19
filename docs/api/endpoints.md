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
*   `GET /t/:qrToken`: Scan a table QR code to identify table.
*   `POST /t/:qrToken/seat`: Start a session for a customer via QR scan.

## Menu
*   `GET /menu`: Get full menu categorized.
*   `POST /menu/categories`: Create category (Admin).
*   `POST /menu/items`: Create menu item (Admin).
*   `PATCH /menu/items/:id/availability`: Toggle item availability.

## Orders
*   `POST /orders`: Place a new order for the active session.
*   `GET /orders/me`: Get current session orders.
*   `GET /orders`: List active orders for kitchen/staff.
*   `PATCH /orders/:id/status`: Update order status (Staff).

## Payments & Billing
*   `GET /sessions/me/bill`: Compute current bill for the session.
*   `POST /payments/pay/:sessionId`: Process payment and close session.
*   `POST /sessions/:id/force-close`: Emergency session closure.

## Staff (Admin Only)
*   `GET /staff`: List all staff members.
*   `POST /staff`: Create a new staff account.
*   `PATCH /staff/:id/role`: Change staff role.
*   `PATCH /staff/:id/status`: Activate/Deactivate staff member.

## Reservations
*   `GET /reservations`: List all reservations (Staff/Admin).
*   `GET /reservations/me`: Get current customer's reservations.
*   `POST /reservations`: Create a new reservation.
*   `PATCH /reservations/:id/status`: Update reservation status (Staff).

## Feedback
*   `POST /feedback`: Submit customer feedback for a closed session.
*   `GET /feedback`: List all feedback (Admin).

## Reports (Admin Only)
*   `GET /reports/dashboard`: Get high-level sales and activity stats.

## Audit Logs (Admin Only)
*   `GET /audit-logs`: List system audit logs.

## Inventory (Staff/Admin Only)
*   `GET /inventory`: List all inventory items.
*   `POST /inventory`: Add new inventory item.
*   `PATCH /inventory/:id`: Update inventory details.
*   `POST /inventory/:id/adjust`: Adjust stock levels.
