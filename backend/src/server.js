import "./config/env.js";
import express from "express";
import cors from "cors";
import pool from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import groupRoutes from "./routes/groupRoutes.js";

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Test route — checks the server is alive
app.get("/", (req, res) => {
  res.json({ message: "SplitIt API is running " });
});

// Test route — checks the database connection
app.get("/api/db-test", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW() AS current_time");
    res.json({
      message: "Database connection works ",
      time: result.rows[0].current_time,
    });
  } catch (err) {
    console.error("Database query failed:", err);
    res.status(500).json({ error: "Database connection failed" });
  }
});
app.use("/api/auth", authRoutes);
app.use("/api/groups", groupRoutes);
// Start server
app.listen(PORT, () => {
  console.log(` Server running on http://localhost:${PORT}`);
});