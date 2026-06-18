# 🔴 High — Answer Key (Advanced)

Validation and access rules are now solid. What remains are **business-logic and
integration defects** — the kind you only catch by combining steps and thinking
about state over time (exploratory + integration testing).

> Set the level to **High** or send `X-QA-Level: high`.

## ✅ Fixed since Medium
Profile only updates `name` · password needs letters+numbers · email needs
`x@y.z` · name length capped · all internal fields hidden · pagination works ·
discount capped 0–100 · product update is a strict whitelist · **soft delete**
(references stay valid) · add validates **quantity vs stock** · inactive products
can't be added · duplicate cart lines **merge** · token rejected after logout ·
order **cancel** restricted to owner · shipping address required · stock
decremented on order · cart cleared after checkout · order status **lifecycle**
enforced · delivered orders can't be cancelled · user delete **cascades** ·
admin password update is **hashed**.

## ✗ Still broken — the subtle ones
1. **Stale price at checkout (integration/state defect)** — add an item to the
   cart, then (as admin) change that product's price, then check out. The order
   still charges the **price captured when it was added**, not the current price.
   *How to catch:* a multi-actor, multi-step scenario — exactly what exploratory
   and integration testing is for. *Expected (Stable):* charge current price.
2. **Stock not restored on cancellation** — place an order (stock goes down),
   then cancel it. The stock is **not** returned to inventory. *How to catch:*
   record stock before/after the full place→cancel cycle. *Expected (Stable):*
   cancelling restores stock.
3. **Zero-price / "free" items still orderable** — `price:0` products are still
   accepted by product creation at High (only fully rejected at Stable). Decide
   with the spec whether a $0 item is valid — a great "is this a bug or a
   feature?" discussion.

Everything else now matches the reference build. Two genuine defects remain by
design so advanced learners practise **state-based** and **lifecycle** testing
rather than single-request checks.

➡ Switch to **Stable** to see the fully correct behaviour and use it as your
regression baseline — see [stable.md](stable.md).
