import { useEffect, useState } from "react";
import { api } from "./api/client.js";

export default function GroupsPage({ notify }) {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    async function loadGroups() {
      try {
        const data = await api("/api/groups", { signal: controller.signal });
        if (!controller.signal.aborted) setGroups(data.groups);
      } catch (caught) {
        if (!controller.signal.aborted) setError(caught.message);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    loadGroups();
    return () => controller.abort();
  }, [reloadKey]);

  async function handleCreate(event) {
    event.preventDefault();
    if (creating) return;

    const cleanName = name.trim();
    const cleanDescription = description.trim();
    if (!cleanName) {
      setCreateError("Name is required");
      return;
    }

    setCreating(true);
    setCreateError(null);
    try {
      await api("/api/groups", {
        method: "POST",
        body: { name: cleanName, description: cleanDescription || undefined },
      });
      setName("");
      setDescription("");
      notify("Group created", "success");
      setReloadKey((current) => current + 1);
    } catch (caught) {
      setCreateError(caught.message);
    } finally {
      setCreating(false);
    }
  }

  return (
    <>
      <div className="card">
        <h2>Create a group</h2>
        <form onSubmit={handleCreate} noValidate>
          <label htmlFor="group-name">Name</label>
          <input
            id="group-name"
            placeholder="Berlin Trip"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
          <label htmlFor="group-description">Description (optional)</label>
          <input
            id="group-description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
          <button className="primary" type="submit" disabled={creating}>Create</button>
          {createError && <p className="balance-neg" role="alert">{createError}</p>}
        </form>
      </div>

      <div className="card">
        <h2>Your groups</h2>
        <div aria-live="polite">
          {loading ? (
            <p className="muted">Loading…</p>
          ) : error ? (
            <>
              <p className="balance-neg" role="alert">{error}</p>
              <button className="link" type="button" onClick={() => setReloadKey((current) => current + 1)}>
                Try again
              </button>
            </>
          ) : groups.length === 0 ? (
            <p className="muted">No groups yet. Create one above!</p>
          ) : (
            <ul className="list">
              {groups.map((group) => (
                <li key={group.id}>
                  <a
                    href={`#group/${group.id}`}
                    style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", color: "inherit", textDecoration: "none" }}
                  >
                    <span>
                      <strong>{group.name}</strong>
                      <span className="muted" style={{ display: "block" }}>
                        {group.member_count} member(s)
                      </span>
                    </span>
                    <span aria-hidden="true">›</span>
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}
