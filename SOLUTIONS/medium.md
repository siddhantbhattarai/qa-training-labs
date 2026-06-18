# 🟡 Medium — Answer Key (Intermediate)

The obvious Low defects are fixed. What remains are **boundary / negative /
equivalence** cases — the heart of BVA and equivalence partitioning. The lesson:
"the happy path is fixed" does **not** mean "the feature is correct."

> Set the level to **Medium** or send `X-QA-Level: medium`.

## ✅ Fixed since Low
Register ignores `role` · duplicate email → 409 · account locks after 10 fails ·
refresh tokens rotate · missing-auth is 401 · token errors are clean · password
hash hidden · inactive products hidden · bad id → 400 · negative price rejected ·
cart qty ≤ 0 rejected · removing a missing cart item → 404 · cart total rounded ·
empty-cart order rejected · order **view** restricted to owner · invalid order
status → 400 · admin can't self-delete.

## ✗ Still broken — find these
1. **Profile escalation (boundary of "role can't be set")** — registration now
   ignores `role`, but `PUT /api/users/profile` still applies any field. Send
   `{"name":"x","role":"admin"}` to your own profile → you're admin.
   *Lesson:* test the **same rule on every entry point**, not just the obvious one.
2. **Password length boundary** — min is now 8, but `12345678` (8 digits, no
   letters) is accepted. *BVA:* test at and just past the boundary.
3. **Email "looks validated" but isn't** — only an `@` is required, so `a@b`
   passes. *Equivalence:* pick invalid representatives, not just one.
4. **Name still unbounded** — no max length yet.
5. **User-enumeration-ish internal fields** — password hash is hidden, but other
   internal fields (e.g. `refreshToken`, counters) are still returned. Diff the
   response against the documented schema.
6. **Pagination still ignored** — `?page=2&limit=5` returns everything.
7. **Discount > 100% still accepted** — negative price is blocked, the discount
   boundary isn't.
8. **Zero price / negative stock accepted** — `price:0` and `stock:-5` slip through.
9. **Product update still leaks fields** — `createdBy` is now protected, but
   other unexpected fields (e.g. `isActive`) can still be flipped.
10. **Hard delete still orphans** references (no soft delete yet).
11. **Stock check is shallow** — add is blocked only when `stock` is 0; asking
    for **more than stock** (e.g. qty 999 of a 10-stock item) still succeeds.
    *BVA:* quantity vs available stock.
12. **Inactive product can still be added** to the cart.
13. **Duplicate cart lines** still created.
14. **Token still valid after logout** (session not truly ended until High).
15. **Order ownership half-done** — you can't *view* someone else's order, but
    you can still **cancel** it (`PATCH /api/orders/:id/cancel`). *Lesson:* an
    access rule must cover **every action**, not just reads.
16. **No shipping address required** on orders.
17. **Stock not decremented; cart not cleared; stale price** still apply.
18. **Order status has no lifecycle** — value is validated, but `pending →
    delivered` jumps are allowed; **delivered orders can still be cancelled**.
19. **No cascade** on user delete; **plaintext password** on admin update.
20. **`/api/seed/reset` still open** (no auth).
21. **Stack trace** — fixed at Medium (clean 500). ✓

➡ Switch to **High** to close the access-rule and business-logic gaps — see
[high.md](high.md).
