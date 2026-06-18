/**
 * QA Training Lab — Difficulty Level Engine
 * ------------------------------------------------------------------
 * Borrows DVWA's "switch the difficulty" idea, but applied to QA defects
 * (functional, validation, business-logic, error-handling) — NOT security
 * exploitation. The goal is to teach the craft of testing.
 *
 * The SAME feature behaves differently depending on the active level, so a
 * learner can practise the same test at increasing difficulty:
 *
 *   low     → obvious functional defects. A beginner finds them with smoke
 *             and basic functional testing.
 *   medium  → the obvious case is fixed, but a boundary / negative / edge
 *             variant of the same defect is still broken (BVA territory).
 *   high    → subtle business-logic & integration defects, only found by
 *             exploratory testing and combining steps.
 *   stable  → the correct reference build. Nothing to find here — use it to
 *             learn the expected behaviour and as a regression baseline to
 *             diff the buggy levels against.
 *
 * How the active level is resolved (first match wins):
 *   1. `X-QA-Level` request header   → best for API / Postman / per-request
 *   2. `qa_level` cookie             → set by the UI level switcher
 *   3. server default (LOW)          → fresh start
 *
 * Nothing here is global mutable state, so multiple learners hitting the
 * same server never clobber each other's chosen level.
 */

const LEVELS = ["low", "medium", "high", "stable"];
const DEFAULT_LEVEL = "low";

const LEVEL_META = {
  low: {
    label: "Low",
    tagline: "Beginner — obvious functional defects (smoke & functional testing)",
    color: "#22c55e",
  },
  medium: {
    label: "Medium",
    tagline: "Intermediate — boundary & negative cases (BVA, equivalence partitioning)",
    color: "#f59e0b",
  },
  high: {
    label: "High",
    tagline: "Advanced — subtle business-logic & integration defects (exploratory + regression)",
    color: "#ef4444",
  },
  stable: {
    label: "Stable",
    tagline: "Reference build — correct behaviour, your regression baseline",
    color: "#6366f1",
  },
};

function isValidLevel(level) {
  return typeof level === "string" && LEVELS.includes(level.toLowerCase());
}

function normalize(level) {
  return isValidLevel(level) ? level.toLowerCase() : null;
}

/** Tiny cookie reader so we don't pull in cookie-parser as a dependency. */
function readCookie(req, name) {
  const header = req.headers.cookie;
  if (!header) return null;
  for (const part of header.split(";")) {
    const idx = part.indexOf("=");
    if (idx === -1) continue;
    const key = part.slice(0, idx).trim();
    if (key === name) return decodeURIComponent(part.slice(idx + 1).trim());
  }
  return null;
}

/** Resolve the active level for this request and remember the source. */
function resolveLevel(req) {
  const fromHeader = normalize(req.headers["x-qa-level"]);
  if (fromHeader) return { level: fromHeader, source: "header" };

  const fromCookie = normalize(readCookie(req, "qa_level"));
  if (fromCookie) return { level: fromCookie, source: "cookie" };

  return { level: DEFAULT_LEVEL, source: "default" };
}

/**
 * Express middleware: attach `req.qaLevel` and echo it back on the response
 * so testers can always confirm which level they exercised.
 */
function attachLevel(req, res, next) {
  const { level, source } = resolveLevel(req);
  req.qaLevel = level;
  req.qaLevelSource = source;
  res.setHeader("X-QA-Level", level);
  next();
}

/** Convenience comparators used throughout the behaviour module. */
const is = (level, target) => level === target;
const atLeast = (level, target) =>
  LEVELS.indexOf(level) >= LEVELS.indexOf(target);

module.exports = {
  LEVELS,
  DEFAULT_LEVEL,
  LEVEL_META,
  isValidLevel,
  normalize,
  resolveLevel,
  attachLevel,
  is,
  atLeast,
};
