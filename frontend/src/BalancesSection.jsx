import { useEffect, useState } from "react";
import { api } from "./api/client.js";

const euroFormatter = new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" });

function formatEuro(amount) {
  return euroFormatter.format(amount);
}

export default function BalancesSection({ groupId, refreshKey }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    async function loadBalances() {
      try {
        const result = await api(`/api/groups/${groupId}/balances`, { signal: controller.signal });
        if (!controller.signal.aborted) setData(result);
      } catch (caught) {
        if (!controller.signal.aborted) setError(caught.message);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    loadBalances();
    return () => controller.abort();
  }, [groupId, refreshKey, retryKey]);

  return (
    <div className="card" aria-live="polite">
      <h3>Balances</h3>
      {loading ? (
        <p className="muted" role="status">Loading balances…</p>
      ) : error ? (
        <>
          <p className="balance-neg" role="alert">{error}</p>
          <button className="link" type="button" onClick={() => setRetryKey((current) => current + 1)}>
            Try again
          </button>
        </>
      ) : (
        <>
          {data.balances.length === 0 ? (
            <p className="muted">No balances to show.</p>
          ) : (
            <ul className="list">
              {data.balances.map((member) => (
                <li key={member.userId}>
                  <span>{member.username}</span>
                  <span className={member.balance > 0 ? "balance-pos" : member.balance < 0 ? "balance-neg" : ""}>
                    {member.balance > 0 ? "+" : ""}{formatEuro(member.balance)}
                  </span>
                </li>
              ))}
            </ul>
          )}

          <h3 style={{ marginTop: 24 }}>Suggested settlement</h3>
          {data.settlement.length === 0 ? (
            <p className="muted">All settled up! 🎉</p>
          ) : (
            <ul className="list">
              {data.settlement.map((transfer, index) => (
                <li key={`${transfer.from}-${transfer.to}-${index}`}>
                  <span><strong>{transfer.fromUsername}</strong> pays <strong>{transfer.toUsername}</strong></span>
                  <span>{formatEuro(transfer.amount)}</span>
                </li>
              ))}
            </ul>
          )}
          <p className="muted">These transfers are suggestions only; payments cannot be recorded here.</p>
          <button className="link" type="button" onClick={() => setRetryKey((current) => current + 1)}>
            Reload balances
          </button>
        </>
      )}
    </div>
  );
}
