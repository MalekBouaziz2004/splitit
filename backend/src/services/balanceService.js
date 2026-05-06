

/**
 * Round to 2 decimal places, return as Number.
 * Avoids floating-point garbage like 0.1 + 0.2 = 0.30000000000000004.
 */
function round2(n) {
  return Math.round(n * 100) / 100;
}

/**
 * Compute net balance per user from raw expense data.
 *
 * Input:
 *   expenses: [{ paidBy: number, amount: number }, ...]
 *   splits:   [{ expenseId, userId, shareAmount }, ...]
 *   memberIds: [number, ...]   // all current group members
 *
 * Output:
 *   { [userId]: balance }   // positive = is owed money; negative = owes
 */
export function computeBalances(expenses, splits, memberIds) {
  const balances = {};
  for (const id of memberIds) balances[id] = 0;

  // Each payer is owed the full amount they paid
  for (const exp of expenses) {
    if (balances[exp.paidBy] === undefined) balances[exp.paidBy] = 0;
    balances[exp.paidBy] += Number(exp.amount);
  }

  // Each split-share is what that user owes for that expense
  for (const sp of splits) {
    if (balances[sp.userId] === undefined) balances[sp.userId] = 0;
    balances[sp.userId] -= Number(sp.shareAmount);
  }

  // Round to avoid floating-point noise
  for (const id of Object.keys(balances)) {
    balances[id] = round2(balances[id]);
  }

  return balances;
}

/**
 * Greedy debt-simplification.
 *
 * Input:  balances object { userId: netBalance, ... }
 * Output: array of transfers [{ from, to, amount }, ...]
 *
 * Strategy: largest debtor pays as much as possible to largest creditor,
 * repeat until everyone is at zero (within an epsilon).
 */
export function simplifyDebts(balances) {
  const EPSILON = 0.005; // < half a cent; treat as zero
  const debtors = [];
  const creditors = [];

  for (const [userId, balance] of Object.entries(balances)) {
    const id = Number(userId);
    if (balance < -EPSILON) debtors.push({ userId: id, amount: -balance });
    else if (balance > EPSILON) creditors.push({ userId: id, amount: balance });
  }

  // Largest first
  debtors.sort((a, b) => b.amount - a.amount);
  creditors.sort((a, b) => b.amount - a.amount);

  const transfers = [];
  let i = 0;
  let j = 0;

  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i];
    const creditor = creditors[j];
    const transfer = round2(Math.min(debtor.amount, creditor.amount));

    if (transfer > 0) {
      transfers.push({ from: debtor.userId, to: creditor.userId, amount: transfer });
    }

    debtor.amount = round2(debtor.amount - transfer);
    creditor.amount = round2(creditor.amount - transfer);

    if (debtor.amount < EPSILON) i++;
    if (creditor.amount < EPSILON) j++;
  }

  return transfers;
}