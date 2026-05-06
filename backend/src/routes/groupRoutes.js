import express from "express";
import {
  createGroup,
  getMyGroups,
  getGroupById,
  addMember,
  removeMember,
} from "../controllers/groupController.js";
import {
  createExpense,
  listExpenses,
  deleteExpense,
  getBalances,
} from "../controllers/expenseController.js";
import { authenticate } from "../middleware/authMiddleware.js";

const router = express.Router();

// Every route here requires a valid JWT
router.use(authenticate);

// /api/groups
router.post("/", createGroup);
router.get("/", getMyGroups);
router.get("/:id", getGroupById);

// /api/groups/:id/members
router.post("/:id/members", addMember);
router.delete("/:id/members/:userId", removeMember);

// /api/groups/:id/expenses
router.post("/:id/expenses", createExpense);
router.get("/:id/expenses", listExpenses);
router.delete("/:id/expenses/:expenseId", deleteExpense);

// /api/groups/:id/balances
router.get("/:id/balances", getBalances);

export default router;