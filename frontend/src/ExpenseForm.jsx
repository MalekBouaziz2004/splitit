import { useState } from "react";
import { api } from "./api/client.js";

export default function ExpenseForm({ groupId, members, onCancel, onCreated }) {
  const [description, setDescription] = useState("");
  const [amountInput, setAmountInput] = useState("");
  const [paidBy, setPaidBy] = useState(String(members[0]?.id ?? ""));
  const [participants, setParticipants] = useState(() => members.map((member) => member.id));
  const [splitType, setSplitType] = useState("equal");
  const [shares, setShares] = useState({});
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  const selectedMembers = members.filter((member) => participants.includes(member.id));

  function toggleParticipant(memberId, checked) {
    setParticipants((current) => checked
      ? [...current, memberId]
      : current.filter((id) => id !== memberId));
    if (!checked) {
      setShares((current) => {
        const next = { ...current };
        delete next[memberId];
        return next;
      });
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (saving) return;

    const cleanDescription = description.trim();
    const amount = Number(amountInput);
    if (!cleanDescription) return setError("Description is required");
    if (!Number.isFinite(amount) || amount <= 0) return setError("Amount must be positive");
    if (!members.some((member) => member.id === Number(paidBy))) return setError("Pick a payer");
    if (selectedMembers.length === 0) return setError("Pick at least one participant");

    const body = {
      description: cleanDescription,
      amount,
      paidBy: Number(paidBy),
      splitType,
      participants: selectedMembers.map((member) => member.id),
    };

    if (splitType === "custom") {
      const customShares = {};
      let total = 0;
      for (const member of selectedMembers) {
        const raw = shares[member.id] ?? "";
        const share = raw.trim() === "" ? 0 : Number(raw);
        if (!Number.isFinite(share) || share < 0) {
          return setError(`Enter a valid share for ${member.username}`);
        }
        customShares[member.id] = share;
        total += share;
      }
      if (Math.abs(total - amount) > 0.01) {
        return setError(`Shares total ${total.toFixed(2)} but should be ${amount.toFixed(2)}`);
      }
      body.shares = customShares;
    }

    setSaving(true);
    setError(null);
    try {
      await api(`/api/groups/${groupId}/expenses`, { method: "POST", body });
      onCreated();
    } catch (caught) {
      setError(caught.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="card">
      <button className="link" type="button" disabled={saving} onClick={onCancel}>← Back to expenses</button>
      <h2>Add expense</h2>
      <form onSubmit={handleSubmit} noValidate>
        <label htmlFor="expense-description">Description</label>
        <input
          id="expense-description"
          placeholder="Groceries"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
        />

        <label htmlFor="expense-amount">Amount (€)</label>
        <input
          id="expense-amount"
          type="number"
          step="0.01"
          min="0.01"
          value={amountInput}
          onChange={(event) => setAmountInput(event.target.value)}
        />

        <label htmlFor="expense-payer">Paid by</label>
        <select id="expense-payer" value={paidBy} onChange={(event) => setPaidBy(event.target.value)}>
          {members.map((member) => (
            <option key={member.id} value={member.id}>{member.username}</option>
          ))}
        </select>

        <span className="muted" style={{ display: "block", marginTop: 12 }}>Split between</span>
        {members.map((member) => (
          <label key={member.id} style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: "normal" }}>
            <input
              type="checkbox"
              style={{ width: "auto" }}
              checked={participants.includes(member.id)}
              onChange={(event) => toggleParticipant(member.id, event.target.checked)}
            />
            {member.username}
          </label>
        ))}

        <label htmlFor="expense-split-type">Split type</label>
        <select id="expense-split-type" value={splitType} onChange={(event) => setSplitType(event.target.value)}>
          <option value="equal">Equal</option>
          <option value="custom">Custom amounts</option>
        </select>

        {splitType === "custom" && selectedMembers.map((member) => (
          <div key={member.id}>
            <label htmlFor={`expense-share-${member.id}`}>{member.username}'s share (€)</label>
            <input
              id={`expense-share-${member.id}`}
              type="number"
              step="0.01"
              min="0"
              value={shares[member.id] ?? ""}
              onChange={(event) => setShares((current) => ({ ...current, [member.id]: event.target.value }))}
            />
          </div>
        ))}

        <button className="primary" type="submit" disabled={saving}>Save expense</button>
        {error && <p className="balance-neg" role="alert">{error}</p>}
      </form>
    </div>
  );
}
