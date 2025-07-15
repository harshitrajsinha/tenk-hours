const express = require("express");
const { Pool } = require("pg");
const dotenv = require("dotenv");
const app = express();
const port = 3000;

// Load environment variables
dotenv.config();

// Create PostgreSQL pool
const pool = new Pool({
  connectionString: process.env.CONN_STR,
});

// Serve static files from the 'public' directory
app.use(express.static("public"));
app.use(express.json());

// Get all tiles that should be displayed
app.get("/tiles", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, title, hours FROM tenk_hours WHERE to_display = true order by id desc"
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching tiles:", err);
    res.status(500).json({ error: "Failed to fetch tiles" });
  }
});

// Update tile count
app.put("/tiles/:id/count", async (req, res) => {
  const { id } = req.params;
  const { change } = req.body;

  try {
    const result = await pool.query(
      "UPDATE tenk_hours SET hours = hours + $1 WHERE id = $2 RETURNING hours",
      [change, id]
    );
    res.json({ hours: result.rows[0].hours });
  } catch (err) {
    console.error("Error updating tile count:", err);
    res.status(500).json({ error: "Failed to update tile count" });
  }
});

// Delete tile (set to_display to false)
app.delete("/tiles/:id", async (req, res) => {
  const { id } = req.params;

  try {
    await pool.query("UPDATE tenk_hours SET to_display = false WHERE id = $1", [
      id,
    ]);
    res.json({ message: "Tile hidden successfully" });
  } catch (err) {
    console.error("Error hiding tile:", err);
    res.status(500).json({ error: "Failed to hide tile" });
  }
});

app.post("/tiles", async (req, res) => {
  const { title } = req.body;

  try {
    const result = await pool.query(
      "INSERT INTO tenk_hours (title, to_display, hours) VALUES ($1, true, 0) RETURNING id",
      [title]
    );
    res.json({ id: result.rows[0].id });
  } catch (err) {
    console.error("Error adding tile:", err);
    res.status(500).json({ error: "Failed to add tile" });
  }
});

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/public/index.html");
});

app.get("/styles.css", (req, res) => {
  res.sendFile(__dirname + "/public/styles.css");
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
