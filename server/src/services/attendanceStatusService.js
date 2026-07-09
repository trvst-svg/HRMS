import db from "../config/db.js";

function normalizeDate(input = new Date()) {
  const d = new Date(input);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getDateRange(from, to) {
  const start = normalizeDate(from);
  const end = normalizeDate(to);
  const dates = [];
  const cursor = new Date(start);

  while (cursor <= end) {
    dates.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }

  return dates;
}

async function applyApprovedRequestToAttendance({
  employeeId,
  from,
  to,
  status,
}) {
  const dates = getDateRange(from, to);

  for (const date of dates) {
    const result = await db.query(
      "SELECT * FROM attendance WHERE employee_id = $1 AND date = $2",
      [employeeId, date],
    );
    const record = result.rows[0];

    if (!record) {
      await db.query(
        "INSERT INTO attendance (employee_id, date, status) VALUES ($1, $2, $3)",
        [employeeId, date, status],
      );
      continue;
    }

    if (record.check_in || record.check_out) continue;

    await db.query("UPDATE attendance SET status = $1 WHERE id = $2", [
      status,
      record.id,
    ]);
  }
}

export { applyApprovedRequestToAttendance };
export default { applyApprovedRequestToAttendance };
