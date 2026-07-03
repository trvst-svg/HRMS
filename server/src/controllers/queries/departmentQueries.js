const db = require("../../config/db");

async function getDepartments(req, res) {
  try {
    const result = await db.query(
      "SELECT id AS _id, id, name, created_at, updated_at FROM departments ORDER BY name ASC",
    );
    return res.json({ data: result.rows });
  } catch (err) {
    console.error("getDepartments error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

module.exports = {
  getDepartments,
};
