const db = require("../../config/db");

function normalizeDate(input = new Date()) {
  const d = new Date(input);
  d.setHours(0, 0, 0, 0);
  return d;
}

async function getNormalizedDepartmentName(department) {
  const value = String(department || "").trim();
  if (!value) return "Unassigned";
  const result = await db.query(
    "SELECT id FROM departments WHERE name = $1 LIMIT 1",
    [value],
  );
  return result.rows.length > 0 ? value : "Unassigned";
}

async function getOrCreateEmployeeForUser(user) {
  const result = await db.query(
    "SELECT * FROM employees WHERE user_id = $1 LIMIT 1",
    [user.id],
  );
  let employee = result.rows[0];

  if (employee) {
    employee._id = employee.id;
    return employee;
  }

  const firstName = user.name || user.email.split("@")[0] || "Employee";
  const employeeId = `EMP-${Date.now()}`;

  const insertResult = await db.query(
    "INSERT INTO employees (user_id, employee_id, first_name, last_name, email, status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
    [user.id, employeeId, firstName, "", user.email, "active"],
  );
  employee = insertResult.rows[0];
  employee._id = employee.id;
  return employee;
}

async function getLeaveBalanceForYear(employeeId) {
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const endOfYear = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);

  const result = await db.query(
    `SELECT from_date, to_date 
     FROM leave_requests 
     WHERE employee_id = $1 
       AND type != 'WFH' 
       AND status = 'Approved' 
       AND from_date <= $2 
       AND to_date >= $3`,
    [employeeId, endOfYear, startOfYear],
  );

  const approvedLeaves = result.rows;
  const annualAllowance = 24;
  const usedLeaveDays = approvedLeaves.reduce((sum, leave) => {
    const from = normalizeDate(leave.from_date);
    const to = normalizeDate(leave.to_date);
    const diff = Math.floor((to - from) / (1000 * 60 * 60 * 24)) + 1;
    return sum + (diff > 0 ? diff : 0);
  }, 0);

  return {
    annualAllowance,
    used: usedLeaveDays,
    remaining: Math.max(0, annualAllowance - usedLeaveDays),
  };
}

