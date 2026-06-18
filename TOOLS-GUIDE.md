# 🧰 Tools You'll Use

The toolkit for testing this lab. Each tool links to its site, with notes on
**how to use it for this project**. Almost everything targets
`http://localhost:3000`; set the difficulty with the **Level** dropdown or the
`X-QA-Level` header.

> In-app version: open **[/pages/tools.html](public/pages/tools.html)** while the lab is running.

---

### 🌐 [Web Browser](https://www.google.com/chrome/) + [DevTools](https://developer.chrome.com/docs/devtools/) — *manual & UI testing, free*
Your main tool for manual testing. Press **F12** for DevTools.
- **Network tab** — click around the app and watch real API requests/responses (status codes, bodies). Check the `X-QA-Level` response header to confirm which level you tested.
- **Console tab** — read errors; `QALevel.get()` prints the active level.
- **Application → Cookies** — see the `qa_level` cookie the switcher sets.
- *Try:* open Network, add to cart, inspect the `POST /api/cart/add` call.

### 🎚️ Difficulty Switcher (built in) — *core to this lab*
The DVWA-style level control in the top bar.
- In the browser: pick **Low → Medium → High → Stable** and re-run the same test.
- For API tools: send a header.
  ```bash
  curl -s localhost:3000/api/products/bad-id -H "X-QA-Level: low"     # 500 (defect)
  curl -s localhost:3000/api/products/bad-id -H "X-QA-Level: stable"  # 400 (correct)
  ```
- *Tip:* write a bug report's **Expected Result** by running the same steps at `stable`.

### 📘 [Swagger UI](http://localhost:3000/api/docs) — *API exploration, built in*
Interactive docs at `/api/docs`, no install.
- Browse endpoints and read the "Defects to find" notes.
- **Try it out → Execute** to call an endpoint live.
- **Authorize** (top-right) with a JWT from `POST /api/auth/login` (admin@qalab.com / Admin@1234) so protected routes work.

### 📮 [Postman](https://www.postman.com/downloads/) — *API testing*
- **Import** `postman/QA-Training-Lab.postman_collection.json` + the environment in that folder.
- Set `baseUrl` to `http://localhost:3000`.
- Add a header `X-QA-Level: low` to the collection to run a whole pass at one level; change it and re-run for **regression**.

### 🏃 [Newman](https://github.com/postmanlabs/newman) — *run Postman from the CLI (intro to automation/CI)*
```bash
npm install -g newman
newman run postman/QA-Training-Lab.postman_collection.json \
  -e postman/QA-Lab-Local.postman_environment.json
```
Run at each level and compare which requests change — instant regression evidence.

### ⌨️ [curl](https://curl.se/) — *quick API checks, pre-installed*
```bash
# Log in and grab a token
TOKEN=$(curl -s localhost:3000/api/auth/login -H "Content-Type: application/json" \
  -d '{"email":"user@qalab.com","password":"User@1234"}' | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)

# Reproduce "quantity 0 accepted" at Low
curl -i localhost:3000/api/cart/add -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" -H "X-QA-Level: low" \
  -d '{"productId":"PASTE_ID","quantity":0}'
```
Paste the exact command + response into your bug report's Steps/Evidence.

### 🔎 [jq](https://jqlang.github.io/jq/) — *read JSON responses*
```bash
curl -s localhost:3000/api/products | jq '.[].name'
curl -s localhost:3000/api/products -H "X-QA-Level: low" | jq 'length'
```
Quickly check e.g. "does the list still include the inactive *Webcam HD* product?" per level.

### 📝 [Reporting Templates](http://localhost:3000/pages/reporting.html) — *document findings*
Bug report / test case / test summary templates (also in `templates/`). Fill one per defect; confirm the Expected Result against the **Stable** level.

### 🛠️ Optional extras
- [VS Code](https://code.visualstudio.com/) — read the source / keep notes. Level logic is in `src/lab/behaviors.js`.
- [MongoDB Compass](https://www.mongodb.com/products/compass) — only if you set a real `MONGODB_URI`; inspect data your tests create.
- [Hoppscotch](https://hoppscotch.io/) — a free, browser-based Postman alternative.

---

**Beginner path:** Browser + DevTools → Swagger → Postman/curl → jq → Reporting templates. Then automate with Newman.
