// js/auth.js

function renderLogin() {
  const app = document.getElementById("app");
  app.innerHTML = `
    <div class="card">
      <h2>Login</h2>
      <label>Email</label>
      <input id="login-email" type="email" placeholder="you@example.com" />
      <label>Password</label>
      <input id="login-password" type="password" />
      <button class="primary" id="login-btn">Login</button>
      <p class="muted" style="margin-top:16px">
        No account? <button class="link" id="goto-register">Register</button>
      </p>
    </div>
  `;

  document.getElementById("login-btn").addEventListener("click", handleLogin);
  document.getElementById("goto-register").addEventListener("click", () => {
    navigate("register");
  });
}

function renderRegister() {
  const app = document.getElementById("app");
  app.innerHTML = `
    <div class="card">
      <h2>Create account</h2>
      <label>Username</label>
      <input id="reg-username" />
      <label>Email</label>
      <input id="reg-email" type="email" />
      <label>Password</label>
      <input id="reg-password" type="password" />
      <button class="primary" id="reg-btn">Register</button>
      <p class="muted" style="margin-top:16px">
        Already have an account? <button class="link" id="goto-login">Login</button>
      </p>
    </div>
  `;

  document.getElementById("reg-btn").addEventListener("click", handleRegister);
  document.getElementById("goto-login").addEventListener("click", () => {
    navigate("login");
  });
}

async function handleLogin() {
  const email = document.getElementById("login-email").value.trim();
  const password = document.getElementById("login-password").value;
  if (!email || !password) {
    toast("Email and password are required", "error");
    return;
  }
  try {
    const data = await api("/api/auth/login", {
      method: "POST",
      body: { email, password },
      auth: false,
    });
    auth.set(data.token, data.user);
    toast(`Welcome back, ${data.user.username}!`, "success");
    navigate("groups");
  } catch (err) {
    toast(err.message, "error");
  }
}

async function handleRegister() {
  const username = document.getElementById("reg-username").value.trim();
  const email = document.getElementById("reg-email").value.trim();
  const password = document.getElementById("reg-password").value;
  if (!username || !email || !password) {
    toast("All fields are required", "error");
    return;
  }
  try {
    const data = await api("/api/auth/register", {
      method: "POST",
      body: { username, email, password },
      auth: false,
    });
    auth.set(data.token, data.user);
    toast(`Account created — welcome, ${data.user.username}!`, "success");
    navigate("groups");
  } catch (err) {
    toast(err.message, "error");
  }
}