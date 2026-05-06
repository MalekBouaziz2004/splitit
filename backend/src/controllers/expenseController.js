import pool from "../config/db.js";
import {
  computeBalances,
  simplifyDebts,
} from "../services/balanceService.js";

/**
 * Helper: verify the user is a member of the group.
 * Returns true/false. Used in every endpoint for authorization.
 */
async function isGroupMember(groupId, userId) {
  const r = await pool.query(
    `SELECT 1 FROM group_members WHERE group_id = $1 AND user_id = $2`,
    [groupId, userId]
  );
  return r.rows.length > 0;
}

/**
 * POST /api/groups/:id/expenses
 * Body:
 *   {
 *     amount: number,
 *     description: string,
 *     paidBy: number,            // user id of the payer
 *     splitType: "equal" | "custom",
 *     participants: number[]     // user ids who share this expense
 *     shares?: { [userId]: number }  // required if splitType="custom"
 *   }
 */
export async function createExpense(req, res) {
  const groupId = parseInt(req.params.id, 10);
  const userId = req.user.userId;

  if (Number.isNaN(groupId)) {
    return res.status(400).json({ error: "Invalid group id" });
  }

  const {
    amount,
    description,
    paidBy,
    splitType = "equal",
    participants,
    shares,
  } = req.body;

  // -------- Validation --------
  if (
    typeof amount !== "number" ||
    !Number.isFinite(amount) ||
    amount <= 0
  ) {
    return res.status(400).json({ error: "amount must be a positive number" });
  }
  if (!description || description.trim().length === 0) {
    return res.status(400).json({ error: "description is required" });
  }
  if (!Number.isInteger(paidBy)) {
    return res.status(400).json({ error: "paidBy (user id) is required" });
  }
  if (!Array.isArray(participants) || participants.length === 0) {
    return res.status(400).json({ error: "participants must be a non-empty array" });
  }

  const client = await pool.connect();
  try {
    // -------- Authorization --------
    if (!(await isGroupMember(groupId, userId))) {
      return res.status(403).json({ error: "You are not a member of this group" });
    }

    // The payer and all participants must also be members of the group
    const memberCheck = await client.query(
      `SELECT user_id FROM group_members WHERE group_id = $1`,
      [groupId]
    );
    const memberIds = new Set(memberCheck.rows.map((r) => r.user_id));

    if (!memberIds.has(paidBy)) {
      return res.status(400).json({ error: "paidBy is not a member of the group" });
    }
    for (const p of participants) {
      if (!memberIds.has(p)) {
        return res.status(400).json({ error: `User ${p} is not a member of the group` });
      }
    }

    // -------- Compute splits --------
    let computedShares = {}; // { userId: shareAmount }
    if (splitType === "equal") {
      const each = Math.floor((amount * 100) / participants.length) / 100;
      const remainder = +(amount - each * participants.length).toFixed(2);
      // Distribute the rounding remainder one cent at a time across participants
      participants.forEach((p, idx) => {
        const extra = idx < Math.round(remainder * 100) ? 0.01 : 0;
        computedShares[p] = +(each + extra).toFixed(2);
      });
    } else if (splitType === "custom") {
      if (!shares || typeof shares !== "object") {
        return res.status(400).json({ error: "shares object required for custom split" });
      }
      let total = 0;
      for (const p of participants) {
        const s = shares[p];
        if (typeof s !== "number" || !Number.isFinite(s) || s < 0) {
          return res.status(400).json({ error: `Invalid share for user ${p}` });
        }
        computedShares[p] = +s.toFixed(2);
        total += s;
      }
      if (Math.abs(total - amount) > 0.01) {
        return res.status(400).json({ error: "Sum of shares must equal amount" });
      }
    } else {
      return res.status(400).json({ error: "splitType must be 'equal' or 'custom'" });
    }

    // -------- Insert (transaction) --------
    await client.query("BEGIN");

    const expResult = await client.query(
      `INSERT INTO expenses (group_id, paid_by, amount, description)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [groupId, paidBy, amount, description.trim()]
    );
    const expense = expResult.rows[0];

    for (const [uid, share] of Object.entries(computedShares)) {
      await client.query(
        `INSERT INTO expense_splits (expense_id, user_id, share_amount)
         VALUES ($1, $2, $3)`,
        [expense.id, Number(uid), share]
      );
    }

    await client.query("COMMIT");

    return res.status(201).json({
      expense,
      splits: Object.entries(computedShares).map(([uid, share]) => ({
        userId: Number(uid),
        shareAmount: share,
      })),
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("createExpense error:", err);
    return res.status(500).json({ error: "Internal server error" });
  } finally {
    client.release();
  }
}

/**
 * GET /api/groups/:id/expenses
 * List all expenses for a group with their splits.
 */
export async function listExpenses(req, res) {
  try {
    const groupId = parseInt(req.params.id, 10);
    const userId = req.user.userId;

    if (Number.isNaN(groupId)) {
      return res.status(400).json({ error: "Invalid group id" });
    }
    if (!(await isGroupMember(groupId, userId))) {
      return res.status(403).json({ error: "You are not a member of this group" });
    }

    const expensesResult = await pool.query(
      `SELECT e.*, u.username AS paid_by_username
       FROM expenses e
       INNER JOIN users u ON u.id = e.paid_by
       WHERE e.group_id = $1
       ORDER BY e.created_at DESC`,
      [groupId]
    );

    const splitsResult = await pool.query(
      `SELECT es.expense_id, es.user_id, es.share_amount, u.username
       FROM expense_splits es
       INNER JOIN users u ON u.id = es.user_id
       INNER JOIN expenses e ON e.id = es.expense_id
       WHERE e.group_id = $1`,
      [groupId]
    );

    // Group splits by expense_id
    const splitsByExpense = {};
    for (const s of splitsResult.rows) {
      if (!splitsByExpense[s.expense_id]) splitsByExpense[s.expense_id] = [];
      splitsByExpense[s.expense_id].push({
        userId: s.user_id,
        username: s.username,
        shareAmount: s.share_amount, // string from pg
      });
    }

    const expenses = expensesResult.rows.map((e) => ({
      ...e,
      splits: splitsByExpense[e.id] || [],
    }));

    return res.json({ expenses });
  } catch (err) {
    console.error("listExpenses error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}

/**
 * DELETE /api/groups/:id/expenses/:expenseId
 * Only the payer or the group creator can delete an expense.
 */
export async function deleteExpense(req, res) {
  try {
    const groupId = parseInt(req.params.id, 10);
    const expenseId = parseInt(req.params.expenseId, 10);
    const userId = req.user.userId;

    if (Number.isNaN(groupId) || Number.isNaN(expenseId)) {
      return res.status(400).json({ error: "Invalid id" });
    }
    if (!(await isGroupMember(groupId, userId))) {
      return res.status(403).json({ error: "You are not a member of this group" });
    }

    const expResult = await pool.query(
      `SELECT e.paid_by, g.created_by
       FROM expenses e
       INNER JOIN groups g ON g.id = e.group_id
       WHERE e.id = $1 AND e.group_id = $2`,
      [expenseId, groupId]
    );
    if (expResult.rows.length === 0) {
      return res.status(404).json({ error: "Expense not found" });
    }
    const { paid_by, created_by } = expResult.rows[0];

    if (userId !== paid_by && userId !== created_by) {
      return res.status(403).json({ error: "Not allowed to delete this expense" });
    }

    await pool.query(`DELETE FROM expenses WHERE id = $1`, [expenseId]);
    // Splits are auto-deleted via ON DELETE CASCADE

    return res.json({ message: "Expense deleted" });
  } catch (err) {
    console.error("deleteExpense error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}

/**
 * GET /api/groups/:id/balances
 * Returns the current net balance per member + simplified settlement.
 */
export async function getBalances(req, res) {
  try {
    const groupId = parseInt(req.params.id, 10);
    const userId = req.user.userId;

    if (Number.isNaN(groupId)) {
      return res.status(400).json({ error: "Invalid group id" });
    }
    if (!(await isGroupMember(groupId, userId))) {
      return res.status(403).json({ error: "You are not a member of this group" });
    }

    const membersResult = await pool.query(
      `SELECT u.id, u.username
       FROM users u
       INNER JOIN group_members gm ON gm.user_id = u.id
       WHERE gm.group_id = $1`,
      [groupId]
    );
    const members = membersResult.rows;
    const memberIds = members.map((m) => m.id);

    const expensesResult = await pool.query(
      `SELECT id, paid_by AS "paidBy", amount FROM expenses WHERE group_id = $1`,
      [groupId]
    );
    const splitsResult = await pool.query(
      `SELECT es.expense_id AS "expenseId",
              es.user_id     AS "userId",
              es.share_amount AS "shareAmount"
       FROM expense_splits es
       INNER JOIN expenses e ON e.id = es.expense_id
       WHERE e.group_id = $1`,
      [groupId]
    );

    const balances = computeBalances(
      expensesResult.rows,
      splitsResult.rows,
      memberIds
    );
    const settlement = simplifyDebts(balances);

    // Add usernames for readability
    const usernameById = Object.fromEntries(members.map((m) => [m.id, m.username]));
    const balancesWithNames = members.map((m) => ({
      userId: m.id,
      username: m.username,
      balance: balances[m.id] ?? 0,
    }));
    const settlementWithNames = settlement.map((t) => ({
      from: t.from,
      fromUsername: usernameById[t.from],
      to: t.to,
      toUsername: usernameById[t.to],
      amount: t.amount,
    }));

    return res.json({
      balances: balancesWithNames,
      settlement: settlementWithNames,
    });
  } catch (err) {
    console.error("getBalances error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}