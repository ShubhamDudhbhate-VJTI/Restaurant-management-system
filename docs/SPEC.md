# spec.md: Restaurant Management System MVP

## 1. Problem

Restaurants that handle orders, tables and billing manually suffer delays, mistakes, slow table turnover and poor visibility into restaurant operations.

The proposed web application centralizes table management, reservations, menu management, QR ordering, customer/waiter orders, kitchen processing, billing, payment recording and feedback.

## 2. Goals

- Customers can view restaurant tables and make reservations.
- Customers can scan a table QR code to access the menu and order.
- Waiters can create and manage orders for tables.
- Orders reach the kitchen instantly and progress through clear statuses.
- Customers can place multiple order rounds during one table session.
- Cashiers can generate one combined bill for all order rounds.
- Cashiers can record cash, card or UPI payments.
- Admin can monitor tables, reservations, menu, staff, sales and feedback.
- Important updates appear live without manual refresh.

## 3. Non-goals

Do NOT build:

- Inventory / ingredient tracking / low-stock alerts.
- AI dish recommendations.
- Real payment gateway.
- Payroll, attendance or staff shift management.
- Advanced forecasting or complex business intelligence.
- Email/SMS notification infrastructure.
- Multi-restaurant / multi-tenant support.
- Ingredient consumption calculations.
- Complex customer loyalty systems.

A simple customer account is supported because the current application uses authenticated customer sessions.

## 4. Roles and permissions

| Role     | Can do                                                                                                                                                    |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Customer | Sign up, log in, view tables, make/cancel reservations, scan QR, browse menu, place/cancel own orders while placed, view own orders/bill, submit feedback |
| Waiter   | View tables/reservations, create orders for tables, add order rounds, view order status                                                                   |
| Kitchen  | View active orders, move `placed -> preparing -> ready -> served`                                                                                         |
| Cashier  | View active sessions and bills, apply permitted discount, mark a session paid, force-close abandoned sessions                                             |
| Admin    | All operational functions plus manage tables, QR codes, menu, staff, reservations, reports and feedback                                                   |

Only customers can self-sign-up. Staff accounts are created/seeded by Admin.

## 5. Core concepts

### Table

Physical restaurant table with:

- number
- capacity
- current status
- static QR token

### Reservation

A future booking for a table with:

- customer
- date
- start time
- end time
- guest count
- reservation status

### Table session

The active dining session for a table. All order rounds during that visit belong to the session.

### Order

One round of ordering inside a session.

A session may contain multiple orders.

### Bill

The final bill is calculated from all non-cancelled order items in the session.

### Feedback

Customer rating/comment submitted after payment.

## 6. Key rules

- Scanning a table QR identifies the table.
- A customer can have at most one active table session.
- A table can have at most one active session.
- Reservation and table status are separate concepts.
- A reservation cannot overlap another active reservation for the same table.
- Orders are associated with an active session.
- Customers can only access their own orders.
- Waiters can create orders for restaurant sessions.
- Multiple order rounds are combined into one final bill.
- Menu price/name is copied into order items when ordered.
- Editing a menu item later must not change old bills.
- Unavailable menu items cannot be ordered.
- Order state transitions are validated on the backend.
- Payment closes the session and makes the table available.
- Force-close is a recovery action and does not create a payment.
- Payment methods are recorded as cash, card or UPI.
- Discount is supported in the MVP as a percentage discount.
- Tax defaults to CGST 2.5% + SGST 2.5%, configurable through environment variables.
- Currency is INR and money is stored in paise.

## 7. User flows

### 7.1 Customer signup/login

1. Customer registers with name, email and password.
2. Customer logs in.
3. Customer reaches the customer home/table page.
4. If they came from a QR link while logged out, login returns them to that QR URL.

### 7.2 Reservation

1. Customer opens Reservations.
2. Selects date.
3. Selects time.
4. Enters guest count.
5. System shows available tables that are suitable for the requested time.
6. Customer selects a table.
7. Reservation is created.
8. Admin can confirm it.
9. Customer can cancel an eligible reservation.
10. On arrival, staff can mark it seated.

### 7.3 Walk-in / QR seating

1. Customer scans table QR.
2. System identifies the table.
3. If available, customer can start a session.
4. Table becomes occupied.
5. Customer goes to the menu.

### 7.4 Waiter seating/order

1. Waiter selects a table.
2. Waiter starts/opens a session for a walk-in customer when required.
3. Waiter opens the menu.
4. Adds items and notes.
5. Sends order to kitchen.
6. Waiter can add another order round later.

### 7.5 Ordering

1. Customer or waiter browses menu by category.
2. Adds items to cart.
3. Sets quantities and optional notes.
4. Places order.
5. Order status starts as `placed`.
6. Kitchen receives the order instantly.
7. Customer/waiter can view status.
8. Additional order rounds can be placed during the same session.

