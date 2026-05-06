import express from "express";
import {
  createGroup,
  getMyGroups,
  getGroupById,
  addMember,
  removeMember,
} from "../controllers/groupController.js";
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

export default router;