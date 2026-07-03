const db = require("../../config/db");
const { getOrCreateEmployeeForUser } = require("./employeeQueries");

function startOfDay(input = new Date()) {
  const d = new Date(input);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfDay(input = new Date()) {
  const d = new Date(input);
  d.setHours(23, 59, 59, 999);
  return d;
}

async function getAdminAttendance(req, res) {
  try {
    const { from, to, employeeId, role, status = "" } = req.query;
    const fromDate = from ? startOfDay(from) : startOfDay(new Date());
    const toDate = to ? endOfDay(to) : endOfDay(fromDate);
    const isSingleDay = fromDate.getTime() === startOfDay(toDate).getTime();
    const allowedRole = ["employee", "manager"].includes(role) ? role : "";
    const normalizedStatus = String(status || "").trim();

    let roleUserIds = [];
    if (allowedRole) {
      const usersResult = await db.query(
        "SELECT id FROM users WHERE role = $1",
        [allowedRole],
      );
      roleUserIds = usersResult.rows.map((u) => u.id);
      if (!roleUserIds.length) return res.json({ data: [] });
    }

    if (isSingleDay) {
      // Load active employees
      let empQuery =
        'SELECT id, employee_id as "employeeId", first_name as "firstName", last_name as "lastName", email FROM employees WHERE status = \'active\'';
      const params = [];

      if (employeeId) {
        params.push(employeeId);
        empQuery += ` AND employee_id = $${params.length}`;
      }
      if (allowedRole) {
        params.push(roleUserIds);
        empQuery += ` AND user_id = ANY($${params.length})`;
      }

      empQuery += " ORDER BY first_name ASC, last_name ASC";
      const empResult = await db.query(empQuery, params);
      const employees = empResult.rows;

      if (!employees.length) return res.json({ data: [] });

      const empIds = employees.map((e) => e.id);
      const attResult = await db.query(
        "SELECT * FROM attendance WHERE employee_id = ANY($1) AND date >= $2 AND date <= $3",
        [empIds, fromDate, toDate],
      );
      const dayRecords = attResult.rows;

      const byEmployee = new Map();
      dayRecords.forEach((rec) => {
        byEmployee.set(String(rec.employee_id), rec);
      });

      const rows = employees.map((emp) => {
        const rec = byEmployee.get(String(emp.id));
        return {
          _id: rec?.id || `absent-${emp.id}-${fromDate.toISOString()}`,
          id: rec?.id || null,
          date: fromDate,
          checkIn: rec?.check_in || null,
          checkOut: rec?.check_out || null,
          status: rec?.status || "Absent",
          employee: {
            _id: emp.id,
            id: emp.id,
            employeeId: emp.employeeId,
            firstName: emp.firstName,
            lastName: emp.lastName,
            email: emp.email,
          },
        };
      });

      const filteredRows = normalizedStatus
        ? rows.filter(
            (row) =>
              String(row.status).toLowerCase() ===
              normalizedStatus.toLowerCase(),
          )
        : rows;

      return res.json({ data: filteredRows });
    }

    // Range search
    let rangeQuery = `
      SELECT a.id AS _id, a.id, a.date, a.check_in as "checkIn", a.check_out as "checkOut", a.status, a.notes,
             e.id as emp_id, e.employee_id as "employeeId", e.first_name as "firstName", e.last_name as "lastName", e.email
      FROM attendance a
      JOIN employees e ON a.employee_id = e.id
      WHERE a.date >= $1 AND a.date <= $2
    `;
    const params = [fromDate, toDate];

    if (employeeId) {
      params.push(employeeId);
      rangeQuery += ` AND e.employee_id = $${params.length}`;
    } else if (allowedRole) {
      params.push(roleUserIds);
      rangeQuery += ` AND e.user_id = ANY($${params.length})`;
    }

    if (normalizedStatus) {
      params.push(normalizedStatus);
      rangeQuery += ` AND a.status = $${params.length}`;
    }

    rangeQuery += " ORDER BY a.date DESC";
    const result = await db.query(rangeQuery, params);

    const records = result.rows.map((row) => ({
      _id: row._id,
      id: row.id,
      date: row.date,
      checkIn: row.checkIn,
      checkOut: row.checkOut,
      status: row.status,
      notes: row.notes,
      employee: {
        _id: row.emp_id,
        id: row.emp_id,
        employeeId: row.employeeId,
        firstName: row.firstName,
        lastName: row.lastName,
        email: row.email,
      },
    }));

    return res.json({ data: records });
  } catch (err) {
    console.error("getAdminAttendance error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

async function getMyAttendance(req, res) {
  try {
    const employee = await getOrCreateEmployeeForUser(req.user);
    const { from, to } = req.query;

    const fromDate = from ? startOfDay(from) : startOfDay(new Date());
    if (!from) fromDate.setDate(fromDate.getDate() - 30);

    const toDate = to ? endOfDay(to) : endOfDay(new Date());

    const result = await db.query(
      `SELECT id AS _id, id, date, check_in as "checkIn", check_out as "checkOut", status, notes
       FROM attendance
       WHERE employee_id = $1 AND date >= $2 AND date <= $3
       ORDER BY date DESC`,
      [employee.id, fromDate, toDate],
    );

    return res.json({ data: result.rows });
  } catch (err) {
    console.error("getMyAttendance error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

module.exports = {
  getAdminAttendance,
  getMyAttendance,
};
