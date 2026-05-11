// js/app.js

/**
 * Tiny hash-based router.
 * URL like http://localhost:5500/#groups → screen "groups"
 * URL like http://localhost:5500/#group/3 → screen "group" with id 3
 *
 * Why hashes? They don't trigger a server reload — perfect for SPAs without
 * needing server-side rewrites.
 */
function navigate(route) {
  if (window.location.hash === `#${route}`) {
    render();
  } else {
    window.location.hash = route;
  }
}

function render() {
  const hash = window.location.hash.replace(/^#/, "") || (auth.isLoggedIn() ? "groups" : "login");

  // Auth gate
  const publicRoutes = ["login", "register"];
  if (!auth.isLoggedIn() && !publicRoutes.includes(hash.split("/")[0])) {
    navigate("login");
    return;
  }
  if (auth.isLoggedIn() && publicRoutes.includes(hash)) {
    navigate("groups");
    return;
  }

  renderNav();

  // Route dispatch
  if (hash === "login") return renderLogin();
  if (hash === "register") return renderRegister();
  if (hash === "groups") return renderGroups();

  const groupMatch = hash.match(/^group\/(\d+)$/);
  if (groupMatch) return renderGroupDetails(groupMatch[1]);

  // Fallback
  navigate(auth.isLoggedIn() ? "groups" : "login");
}

function renderNav() {
  const nav = document.getElementById("nav");
  if (!auth.isLoggedIn()) { nav.innerHTML = ""; return; }
  const user = auth.getUser();
  nav.innerHTML = `
    <span class="muted">Hi, ${escapeHtml(user.username)}</span>
    <button id="logout-btn">Logout</button>
  `;
  document.getElementById("logout-btn").addEventListener("click", () => {
    auth.clear();
    navigate("login");
  });
}

// Re-render whenever the URL hash changes
window.addEventListener("hashchange", render);
window.addEventListener("DOMContentLoaded", render);