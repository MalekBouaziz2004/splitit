// js/api.js

const API_BASE = "http://localhost:3000";

/**
 * Token storage helpers.
 * We keep the raw token + the user object so we can show "Hi Malek"
 * without an extra request on every page load.
 */
const auth = {
  getToken() { return localStorage.getItem("token"); },
  getUser()  {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  },
  set(token, user) {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
  },
  clear() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  },
  isLoggedIn() { return !!this.getToken(); },
};

/**
 * Generic fetch wrapper.
 * - Adds JSON content-type
 * - Attaches the JWT if logged in
 * - Parses the JSON response
 * - Throws a nice Error on non-2xx responses
 */
async function api(path, { method = "GET", body, auth: needAuth = true } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (needAuth && auth.getToken()) {
    headers["Authorization"] = `Bearer ${auth.getToken()}`;
  }

  let res;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (networkErr) {
    throw new Error("Cannot reach the server. Is the backend running?");
  }

  // Handle expired/invalid token globally
  if (res.status === 401 && auth.isLoggedIn()) {
    auth.clear();
    window.location.reload();
    return;
  }

  let data = null;
  try { data = await res.json(); } catch { /* no body */ }

  if (!res.ok) {
    throw new Error(data?.error || `Request failed (${res.status})`);
  }
  return data;
}

/**
 * Toast notification — small bubble at the bottom-right.
 */
function toast(message, type = "") {
  const el = document.getElementById("toast");
  el.textContent = message;
  el.className = `toast ${type}`;
  setTimeout(() => el.classList.add("hidden"), 3000);
}