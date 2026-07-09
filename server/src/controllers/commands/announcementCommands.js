import db from "../../config/db.js";

async function createAnnouncement(req, res) {
  try {
    const {
      title,
      content,
      type = "General",
      audience = "All",
      effectiveFrom,
      effectiveTo,
    } = req.body;
    if (!title || !content) {
      return res
        .status(400)
        .json({ message: "Title and content are required." });
    }

    const effFrom = effectiveFrom ? new Date(effectiveFrom) : null;
    const effTo = effectiveTo ? new Date(effectiveTo) : null;

    const result = await db.query(
      `INSERT INTO announcements (title, content, type, audience, effective_from, effective_to, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id AS _id, id, title, content, type, audience, effective_from as "effectiveFrom", effective_to as "effectiveTo", created_by as "createdBy"`,
      [
        String(title).trim(),
        String(content).trim(),
        type,
        audience,
        effFrom,
        effTo,
        req.user.id,
      ],
    );

    return res
      .status(201)
      .json({ message: "Announcement created", data: result.rows[0] });
  } catch (err) {
    console.error("createAnnouncement error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

async function deleteAnnouncement(req, res) {
  try {
    const { id } = req.params;
    const idInt = parseInt(id, 10);
    if (isNaN(idInt)) {
      return res.status(400).json({ message: "Invalid announcement id" });
    }

    const result = await db.query(
      "DELETE FROM announcements WHERE id = $1 RETURNING id",
      [idInt],
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Announcement not found" });
    }

    return res.json({ message: "Announcement deleted" });
  } catch (err) {
    console.error("deleteAnnouncement error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

export { createAnnouncement, deleteAnnouncement };
export default { createAnnouncement, deleteAnnouncement };
