import { useState } from "react";
import { api } from "./api/client.js";

export default function AuthForm({ mode, navigate, notify, onAuthenticated }) {
  const isRegister = mode === "register";
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    if (submitting) return;

    const cleanUsername = username.trim();
    const cleanEmail = email.trim();
    if (!cleanEmail || !password || (isRegister && !cleanUsername)) {
      notify(isRegister ? "All fields are required" : "Email and password are required", "error");
      return;
    }
    if (isRegister && password.length < 6) {
      notify("Password must be at least 6 characters", "error");
      return;
    }

    setSubmitting(true);
    try {
      const { token, user } = await api(`/api/auth/${mode}`, {
        method: "POST",
        body: isRegister
          ? { username: cleanUsername, email: cleanEmail, password }
          : { email: cleanEmail, password },
        auth: false,
      });
      onAuthenticated(token, user, isRegister);
    } catch (error) {
      notify(error.message, "error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="card">
      <h2>{isRegister ? "Create account" : "Login"}</h2>
      <form onSubmit={handleSubmit} noValidate>
        {isRegister && (
          <>
            <label htmlFor="auth-username">Username</label>
            <input
              id="auth-username"
              autoComplete="username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
            />
          </>
        )}

        <label htmlFor="auth-email">Email</label>
        <input
          id="auth-email"
          type="email"
          autoComplete="email"
          placeholder={isRegister ? undefined : "you@example.com"}
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />

        <label htmlFor="auth-password">Password</label>
        <input
          id="auth-password"
          type="password"
          autoComplete={isRegister ? "new-password" : "current-password"}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />

        <button className="primary" type="submit" disabled={submitting}>
          {isRegister ? "Register" : "Login"}
        </button>
      </form>
      <p className="muted" style={{ marginTop: 16 }}>
        {isRegister ? "Already have an account? " : "No account? "}
        <button
          className="link"
          type="button"
          onClick={() => navigate(isRegister ? "login" : "register")}
        >
          {isRegister ? "Login" : "Register"}
        </button>
      </p>
    </div>
  );
}
