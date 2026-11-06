import { useEffect, useState } from "react";
import { api } from "./api/client.js";
import ExpenseForm from "./ExpenseForm.jsx";

const euroFormatter = new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" });

function formatAmount(value) {
  const amount = Number(value);
  return Number.isFinite(amount) ? euroFormatter.format(amount) : "—";
}

export default function ExpensesSection({ groupId, group, members, currentUser, notify, onChanged }) {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setLoadError(null);

    async function loadExpenses() {
      try {
        const data = await api(`/api/groups/${groupId}/expenses`, { signal: controller.signal });
        if (!controller.signal.aborted) setExpenses(data.expenses);
      } catch (caught) {
        if (!controller.signal.aborted) setLoadError(caught.message);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    loadExpenses();
    return () => controller.abort();
  }, [groupId, reloadKey]);

  function handleCreated() {
    setShowForm(false);
    setActionError(null);
    notify("Expense added", "success");
    setReloadKey((current) => current + 1);
    onChanged();
  }

  async function handleDelete(expenseId) {
    if (deletingId !== null || !window.confirm("Delete this expense?")) return;

    setDeletingId(expenseId);
    setActionError(null);
    try {
      await api(`/api/groups/${groupId}/expenses/${expenseId}`, { method: "DELETE" });
      notify("Expense deleted", "success");
      setReloadKey((current) => current + 1);
      onChanged();
    } catch (caught) {
      setActionError(caught.message);
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <>
      {showForm && (
        <ExpenseForm
          groupId={groupId}
          members={members}
          onCancel={() => setShowForm(false)}
          onCreated={handleCreated}
        />
      )}

      <div className="card">
        <h3>Expenses</h3>
        {!showForm && (
          <button className="primary" type="button" disabled={members.length === 0} onClick={() => setShowForm(true)}>
            + Add expense
          </button>
        )}
        {actionError && <p className="balance-neg" role="alert">{actionError}</p>}

        <div aria-live="polite" style={{ marginTop: 16 }}>
          {loading ? (
            <p className="muted" role="status">Loading expenses…</p>
          ) : loadError ? (
            <>
              <p className="balance-neg" role="alert">{loadError}</p>
              <button className="link" type="button" onClick={() => setReloadKey((current) => current + 1)}>
                Try again
              </button>
            </>
          ) : expenses.length === 0 ? (
            <p className="muted">No expenses yet.</p>
          ) : (
            <ul className="list">
              {expenses.map((expense) => {
                const canDelete = expense.paid_by === currentUser?.id || group.created_by === currentUser?.id;
                return (
                  <li key={expense.id}>
                    <div>
                      <strong>{expense.description}</strong>
                      <div className="muted">
                        paid by {expense.paid_by_username} · {new Date(expense.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                      <span>{formatAmount(expense.amount)}</span>
                      {canDelete && (
                        <button
                          className="danger"
                          type="button"
                          disabled={deletingId !== null}
                          onClick={() => handleDelete(expense.id)}
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}
