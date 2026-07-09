import db from "../../config/db.js";

function normalizeDate(input) {
  const d = new Date(input);
  d.setHours(0, 0, 0, 0);
  return d;
}

async function createHoliday(req, res) {
  try {
    const {
      name,
      date,
      startDate: rawStartDate,
      endDate: rawEndDate,
      type = "Public",
      description = "",
    } = req.body;

    const startInput = rawStartDate || date;
    const endInput = rawEndDate || rawStartDate || date;

    if (!name || !startInput) {
      return res
        .status(400)
        .json({ message: "Name and start date are required." });
    }

    const startDate = normalizeDate(startInput);
    const endDate = normalizeDate(endInput);
    if (endDate < startDate) {
      return res
        .status(400)
        .json({ message: "End date cannot be before start date." });
    }

    const result = await db.query(
      `INSERT INTO holidays (name, date, start_date, end_date, type, description)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id AS _id, id, name, date, start_date as "startDate", end_date as "endDate", type, description`,
      [
        String(name).trim(),
        startDate,
        startDate,
        endDate,
        type,
        String(description).trim(),
      ],
    );

    return res
      .status(201)
      .json({ message: "Holiday added", data: result.rows[0] });
  } catch (err) {
    console.error("createHoliday error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

async function deleteHoliday(req, res) {
  try {
    const { id } = req.params;
    const idInt = parseInt(id, 10);
    if (isNaN(idInt)) {
      return res.status(400).json({ message: "Invalid holiday id" });
    }

    const result = await db.query(
      "DELETE FROM holidays WHERE id = $1 RETURNING id",
      [idInt],
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Holiday not found" });
    }

    return res.json({ message: "Holiday deleted" });
  } catch (err) {
    console.error("deleteHoliday error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

export { createHoliday, deleteHoliday };
export default { createHoliday, deleteHoliday };
