const db = require("../../config/db");

async function getContracts(req, res) {
  try {
    let result;
    if (req.user.role === "admin") {
      result = await db.query(
        `SELECT c.id as _id, c.id, c.title, c.content, c.status, c.signature_data as "signatureData", c.signed_at as "signedAt", c.created_at as "createdAt",
                e.first_name as "firstName", e.last_name as "lastName"
         FROM contracts c
         LEFT JOIN employees e ON c.employee_id = e.id
         ORDER BY c.created_at DESC`,
      );
    } else {
      const empRes = await db.query(
        "SELECT id FROM employees WHERE user_id = $1",
        [req.user.id],
      );
      const employee = empRes.rows[0];
      if (!employee) return res.json({ data: [] });

      result = await db.query(
        `SELECT id as _id, id, title, content, status, signature_data as "signatureData", signed_at as "signedAt", created_at as "createdAt"
         FROM contracts
         WHERE employee_id = $1
         ORDER BY created_at DESC`,
        [employee.id],
      );
    }
    return res.json({ data: result.rows });
  } catch (err) {
    console.error("getContracts error:", err);
    return res.status(500).json({ message: "Server error." });
  }
}

async function getOkrs(req, res) {
  try {
    let result;
    if (req.user.role === "admin" || req.user.role === "manager") {
      result = await db.query(
        `SELECT o.id as _id, o.id, o.objective, o.key_results as "keyResults", o.progress, o.target_date as "targetDate", o.status, o.feedback,
                e.first_name as "firstName", e.last_name as "lastName"
         FROM okrs o
         LEFT JOIN employees e ON o.employee_id = e.id
         ORDER BY o.created_at DESC`,
      );
    } else {
      const empRes = await db.query(
        "SELECT id FROM employees WHERE user_id = $1",
        [req.user.id],
      );
      const employee = empRes.rows[0];
      if (!employee) return res.json({ data: [] });

      result = await db.query(
        `SELECT id as _id, id, objective, key_results as "keyResults", progress, target_date as "targetDate", status, feedback
         FROM okrs
         WHERE employee_id = $1
         ORDER BY created_at DESC`,
        [employee.id],
      );
    }
    return res.json({ data: result.rows });
  } catch (err) {
    console.error("getOkrs error:", err);
    return res.status(500).json({ message: "Server error." });
  }
}

async function getJobPostings(req, res) {
  try {
    const result = await db.query(
      `SELECT id as _id, id, title, description, department, status, created_at as "createdAt"
       FROM job_postings
       ORDER BY created_at DESC`,
    );
    return res.json({ data: result.rows });
  } catch (err) {
    console.error("getJobPostings error:", err);
    return res.status(500).json({ message: "Server error." });
  }
}

async function getJobApplications(req, res) {
  try {
    const result = await db.query(
      `SELECT a.id as _id, a.id, a.name, a.email, a.resume_url as "resumeUrl", a.status, a.feedback, a.created_at as "createdAt",
              jp.title as "jobTitle", jp.department
       FROM job_applications a
       JOIN job_postings jp ON a.job_id = jp.id
       ORDER BY a.created_at DESC`,
    );
    return res.json({ data: result.rows });
  } catch (err) {
    console.error("getJobApplications error:", err);
    return res.status(500).json({ message: "Server error." });
  }
}

async function getShifts(req, res) {
  try {
    let result;
    if (req.user.role === "admin" || req.user.role === "manager") {
      result = await db.query(
        `SELECT s.id as _id, s.id, s.start_time as "startTime", s.end_time as "endTime", s.notes,
                e.first_name as "firstName", e.last_name as "lastName"
         FROM shifts s
         LEFT JOIN employees e ON s.employee_id = e.id
         ORDER BY s.start_time ASC`,
      );
    } else {
      const empRes = await db.query(
        "SELECT id FROM employees WHERE user_id = $1",
        [req.user.id],
      );
      const employee = empRes.rows[0];
      if (!employee) return res.json({ data: [] });

      result = await db.query(
        `SELECT id as _id, id, start_time as "startTime", end_time as "endTime", notes
         FROM shifts
         WHERE employee_id = $1
         ORDER BY start_time ASC`,
        [employee.id],
      );
    }
    return res.json({ data: result.rows });
  } catch (err) {
    console.error("getShifts error:", err);
    return res.status(500).json({ message: "Server error." });
  }
}

module.exports = {
  getContracts,
  getOkrs,
  getJobPostings,
  getJobApplications,
  getShifts,
};
