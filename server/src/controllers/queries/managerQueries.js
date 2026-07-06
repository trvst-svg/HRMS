const db = require("../../config/db");

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

async function getManagerDepartment(userId) {
  const result = await db.query(
    "SELECT department FROM employees WHERE user_id = $1 LIMIT 1",
    [userId],
  );
  return String(result.rows[0]?.department || "").trim();
}

function roleLabel(role) {
  return role === "manager"
    ? "Manager"
    : role === "admin"
      ? "Admin"
      : "Employee";
}

function ping(req, res) {
  return res.json({ message: "Manager route working" });
}

async function dashboardSummary(req, res) {
  try {
    const department = await getManagerDepartment(req.user.id);
    if (!department)
      return res.status(400).json({ message: "Manager department not set." });

    const startToday = startOfDay(new Date());
    const endToday = endOfDay(new Date());
    const startMonth = new Date();
    startMonth.setDate(1);
    startMonth.setHours(0, 0, 0, 0);

    const totalResult = await db.query(
      `SELECT COUNT(*)::int FROM employees e JOIN users u ON e.user_id = u.id WHERE e.department = $1 AND u.role = 'employee' AND e.status = 'active'`,
      [department],
    );
    const totalEmployees = totalResult.rows[0]?.count || 0;

    const presentResult = await db.query(
      `SELECT COUNT(DISTINCT a.employee_id)::int FROM attendance a
       JOIN employees e ON a.employee_id = e.id
       JOIN users u ON e.user_id = u.id
       WHERE e.department = $1 AND u.role = 'employee' AND a.date >= $2 AND a.date <= $3 AND a.status IN ('Present', 'WFH')`,
      [department, startToday, endToday],
    );
    const presentToday = presentResult.rows[0]?.count || 0;

    const pendingResult = await db.query(
      `SELECT COUNT(*)::int FROM leave_requests lr
       JOIN employees e ON lr.employee_id = e.id
       JOIN users u ON e.user_id = u.id
       WHERE e.department = $1 AND u.role = 'employee' AND lr.status = 'Pending'`,
      [department],
    );
    const pendingLeaves = pendingResult.rows[0]?.count || 0;

    const approvedResult = await db.query(
      `SELECT COUNT(*)::int FROM leave_requests lr
       JOIN employees e ON lr.employee_id = e.id
       JOIN users u ON e.user_id = u.id
       WHERE e.department = $1 AND u.role = 'employee' AND lr.status = 'Approved' AND lr.approved_at >= $2`,
      [department, startMonth],
    );
    const approvedThisMonth = approvedResult.rows[0]?.count || 0;

    const leaveOutcomeResult = await db.query(
      `SELECT lr.status as _id, COUNT(*)::int FROM leave_requests lr
       JOIN employees e ON lr.employee_id = e.id
       JOIN users u ON e.user_id = u.id
       WHERE e.department = $1 AND u.role = 'employee' AND lr.status IN ('Approved', 'Rejected') 
       GROUP BY lr.status`,
      [department],
    );
    const leaveOutcomeStats = leaveOutcomeResult.rows;

    const recentResult = await db.query(
      `SELECT e.id as _id, e.id, e.employee_id as "employeeId", e.first_name as "firstName", e.last_name as "lastName", e.email, e.department, e.designation, e.status, e.created_at as "createdAt"
       FROM employees e
       JOIN users u ON e.user_id = u.id
       WHERE e.department = $1 AND u.role = 'employee'
       ORDER BY e.created_at DESC
       LIMIT 5`,
      [department],
    );
    const recentEmployees = recentResult.rows;

    const attendanceRate = totalEmployees
      ? Math.round((presentToday / totalEmployees) * 100)
      : 0;
    const approvedCount =
      leaveOutcomeStats.find((x) => x._id === "Approved")?.count || 0;
    const rejectedCount =
      leaveOutcomeStats.find((x) => x._id === "Rejected")?.count || 0;
    const leaveApprovalRate =
      approvedCount + rejectedCount
        ? Math.round((approvedCount / (approvedCount + rejectedCount)) * 100)
        : 0;

    return res.json({
      data: {
        totalEmployees,
        presentToday,
        pendingLeaves,
        approvedLeaves: approvedThisMonth,
        attendanceRate,
        leaveApprovalRate,
        department,
        managerRole: roleLabel(req.user.role),
        generatedAt: new Date(),
        recentEmployees,
      },
    });
  } catch (err) {
    console.error("manager dashboardSummary error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

async function getEmployees(req, res) {
  try {
    const department = await getManagerDepartment(req.user.id);
    if (!department)
      return res.status(400).json({ message: "Manager department not set." });

    const {
      search = "",
      status = "",
      role = "",
      department: departmentFilter = "",
      page = "1",
      limit = "20",
    } = req.query;
    const safePage = Math.max(parseInt(page, 10) || 1, 1);
    const safeLimit = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
    const offset = (safePage - 1) * safeLimit;

    if (departmentFilter && String(departmentFilter).trim() !== department) {
      return res.json({
        data: [],
        pagination: { page: 1, limit: safeLimit, total: 0, pages: 1 },
      });
    }
    if (role && !["employee", "project_manager"].includes(String(role))) {
      return res.json({
        data: [],
        pagination: { page: 1, limit: safeLimit, total: 0, pages: 1 },
      });
    }

    let queryStr = `
      SELECT e.id AS _id, e.id, e.employee_id as "employeeId", e.first_name as "firstName", e.last_name as "lastName", e.email, e.phone, e.department, e.designation, e.join_date as "joinDate", e.status, e.annual_salary as "annualSalary", e.filing_status as "filingStatus", e.base_salary as "baseSalary", e.created_at as "createdAt", e.updated_at as "updatedAt",
             u.name as u_name, u.email as u_email, u.role as u_role, u.avatar as u_avatar,
             COUNT(*) OVER()::int as total_count
      FROM employees e
      JOIN users u ON e.user_id = u.id
      WHERE e.department = $1 AND u.role IN ('employee', 'project_manager')
    `;
    const params = [department];

    if (role) {
      if (role === "employee") {
        queryStr += ` AND u.role IN ('employee', 'project_manager')`;
      } else if (role === "project_manager") {
        queryStr += ` AND u.role = 'project_manager'`;
      }
    }

    if (status && ["active", "inactive"].includes(String(status))) {
      params.push(status);
      queryStr += ` AND e.status = $${params.length}`;
    }

    if (search && String(search).trim()) {
      params.push(`%${String(search).trim()}%`);
      queryStr += ` AND (e.employee_id ILIKE $${params.length} OR e.first_name ILIKE $${params.length} OR e.last_name ILIKE $${params.length} OR e.email ILIKE $${params.length} OR e.department ILIKE $${params.length} OR e.designation ILIKE $${params.length})`;
    }

    queryStr += " ORDER BY e.created_at DESC";

    params.push(safeLimit);
    queryStr += ` LIMIT $${params.length}`;

    params.push(offset);
    queryStr += ` OFFSET $${params.length}`;

    const result = await db.query(queryStr, params);
    const rows = result.rows;
    const total = rows[0]?.total_count || 0;

    const data = rows.map((r) => ({
      _id: r._id,
      id: r.id,
      employeeId: r.employeeId,
      firstName: r.firstName,
      lastName: r.lastName,
      email: r.email,
      phone: r.phone,
      department: r.department,
      designation: r.designation,
      joinDate: r.joinDate,
      status: r.status,
      annualSalary: Number(r.annualSalary),
      filingStatus: r.filingStatus,
      baseSalary: Number(r.baseSalary),
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      user: {
        _id: r.id,
        name: r.u_name,
        email: r.u_email,
        role: r.u_role,
        avatar: r.u_avatar || null,
      },
    }));

    return res.json({
      data,
      pagination: {
        page: safePage,
        limit: safeLimit,
        total,
        pages: Math.max(Math.ceil(total / safeLimit), 1),
      },
    });
  } catch (err) {
    console.error("manager getEmployees error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

async function getAttendance(req, res) {
  try {
    const department = await getManagerDepartment(req.user.id);
    if (!department)
      return res.status(400).json({ message: "Manager department not set." });

    const { from, to, employeeId, status = "" } = req.query;
    const fromDate = from ? startOfDay(from) : startOfDay(new Date());
    const toDate = to ? endOfDay(to) : endOfDay(fromDate);
    const isSingleDay = fromDate.getTime() === startOfDay(toDate).getTime();
    const normalizedStatus = String(status || "").trim();

    if (isSingleDay) {
      let empQuery = `
        SELECT e.id, e.employee_id as "employeeId", e.first_name as "firstName", e.last_name as "lastName", e.email, e.department 
        FROM employees e
        JOIN users u ON e.user_id = u.id
        WHERE e.department = $1 AND u.role = 'employee' AND e.status = 'active'
      `;
      const params = [department];

      if (employeeId) {
        params.push(employeeId);
        empQuery += ` AND e.employee_id = $${params.length}`;
      }

      empQuery += " ORDER BY e.first_name ASC, e.last_name ASC";
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
            department: emp.department,
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

    // Range query
    let rangeQuery = `
      SELECT a.id AS _id, a.id, a.date, a.check_in as "checkIn", a.check_out as "checkOut", a.status, a.notes,
             e.id as emp_id, e.employee_id as "employeeId", e.first_name as "firstName", e.last_name as "lastName", e.email, e.department
      FROM attendance a
      JOIN employees e ON a.employee_id = e.id
      JOIN users u ON e.user_id = u.id
      WHERE e.department = $1 AND u.role = 'employee' AND a.date >= $2 AND a.date <= $3
    `;
    const params = [department, fromDate, toDate];

    if (employeeId) {
      params.push(employeeId);
      rangeQuery += ` AND e.employee_id = $${params.length}`;
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
        department: row.department,
      },
    }));

    return res.json({ data: records });
  } catch (err) {
    console.error("manager getAttendance error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

async function getLeaveRequests(req, res) {
  try {
    const department = await getManagerDepartment(req.user.id);
    if (!department)
      return res.status(400).json({ message: "Manager department not set." });

    const { status, search = "", from = "", to = "" } = req.query;

    let queryStr = `
      SELECT lr.id AS _id, lr.id, lr.type, lr.from_date as "from", lr.to_date as "to", lr.reason, lr.status, lr.approved_by as "approvedBy", lr.approved_at as "approvedAt", lr.created_at as "createdAt", lr.updated_at as "updatedAt",
             e.id as emp_id, e.employee_id as "employeeId", e.first_name as "firstName", e.last_name as "lastName", e.email, e.department
      FROM leave_requests lr
      JOIN employees e ON lr.employee_id = e.id
      JOIN users u ON e.user_id = u.id
      WHERE lr.type != 'WFH' AND e.department = $1 AND u.role = 'employee'
    `;
    const params = [department];

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
        department: row.department,
      },
    }));

    return res.json({ data });
  } catch (err) {
    console.error("manager getLeaveRequests error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

async function getWfhRequests(req, res) {
  try {
    const department = await getManagerDepartment(req.user.id);
    if (!department)
      return res.status(400).json({ message: "Manager department not set." });

    const { status, search = "", from = "", to = "" } = req.query;

    let queryStr = `
      SELECT lr.id AS _id, lr.id, lr.type, lr.from_date as "from", lr.to_date as "to", lr.reason, lr.status, lr.approved_by as "approvedBy", lr.approved_at as "approvedAt", lr.created_at as "createdAt", lr.updated_at as "updatedAt",
             e.id as emp_id, e.employee_id as "employeeId", e.first_name as "firstName", e.last_name as "lastName", e.email, e.department
      FROM leave_requests lr
      JOIN employees e ON lr.employee_id = e.id
      JOIN users u ON e.user_id = u.id
      WHERE lr.type = 'WFH' AND e.department = $1 AND u.role = 'employee'
    `;
    const params = [department];

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
        department: row.department,
      },
    }));

    return res.json({ data });
  } catch (err) {
    console.error("manager getWfhRequests error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

module.exports = {
  ping,
  dashboardSummary,
  getEmployees,
  getAttendance,
  getLeaveRequests,
  getWfhRequests,
};
