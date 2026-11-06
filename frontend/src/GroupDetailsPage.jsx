import { useEffect, useState } from "react";
import { api } from "./api/client.js";
import BalancesSection from "./BalancesSection.jsx";
import ExpensesSection from "./ExpensesSection.jsx";

export default function GroupDetailsPage({ groupId, currentUser, navigate, notify }) {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [memberInput, setMemberInput] = useState("");
  const [actionError, setActionError] = useState(null);
  const [actionPending, setActionPending] = useState(false);
  const [balanceRefreshKey, setBalanceRefreshKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setLoadError(null);

    async function loadDetails() {
      try {
        const data = await api(`/api/groups/${groupId}`, { signal: controller.signal });
        if (!controller.signal.aborted) setDetails(data);
      } catch (caught) {
        if (!controller.signal.aborted) setLoadError(caught.message);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    loadDetails();
    return () => controller.abort();
  }, [groupId, reloadKey]);

  async function handleAddMember(event) {
    event.preventDefault();
    if (actionPending) return;

    const value = memberInput.trim();
    if (!value) {
      setActionError("Username or email is required");
      return;
    }

    setActionPending(true);
    setActionError(null);
    try {
      await api(`/api/groups/${groupId}/members`, {
        method: "POST",
        body: value.includes("@") ? { email: value } : { username: value },
      });
      setMemberInput("");
      notify("Member added", "success");
      setReloadKey((current) => current + 1);
    } catch (caught) {
      setActionError(caught.message);
    } finally {
      setActionPending(false);
    }
  }

  async function handleRemoveMember(memberId) {
    if (actionPending || !window.confirm("Remove this member?")) return;

    setActionPending(true);
    setActionError(null);
    try {
      await api(`/api/groups/${groupId}/members/${memberId}`, { method: "DELETE" });
      notify("Member removed", "success");
      if (memberId === currentUser?.id) {
        navigate("groups");
      } else {
        setReloadKey((current) => current + 1);
      }
    } catch (caught) {
      setActionError(caught.message);
    } finally {
      setActionPending(false);
    }
  }

  const group = details?.group;
  const members = details?.members ?? [];

  return (
    <>
      <div className="card">
        <button className="link" type="button" onClick={() => navigate("groups")}>← Back to groups</button>
        {!loading && !loadError && (
          <button
            className="link"
            type="button"
            style={{ marginLeft: 16 }}
            onClick={() => setReloadKey((current) => current + 1)}
          >
            Reload
          </button>
        )}
        {loading ? (
          <p className="muted" role="status">Loading group…</p>
        ) : loadError ? (
          <>
            <p className="balance-neg" role="alert">{loadError}</p>
            <button className="link" type="button" onClick={() => setReloadKey((current) => current + 1)}>
              Try again
            </button>
          </>
        ) : group ? (
          <>
            <h2>{group.name}</h2>
            {group.description && <p className="muted">{group.description}</p>}
          </>
        ) : (
          <p className="muted">Group not found.</p>
        )}
      </div>

      {!loading && !loadError && group && (
        <div className="card">
          <h3>Members</h3>
          {members.length === 0 ? (
            <p className="muted">No members yet.</p>
          ) : (
            <ul className="list">
              {members.map((member) => {
                const canRemove = member.id !== group.created_by &&
                  (member.id === currentUser?.id || currentUser?.id === group.created_by);
                return (
                  <li key={member.id}>
                    <span>
                      {member.username}{" "}
                      {member.id === group.created_by && <span className="muted">(creator)</span>}
                    </span>
                    {canRemove && (
                      <button
                        className="danger"
                        type="button"
                        disabled={actionPending}
                        onClick={() => handleRemoveMember(member.id)}
                      >
                        Remove
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}

          <form onSubmit={handleAddMember} noValidate>
            <label htmlFor="new-member">Add member by username or email</label>
            <input
              id="new-member"
              placeholder="username or email"
              value={memberInput}
              onChange={(event) => setMemberInput(event.target.value)}
            />
            <button className="primary" type="submit" disabled={actionPending}>Add</button>
          </form>
          {actionError && <p className="balance-neg" role="alert">{actionError}</p>}
        </div>
      )}

      {!loading && !loadError && group && (
        <BalancesSection groupId={groupId} refreshKey={balanceRefreshKey} />
      )}

      {!loading && !loadError && group && (
        <ExpensesSection
          groupId={groupId}
          group={group}
          members={members}
          currentUser={currentUser}
          notify={notify}
          onChanged={() => setBalanceRefreshKey((current) => current + 1)}
        />
      )}
    </>
  );
}
