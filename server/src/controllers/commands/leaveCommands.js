const db = require("../../config/db");
const { getOrCreateEmployeeForUser } = require("../queries/employeeQueries");
const { notifyLeaveOrWfhDecision } = require("../../services/mailService");
const {
  applyApprovedRequestToAttendance,
} = require("../../services/attendanceStatusService");

const DATE_ONLY_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const REASON_REGEX = /^[A-Za-z0-9][A-Za-z0-9\s.,'()&-]{2,249}$/;

function isValidDateOnly(value) {
  if (!DATE_ONLY_REGEX.test(String(value || ""))) return false;
  const d = new Date(value);
  return !Number.isNaN(d.getTime());
}

function normalizeDateOnly(input) {
  const date = new Date(input);
  date.setHours(0, 0, 0, 0);
  return date;
}

function validateReasonText(text) {
  const clean = String(text || "").trim();
  if (!clean) return "Reason is required";
  if (!REASON_REGEX.test(clean)) {
    return "Reason must be 3-250 chars and use only letters, numbers and basic punctuation.";
  }
  return "";
}

function normalizeLeaveType(rawType) {
  const input = String(rawType || "Annual").trim();
  const lower = input.toLowerCase();

  if (lower === "leave") return "Annual";
  if (lower === "annual" || lower === "annual leave") return "Annual";
  if (lower === "sick" || lower === "sick leave") return "Sick";
  if (lower === "casual" || lower === "casual leave") return "Casual";
  if (lower === "other") return "Other";
  if (lower === "wfh" || lower === "work from home") return "WFH";

  return input;
}

async function hasPendingLeaveOrWfhRequest(employeeId) {
  const result = await db.query(
    "SELECT type FROM leave_requests WHERE employee_id = $1 AND status = 'Pending' LIMIT 1",
    [employeeId],
  );
  return result.rows[0];
}

async function createLeave(req, res) {
  try {
    const { from, to, reason, type } = req.body;
    if (!from)
      return res.status(400).json({ message: "From date is required" });
    if (!type)
      return res.status(400).json({ message: "Leave type is required" });
    const finalTo = to || from;
    const cleanReason = String(reason || "").trim();

    const reasonError = validateReasonText(cleanReason);
    if (reasonError) return res.status(400).json({ message: reasonError });

    if (!isValidDateOnly(from) || !isValidDateOnly(finalTo)) {
      return res
        .status(400)
        .json({ message: "Date format must be YYYY-MM-DD" });
    }
    const fromDate = new Date(from);
    const toDate = new Date(finalTo);
    const today = normalizeDateOnly(new Date());
    if (toDate < fromDate) {
      return res
        .status(400)
        .json({ message: "To date cannot be before from date" });
    }
    if (normalizeDateOnly(fromDate) < today) {
      return res
        .status(400)
        .json({ message: "Leave cannot be requested for past dates" });
    }

    const leaveType = normalizeLeaveType(type);
    if (leaveType === "WFH") {
      return res
        .status(400)
        .json({ message: "Use /wfh endpoint for Work From Home requests" });
    }
    if (!["Annual", "Sick", "Casual", "Other"].includes(leaveType)) {
      return res.status(400).json({
        message: "Invalid leave type. Allowed: Annual, Sick, Casual, Other",
      });
    }

    const employee = await getOrCreateEmployeeForUser(req.user);
    const pendingRequest = await hasPendingLeaveOrWfhRequest(employee.id);
    if (pendingRequest) {
      return res.status(400).json({
        message: `You already have a pending ${pendingRequest.type} request. Please wait until it is reviewed before creating another Leave or WFH request.`,
      });
    }

    const insertResult = await db.query(
      `INSERT INTO leave_requests (employee_id, type, from_date, to_date, reason, status)
       VALUES ($1, $2, $3, $4, $5, 'Pending')
       RETURNING id AS _id, id, type, from_date as "from", to_date as "to", reason, status`,
      [employee.id, leaveType, fromDate, toDate, cleanReason],
    );

    return res
      .status(201)
      .json({ message: "Leave request submitted", data: insertResult.rows[0] });
  } catch (err) {
    console.error("createLeave error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

async function approveLeave(req, res) {
  try {
    const { id } = req.params;
    const idInt = parseInt(id, 10);
    if (isNaN(idInt))
      return res.status(400).json({ message: "Invalid leave request ID" });

    const result = await db.query(
      `SELECT lr.*, lr.from_date as "from", lr.to_date as "to",
              e.id as emp_id, e.first_name as "firstName", e.last_name as "lastName", e.email, e.user_id as emp_user_id,
              u.role as emp_user_role
       FROM leave_requests lr
       JOIN employees e ON lr.employee_id = e.id
       JOIN users u ON e.user_id = u.id
       WHERE lr.id = $1 AND lr.type != 'WFH'`,
      [idInt],
    );
    const request = result.rows[0];
    if (!request)
      return res.status(404).json({ message: "Leave request not found" });

    if (request.emp_user_role !== "manager") {
      return res
        .status(403)
        .json({ message: "Admin can approve only manager leave requests." });
    }

    const updateResult = await db.query(
      `UPDATE leave_requests 
       SET status = 'Approved', approved_by = $1, approved_at = $2 
       WHERE id = $3 
       RETURNING id AS _id, id, type, from_date as "from", to_date as "to", reason, status, approved_by as "approvedBy", approved_at as "approvedAt"`,
      [req.user.id, new Date(), idInt],
    );
    const updatedRequest = updateResult.rows[0];

    await applyApprovedRequestToAttendance({
      employeeId: request.employee_id,
      from: request.from,
      to: request.to,
      status: "Leave",
    });

    await notifyLeaveOrWfhDecision({
      requestType: "Leave",
      status: "Approved",
      employeeName:
        `${request.firstName || ""} ${request.lastName || ""}`.trim() ||
        "Employee",
      employeeEmail: request.email || "-",
      fromDate: request.from,
      toDate: request.to,
      reason: request.reason || "",
      decidedByRole: "admin",
    });

    updatedRequest.employee = {
      _id: request.emp_id,
      id: request.emp_id,
      firstName: request.firstName,
      lastName: request.lastName,
      email: request.email,
    };

    return res.json({ message: "Leave approved", data: updatedRequest });
  } catch (err) {
    console.error("approveLeave error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

async function rejectLeave(req, res) {
  try {
    const { id } = req.params;
    const idInt = parseInt(id, 10);
    if (isNaN(idInt))
      return res.status(400).json({ message: "Invalid leave request ID" });

    const result = await db.query(
      `SELECT lr.*, lr.from_date as "from", lr.to_date as "to",
              e.id as emp_id, e.first_name as "firstName", e.last_name as "lastName", e.email, e.user_id as emp_user_id,
              u.role as emp_user_role
       FROM leave_requests lr
       JOIN employees e ON lr.employee_id = e.id
       JOIN users u ON e.user_id = u.id
       WHERE lr.id = $1 AND lr.type != 'WFH'`,
      [idInt],
    );
    const request = result.rows[0];
    if (!request)
      return res.status(404).json({ message: "Leave request not found" });

    if (request.emp_user_role !== "manager") {
      return res
        .status(403)
        .json({ message: "Admin can reject only manager leave requests." });
    }

    const updateResult = await db.query(
      `UPDATE leave_requests 
       SET status = 'Rejected', approved_by = $1, approved_at = $2 
       WHERE id = $3 
       RETURNING id AS _id, id, type, from_date as "from", to_date as "to", reason, status, approved_by as "approvedBy", approved_at as "approvedAt"`,
      [req.user.id, new Date(), idInt],
    );
    const updatedRequest = updateResult.rows[0];

    await notifyLeaveOrWfhDecision({
      requestType: "Leave",
      status: "Rejected",
      employeeName:
        `${request.firstName || ""} ${request.lastName || ""}`.trim() ||
        "Employee",
      employeeEmail: request.email || "-",
      fromDate: request.from,
      toDate: request.to,
      reason: request.reason || "",
      decidedByRole: "admin",
    });

    updatedRequest.employee = {
      _id: request.emp_id,
      id: request.emp_id,
      firstName: request.firstName,
      lastName: request.lastName,
      email: request.email,
    };

    return res.json({ message: "Leave rejected", data: updatedRequest });
  } catch (err) {
    console.error("rejectLeave error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

async function createWfh(req, res) {
  try {
    const { from, to, reason } = req.body;
    if (!from)
      return res.status(400).json({ message: "From date is required" });
    const finalTo = to || from;
    const cleanReason = String(reason || "").trim();

    const reasonError = validateReasonText(cleanReason);
    if (reasonError) return res.status(400).json({ message: reasonError });

    if (!isValidDateOnly(from) || !isValidDateOnly(finalTo)) {
      return res
        .status(400)
        .json({ message: "Date format must be YYYY-MM-DD" });
    }
    const fromDate = new Date(from);
    const toDate = new Date(finalTo);
    const today = normalizeDateOnly(new Date());
    if (toDate < fromDate) {
      return res
        .status(400)
        .json({ message: "To date cannot be before from date" });
    }
    if (normalizeDateOnly(fromDate) < today) {
      return res
        .status(400)
        .json({ message: "WFH cannot be requested for past dates" });
    }

    const employee = await getOrCreateEmployeeForUser(req.user);
    const pendingRequest = await hasPendingLeaveOrWfhRequest(employee.id);
    if (pendingRequest) {
      return res.status(400).json({
        message: `You already have a pending ${pendingRequest.type} request. Please wait until it is reviewed before creating another Leave or WFH request.`,
      });
    }

    const insertResult = await db.query(
      `INSERT INTO leave_requests (employee_id, type, from_date, to_date, reason, status)
       VALUES ($1, 'WFH', $2, $3, $4, 'Pending')
       RETURNING id AS _id, id, type, from_date as "from", to_date as "to", reason, status`,
      [employee.id, fromDate, toDate, cleanReason],
    );

    return res
      .status(201)
      .json({ message: "WFH request submitted", data: insertResult.rows[0] });
  } catch (err) {
    console.error("createWfh error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

async function approveWfh(req, res) {
  try {
    const { id } = req.params;
    const idInt = parseInt(id, 10);
    if (isNaN(idInt))
      return res.status(400).json({ message: "Invalid request ID" });

    const result = await db.query(
      `SELECT lr.*, lr.from_date as "from", lr.to_date as "to",
              e.id as emp_id, e.first_name as "firstName", e.last_name as "lastName", e.email, e.user_id as emp_user_id,
              u.role as emp_user_role
       FROM leave_requests lr
       JOIN employees e ON lr.employee_id = e.id
       JOIN users u ON e.user_id = u.id
       WHERE lr.id = $1 AND lr.type = 'WFH'`,
      [idInt],
    );
    const request = result.rows[0];
    if (!request)
      return res.status(404).json({ message: "WFH request not found" });

    if (request.emp_user_role !== "manager") {
      return res
        .status(403)
        .json({ message: "Admin can approve only manager WFH requests." });
    }

    const updateResult = await db.query(
      `UPDATE leave_requests 
       SET status = 'Approved', approved_by = $1, approved_at = $2 
       WHERE id = $3 
       RETURNING id AS _id, id, type, from_date as "from", to_date as "to", reason, status, approved_by as "approvedBy", approved_at as "approvedAt"`,
      [req.user.id, new Date(), idInt],
    );
    const updatedRequest = updateResult.rows[0];

    await applyApprovedRequestToAttendance({
      employeeId: request.employee_id,
      from: request.from,
      to: request.to,
      status: "WFH",
    });

    await notifyLeaveOrWfhDecision({
      requestType: "WFH",
      status: "Approved",
      employeeName:
        `${request.firstName || ""} ${request.lastName || ""}`.trim() ||
        "Employee",
      employeeEmail: request.email || "-",
      fromDate: request.from,
      toDate: request.to,
      reason: request.reason || "",
      decidedByRole: "admin",
    });

    updatedRequest.employee = {
      _id: request.emp_id,
      id: request.emp_id,
      firstName: request.firstName,
      lastName: request.lastName,
      email: request.email,
    };

    return res.json({ message: "WFH approved", data: updatedRequest });
  } catch (err) {
    console.error("approveWfh error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

async function rejectWfh(req, res) {
  try {
    const { id } = req.params;
    const idInt = parseInt(id, 10);
    if (isNaN(idInt))
      return res.status(400).json({ message: "Invalid request ID" });

    const result = await db.query(
      `SELECT lr.*, lr.from_date as "from", lr.to_date as "to",
              e.id as emp_id, e.first_name as "firstName", e.last_name as "lastName", e.email, e.user_id as emp_user_id,
              u.role as emp_user_role
       FROM leave_requests lr
       JOIN employees e ON lr.employee_id = e.id
       JOIN users u ON e.user_id = u.id
       WHERE lr.id = $1 AND lr.type = 'WFH'`,
      [idInt],
    );
    const request = result.rows[0];
    if (!request)
      return res.status(404).json({ message: "WFH request not found" });

    if (request.emp_user_role !== "manager") {
      return res
        .status(403)
        .json({ message: "Admin can reject only manager WFH requests." });
    }

    const updateResult = await db.query(
      `UPDATE leave_requests 
       SET status = 'Rejected', approved_by = $1, approved_at = $2 
       WHERE id = $3 
       RETURNING id AS _id, id, type, from_date as "from", to_date as "to", reason, status, approved_by as "approvedBy", approved_at as "approvedAt"`,
      [req.user.id, new Date(), idInt],
    );
    const updatedRequest = updateResult.rows[0];

    await notifyLeaveOrWfhDecision({
      requestType: "WFH",
      status: "Rejected",
      employeeName:
        `${request.firstName || ""} ${request.lastName || ""}`.trim() ||
        "Employee",
      employeeEmail: request.email || "-",
      fromDate: request.from,
      toDate: request.to,
      reason: request.reason || "",
      decidedByRole: "admin",
    });

    updatedRequest.employee = {
      _id: request.emp_id,
      id: request.emp_id,
      firstName: request.firstName,
      lastName: request.lastName,
      email: request.email,
    };

    return res.json({ message: "WFH rejected", data: updatedRequest });
  } catch (err) {
    console.error("rejectWfh error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

module.exports = {
  createLeave,
  approveLeave,
  rejectLeave,
  createWfh,
  approveWfh,
  rejectWfh,
};