### 7.6 Kitchen

Order states:

`placed -> preparing -> ready -> served`

No skipping or backwards movement.

Kitchen screen contains:

- Placed
- Preparing
- Ready

Each ticket shows:

- table number
- order number
- items
- notes
- elapsed time
- primary action

### 7.7 Billing

Cashier opens an active session.

The bill contains all order rounds:

```text
Order 1
Order 2
Order 3
----------------
Subtotal
Discount
CGST
SGST
Total
```

Example:

```text
Subtotal        ₹1000
Discount 10%    -₹100
CGST 2.5%        ₹22.50
SGST 2.5%        ₹22.50
Total            ₹945
```

### 7.8 Payment

1. Cashier chooses:
   - Cash
   - Card
   - UPI
2. System records payment.
3. Session becomes closed.
4. Table becomes available.
5. Customer receives a session-closed update.

No real payment gateway is required.

### 7.9 Feedback

After payment:

- Customer selects rating from 1 to 5.
- Customer may enter a comment.
- Admin can view average rating and recent feedback.

### 7.10 Reports

Admin can view:

- Daily sales.
- Weekly sales.
- Monthly sales.
- Number of orders.
- Best-selling dishes.

Reports must use real database data.

## 8. MVP features

1. Authentication.
2. Role-based access.
3. Table management.
4. Table QR codes.
5. Reservations.
6. Customer QR ordering.
7. Waiter ordering.
8. Digital menu management.
9. Multiple order rounds.
10. Kitchen order management.
11. Consolidated billing.
12. Percentage discount.
13. Payment recording.
14. Customer feedback.
15. Basic dashboard.
16. Basic sales reports.
17. Basic staff management.
18. Socket.IO real-time updates.

## 9. Later / optional scope

These can be considered future enhancements:

- Real payment gateway.
- Advanced customer recommendations.
- Inventory management.
- Ingredient tracking.
- Low-stock alerts.
- Advanced analytics/forecasting.
- Email/SMS notifications.
- Loyalty program.
- Multi-restaurant support.

## 10. State machines

### Table

`available -> reserved -> occupied -> billing -> available`

A walk-in QR flow may use:

`available -> occupied`

### Reservation

`pending -> confirmed -> seated -> completed`

Cancellation:

`pending -> cancelled`
`confirmed -> cancelled`

### Session

`active -> closed`

Close reasons:

`paid`
`force_closed`

### Order

`placed -> preparing -> ready -> served`

Cancellation:

`placed -> cancelled`

No skipping or backwards transitions.

## 11. Billing

- Subtotal = sum of `quantity x unit_price` for all non-cancelled order items.
- Discount = configured percentage applied to the subtotal.
- Tax is calculated after discount.
- CGST and SGST rates are configurable.
- Each tax amount is rounded half up in paise.
- Final total = discounted subtotal + CGST + SGST.
- Old order prices remain unchanged after menu edits.
- On payment, the calculated subtotal, discount, tax and total are stored on the session.

## 12. Acceptance criteria

- Two users cannot occupy the same table at the same time.
- A reservation cannot overlap another active reservation for the same table.
- A logged-out QR scan returns to the same QR page after login.
- A customer cannot place an order without an active session.
- A customer cannot access another customer's orders.
- A waiter can create an order for an active restaurant session.
- Unavailable menu items cannot be ordered.
- Editing a menu price does not alter existing order totals.
- Multiple order rounds appear in one final bill.
- Kitchen cannot skip or reverse order states.
- Payment closes the session and makes the table available in one transaction.
- Force-close closes an abandoned session without creating a payment.
- Discount and tax calculations are correct.
- Feedback can only be submitted for an eligible completed session.
- Dashboard and reports use real data.
- Status changes reach affected screens through Socket.IO.
- Reconnecting clients refetch current state.
- Customer screens work at 390px width without horizontal scrolling.
- Kitchen and cashier screens work at 1024px tablet width.

## 13. Decisions

| Topic            | Decision                                       |
| ---------------- | ---------------------------------------------- |
| Database         | PostgreSQL                                     |
| ORM              | Drizzle                                        |
| Ordering         | Customer self-order + waiter-assisted ordering |
| Reservations     | Included in MVP                                |
| Queue            | Removed                                        |
| Inventory        | Removed                                        |
| AI               | Removed                                        |
| Discount         | Included as percentage discount                |
| Payment          | Manual recording only                          |
| Tax              | CGST 2.5% + SGST 2.5%, configurable            |
| QR               | Static UUID per table                          |
| Customer account | Required                                       |
| Real-time        | Socket.IO                                      |
| Currency         | INR / paise                                    |
