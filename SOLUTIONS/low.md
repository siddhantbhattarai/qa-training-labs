# 🟢 Low — Answer Key (Beginner)

Everything is blatant here. A learner using smoke + basic functional testing
should find all of these. Each item: **how to reproduce → what's wrong →
expected.**

> Set the level to **Low** (navbar dropdown) or send `X-QA-Level: low`.

## Auth & accounts
1. **Self-assign admin** — `POST /api/auth/register` with `"role":"admin"`.
   The account is created as admin. *Expected:* new users are always `user`.
2. **Weak password accepted** — register with password `123456`.
   Accepted. *Expected:* enforce a sensible minimum (≥8).
3. **Invalid email accepted** — register with `email: "not-an-email"`.
   Accepted. *Expected:* validate email format.
4. **No name length limit** — set a 5,000-character name. Accepted.
5. **Duplicate email → 500** — register the same email twice; second returns
   **500**. *Expected:* **409 Conflict**.
6. **No account lockout** — `POST /api/auth/login` with a wrong password 50×.
   Never locks. *Expected:* lock after several failures.
7. **Refresh token reuse** — call `/api/auth/refresh`, then call it again with
   the *same* token. Still works. *Expected:* refresh tokens are single-use.
8. **Token works after logout** — log in, `POST /api/auth/logout`, reuse the
   access token on `/api/auth/me`. Still works. *Expected:* token rejected.
9. **Inconsistent 403** — call a protected route with NO token → **403**
   (elsewhere it's 401). *Expected:* **401**.
10. **Leaky token error** — send a garbage token; the response includes the raw
    library error text. *Expected:* a clean generic message.
11. **Password hash exposed** — `GET /api/auth/me` (and `/api/users`) returns the
    `password` hash and internal fields. *Expected:* only documented fields.

## Products
12. **Inactive products shown** — `GET /api/products` returns "Webcam HD"
    (`isActive:false`). *Expected:* hidden from shoppers.
13. **Pagination ignored** — `GET /api/products?page=2` returns the full list.
14. **Bad id → 500** — `GET /api/products/not-an-id` returns **500**.
    *Expected:* **400** (or 404).
15. **Negative price accepted** — `POST /api/products` `price:-50`. Saved.
16. **Discount > 100% accepted** — `discount:150`. Saved.
17. **Missing required field → 500** — create a product with no `name`. **500**
    instead of **400**.
18. **Update overwrites anything** — `PUT /api/products/:id` with `createdBy` or
    other fields changes them.
19. **Hard delete orphans data** — delete a product that's in a cart/order; the
    reference is now dangling.

## Cart
20. **Quantity 0 / negative** — `POST /api/cart/add` `quantity:0`. Accepted.
21. **Out-of-stock add** — add a product with `stock:0`. Accepted.
22. **Inactive product add** — add "Webcam HD". Accepted.
23. **Duplicate lines** — add the same product twice → two separate lines
    instead of one with quantity 2.
24. **Float total** — add 3 × $29.99; the cart `total` shows
    `89.97000000000001`.
25. **Silent remove** — `DELETE /api/cart/remove/<madeUpId>` returns **200**
    even though nothing was removed.

## Orders
26. **Order an empty cart** — clear cart, `POST /api/orders`. Creates an order
    with total 0.
27. **No shipping address required.**
28. **Stock not reduced** — order 5 of a 5-stock item; stock stays 5.
29. **Cart not cleared** — place an order, the cart still has the items → order
    again.
30. **Stale price charged** — change a product's price after adding to cart;
    checkout uses the old price.
31. **Read anyone's order (ownership)** — log in as User B, `GET /api/orders/<User A's id>`.
    Returns it. *Expected:* 403.
32. **Cancel anyone's order**, including **delivered** ones; stock isn't restored.
33. **Status jumps** — `PATCH /api/orders/:id/status` straight to `delivered`
    from `pending`; an invalid status returns **500**.

## Users / admin / platform
34. **Admin self-delete** — admin deletes their own account. Allowed.
35. **No cascade** — deleting a user leaves their carts/orders behind.
36. **Plaintext password on admin update** — `PATCH /api/users/:id` with
    `password` stores it unhashed.
37. **Open DB wipe** — `DELETE /api/seed/reset` with NO auth wipes everything.
38. **Stack trace leaked** — trigger a 500; the JSON includes a full stack trace.

➡ Now switch to **Medium** and re-test: most "obvious" cases are fixed, but the
boundary variants survive — see [medium.md](medium.md).
