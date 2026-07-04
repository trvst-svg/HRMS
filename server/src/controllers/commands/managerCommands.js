const db = require("../../config/db");
const { notifyLeaveOrWfhDecision } = require("../../services/mailService");
const {
  applyApprovedRequestToAttendance,
} = require("../../services/attendanceStatusService");

async function getManagerDepartment(userId) {
  const result = await db.query(
    "SELECT department FROM employees WHERE user_id = $1 LIMIT 1",
    [userId],
  );
  return String(result.rows[0]?.department || "").trim();
}

async function approveLeave(req, res) {
  try {
    const { id } = req.params;
    const idInt = parseInt(id, 10);
    if (isNaN(idInt))
      return res.status(400).json({ message: "Invalid leave request id" });

    const department = await getManagerDepartment(req.user.id);
    if (!department)
      return res.status(400).json({ message: "Manager department not set." });

    const result = await db.query(
      `SELECT lr.*, lr.from_date as "from", lr.to_date as "to",
              e.id as emp_id, e.first_name as "firstName", e.last_name as "lastName", e.email, e.department,
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

    if (String(request.department || "").trim() !== department) {
      return res
        .status(403)
        .json({ message: "You can only manage your own department requests." });
    }

    if (request.emp_user_role !== "employee") {
      return res
        .status(403)
        .json({ message: "Manager can approve only employee leave requests." });
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

    await db.query(
      "UPDATE employees SET status = 'inactive' WHERE id = $1",
      [request.employee_id]
    );

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
      decidedByRole: "manager",
    });

    updatedRequest.employee = {
      _id: request.emp_id,
      id: request.emp_id,
      firstName: request.firstName,
      lastName: request.lastName,
      email: request.email,
      department: request.department,
    };

    return res.json({ message: "Leave approved", data: updatedRequest });
  } catch (err) {
    console.error("manager approveLeave error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

async function rejectLeave(req, res) {
  try {
    const { id } = req.params;
    const idInt = parseInt(id, 10);
    if (isNaN(idInt))
      return res.status(400).json({ message: "Invalid leave request id" });

    const department = await getManagerDepartment(req.user.id);
    if (!department)
      return res.status(400).json({ message: "Manager department not set." });

    const result = await db.query(
      `SELECT lr.*, lr.from_date as "from", lr.to_date as "to",
              e.id as emp_id, e.first_name as "firstName", e.last_name as "lastName", e.email, e.department,
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

    if (String(request.department || "").trim() !== department) {
      return res
        .status(403)
        .json({ message: "You can only manage your own department requests." });
    }

    if (request.emp_user_role !== "employee") {
      return res
        .status(403)
        .json({ message: "Manager can reject only employee leave requests." });
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
      decidedByRole: "manager",
    });

    updatedRequest.employee = {
      _id: request.emp_id,
      id: request.emp_id,
      firstName: request.firstName,
      lastName: request.lastName,
      email: request.email,
      department: request.department,
    };

    return res.json({ message: "Leave rejected", data: updatedRequest });
  } catch (err) {
    console.error("manager rejectLeave error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

async function approveWfh(req, res) {
  try {
    const { id } = req.params;
    const idInt = parseInt(id, 10);
    if (isNaN(idInt))
      return res.status(400).json({ message: "Invalid WFH request id" });

    const department = await getManagerDepartment(req.user.id);
    if (!department)
      return res.status(400).json({ message: "Manager department not set." });

    const result = await db.query(
      `SELECT lr.*, lr.from_date as "from", lr.to_date as "to",
              e.id as emp_id, e.first_name as "firstName", e.last_name as "lastName", e.email, e.department,
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

    if (String(request.department || "").trim() !== department) {
      return res
        .status(403)
        .json({ message: "You can only manage your own department requests." });
    }

    if (request.emp_user_role !== "employee") {
      return res
        .status(403)
        .json({ message: "Manager can approve only employee WFH requests." });
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
      decidedByRole: "manager",
    });

    updatedRequest.employee = {
      _id: request.emp_id,
      id: request.emp_id,
      firstName: request.firstName,
      lastName: request.lastName,
      email: request.email,
      department: request.department,
    };

    return res.json({ message: "WFH approved", data: updatedRequest });
  } catch (err) {
    console.error("manager approveWfh error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

async function rejectWfh(req, res) {
  try {
    const { id } = req.params;
    const idInt = parseInt(id, 10);
    if (isNaN(idInt))
      return res.status(400).json({ message: "Invalid WFH request id" });

    const department = await getManagerDepartment(req.user.id);
    if (!department)
      return res.status(400).json({ message: "Manager department not set." });

    const result = await db.query(
      `SELECT lr.*, lr.from_date as "from", lr.to_date as "to",
              e.id as emp_id, e.first_name as "firstName", e.last_name as "lastName", e.email, e.department,
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

    if (String(request.department || "").trim() !== department) {
      return res
        .status(403)
        .json({ message: "You can only manage your own department requests." });
    }

    if (request.emp_user_role !== "employee") {
      return res
        .status(403)
        .json({ message: "Manager can reject only employee WFH requests." });
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
      decidedByRole: "manager",
    });

    updatedRequest.employee = {
      _id: request.emp_id,
      id: request.emp_id,
      firstName: request.firstName,
      lastName: request.lastName,
      email: request.email,
      department: request.department,
    };

    return res.json({ message: "WFH rejected", data: updatedRequest });
  } catch (err) {
    console.error("manager rejectWfh error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

module.exports = {
  approveLeave,
  rejectLeave,
  approveWfh,
  rejectWfh,
};
