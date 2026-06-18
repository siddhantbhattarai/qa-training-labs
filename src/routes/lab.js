const express = require("express");
const { LEVELS, LEVEL_META, normalize, resolveLevel } = require("../lab/level");

const router = express.Router();

/**
 * @swagger
 * /api/lab/level:
 *   get:
 *     tags: [Lab]
 *     summary: Get the active difficulty level
 *     description: |
 *       Returns the difficulty level currently applied to YOUR requests and
 *       how it was decided (request header, cookie, or the default).
 *
 *       The same endpoints behave differently per level:
 *       **low** (beginner) → **medium** (boundary/negative) →
 *       **high** (business-logic/exploratory) → **stable** (correct reference).
 *     responses:
 *       200:
 *         description: Active level + catalogue of available levels
 */
router.get("/level", (req, res) => {
  const { level, source } = resolveLevel(req);
  res.json({
    level,
    source, // "header" | "cookie" | "default"
    meta: LEVEL_META[level],
    available: LEVELS.map((l) => ({ level: l, ...LEVEL_META[l] })),
    howToSwitch: {
      ui: "Use the level dropdown in the top navigation bar.",
      api: "Send an 'X-QA-Level: low|medium|high|stable' header on any request.",
      browser: "POST /api/lab/level { level } to set the qa_level cookie.",
    },
  });
});

/**
 * @swagger
 * /api/lab/level:
 *   post:
 *     tags: [Lab]
 *     summary: Set the difficulty level (stored in a cookie for this browser)
 *     description: |
 *       Persists the chosen level in a `qa_level` cookie so the whole site
 *       (and the API, when called from this browser) runs at that difficulty.
 *       For headless tools like Postman, send the `X-QA-Level` header instead —
 *       it always wins over the cookie.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [level]
 *             properties:
 *               level:
 *                 type: string
 *                 enum: [low, medium, high, stable]
 *                 example: medium
 *     responses:
 *       200:
 *         description: Level set
 *       400:
 *         description: Unknown level
 */
router.post("/level", (req, res) => {
  const level = normalize(req.body && req.body.level);
  if (!level) {
    return res
      .status(400)
      .json({ message: `Invalid level. Choose one of: ${LEVELS.join(", ")}` });
  }
  // 1 year, lax so normal navigation keeps it; not httpOnly so the UI can read it.
  res.cookie
    ? res.cookie("qa_level", level, {
        maxAge: 365 * 24 * 60 * 60 * 1000,
        sameSite: "lax",
        path: "/",
      })
    : res.setHeader(
        "Set-Cookie",
        `qa_level=${level}; Max-Age=${365 * 24 * 60 * 60}; Path=/; SameSite=Lax`
      );
  res.json({ message: `Difficulty set to "${level}"`, level, meta: LEVEL_META[level] });
});

module.exports = router;
