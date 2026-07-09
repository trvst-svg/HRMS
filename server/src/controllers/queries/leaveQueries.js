import db from "../../config/db.js";
import { getOrCreateEmployeeForUser } from "./employeeQueries.js";

async function getMyLeave(req, res) {
  try {
    const employee = await getOrCreateEmployeeForUser(req.user);
    const { type } = req.query;

    let queryStr = `
      SELECT id AS _id, id, type, from_date as "from", to_date as "to", reason, status, approved_by as "approvedBy", approved_at as "approvedAt", created_at as "createdAt", updated_at as "updatedAt"
      FROM leave_requests
      WHERE employee_id = $1 AND type != 'WFH'
    `;
    const params = [employee.id];

    if (type) {
      params.push(type);
      queryStr += ` AND type = $${params.length}`;
    }

    queryStr += " ORDER BY created_at DESC";
    const result = await db.query(queryStr, params);

    return res.json({ data: result.rows });
  } catch (err) {
    console.error("getMyLeave error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

async function getAdminLeaveRequests(req, res) {
  try {
    const { status, search = "", from = "", to = "" } = req.query;

    let queryStr = `
      SELECT lr.id AS _id, lr.id, lr.type, lr.from_date as "from", lr.to_date as "to", lr.reason, lr.status, lr.approved_by as "approvedBy", lr.approved_at as "approvedAt", lr.created_at as "createdAt", lr.updated_at as "updatedAt",
             e.id as emp_id, e.employee_id as "employeeId", e.first_name as "firstName", e.last_name as "lastName", e.email
      FROM leave_requests lr
      JOIN employees e ON lr.employee_id = e.id
      JOIN users u ON e.user_id = u.id
      WHERE lr.type != 'WFH' AND u.role = 'manager'
    `;
    const params = [];

    if (status) {
      params.push(status);
      queryStr += ` AND lr.status = $${params.length}`;
    }

    if (from) {
      params.push(new Date(from));
      queryStr += ` AND lr.created_at >= $${params.length}`;
    }

    if (to) {
      const toDate = new Date(to);
      toDate.setHours(23, 59, 59, 999);
      params.push(toDate);
      queryStr += ` AND lr.created_at <= $${params.length}`;
    }

    if (search && String(search).trim()) {
      params.push(`%${String(search).trim()}%`);
      queryStr += ` AND (e.employee_id ILIKE $${params.length} OR e.first_name ILIKE $${params.length} OR e.last_name ILIKE $${params.length} OR e.email ILIKE $${params.length})`;
    }

    queryStr += " ORDER BY lr.created_at DESC";
    const result = await db.query(queryStr, params);

    const data = result.rows.map((row) => ({
      _id: row._id,
      id: row.id,
      type: row.type,
      from: row.from,
      to: row.to,
      reason: row.reason,
      status: row.status,
      approvedBy: row.approvedBy,
      approvedAt: row.approvedAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      employee: {
        _id: row.emp_id,
        id: row.emp_id,
        employeeId: row.employeeId,
        firstName: row.firstName,
        lastName: row.lastName,
        email: row.email,
      },
    }));

    return res.json({ data });
  } catch (err) {
    console.error("getAdminLeaveRequests error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

async function getMyWfh(req, res) {
  try {
    const employee = await getOrCreateEmployeeForUser(req.user);
    const result = await db.query(
      `SELECT id AS _id, id, type, from_date as "from", to_date as "to", reason, status, approved_by as "approvedBy", approved_at as "approvedAt", created_at as "createdAt", updated_at as "updatedAt"
       FROM leave_requests 
       WHERE employee_id = $1 AND type = 'WFH' 
       ORDER BY created_at DESC`,
      [employee.id],
    );
    return res.json({ data: result.rows });
  } catch (err) {
    console.error("getMyWfh error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

async function getAdminWfhRequests(req, res) {
  try {
    const { status, search = "", from = "", to = "" } = req.query;

    let queryStr = `
      SELECT lr.id AS _id, lr.id, lr.type, lr.from_date as "from", lr.to_date as "to", lr.reason, lr.status, lr.approved_by as "approvedBy", lr.approved_at as "approvedAt", lr.created_at as "createdAt", lr.updated_at as "updatedAt",
             e.id as emp_id, e.employee_id as "employeeId", e.first_name as "firstName", e.last_name as "lastName", e.email
      FROM leave_requests lr
      JOIN employees e ON lr.employee_id = e.id
      JOIN users u ON e.user_id = u.id
      WHERE lr.type = 'WFH' AND u.role = 'manager'
    `;
    const params = [];

    if (status) {
      params.push(status);
      queryStr += ` AND lr.status = $${params.length}`;
    }

    if (from) {
      params.push(new Date(from));
      queryStr += ` AND lr.created_at >= $${params.length}`;
    }

    if (to) {
      const toDate = new Date(to);
      toDate.setHours(23, 59, 59, 999);
      params.push(toDate);
      queryStr += ` AND lr.created_at <= $${params.length}`;
    }

    if (search && String(search).trim()) {
      params.push(`%${String(search).trim()}%`);
      queryStr += ` AND (e.employee_id ILIKE $${params.length} OR e.first_name ILIKE $${params.length} OR e.last_name ILIKE $${params.length} OR e.email ILIKE $${params.length})`;
    }

    queryStr += " ORDER BY lr.created_at DESC";
    const result = await db.query(queryStr, params);

    const data = result.rows.map((row) => ({
      _id: row._id,
      id: row.id,
      type: row.type,
      from: row.from,
      to: row.to,
      reason: row.reason,
      status: row.status,
      approvedBy: row.approvedBy,
      approvedAt: row.approvedAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      employee: {
        _id: row.emp_id,
        id: row.emp_id,
        employeeId: row.employeeId,
        firstName: row.firstName,
        lastName: row.lastName,
        email: row.email,
      },
    }));

    return res.json({ data });
  } catch (err) {
    console.error("getAdminWfhRequests error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

export { getMyLeave, getAdminLeaveRequests, getMyWfh, getAdminWfhRequests };
export default { getMyLeave, getAdminLeaveRequests, getMyWfh, getAdminWfhRequests };
