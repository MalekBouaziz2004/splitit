// js/groups.js

async function renderGroups() {
  const app = document.getElementById("app");
  app.innerHTML = `
    <div class="card">
      <h2>Create a group</h2>
      <label>Name</label>
      <input id="g-name" placeholder="Berlin Trip" />
      <label>Description (optional)</label>
      <input id="g-desc" />
      <button class="primary" id="create-group-btn">Create</button>
    </div>
    <div class="card">
      <h2>Your groups</h2>
      <ul class="list" id="groups-list"><li class="muted">Loading…</li></ul>
    </div>
  `;

  document.getElementById("create-group-btn").addEventListener("click", handleCreateGroup);
  await loadGroups();
}

async function loadGroups() {
  try {
    const data = await api("/api/groups");
    const ul = document.getElementById("groups-list");
    if (data.groups.length === 0) {
      ul.innerHTML = `<li class="muted">No groups yet. Create one above!</li>`;
      return;
    }
    ul.innerHTML = data.groups.map((g) => `
      <li data-group-id="${g.id}">
        <div>
          <strong>${escapeHtml(g.name)}</strong>
          <div class="muted">${g.member_count} member(s)</div>
        </div>
        <span>›</span>
      </li>
    `).join("");

    // Click on a group → open its details
    ul.querySelectorAll("li[data-group-id]").forEach((li) => {
      li.addEventListener("click", () => {
        const id = li.getAttribute("data-group-id");
        navigate(`group/${id}`);
      });
    });
  } catch (err) {
    toast(err.message, "error");
  }
}

async function handleCreateGroup() {
  const name = document.getElementById("g-name").value.trim();
  const description = document.getElementById("g-desc").value.trim();
  if (!name) { toast("Name is required", "error"); return; }
  try {
    await api("/api/groups", {
      method: "POST",
      body: { name, description: description || undefined },
    });
    toast("Group created", "success");
    document.getElementById("g-name").value = "";
    document.getElementById("g-desc").value = "";
    await loadGroups();
  } catch (err) {
    toast(err.message, "error");
  }
}

async function renderGroupDetails(groupId) {
  const app = document.getElementById("app");
  app.innerHTML = `<div class="card"><p class="muted">Loading…</p></div>`;

  try {
    const [groupData, balanceData] = await Promise.all([
      api(`/api/groups/${groupId}`),
      api(`/api/groups/${groupId}/balances`),
    ]);
    const { group, members } = groupData;
    const { balances, settlement } = balanceData;
    const me = auth.getUser();

    app.innerHTML = `
      <div class="card">
        <button class="link" id="back-btn">← Back to groups</button>
        <h2>${escapeHtml(group.name)}</h2>
        ${group.description ? `<p class="muted">${escapeHtml(group.description)}</p>` : ""}
      </div>

      <div class="card">
        <h3>Members</h3>
        <ul class="list">
          ${members.map((m) => `
            <li>
              <span>${escapeHtml(m.username)} ${m.id === group.created_by ? "<span class='muted'>(creator)</span>" : ""}</span>
              ${m.id !== group.created_by && (m.id === me.id || me.id === group.created_by)
                ? `<button class="danger" data-remove-id="${m.id}">Remove</button>` : ""}
            </li>
          `).join("")}
        </ul>
        <label>Add member by username or email</label>
        <input id="new-member" placeholder="username or email" />
        <button class="primary" id="add-member-btn">Add</button>
      </div>

      <div class="card">
        <h3>Balances</h3>
        <ul class="list">
          ${balances.map((b) => `
            <li>
              <span>${escapeHtml(b.username)}</span>
              <span class="${b.balance > 0 ? "balance-pos" : b.balance < 0 ? "balance-neg" : ""}">
                ${b.balance > 0 ? "+" : ""}${b.balance.toFixed(2)} €
              </span>
            </li>
          `).join("")}
        </ul>
        <h3 style="margin-top:24px">Settlement</h3>
        ${settlement.length === 0
          ? `<p class="muted">All settled up! 🎉</p>`
          : `<ul class="list">
              ${settlement.map((t) => `
                <li>
                  <span><strong>${escapeHtml(t.fromUsername)}</strong> pays <strong>${escapeHtml(t.toUsername)}</strong></span>
                  <span>${t.amount.toFixed(2)} €</span>
                </li>
              `).join("")}
            </ul>`
        }
      </div>

      <div class="card">
        <h3>Expenses</h3>
        <button class="primary" id="add-expense-btn">+ Add expense</button>
        <ul class="list" id="expenses-list" style="margin-top:16px"></ul>
      </div>
    `;

    document.getElementById("back-btn").addEventListener("click", () => navigate("groups"));
    document.getElementById("add-member-btn").addEventListener("click", () => handleAddMember(groupId));
    document.getElementById("add-expense-btn").addEventListener("click", () => renderExpenseForm(groupId, members));

    document.querySelectorAll("button[data-remove-id]").forEach((btn) => {
      btn.addEventListener("click", () => handleRemoveMember(groupId, btn.getAttribute("data-remove-id")));
    });

    await loadExpenses(groupId, members);
  } catch (err) {
    toast(err.message, "error");
    navigate("groups");
  }
}

async function handleAddMember(groupId) {
  const value = document.getElementById("new-member").value.trim();
  if (!value) return;
  const body = value.includes("@") ? { email: value } : { username: value };
  try {
    await api(`/api/groups/${groupId}/members`, { method: "POST", body });
    toast("Member added", "success");
    renderGroupDetails(groupId);
  } catch (err) {
    toast(err.message, "error");
  }
}

async function handleRemoveMember(groupId, memberId) {
  if (!confirm("Remove this member?")) return;
  try {
    await api(`/api/groups/${groupId}/members/${memberId}`, { method: "DELETE" });
    toast("Member removed", "success");
    renderGroupDetails(groupId);
  } catch (err) {
    toast(err.message, "error");
  }
}

/**
 * Tiny HTML escape for safety (so usernames don't break the DOM).
 */
function escapeHtml(str) {
  return String(str ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}