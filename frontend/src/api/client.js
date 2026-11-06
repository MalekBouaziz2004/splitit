import { clearSession, getToken } from "./session.js";

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

// Paths match the existing Express routes, for example "/api/groups".
// Vite proxies /api in development; a deployment must serve it on the same origin.
export async function api(path, { method = "GET", body, auth = true, signal } = {}) {
  if (!/^\/api(?:\/|$)/.test(path)) {
    throw new TypeError("API path must start with /api");
  }

  const token = auth ? getToken() : null;
  const headers = { Accept: "application/json" };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = `Bearer ${token}`;

  let response;
  try {
    response = await fetch(path, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
    });
  } catch (error) {
    if (error.name === "AbortError") throw error;
    throw new ApiError("Cannot reach the server. Is the backend running?", 0);
  }

  let data = null;
  try {
    data = await response.json();
  } catch {
    // DELETE responses and other endpoints may have no JSON body.
  }

  if (response.status === 401 && auth && token) clearSession();
  if (!response.ok) {
    throw new ApiError(data?.error || `Request failed (${response.status})`, response.status);
  }
  return data;
}
