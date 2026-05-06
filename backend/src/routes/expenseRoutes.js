import express from "express";
import {
  createExpense,
  listExpenses,
  deleteExpense,
  getBalances,
} from "../controllers/expenseController.js";
import { authenticate } from "../middleware/authMiddleware.js";

const router = express.Router({ mergeParams: true });

router.use(authenticate);

router.post("/", createExpense);
router.get("/", listExpenses);
router.delete("/:expenseId", deleteExpense);
router.get("/balances", getBalances);

export default router;
