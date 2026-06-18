# 📝 QA Reporting Guide

Finding a bug is only half the job — a bug that isn't **reported well** often
never gets fixed. This guide teaches you to write bug reports and test reports
that a developer can act on immediately. It's written for this lab, but the
format is exactly what you'll use on a real team.

---

## 1. Anatomy of a great bug report

A good report answers four questions fast: **What's wrong? How do I see it for
myself? How bad is it? What did you expect?**

| Field | What goes here | Example (from this lab) |
|-------|----------------|--------------------------|
| **ID** | Unique reference | `BUG-014` |
| **Title** | One line: *[area] what + where* | "Cart: quantity 0 is accepted when adding an item" |
| **Environment** | Build/level, URL, browser, account | Level **Low**, `localhost:3000`, Chrome 124, user@qalab.com |
| **Preconditions** | State needed before you start | Logged in; at least one product seeded |
| **Steps to Reproduce** | Numbered, exact, repeatable | see below |
| **Expected Result** | What *should* happen (cite the spec / Stable build) | "API rejects with 400; item not added" |
| **Actual Result** | What *did* happen, with evidence | "API returns 200; cart now has a 0-qty line" |
| **Severity** | Impact on the product | Medium |
| **Priority** | How soon to fix | Medium |
| **Evidence** | Screenshot, response body, logs, request id | JSON response, screenshot |
| **Notes** | Anything else (workaround, frequency) | Reproduces 100% of the time |

### Worked example

```
ID:            BUG-014
Title:         Cart accepts quantity 0 when adding an item
Environment:   Level=Low, http://localhost:3000, Chrome 124, user@qalab.com
Preconditions: Logged in; product "Wireless Mouse" exists
Steps:
  1. POST /api/cart/add with body { "productId": "<id>", "quantity": 0 }
  2. GET /api/cart
Expected:      Step 1 returns 400 Bad Request; the item is NOT added
               (verified on the Stable build, which returns 400)
Actual:        Step 1 returns 200 OK; GET /api/cart shows a line with quantity 0
Severity:      Medium  (lets users create meaningless cart state / 0-qty orders)
Priority:      Medium
Evidence:      response-bug014.json, cart-screenshot.png
Notes:         100% reproducible. Also accepts negative quantities.
```

> 💡 **Pro tip — use the Stable level to write your "Expected Result".** Run the
> same steps with `X-QA-Level: stable`; whatever it does is the documented
> correct behaviour. That single trick makes every report airtight.

---

## 2. Severity vs Priority (they are NOT the same)

- **Severity** = how badly it affects the product (a technical/impact judgement).
- **Priority** = how soon the team should fix it (a business/scheduling judgement).

A typo in the footer is **low severity** but might be **high priority** before a
big demo. A crash on a screen nobody uses is **high severity, low priority**.

| Severity | Meaning | Lab examples |
|----------|---------|--------------|
| **Critical** | Data loss / crash / blocks core flow for everyone | Open `DELETE /api/seed/reset` wipes the whole DB; server 500 on a normal action |
| **High** | Major feature broken; wrong account permissions; money/stock wrong | Register as admin; order charges stale price; stock never decremented |
| **Medium** | Feature works but with a clear defect / bad validation | Quantity 0 accepted; duplicate cart lines; wrong status code (500 vs 400) |
| **Low** | Minor / cosmetic / edge polish | Float noise in cart total (`89.97000000001`); over-long name accepted |

| Priority | Meaning |
|----------|---------|
| **P1 – Urgent** | Fix now; blocks release or testing |
| **P2 – High** | Fix this sprint |
| **P3 – Medium** | Schedule soon |
| **P4 – Low** | Fix when convenient / backlog |

---

## 3. Writing reproducible steps

Bad: *"Adding to cart is broken."*
Good: a numbered list anyone can follow to the exact same result.

Rules:
1. Start from a known state (say the level, the account, the data).
2. One action per step. Include the **exact** input (URL, method, body, button).
3. End with the observable result and how you measured it.
4. State the reproduction rate (always / intermittent / once).
5. Attach evidence — for an API, paste the **request and the response body**.

---

## 4. Bug lifecycle (status values)

`New → Triaged → In Progress → Fixed → Ready for Retest → Closed`
(or **Reopened** if your retest still fails, or **Won't Fix / By Design** after triage).

When you **retest a fix**, this lab gives you a superpower: compare the buggy
level against **Stable**. If the fixed behaviour now matches Stable, close it.

---

## 5. From single bugs to a Test Report

When you finish a testing session, summarise it. A **Test Summary Report**
tells stakeholders what you covered and whether it's safe to ship.

```
Test Summary — QA Training Lab
Date:        2026-06-18
Tester:      <name>
Scope:       Cart & Orders, Levels Low + Medium
Build/Level: Low, then Medium  (http://localhost:3000)

Executed:    24 test cases
  Passed:    17
  Failed:    7   (see BUG-011 .. BUG-017)
  Blocked:   0

Key risks:
  - HIGH: orders never decrement stock (BUG-028) — overselling possible
  - MED:  duplicate cart lines and 0-qty adds (BUG-014, BUG-024)

Regression note:
  Re-ran the Low failures at Medium: 4 fixed, 3 still failing,
  2 NEW boundary failures appeared (over-stock add, profile role change).

Recommendation: not ready to ship cart/order flow; retest after fixes.
```

A good summary has: scope, what you ran, pass/fail/blocked counts, the top risks
in plain language, and a clear recommendation.

---

## 6. Templates (downloadable)

Ready-to-use templates live in [`templates/`](templates/):

| File | Use |
|------|-----|
| [`bug-report-template.md`](templates/bug-report-template.md) | One bug, full detail (Markdown) |
| [`bug-report-template.csv`](templates/bug-report-template.csv) | Many bugs in a spreadsheet |
| [`test-case-template.csv`](templates/test-case-template.csv) | Plan test cases before you run them |
| [`test-summary-template.md`](templates/test-summary-template.md) | End-of-session summary report |

---

## 7. Practice loop (do this for every feature)

1. Pick a feature and a level (start at **Low**).
2. Write 3–5 **test cases** first (use the template) — including negative & boundary cases.
3. Execute them; for each failure, file a **bug report**.
4. Switch up a level and **retest** — note what's fixed and what new edge case appears.
5. Confirm "Expected Result" against **Stable**.
6. Write a one-paragraph **test summary**.

Do that across the curriculum and you'll have a portfolio of real QA artifacts.
