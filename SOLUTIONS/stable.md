# 🔵 Stable — Reference Build (Expected Behaviour)

There are **no defects to find here**. This is the correct implementation. Use it
to (a) learn what each feature *should* do, and (b) as a **regression baseline** —
run the same test on Stable and on a buggy level and compare the results.

> Set the level to **Stable** or send `X-QA-Level: stable`.

## Expected behaviour, by feature

**Accounts & auth**
- Registration always creates a `user`; `role` from the body is ignored.
- Passwords require ≥8 chars with upper + lower + number + special; common
  passwords are rejected.
- Emails must match `something@something.tld`.
- Names are capped at 100 chars.
- A duplicate email returns **409**, with a message that doesn't confirm which
  field clashed.
- After 5 failed logins the account locks for a window (**429** while locked).
- Refresh tokens are single-use (rotated every refresh; the old one stops working).
- After logout the access token is rejected immediately.
- Missing auth → **401**; bad tokens → **401** with a clean message.
- Responses only contain documented fields (never the password hash or internals).

**Products**
- `GET /api/products` hides inactive products and supports `page`/`limit`
  pagination, returning `{ page, limit, total, products }`.
- A malformed id → **400**; an unknown id → **404**.
- Create/update validate: price > 0, discount 0–100, stock ≥ 0; errors are
  **400** with clean messages.
- Update only writes known product fields.
- Delete is a **soft delete** (`isActive:false`) so historical references stay valid.

**Cart**
- Quantity must be a positive integer and not exceed stock.
- Inactive/out-of-stock products can't be added.
- Adding the same product twice merges into one line.
- `total` is rounded to 2 decimals.
- Removing an item that isn't in the cart → **404**.

**Orders**
- An empty cart can't be ordered; a complete shipping address is required.
- Lines are charged at the product's **current** price.
- Placing an order **decrements stock** and **clears the cart**.
- A user can only view/cancel their **own** orders (admins may act on any).
- Status changes follow the lifecycle
  `pending → processing → shipped → delivered` (plus `→ cancelled` from
  pending/processing); illegal jumps → **409**, invalid values → **400**.
- Delivered orders can't be cancelled; cancelling **restores stock**.

**Users / admin / platform**
- Admins can't delete their own account.
- Deleting a user cascades to their carts and orders.
- Admin password updates are properly hashed.
- `DELETE /api/seed/reset` requires an authenticated admin.
- Server errors return a clean **500** with no stack trace.

## Using Stable for regression testing
1. Run your test on **Low/Medium/High** and record the actual result.
2. Run the identical test on **Stable** and record the expected result.
3. Any difference on the buggy level is a defect — and Stable just gave you the
   "Expected Result" line for your bug report.
