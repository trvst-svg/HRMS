const db = require("../../config/db");
const { getOrCreateEmployeeForUser } = require("../queries/employeeQueries");

function normalizeDate(input = new Date()) {
  const d = new Date(input);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getWorkedHours(checkIn, checkOut) {
  if (!checkIn || !checkOut) return 0;
  const milliseconds =
    new Date(checkOut).getTime() - new Date(checkIn).getTime();
  return milliseconds > 0 ? milliseconds / (1000 * 60 * 60) : 0;
}

async function checkIn(req, res) {
  try {
    const employee = await getOrCreateEmployeeForUser(req.user);
    const today = normalizeDate(new Date());

    const result = await db.query(
      "SELECT * FROM attendance WHERE employee_id = $1 AND date = $2",
      [employee.id, today],
    );
    let record = result.rows[0];

    // Check if today is a holiday
    const holidayRes = await db.query(
      "SELECT * FROM holidays WHERE date = $1 LIMIT 1",
      [today],
    );
    if (holidayRes.rows.length > 0) {
      return res.status(400).json({
        message: `Today is a holiday (${holidayRes.rows[0].name}). Attendance check-in is not required.`,
      });
    }

    if (
      record &&
      ["Leave", "WFH"].includes(record.status || "") &&
      !record.check_in
    ) {
      return res.status(400).json({
        message: `Attendance is not required today because your approved ${record.status} is already recorded.`,
      });
    }

    if (record && record.check_in) {
      return res.status(400).json({ message: "Already checked in for today" });
    }

    const now = new Date();
    let finalRecord;
    if (!record) {
      const insertResult = await db.query(
        'INSERT INTO attendance (employee_id, date, check_in, status) VALUES ($1, $2, $3, $4) RETURNING id AS _id, id, date, check_in as "checkIn", check_out as "checkOut", status, notes',
        [employee.id, today, now, "Present"],
      );
      finalRecord = insertResult.rows[0];
    } else {
      const updateResult = await db.query(
        'UPDATE attendance SET check_in = $1, status = $2 WHERE id = $3 RETURNING id AS _id, id, date, check_in as "checkIn", check_out as "checkOut", status, notes',
        [now, "Present", record.id],
      );
      finalRecord = updateResult.rows[0];
    }

    return res
      .status(201)
      .json({ message: "Checked in successfully", data: finalRecord });
  } catch (err) {
    console.error("checkIn error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

async function checkOut(req, res) {
  try {
    const employee = await getOrCreateEmployeeForUser(req.user);
    const today = normalizeDate(new Date());

    const result = await db.query(
      "SELECT * FROM attendance WHERE employee_id = $1 AND date = $2",
      [employee.id, today],
    );
    const record = result.rows[0];

    if (
      record &&
      ["Leave", "WFH"].includes(record.status || "") &&
      !record.check_in
    ) {
      return res.status(400).json({
        message: `Attendance is not required today because your approved ${record.status} is already recorded.`,
      });
    }

    if (!record || !record.check_in) {
      return res
        .status(400)
        .json({ message: "Cannot check-out before check-in for today" });
    }
    if (record.check_out) {
      return res.status(400).json({ message: "Already checked out for today" });
    }

    const now = new Date();
    const worked = getWorkedHours(record.check_in, now);
    const status = worked >= 6 ? "Present" : "Half Day Present";

    const updateResult = await db.query(
      'UPDATE attendance SET check_out = $1, status = $2 WHERE id = $3 RETURNING id AS _id, id, date, check_in as "checkIn", check_out as "checkOut", status, notes',
      [now, status, record.id],
    );

    return res.json({
      message: "Checked out successfully",
      data: updateResult.rows[0],
    });
  } catch (err) {
    console.error("checkOut error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

module.exports = {
  checkIn,
  checkOut,
};
