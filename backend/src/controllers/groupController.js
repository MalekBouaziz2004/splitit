import pool from "../config/db.js";

/**
 * POST /api/groups
 * Create a new group. The creator is automatically added as a member.
 * Body: { name, description? }
 */
export async function createGroup(req, res) {
  const client = await pool.connect();
  try {
    const { name, description } = req.body;
    const userId = req.user.userId;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: "Group name is required" });
    }

    // Use a transaction so both inserts succeed or both fail
    await client.query("BEGIN");

    const groupResult = await client.query(
      `INSERT INTO groups (name, description, created_by)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [name.trim(), description?.trim() || null, userId]
    );
    const group = groupResult.rows[0];

    await client.query(
      `INSERT INTO group_members (group_id, user_id) VALUES ($1, $2)`,
      [group.id, userId]
    );

    await client.query("COMMIT");

    return res.status(201).json({ group });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("createGroup error:", err);
    return res.status(500).json({ error: "Internal server error" });
  } finally {
    client.release();
  }
}

/**
 * GET /api/groups
 * List all groups the current user is a member of.
 */
export async function getMyGroups(req, res) {
  try {
    const userId = req.user.userId;

    const result = await pool.query(
      `SELECT g.id, g.name, g.description, g.created_by, g.created_at,
              COUNT(gm2.user_id) AS member_count
       FROM groups g
       INNER JOIN group_members gm ON gm.group_id = g.id
       LEFT JOIN group_members gm2 ON gm2.group_id = g.id
       WHERE gm.user_id = $1
       GROUP BY g.id
       ORDER BY g.created_at DESC`,
      [userId]
    );

    return res.json({ groups: result.rows });
  } catch (err) {
    console.error("getMyGroups error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}

/**
 * GET /api/groups/:id
 * Get one group's details, including its members.
 * The user must be a member of the group.
 */
export async function getGroupById(req, res) {
  try {
    const groupId = parseInt(req.params.id, 10);
    const userId = req.user.userId;

    if (Number.isNaN(groupId)) {
      return res.status(400).json({ error: "Invalid group id" });
    }

    // Authorization: is the user a member?
    const membership = await pool.query(
      `SELECT 1 FROM group_members WHERE group_id = $1 AND user_id = $2`,
      [groupId, userId]
    );
    if (membership.rows.length === 0) {
      return res.status(403).json({ error: "You are not a member of this group" });
    }

    // Fetch group + members in two simple queries
    const groupResult = await pool.query(
      `SELECT * FROM groups WHERE id = $1`,
      [groupId]
    );
    if (groupResult.rows.length === 0) {
      return res.status(404).json({ error: "Group not found" });
    }
    const group = groupResult.rows[0];

    const membersResult = await pool.query(
      `SELECT u.id, u.username, u.email, gm.joined_at
       FROM users u
       INNER JOIN group_members gm ON gm.user_id = u.id
       WHERE gm.group_id = $1
       ORDER BY gm.joined_at ASC`,
      [groupId]
    );

    return res.json({ group, members: membersResult.rows });
  } catch (err) {
    console.error("getGroupById error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}

/**
 * POST /api/groups/:id/members
 * Add a user to a group (by username or email).
 * Only existing members of the group can add new members.
 * Body: { username } OR { email }
 */
export async function addMember(req, res) {
  try {
    const groupId = parseInt(req.params.id, 10);
    const userId = req.user.userId;
    const { username, email } = req.body;

    if (Number.isNaN(groupId)) {
      return res.status(400).json({ error: "Invalid group id" });
    }
    if (!username && !email) {
      return res.status(400).json({ error: "username or email is required" });
    }

    // Authorization: requester must be a member of the group
    const membership = await pool.query(
      `SELECT 1 FROM group_members WHERE group_id = $1 AND user_id = $2`,
      [groupId, userId]
    );
    if (membership.rows.length === 0) {
      return res.status(403).json({ error: "You are not a member of this group" });
    }

    // Find the user to add
    const userToAdd = await pool.query(
      `SELECT id, username, email FROM users
       WHERE username = $1 OR email = $2 LIMIT 1`,
      [username || null, email || null]
    );
    if (userToAdd.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    const newMember = userToAdd.rows[0];

    // Insert membership; ignore if already a member (ON CONFLICT)
    const insert = await pool.query(
      `INSERT INTO group_members (group_id, user_id)
       VALUES ($1, $2)
       ON CONFLICT (group_id, user_id) DO NOTHING
       RETURNING *`,
      [groupId, newMember.id]
    );
    if (insert.rows.length === 0) {
      return res.status(409).json({ error: "User is already a member" });
    }

    return res.status(201).json({ member: newMember });
  } catch (err) {
    console.error("addMember error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}

/**
 * DELETE /api/groups/:id/members/:userId
 * Remove a user from a group. Either the user themselves OR the group creator can do this.
 */
export async function removeMember(req, res) {
  try {
    const groupId = parseInt(req.params.id, 10);
    const targetUserId = parseInt(req.params.userId, 10);
    const requesterId = req.user.userId;

    if (Number.isNaN(groupId) || Number.isNaN(targetUserId)) {
      return res.status(400).json({ error: "Invalid id" });
    }

    // Find the group to check who created it
    const groupResult = await pool.query(
      `SELECT created_by FROM groups WHERE id = $1`,
      [groupId]
    );
    if (groupResult.rows.length === 0) {
      return res.status(404).json({ error: "Group not found" });
    }
    const { created_by } = groupResult.rows[0];

    // Authorization: requester must be the user themselves or the group creator
    const isSelf = requesterId === targetUserId;
    const isCreator = requesterId === created_by;
    if (!isSelf && !isCreator) {
      return res.status(403).json({ error: "Not allowed" });
    }

    // The creator cannot be removed (simple rule for now)
    if (targetUserId === created_by) {
      return res.status(400).json({ error: "The group creator cannot be removed" });
    }

    const del = await pool.query(
      `DELETE FROM group_members WHERE group_id = $1 AND user_id = $2 RETURNING *`,
      [groupId, targetUserId]
    );
    if (del.rows.length === 0) {
      return res.status(404).json({ error: "Membership not found" });
    }

    return res.json({ message: "Member removed" });
  } catch (err) {
    console.error("removeMember error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}