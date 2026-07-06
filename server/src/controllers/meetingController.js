const db = require("../config/db");
const { getOrCreateEmployeeForUser } = require("./queries/employeeQueries");

async function createMeeting(req, res) {
  try {
    const {
      title,
      type,
      employeeId,
      candidateName = "",
      conductedBy,
      scheduledAt,
      notes = "",
    } = req.body;

    if (!title || !scheduledAt) {
      return res
        .status(400)
        .json({ message: "Title and scheduled date/time are required." });
    }

    const scheduledDate = new Date(scheduledAt);
    if (isNaN(scheduledDate.getTime())) {
      return res.status(400).json({ message: "Invalid scheduled date/time." });
    }
    if (scheduledDate < new Date()) {
      return res
        .status(400)
        .json({ message: "Scheduled date/time must be in the future." });
    }

    const empId = employeeId ? parseInt(employeeId, 10) : null;
    const condBy = conductedBy ? parseInt(conductedBy, 10) : null;

    if (employeeId && isNaN(empId)) {
      return res.status(400).json({ message: "Invalid employee ID." });
    }
    if (conductedBy && isNaN(condBy)) {
      return res.status(400).json({ message: "Invalid host ID." });
    }

    const result = await db.query(
      `INSERT INTO hr_meetings (title, type, employee_id, candidate_name, conducted_by, scheduled_at, status, notes)
       VALUES ($1, $2, $3, $4, $5, $6, 'Scheduled', $7)
       RETURNING *`,
      [
        title,
        type || "Interview",
        empId,
        candidateName,
        condBy,
        scheduledDate,
        notes,
      ],
    );

    return res
      .status(201)
      .json({
        message: "Meeting scheduled successfully.",
        data: result.rows[0],
      });
  } catch (err) {
    console.error("createMeeting error:", err);
    return res.status(500).json({ message: "Server error." });
  }
}

async function getMeetings(req, res) {
  try {
    // Check if user is admin
    let isAdmin = req.user.role === "admin";

    // Check if user is in HR department
    if (!isAdmin) {
      const { rows } = await db.query(
        "SELECT department FROM employees WHERE user_id = $1 LIMIT 1",
        [req.user.id],
      );
      if (
        rows[0]?.department &&
        String(rows[0].department).trim().toUpperCase() === "HR"
      ) {
        isAdmin = true;
      }
    }

    let queryStr = `
      SELECT hm.*, hm.scheduled_at as "scheduledAt", hm.candidate_name as "candidateName",
             e.first_name as "firstName", e.last_name as "lastName", e.employee_id as "employeeId",
             c.first_name as "condFirstName", c.last_name as "condLastName", c.employee_id as "condEmployeeId"
      FROM hr_meetings hm
      LEFT JOIN employees e ON hm.employee_id = e.id
      LEFT JOIN employees c ON hm.conducted_by = c.id
    `;
    const params = [];

    if (!isAdmin) {
      const employee = await getOrCreateEmployeeForUser(req.user);
      queryStr += ` WHERE hm.employee_id = $1 OR hm.conducted_by = $1`;
      params.push(employee.id);
    }

    queryStr += ` ORDER BY hm.scheduled_at DESC`;

    const result = await db.query(queryStr, params);
    return res.json({ data: result.rows });
  } catch (err) {
    console.error("getMeetings error:", err);
    return res.status(500).json({ message: "Server error." });
  }
}

async function updateMeeting(req, res) {
  try {
    const { id } = req.params;
    const { status, conductedBy, scheduledAt, notes } = req.body;
    const meetingId = parseInt(id, 10);

    if (isNaN(meetingId))
      return res.status(400).json({ message: "Invalid meeting ID." });

    const check = await db.query("SELECT * FROM hr_meetings WHERE id = $1", [
      meetingId,
    ]);
    if (check.rows.length === 0) {
      return res.status(404).json({ message: "Meeting not found." });
    }

    let queryStr = "UPDATE hr_meetings SET ";
    const params = [];

    if (status !== undefined) {
      params.push(status);
      queryStr += `status = $${params.length}, `;
    }

    if (conductedBy !== undefined) {
      params.push(conductedBy ? parseInt(conductedBy, 10) : null);
      queryStr += `conducted_by = $${params.length}, `;
    }

    if (scheduledAt !== undefined) {
      const scheduledDate = new Date(scheduledAt);
      if (isNaN(scheduledDate.getTime())) {
        return res.status(400).json({ message: "Invalid scheduled date/time." });
      }
      if (scheduledDate < new Date()) {
        return res
          .status(400)
          .json({ message: "Scheduled date/time must be in the future." });
      }
      params.push(scheduledDate);
      queryStr += `scheduled_at = $${params.length}, `;
    }

    if (notes !== undefined) {
      params.push(notes);
      queryStr += `notes = $${params.length}, `;
    }

    queryStr = queryStr.slice(0, -2); // Remove trailing comma
    params.push(meetingId);
    queryStr += ` WHERE id = $${params.length} RETURNING *`;

    const result = await db.query(queryStr, params);
    return res.json({
      message: "Meeting updated successfully.",
      data: result.rows[0],
    });
  } catch (err) {
    console.error("updateMeeting error:", err);
    return res.status(500).json({ message: "Server error." });
  }
}

async function getHrEmployees(req, res) {
  try {
    const result = await db.query(
      `SELECT e.id as _id, e.id, e.first_name as "firstName", e.last_name as "lastName", e.employee_id as "employeeId", e.designation
       FROM employees e
       WHERE UPPER(TRIM(e.department)) = 'HR' AND e.status = 'active'
       ORDER BY e.first_name ASC`,
    );
    return res.json({ data: result.rows });
  } catch (err) {
    console.error("getHrEmployees error:", err);
    return res.status(500).json({ message: "Server error." });
  }
}

module.exports = {
  createMeeting,
  getMeetings,
  updateMeeting,
  getHrEmployees,
};
