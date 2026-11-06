import { useEffect, useState } from "react";
import AuthForm from "./AuthForm.jsx";
import {
  AUTH_CHANGED_EVENT,
  clearSession,
  getToken,
  getUser,
  setSession,
} from "./api/session.js";

function readRoute() {
  return window.location.hash.replace(/^#/, "");
}

function navigate(route) {
  window.location.hash = route;
}

export default function App() {
  const [route, setRoute] = useState(readRoute);
  const [session, setCurrentSession] = useState(() => ({
    token: getToken(),
    user: getUser(),
  }));
  const [notice, setNotice] = useState(null);

  useEffect(() => {
    const syncRoute = () => setRoute(readRoute());
    const syncSession = () => setCurrentSession({ token: getToken(), user: getUser() });
    window.addEventListener("hashchange", syncRoute);
    window.addEventListener(AUTH_CHANGED_EVENT, syncSession);
    return () => {
      window.removeEventListener("hashchange", syncRoute);
      window.removeEventListener(AUTH_CHANGED_EVENT, syncSession);
    };
  }, []);

  const activeRoute = session.token ? "groups" : route === "register" ? "register" : "login";
  useEffect(() => {
    if (route !== activeRoute) navigate(activeRoute);
  }, [route, activeRoute]);

  useEffect(() => {
    if (!notice) return;
    const timeout = window.setTimeout(() => setNotice(null), 3000);
    return () => window.clearTimeout(timeout);
  }, [notice]);

  function notify(message, type) {
    setNotice({ message, type });
  }

  function onAuthenticated(token, user, isRegister) {
    setSession(token, user);
    notify(
      isRegister ? `Account created — welcome, ${user.username}!` : `Welcome back, ${user.username}!`,
      "success",
    );
    navigate("groups");
  }

  function logout() {
    clearSession();
    navigate("login");
  }

  return (
    <>
      <header className="topbar">
        <h1 className="logo">💸 SplitIt</h1>
        {session.token && (
          <nav>
            <span className="muted">Hi, {session.user?.username ?? "User"}</span>
            <button type="button" onClick={logout}>Logout</button>
          </nav>
        )}
      </header>

      <main>
        {activeRoute === "groups" ? (
          <div className="card">
            <h2>Groups</h2>
            <p className="muted">The groups view has not been migrated to React yet.</p>
          </div>
        ) : (
          <AuthForm
            key={activeRoute}
            mode={activeRoute}
            navigate={navigate}
            notify={notify}
            onAuthenticated={onAuthenticated}
          />
        )}
      </main>

      {notice && (
        <div className={`toast ${notice.type}`} role={notice.type === "error" ? "alert" : "status"}>
          {notice.message}
        </div>
      )}
    </>
  );
}
