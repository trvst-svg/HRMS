const db = require("../../config/db");

function normalizeDate(input = new Date()) {
  const d = new Date(input);
  d.setHours(0, 0, 0, 0);
  return d;
}

async function normalizeEmployeeDepartments(employees) {
  const depResult = await db.query("SELECT name FROM departments");
  const validDepartments = new Set(
    depResult.rows.map((row) => String(row.name || "").trim()).filter(Boolean),
  );

  return employees.map((employee) => {
    const rawDepartment = String(employee.department || "").trim();
    const department =
      rawDepartment && validDepartments.has(rawDepartment)
        ? rawDepartment
        : "Unassigned";
    return {
      ...employee,
      department,
    };
  });
}

function ping(req, res) {
  return res.json({ message: "Admin route working" });
}

async function getEmployees(req, res) {
  try {
    const {
      search = "",
      status = "",
      role = "",
      department = "",
      page = "1",
      limit = "20",
    } = req.query;
    const safePage = Math.max(parseInt(page, 10) || 1, 1);
    const safeLimit = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
    const offset = (safePage - 1) * safeLimit;

    let queryStr = `
      SELECT e.id AS _id, e.id, e.employee_id as "employeeId", e.first_name as "firstName", e.last_name as "lastName", e.email, e.phone, e.department, e.designation, e.join_date as "joinDate", e.status, e.annual_salary as "annualSalary", e.filing_status as "filingStatus", e.base_salary as "baseSalary", e.created_at as "createdAt", e.updated_at as "updatedAt",
             u.name as u_name, u.email as u_email, u.role as u_role, u.avatar as u_avatar,
             COUNT(*) OVER()::int as total_count
      FROM employees e
      JOIN users u ON e.user_id = u.id
      WHERE u.role <> 'admin'
    `;
    const params = [];

    if (status && ["active", "inactive", "layoff"].includes(String(status))) {
      params.push(status);
      queryStr += ` AND e.status = $${params.length}`;
    }

    if (department) {
      params.push(String(department).trim());
      queryStr += ` AND e.department = $${params.length}`;
    }

    if (role) {
      if (role === "employee") {
        queryStr += ` AND u.role IN ('employee', 'project_manager')`;
      } else if (role === "manager") {
        queryStr += ` AND u.role IN ('manager', 'department_head')`;
      } else if (["project_manager", "department_head"].includes(String(role))) {
        params.push(role);
        queryStr += ` AND u.role = $${params.length}`;
      } else {
        queryStr += ` AND 1=0`;
      }
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

    const rawEmployees = rows.map((r) => ({
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

    const data = await normalizeEmployeeDepartments(rawEmployees);

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
    console.error("getEmployees error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

async function getEmployeeProfile(req, res) {
  try {
    const idInt = parseInt(req.params.id, 10);
    if (isNaN(idInt))
      return res.status(400).json({ message: "Invalid employee id" });

    const empResult = await db.query(
      `SELECT e.*, e.annual_salary as "annualSalary", e.base_salary as "baseSalary", e.filing_status as "filingStatus", e.employee_id as "employeeId", e.first_name as "firstName", e.last_name as "lastName", e.join_date as "joinDate",
              e.gender, e.ssf_contributor as "ssfContributor", e.cit_contribution as "citContribution", e.insurance_premium as "insurancePremium",
              u.name as u_name, u.email as u_email, u.role as u_role
       FROM employees e
       JOIN users u ON e.user_id = u.id
       WHERE e.id = $1`,
      [idInt],
    );
    const employee = empResult.rows[0];
    if (!employee)
      return res.status(404).json({ message: "Employee not found" });

    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const endOfYear = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);

    const leaveResult = await db.query(
      `SELECT from_date, to_date 
       FROM leave_requests 
       WHERE employee_id = $1 
         AND type != 'WFH' 
         AND status = 'Approved' 
         AND from_date <= $2 
         AND to_date >= $3`,
      [idInt, endOfYear, startOfYear],
    );

    const approvedLeaves = leaveResult.rows;
    const annualAllowance = 24;
    const usedLeaveDays = approvedLeaves.reduce((sum, leave) => {
      const from = normalizeDate(leave.from_date);
      const to = normalizeDate(leave.to_date);
      const diff = Math.floor((to - from) / (1000 * 60 * 60 * 24)) + 1;
      return sum + (diff > 0 ? diff : 0);
    }, 0);

    const payrollResult = await db.query(
      "SELECT * FROM payrolls WHERE employee_id = $1 ORDER BY month DESC, created_at DESC LIMIT 1",
      [idInt],
    );
    const latestPayroll = payrollResult.rows[0];
    const annualSalary =
      Number(employee.annualSalary || 0) ||
      Math.round(Number(employee.baseSalary || 0) * 12);

    const normalizedList = await normalizeEmployeeDepartments([employee]);
    const normalizedDepartmentName =
      normalizedList[0]?.department || "Unassigned";

    return res.json({
      data: {
        _id: employee.id,
        id: employee.id,
        name: `${employee.firstName || ""} ${employee.lastName || ""}`.trim(),
        email: employee.email,
        role: employee.u_role || "employee",
        employeeId: employee.employeeId,
        department: normalizedDepartmentName,
        designation: employee.designation || "N/A",
        phone: employee.phone || "",
        status: employee.status,
        joinDate: employee.joinDate || employee.created_at,
        salary: {
          annualSalary,
          monthlyBeforeTax: Math.round(annualSalary / 12),
          filingStatus: employee.filingStatus || "unmarried",
          gender: employee.gender || "male",
          ssfContributor: Boolean(employee.ssfContributor),
          citContribution: Number(employee.citContribution || 0),
          insurancePremium: Number(employee.insurancePremium || 0),
          latestPayroll: latestPayroll
            ? {
                month: latestPayroll.month,
                grossPay: Number(latestPayroll.gross_pay) || 0,
                taxDeduction: Number(latestPayroll.tax_deduction) || 0,
                deductions: Number(latestPayroll.deductions) || 0,
                netPay: Number(latestPayroll.net_pay) || 0,
                status: latestPayroll.status || "Processed",
              }
            : null,
        },
        leave: {
          annualAllowance,
          used: usedLeaveDays,
          remaining: Math.max(0, annualAllowance - usedLeaveDays),
        },
      },
    });
  } catch (err) {
    console.error("getEmployeeProfile error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

async function dashboardSummary(req, res) {
  try {
    const startOfToday = normalizeDate(new Date());
    const endOfToday = new Date(startOfToday);
    endOfToday.setHours(23, 59, 59, 999);

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const totalResult = await db.query(
      "SELECT COUNT(*)::int FROM employees WHERE status = 'active'",
    );
    const totalEmployees = totalResult.rows[0]?.count || 0;

    const presentResult = await db.query(
      `SELECT COUNT(DISTINCT employee_id)::int FROM attendance 
       WHERE date >= $1 AND date <= $2 AND status IN ('Present', 'WFH')`,
      [startOfToday, endOfToday],
    );
    const presentToday = presentResult.rows[0]?.count || 0;

    const pendingResult = await db.query(
      "SELECT COUNT(*)::int FROM leave_requests WHERE status = 'Pending'",
    );
    const pendingLeaves = pendingResult.rows[0]?.count || 0;

    const approvedResult = await db.query(
      "SELECT COUNT(*)::int FROM leave_requests WHERE status = 'Approved' AND approved_at >= $1",
      [startOfMonth],
    );
    const approvedThisMonth = approvedResult.rows[0]?.count || 0;

    const leaveOutcomeResult = await db.query(
      "SELECT status as _id, COUNT(*)::int FROM leave_requests WHERE status IN ('Approved', 'Rejected') GROUP BY status",
    );
    const leaveOutcomeStats = leaveOutcomeResult.rows;

    const recentResult = await db.query(
      `SELECT id as _id, id, employee_id as "employeeId", first_name as "firstName", last_name as "lastName", email, department, designation, status, created_at as "createdAt" 
       FROM employees 
       ORDER BY created_at DESC 
       LIMIT 5`,
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
        generatedAt: new Date(),
        recentEmployees,
      },
    });
  } catch (err) {
    console.error("dashboardSummary error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

async function analytics(req, res) {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfToday = normalizeDate(now);
    const endOfToday = new Date(startOfToday);
    endOfToday.setHours(23, 59, 59, 999);

    const activeResult = await db.query(
      "SELECT COUNT(*)::int FROM employees WHERE status = 'active'",
    );
    const activeEmployees = activeResult.rows[0]?.count || 0;

    const totalResult = await db.query("SELECT COUNT(*)::int FROM employees");
    const totalEmployees = totalResult.rows[0]?.count || 0;

    const presentResult = await db.query(
      `SELECT COUNT(DISTINCT employee_id)::int FROM attendance 
       WHERE date >= $1 AND date <= $2 AND status IN ('Present', 'WFH')`,
      [startOfToday, endOfToday],
    );
    const presentToday = presentResult.rows[0]?.count || 0;

    const leaveStatsResult = await db.query(
      "SELECT status as _id, COUNT(*)::int FROM leave_requests WHERE created_at >= $1 GROUP BY status",
      [startOfMonth],
    );
    const leaveStats = leaveStatsResult.rows;

    const pending = leaveStats.find((x) => x._id === "Pending")?.count || 0;
    const approved = leaveStats.find((x) => x._id === "Approved")?.count || 0;
    const rejected = leaveStats.find((x) => x._id === "Rejected")?.count || 0;

    // Rich analytics queries
    const deptResult = await db.query(
      `SELECT COALESCE(NULLIF(department, ''), 'Unassigned') as department, COUNT(*)::int as headcount, ROUND(AVG(annual_salary))::int as "avgSalary"
       FROM employees 
       WHERE status = 'active'
       GROUP BY department`,
    );
    const departmentStats = deptResult.rows;

    const payrollResult = await db.query(
      "SELECT COALESCE(SUM(base_salary), 0)::int as total FROM employees WHERE status = 'active'",
    );
    const totalMonthlyPayroll = payrollResult.rows[0]?.total || 0;

    const tenureResult = await db.query(
      "SELECT COALESCE(ROUND(AVG(EXTRACT(EPOCH FROM (CURRENT_DATE - join_date)) / 86400)), 0)::int as tenure FROM employees WHERE status = 'active' AND join_date IS NOT NULL",
    );
    const avgTenureDays = tenureResult.rows[0]?.tenure || 0;

    const leaveDistributionResult = await db.query(
      "SELECT type as _id, COUNT(*)::int as count FROM leave_requests GROUP BY type",
    );
    const leaveDistribution = leaveDistributionResult.rows;

    return res.json({
      data: {
        activeEmployees,
        totalEmployees,
        presentToday,
        attendanceRate: activeEmployees
          ? Math.round((presentToday / activeEmployees) * 100)
          : 0,
        leave: { pending, approved, rejected },
        departmentStats,
        totalMonthlyPayroll,
        avgTenureDays,
        leaveDistribution,
        generatedAt: now,
      },
    });
  } catch (err) {
    console.error("analytics error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

module.exports = {
  ping,
  getEmployees,
  getEmployeeProfile,
  dashboardSummary,
  analytics,
};
