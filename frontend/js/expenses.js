// js/expenses.js

async function loadExpenses(groupId, members) {
  try {
    const data = await api(`/api/groups/${groupId}/expenses`);
    const ul = document.getElementById("expenses-list");
    if (data.expenses.length === 0) {
      ul.innerHTML = `<li class="muted">No expenses yet.</li>`;
      return;
    }
    const me = auth.getUser();
    ul.innerHTML = data.expenses.map((e) => `
      <li>
        <div>
          <strong>${escapeHtml(e.description)}</strong>
          <div class="muted">paid by ${escapeHtml(e.paid_by_username)} · ${new Date(e.created_at).toLocaleDateString()}</div>
        </div>
        <div style="display:flex; gap:12px; align-items:center;">
          <span>${Number(e.amount).toFixed(2)} €</span>
          ${e.paid_by === me.id
            ? `<button class="danger" data-del-id="${e.id}">Delete</button>` : ""}
        </div>
      </li>
    `).join("");

    ul.querySelectorAll("button[data-del-id]").forEach((btn) => {
      btn.addEventListener("click", () => handleDeleteExpense(groupId, btn.getAttribute("data-del-id")));
    });
  } catch (err) {
    toast(err.message, "error");
  }
}

function renderExpenseForm(groupId, members) {
  const app = document.getElementById("app");
  app.innerHTML = `
    <div class="card">
      <button class="link" id="back-btn">← Back to group</button>
      <h2>Add expense</h2>

      <label>Description</label>
      <input id="exp-desc" placeholder="Groceries" />

      <label>Amount (€)</label>
      <input id="exp-amount" type="number" step="0.01" min="0" />

      <label>Paid by</label>
      <select id="exp-paidby">
        ${members.map((m) => `<option value="${m.id}">${escapeHtml(m.username)}</option>`).join("")}
      </select>

      <label>Split between</label>
      <div id="participants">
        ${members.map((m) => `
          <label style="display:flex; align-items:center; gap:8px; font-weight:normal">
            <input type="checkbox" value="${m.id}" checked />
            ${escapeHtml(m.username)}
          </label>
        `).join("")}
      </div>

      <label>Split type</label>
      <select id="exp-splittype">
        <option value="equal">Equal</option>
        <option value="custom">Custom amounts</option>
      </select>

      <div id="custom-shares" class="hidden" style="margin-top:8px"></div>

      <button class="primary" id="save-exp-btn">Save expense</button>
    </div>
  `;

  document.getElementById("back-btn").addEventListener("click", () => navigate(`group/${groupId}`));

  // Show/hide custom-shares inputs
  document.getElementById("exp-splittype").addEventListener("change", (e) => {
    const wrap = document.getElementById("custom-shares");
    if (e.target.value === "custom") {
      wrap.classList.remove("hidden");
      const checked = [...document.querySelectorAll("#participants input:checked")];
      wrap.innerHTML = checked.map((cb) => {
        const m = members.find((x) => x.id === Number(cb.value));
        return `
          <label style="display:flex; align-items:center; gap:8px;">
            ${escapeHtml(m.username)}:
            <input type="number" step="0.01" min="0" data-share-for="${m.id}" />
          </label>
        `;
      }).join("");
    } else {
      wrap.classList.add("hidden");
    }
  });

  document.getElementById("save-exp-btn").addEventListener("click", () => handleSaveExpense(groupId, members));
}

async function handleSaveExpense(groupId, members) {
  const description = document.getElementById("exp-desc").value.trim();
  const amount = parseFloat(document.getElementById("exp-amount").value);
  const paidBy = parseInt(document.getElementById("exp-paidby").value, 10);
  const splitType = document.getElementById("exp-splittype").value;
  const participants = [...document.querySelectorAll("#participants input:checked")]
    .map((cb) => Number(cb.value));

  if (!description) return toast("Description is required", "error");
  if (!Number.isFinite(amount) || amount <= 0) return toast("Amount must be positive", "error");
  if (participants.length === 0) return toast("Pick at least one participant", "error");

  const body = { description, amount, paidBy, splitType, participants };

  if (splitType === "custom") {
    const shares = {};
    let total = 0;
    document.querySelectorAll("[data-share-for]").forEach((inp) => {
      const id = inp.getAttribute("data-share-for");
      const val = parseFloat(inp.value) || 0;
      shares[id] = val;
      total += val;
    });
    if (Math.abs(total - amount) > 0.01) {
      return toast(`Shares total ${total.toFixed(2)} but should be ${amount.toFixed(2)}`, "error");
    }
    body.shares = shares;
  }

  try {
    await api(`/api/groups/${groupId}/expenses`, { method: "POST", body });
    toast("Expense added", "success");
    navigate(`group/${groupId}`);
  } catch (err) {
    toast(err.message, "error");
  }
}

async function handleDeleteExpense(groupId, expenseId) {
  if (!confirm("Delete this expense?")) return;
  try {
    await api(`/api/groups/${groupId}/expenses/${expenseId}`, { method: "DELETE" });
    toast("Expense deleted", "success");
    renderGroupDetails(groupId);
  } catch (err) {
    toast(err.message, "error");
  }
}