async function getEmployeeDashboardSummary(req, res) {
  try {
    const employee = await getOrCreateEmployeeForUser(req.user);
    const now = new Date();
    const startOfToday = normalizeDate(now);
    const endOfToday = new Date(startOfToday);
    endOfToday.setHours(23, 59, 59, 999);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    endOfMonth.setHours(23, 59, 59, 999);

    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const endOfYear = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);

    // 1. Today record
    const todayResult = await db.query(
      "SELECT * FROM attendance WHERE employee_id = $1 AND date = $2 ORDER BY created_at DESC LIMIT 1",
      [employee.id, startOfToday],
    );
    const todayRecord = todayResult.rows[0];

    // 2. Monthly attendance days count
    const monthResult = await db.query(
      `SELECT COUNT(*)::int as count FROM attendance 
       WHERE employee_id = $1 
         AND date >= $2 AND date <= $3 
         AND status IN ('Present', 'Half Day Present', 'WFH')`,
      [employee.id, startOfMonth, endOfMonth],
    );
    const monthAttendanceDays = monthResult.rows[0]?.count || 0;

    // 3. Leaves this year
    const leaveResult = await db.query(
      `SELECT from_date, to_date 
       FROM leave_requests 
       WHERE employee_id = $1 
         AND type != 'WFH' 
         AND status = 'Approved' 
         AND from_date <= $2 
         AND to_date >= $3`,
      [employee.id, endOfYear, startOfYear],
    );
    const approvedLeaves = leaveResult.rows;

    // 4. Announcements
    const announceResult = await db.query(
      `SELECT id as _id, title, content, created_at as "createdAt" 
       FROM announcements 
       WHERE audience IN ('All', 'Employees')
         AND (effective_from IS NULL OR effective_from <= $1)
         AND (effective_to IS NULL OR effective_to >= $1)
       ORDER BY created_at DESC LIMIT 3`,
      [now],
    );
    const announcements = announceResult.rows;

    const leaveBalance = Math.max(
      0,
      24 -
        approvedLeaves.reduce((sum, leave) => {
          const from = normalizeDate(leave.from_date);
          const to = normalizeDate(leave.to_date);
          const diff = Math.floor((to - from) / (1000 * 60 * 60 * 24)) + 1;
          return sum + (diff > 0 ? diff : 0);
        }, 0),
    );

    // Check if today is a holiday
    const holidayCheck = await db.query(
      "SELECT name FROM holidays WHERE date = $1 LIMIT 1",
      [startOfToday],
    );
    const isTodayHoliday = holidayCheck.rows.length > 0;
    const holidayName = isTodayHoliday ? holidayCheck.rows[0].name : "";

    // Check if today is a weekend off day
    const offDaysEnv = String(process.env.WEEKLY_OFF_DAYS || "saturday").toLowerCase();
    const offDays = [];
    if (offDaysEnv.includes("saturday")) offDays.push(6);
    if (offDaysEnv.includes("sunday")) offDays.push(0);
    const isTodayWeekend = offDays.includes(startOfToday.getDay());

    let todayStatus = "Not Checked In";
    if (isTodayHoliday) {
      todayStatus = `Holiday: ${holidayName}`;
    } else if (isTodayWeekend) {
      todayStatus = "Weekend";
    }

    let checkTime = null;
    if (todayRecord?.status === "Leave") {
      todayStatus = "Approved Leave";
    } else if (
      todayRecord?.status === "WFH" &&
      !todayRecord?.check_in &&
      !todayRecord?.check_out
    ) {
      todayStatus = "Approved WFH";
    } else if (todayRecord?.status === "Half Day Present") {
      todayStatus = "Half Day Present";
      checkTime = todayRecord.check_out || todayRecord.check_in;
    } else if (todayRecord?.check_out) {
      todayStatus = "Checked Out";
      checkTime = todayRecord.check_out;
    } else if (todayRecord?.check_in) {
      todayStatus = "Checked In";
      checkTime = todayRecord.check_in;
    }

    let noticeItems = announcements.map((item) => ({
      id: item._id,
      _id: item._id,
      title: item.title,
      content: item.content,
      createdAt: item.createdAt,
    }));

    if (noticeItems.length < 3) {
      const limit = 3 - noticeItems.length;
      const holidayResult = await db.query(
        `SELECT id as _id, name, start_date as date 
         FROM holidays 
         WHERE start_date >= $1 
         ORDER BY start_date ASC LIMIT $2`,
        [startOfToday, limit],
      );
      const holidays = holidayResult.rows;

      noticeItems = noticeItems.concat(
        holidays.map((h) => ({
          id: h._id,
          _id: h._id,
          title: "Holiday Notice",
          content: `${h.name} on ${new Date(h.date).toDateString()}`,
          createdAt: h.date,
        })),
      );
    }

    return res.json({
      data: {
        userProfile: {
          name:
            req.user.name ||
            `${employee.first_name} ${employee.last_name}`.trim(),
          position: employee.designation || "Employee",
          email: employee.email,
        },
        stats: {
          leaveBalance,
          attendance: monthAttendanceDays,
          notifications: noticeItems.length,
        },
        todayAttendance: {
          status: todayStatus,
          time: checkTime,
          checkIn: todayRecord?.check_in || null,
          checkOut: todayRecord?.check_out || null,
        },
        announcements: noticeItems,
      },
    });
  } catch (err) {
    console.error("getEmployeeDashboardSummary error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

async function getMyProfile(req, res) {
  try {
    const employee = await getOrCreateEmployeeForUser(req.user);
    const leave = await getLeaveBalanceForYear(employee.id);
    const annualSalary =
      Number(employee.annual_salary || 0) ||
      Math.round(Number(employee.base_salary || 0) * 12);

    const payrollResult = await db.query(
      "SELECT * FROM payrolls WHERE employee_id = $1 ORDER BY month DESC, created_at DESC LIMIT 1",
      [employee.id],
    );
    const latestPayroll = payrollResult.rows[0];

    return res.json({
      data: {
        firstName: employee.first_name || "",
        lastName: employee.last_name || "",
        name:
          `${employee.first_name || ""} ${employee.last_name || ""}`.trim() ||
          req.user.name ||
          "",
        email: employee.email || req.user.email,
        role: req.user.role,
        avatar: req.user.avatar || null,
        employeeId: employee.employee_id || "N/A",
        department: await getNormalizedDepartmentName(employee.department),
        designation: employee.designation || "N/A",
        phone: employee.phone || "",
        joinDate: employee.join_date || employee.created_at,
        salary: {
          annualSalary,
          monthlyBeforeTax: Math.round(annualSalary / 12),
          filingStatus: employee.filing_status || "unmarried",
          latestPayroll: latestPayroll
            ? {
                month: latestPayroll.month,
                grossPay: Number(latestPayroll.gross_pay),
                taxDeduction: Number(latestPayroll.tax_deduction),
                deductions: Number(latestPayroll.deductions),
                netPay: Number(latestPayroll.net_pay),
                status: latestPayroll.status,
              }
            : null,
        },
        leave,
      },
    });
  } catch (err) {
    console.error("getMyProfile error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

module.exports = {
  normalizeDate,
  getOrCreateEmployeeForUser,
  getEmployeeDashboardSummary,
  getMyProfile,
};
