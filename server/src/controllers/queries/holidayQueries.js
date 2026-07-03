const db = require("../../config/db");

function normalizeDate(input) {
  const d = new Date(input);
  d.setHours(0, 0, 0, 0);
  return d;
}

async function getHolidays(req, res) {
  try {
    const { upcoming = "true" } = req.query;
    const today = normalizeDate(new Date());

    let result;
    if (String(upcoming) !== "false") {
      result = await db.query(
        `SELECT id AS _id, id, name, date, start_date as "startDate", end_date as "endDate", type, description, created_at as "createdAt", updated_at as "updatedAt"
         FROM holidays 
         WHERE end_date >= $1 OR date >= $1 
         ORDER BY start_date ASC, date ASC 
         LIMIT 200`,
        [today],
      );
    } else {
      result = await db.query(
        `SELECT id AS _id, id, name, date, start_date as "startDate", end_date as "endDate", type, description, created_at as "createdAt", updated_at as "updatedAt"
         FROM holidays 
         ORDER BY start_date ASC, date ASC 
         LIMIT 200`,
      );
    }

    const mapped = result.rows.map((h) => {
      const startDate = h.startDate || h.date;
      const endDate = h.endDate || h.startDate || h.date;
      return {
        _id: h._id,
        id: h.id,
        name: h.name,
        date: startDate,
        startDate,
        endDate,
        type: h.type,
        description: h.description,
        createdAt: h.createdAt,
        updatedAt: h.updatedAt,
      };
    });

    return res.json({ data: mapped });
  } catch (err) {
    console.error("getHolidays error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

module.exports = {
  getHolidays,
};
