# 🤖 Automation module

This is the **automation** half of the lab. You've been finding defects by
hand — now you'll catch them with code, the way a QA engineer does on a real
team, and wire it into **CI** so every push is tested automatically.

One framework — **[Playwright Test](https://playwright.dev/)** — covers both
layers you'll automate:

| Folder | Layer | What it does |
|--------|-------|--------------|
| `tests/api/` | **API tests** | Hit the REST endpoints directly — fast checks of status codes & business rules. |
| `tests/e2e/` | **E2E UI tests** | Drive a real Chromium browser through the app like a user (login, navigation). |

## Run it

```bash
npm install                 # first time only
npx playwright install chromium

npm test            # everything (auto-starts the lab, runs API + E2E)
npm run test:api    # API tests only
npm run test:e2e    # browser tests only
npm run test:smoke  # just the quick smoke checks
npm run test:headed # watch the browser drive itself
npm run test:report # open the last HTML report
```

`npm test` **starts the lab for you** (`webServer` in `playwright.config.js`),
so you don't need a separate terminal running `npm start`.

## Test a deployed instance instead of localhost

The lab is hosted on Render, not just `localhost:3000`. Point the suite at any
running instance with `BASE_URL` — it then skips the local auto-start and tests
that URL:

```bash
# Smoke-test the live demo (read-only checks only — recommended for prod)
BASE_URL=https://qa-training-labs.onrender.com npm run test:smoke
```

> ⚠️ Don't run the **full** suite against the shared demo — the API specs
> create users and add to carts. The setup will also refuse to (re)seed an
> external target. Run the full suite against **your own** instance
> (`localhost` or your own deploy).

## The key idea: encode the difficulty levels

Look at [`tests/api/defect-detection.spec.js`](api/defect-detection.spec.js).
Each test asserts the **correct** behaviour (what *Stable* does) and runs it
against **every** level. For levels that still carry the defect we mark the test
`test.fail()` — Playwright then *expects* the correctness check to fail and keeps
the suite green, while flagging it as a known bug:

```
✓  invalid product id returns 400, not 500  [@stable]   ← correct
✘  invalid product id returns 400, not 500  [@low]      ← expected fail (the bug)
```

If someone later *fixes* a low-level bug, its test starts passing unexpectedly
and Playwright tells you to update the expectation. That's a real regression
suite: "known bug here, expected fixed there."

## CI

[`.github/workflows/ci.yml`](../.github/workflows/ci.yml) runs this whole suite
on every push and pull request — it boots a fresh zero-config instance in the
runner, runs the tests, and uploads the HTML report as an artifact. **No
database or secrets required.**

## Also here: Postman → CI with Newman

The Postman collection in [`/postman`](../postman) can run headless via Newman
(start the lab first):

```bash
npm start &                 # in one terminal
npm run test:postman        # Newman runs the collection against localhost:3000
```

## Your turn (exercises)

1. Add an API test: at `stable`, creating a product with `price: 0` should be
   rejected (`400`). Which levels carry that defect? Mark them `test.fail()`.
2. Add an E2E test: log in, open **Products**, add one to the cart, and assert
   the cart count updates.
3. Add a `discount > 100` test across all four levels and find where it's caught.
