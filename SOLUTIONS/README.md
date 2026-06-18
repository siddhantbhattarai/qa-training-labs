# 🔑 Instructor Answer Keys

> **Spoiler warning — instructors & self-checkers only.** If you're a learner,
> try to find the defects yourself first, write them up, then check here.

This folder is the ground truth for **what is broken at each difficulty level**
and **what the correct behaviour is**. It lines up 1:1 with the single source of
truth in code: [`src/lab/behaviors.js`](../src/lab/behaviors.js).

## How difficulty works

The **same feature** behaves differently per level. As you move up, the obvious
defect is fixed but a subtler variant often remains — so learners practise the
same test with increasing rigour.

| Level | Who it's for | What you practise |
|-------|--------------|-------------------|
| **Low** | Beginner | Smoke & functional testing — defects are obvious. |
| **Medium** | Intermediate | Boundary value analysis, equivalence partitioning, negative testing. |
| **High** | Advanced | Business-logic, integration & exploratory testing; combining steps. |
| **Stable** | Everyone | The **correct reference build**. Nothing to find — use it to learn expected behaviour and as a **regression baseline** to diff the buggy levels against. |

Switch level from the **navbar dropdown**, or send an **`X-QA-Level: low|medium|high|stable`** header (Postman/curl), or `POST /api/lab/level {level}`.

## The defect matrix (feature × level)

✗ = defect present (something for a tester to find) · ✓ = behaves correctly

| # | Feature / Test | Low | Medium | High | Stable |
|---|----------------|:---:|:------:|:----:|:------:|
| 1 | Register honours `role` from body (wrong account type) | ✗ | ✓ | ✓ | ✓ |
| 2 | Edit-profile changes `role`/`isActive` from body | ✗ | ✗ | ✓ | ✓ |
| 3 | Password strength rule | ✗ weak (≥6) | ⚠ ≥8 | ⚠ letters+nums | ✓ strong |
| 4 | Email format validation | ✗ none | ⚠ "@" only | ⚠ basic | ✓ proper |
| 5 | Name max-length | ✗ none | ✗ none | ✓ | ✓ |
| 6 | Duplicate email → status code | ✗ 500 | ✓ 409 | ✓ 409 | ✓ 409 |
| 7 | Account locks after repeated failed logins | ✗ never | ✓ 10 | ✓ 5 | ✓ 5 |
| 8 | Old refresh token invalidated after refresh | ✗ no | ✓ | ✓ | ✓ |
| 9 | Token rejected after logout | ✗ no | ✗ no | ✓ | ✓ |
| 10 | Missing-auth status code consistent (401) | ✗ 403 | ✓ | ✓ | ✓ |
| 11 | Invalid-token error message clean (no internals) | ✗ leaks | ✓ | ✓ | ✓ |
| 12 | `/auth/me` & user endpoints hide password/internal fields | ✗ all | ⚠ pw only | ✓ | ✓ |
| 13 | Product list hides inactive products | ✗ shown | ✓ | ✓ | ✓ |
| 14 | Product list pagination (`page`/`limit`) | ✗ ignored | ✗ ignored | ✓ | ✓ |
| 15 | Bad ObjectId → 400 not 500 | ✗ 500 | ✓ 400 | ✓ 400 | ✓ 400 |
| 16 | Reject negative price | ✗ | ✓ | ✓ | ✓ |
| 17 | Reject discount > 100% | ✗ | ✗ | ✓ | ✓ |
| 18 | Reject zero price / negative stock | ✗ | ✗ | ✗ | ✓ |
| 19 | Product update only touches known fields | ✗ any | ⚠ most | ✓ | ✓ |
| 20 | Delete keeps references valid (soft delete) | ✗ hard | ✗ hard | ✓ soft | ✓ soft |
| 21 | Reject cart quantity ≤ 0 | ✗ | ✓ | ✓ | ✓ |
| 22 | Reject out-of-stock / over-stock add | ✗ | ⚠ stock>0 | ✓ vs qty | ✓ |
| 23 | Reject inactive product add | ✗ | ✗ | ✓ | ✓ |
| 24 | Merge duplicate cart lines | ✗ dupes | ✗ dupes | ✓ merge | ✓ merge |
| 25 | Cart total rounded (no float noise) | ✗ raw | ✓ | ✓ | ✓ |
| 26 | Removing a non-existent cart item → 404 | ✗ 200 | ✓ 404 | ✓ 404 | ✓ 404 |
| 27 | Reject ordering an empty cart | ✗ | ✓ | ✓ | ✓ |
| 28 | Require shipping address on order | ✗ | ✗ | ✓ | ✓ |
| 29 | Charge current price (not stale snapshot) | ✗ stale | ✗ stale | ✗ stale | ✓ current |
| 30 | Decrement stock on order | ✗ | ✗ | ✓ | ✓ |
| 31 | Clear cart after checkout | ✗ | ✗ | ✓ | ✓ |
| 32 | Order view restricted to owner | ✗ | ✓ | ✓ | ✓ |
| 33 | Order cancel restricted to owner | ✗ | ✗ | ✓ | ✓ |
| 34 | Order status value validated (400 not 500) | ✗ 500 | ✓ 400 | ✓ | ✓ |
| 35 | Order status lifecycle enforced (no illegal jumps) | ✗ | ✗ | ✓ 409 | ✓ 409 |
| 36 | Block cancelling a delivered order | ✗ | ✗ | ✓ | ✓ |
| 37 | Restore stock on cancellation | ✗ | ✗ | ✗ | ✓ |
| 38 | Admin can't delete their own account | ✗ | ✓ | ✓ | ✓ |
| 39 | Cascade carts/orders on user delete | ✗ | ✗ | ✓ | ✓ |
| 40 | Admin password update is hashed (not plaintext) | ✗ | ✗ | ✓ | ✓ |
| 41 | Destructive `DELETE /api/seed/reset` requires admin | ✗ open | ✗ open | ✓ | ✓ |
| 42 | Server 500s don't dump stack trace to client | ✗ leaks | ✓ | ✓ | ✓ |

Legend: **⚠** = improved but a subtler boundary/edge defect still remains at
that level (the teaching point — keep testing!).

## Per-level write-ups

- [low.md](low.md) — every defect a beginner should catch.
- [medium.md](medium.md) — what's fixed vs the boundary cases still open.
- [high.md](high.md) — the subtle business-logic/integration defects left.
- [stable.md](stable.md) — the reference build: expected behaviour for each feature.

## Suggested classroom flow

1. Learner tests a feature at **Low**, files bug reports (see
   [`REPORTING-GUIDE.md`](../REPORTING-GUIDE.md)).
2. Switch to **Medium/High** and re-test the same feature — which bugs are fixed?
   Which new boundary cases appear? (Great regression-testing practice.)
3. Switch to **Stable** to confirm the *expected* behaviour and validate that
   each earlier report was genuinely a defect.
