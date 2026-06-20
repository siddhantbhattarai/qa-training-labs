/**
 * QA Training Lab — Central navigation (two zones)
 * ------------------------------------------------------------------
 * The site is split into two clearly separated areas:
 *
 *   • "learn"  — notes & guidance (curriculum, guides, tools, interview,
 *                reporting, checklists, templates, scenarios, bug hunt).
 *                This is the front door / classroom.
 *
 *   • "lab"    — the actual app-under-test that students practise on
 *                (login, register, dashboard, products, cart, orders,
 *                profile). Reached via the "Start Training" button.
 *
 * Each page declares which zone it belongs to with <body data-zone="...">.
 * This module renders the correct navbar for that zone so the two worlds
 * never get mixed together again, and we never hand-edit 17 navbars.
 */
(function () {
  const LEARN_LINKS = [
    { href: "/", text: "Home" },
    { href: "/pages/curriculum.html", text: "Curriculum" },
    { href: "/pages/guide.html", text: "Guide" },
    { href: "/pages/tools.html", text: "Tools" },
    { href: "/pages/interview.html", text: "Interview" },
    { href: "/pages/reporting.html", text: "Reporting" },
    { href: "/pages/bugs.html", text: "Bug Hunt" },
  ];

  // Grouped under a "Resources" dropdown to keep the learn navbar tidy.
  const LEARN_RESOURCES = [
    { href: "/pages/checklist.html", text: "✅ QA Checklists" },
    { href: "/pages/test-cases.html", text: "📝 Test Case Templates" },
    { href: "/pages/test-scenarios.html", text: "📋 Test Scenarios" },
    { href: "/api/docs", text: "🔌 API Docs", target: "_blank" },
  ];

  const LAB_LINKS = [
    { href: "/", text: "← Learning Hub" },
    { href: "/pages/dashboard.html", text: "Dashboard" },
    { href: "/pages/products.html", text: "Products" },
    { href: "/pages/cart.html", text: "Cart" },
    { href: "/pages/orders.html", text: "Orders" },
    { href: "/pages/profile.html", text: "Profile" },
    { href: "/pages/bugs.html", text: "Bug Hunt" },
    { href: "/api/docs", text: "API Docs", target: "_blank" },
  ];

  const path = window.location.pathname;
  const onHome = path === "/" || path === "/index.html";
  const isActive = (href) => {
    if (href === "/api/docs") return false;
    if (href === "/") return onHome;
    return path === href;
  };

  function linkHtml(l) {
    const active = isActive(l.href) ? " active" : "";
    const target = l.target ? ` target="${l.target}"` : "";
    return `<a href="${l.href}" class="nav-link${active}"${target}>${l.text}</a>`;
  }

  function resourcesDropdown() {
    const items = LEARN_RESOURCES.map(
      (l) =>
        `<a href="${l.href}" class="nav-dropdown-item"${
          l.target ? ` target="${l.target}"` : ""
        }>${l.text}</a>`
    ).join("");
    return `
      <div class="nav-dropdown">
        <button type="button" class="nav-link nav-dropdown-toggle">Resources ▾</button>
        <div class="nav-dropdown-menu">${items}</div>
      </div>`;
  }

  function render() {
    const navbar = document.querySelector(".navbar");
    if (!navbar) return;
    const zone = document.body.dataset.zone === "lab" ? "lab" : "learn";

    // Brand
    const brand = navbar.querySelector(".nav-brand");
    if (brand) {
      const badge =
        zone === "lab"
          ? '<span class="nav-zone-badge lab">Practice Lab</span>'
          : "";
      brand.innerHTML = `
        <span class="logo">🧪</span>
        <a href="/" class="brand-text" style="text-decoration:none;">QA Training Lab</a>
        ${badge}`;
    }

    // Links
    const links = navbar.querySelector(".nav-links");
    if (links) {
      if (zone === "lab") {
        links.innerHTML = LAB_LINKS.map(linkHtml).join("");
      } else {
        links.innerHTML =
          LEARN_LINKS.map(linkHtml).join("") + resourcesDropdown();
      }
    }

    // Right-hand area.
    //   learn → a single "Start Training ▶" call-to-action (the door to the lab)
    //   lab   → left for auth.js (Hello / Logout) + qalevel switcher
    const authArea = navbar.querySelector(".nav-auth, #navAuth");
    if (authArea && zone === "learn") {
      authArea.innerHTML =
        '<a href="/pages/login.html" class="btn btn-primary nav-start-btn">Start Training ▶</a>';
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", render);
  } else {
    render();
  }
})();
