/**
 * QA Training Lab — Difficulty Level switcher (front-end)
 * ------------------------------------------------------------------
 * Mirrors DVWA's security selector, but for QA practice. Persists the chosen
 * level in a cookie (so the server applies it) + localStorage (so the API
 * client can attach the X-QA-Level header), and injects a dropdown into the nav.
 */
(function () {
  const LEVELS = [
    { key: "low", label: "Low", color: "#22c55e", hint: "Beginner · obvious functional defects" },
    { key: "medium", label: "Medium", color: "#f59e0b", hint: "Intermediate · boundary & negative tests" },
    { key: "high", label: "High", color: "#ef4444", hint: "Advanced · business-logic & exploratory" },
    { key: "stable", label: "Stable", color: "#6366f1", hint: "Reference build · regression baseline" },
  ];
  const KEY = "qa_level";
  const valid = (l) => LEVELS.some((x) => x.key === l);

  function readCookie(name) {
    const m = document.cookie.match(new RegExp("(?:^|; )" + name + "=([^;]*)"));
    return m ? decodeURIComponent(m[1]) : null;
  }
  function get() {
    const fromCookie = readCookie(KEY);
    const fromStore = localStorage.getItem(KEY);
    const l = fromCookie || fromStore || "low";
    return valid(l) ? l : "low";
  }
  function set(level) {
    if (!valid(level)) return;
    localStorage.setItem(KEY, level);
    document.cookie = `${KEY}=${level}; path=/; max-age=${365 * 24 * 60 * 60}; samesite=lax`;
    // Best-effort sync to the server (sets the same cookie server-side too).
    try {
      fetch("/api/lab/level", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ level }),
      }).catch(() => {});
    } catch (e) {}
  }

  const QALevel = { LEVELS, get, set };
  window.QALevel = QALevel;

  function meta(key) {
    return LEVELS.find((x) => x.key === key) || LEVELS[0];
  }

  function injectSwitcher() {
    const navbar = document.querySelector(".navbar");
    if (!navbar || document.getElementById("qaLevelSwitcher")) return;

    const current = get();
    const wrap = document.createElement("div");
    wrap.id = "qaLevelSwitcher";
    wrap.className = "qa-level-switcher";
    wrap.title = "Difficulty level — the same feature gets buggier/cleaner as you change this";

    const options = LEVELS.map(
      (l) => `<option value="${l.key}" ${l.key === current ? "selected" : ""}>${l.label} — ${l.hint}</option>`
    ).join("");

    wrap.innerHTML = `
      <span class="qa-level-dot" style="background:${meta(current).color}"></span>
      <label class="qa-level-label">Level</label>
      <select id="qaLevelSelect" aria-label="QA difficulty level">${options}</select>
    `;

    // Place it just before the auth area if present, else append to navbar.
    const authArea = navbar.querySelector(".nav-auth, #navAuth");
    if (authArea) navbar.insertBefore(wrap, authArea);
    else navbar.appendChild(wrap);

    const select = wrap.querySelector("#qaLevelSelect");
    const dot = wrap.querySelector(".qa-level-dot");
    select.addEventListener("change", (e) => {
      const level = e.target.value;
      set(level);
      dot.style.background = meta(level).color;
      if (window.App && App.showToast) {
        App.showToast(`Difficulty set to "${meta(level).label}". Reloading…`, "info", 1500);
      }
      // Reload so freshly-fetched data reflects the new level everywhere.
      setTimeout(() => window.location.reload(), 400);
    });
  }

  // Make the new learning pages reachable from every page's nav without
  // having to hand-edit each navbar.
  function ensureNavLinks() {
    const links = document.querySelector(".nav-links");
    if (!links) return;
    const wanted = [
      { href: "/pages/curriculum.html", text: "Curriculum" },
      { href: "/pages/tools.html", text: "Tools" },
      { href: "/pages/reporting.html", text: "Reporting" },
    ];
    wanted.forEach((w) => {
      if (links.querySelector(`a[href="${w.href}"]`)) return;
      const a = document.createElement("a");
      a.href = w.href;
      a.className = "nav-link";
      a.textContent = w.text;
      if (window.location.pathname === w.href) a.classList.add("active");
      // Insert before the "API Docs" link if present, else append.
      const apiDocs = links.querySelector('a[href="/api/docs"]');
      if (apiDocs) links.insertBefore(a, apiDocs);
      else links.appendChild(a);
    });
  }

  function boot() {
    injectSwitcher();
    ensureNavLinks();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
