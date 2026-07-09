import db from "../../config/db.js";

async function getAnnouncements(req, res) {
  try {
    const result = await db.query(
      `SELECT id AS _id, title, content, type, audience, created_by, effective_from, effective_to, created_at, updated_at 
       FROM announcements 
       ORDER BY created_at DESC 
       LIMIT 100`,
    );
    return res.json({ data: result.rows });
  } catch (err) {
    console.error("getAnnouncements error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

export { getAnnouncements };
export default { getAnnouncements };
