const db = require("../../config/db");

async function getAvailableManagers(req, res) {
  try {
    const result = await db.query(
      `SELECT e.id as _id, e.id, e.first_name as "firstName", e.last_name as "lastName" 
       FROM employees e
       JOIN users u ON e.user_id = u.id
       WHERE u.role IN ('manager', 'project_manager')`,
    );
    return res.json({ data: result.rows });
  } catch (err) {
    console.error("getAvailableManagers error:", err);
    return res.status(500).json({ message: "Server error." });
  }
}

async function getAvailableEmployees(req, res) {
  try {
    const result = await db.query(
      `SELECT e.id as _id, e.id, e.first_name as "firstName", e.last_name as "lastName", e.employee_id as "employeeId"
       FROM employees e
       JOIN users u ON e.user_id = u.id
       WHERE u.role = 'employee'`,
    );
    return res.json({ data: result.rows });
  } catch (err) {
    console.error("getAvailableEmployees error:", err);
    return res.status(500).json({ message: "Server error." });
  }
}

async function getProjects(req, res) {
  try {
    let queryStr = "";
    const params = [];

    if (["admin", "department_head"].includes(req.user.role)) {
      queryStr = `
        SELECT p.id as _id, p.id, p.name, p.description, p.documentation, p.start_date as "startDate", p.end_date as "endDate",
               e.first_name as "mgrFirstName", e.last_name as "mgrLastName"
        FROM projects p
        LEFT JOIN employees e ON p.manager_id = e.id
        ORDER BY p.created_at DESC
      `;
    } else if (["manager", "project_manager"].includes(req.user.role)) {
      // Find manager employee profile
      const empRes = await db.query(
        "SELECT id FROM employees WHERE user_id = $1",
        [req.user.id],
      );
      const managerEmp = empRes.rows[0];
      if (!managerEmp) return res.json({ data: [] });

      queryStr = `
        SELECT p.id as _id, p.id, p.name, p.description, p.documentation, p.start_date as "startDate", p.end_date as "endDate"
        FROM projects p
        WHERE p.manager_id = $1
      `;
      params.push(managerEmp.id);
    } else {
      // Employee
      const empRes = await db.query(
        "SELECT id FROM employees WHERE user_id = $1",
        [req.user.id],
      );
      const employee = empRes.rows[0];
      if (!employee) return res.json({ data: [] });

      queryStr = `
        SELECT p.id as _id, p.id, p.name, p.description, p.documentation, p.start_date as "startDate", p.end_date as "endDate",
               mgr.first_name as "mgrFirstName", mgr.last_name as "mgrLastName"
        FROM projects p
        JOIN project_members pm ON p.id = pm.project_id
        LEFT JOIN employees mgr ON p.manager_id = mgr.id
        WHERE pm.employee_id = $1
      `;
      params.push(employee.id);
    }

    const result = await db.query(queryStr, params);
    return res.json({ data: result.rows });
  } catch (err) {
    console.error("getProjects error:", err);
    return res.status(500).json({ message: "Server error." });
  }
}

async function getProjectDetails(req, res) {
  try {
    const { id } = req.params;
    const projectIdInt = parseInt(id, 10);
    if (isNaN(projectIdInt))
      return res.status(400).json({ message: "Invalid project ID." });

    // Fetch project
    const projRes = await db.query(
      `SELECT p.id as _id, p.id, p.name, p.description, p.documentation, p.start_date as "startDate", p.end_date as "endDate",
              e.id as mgr_id, e.first_name as "mgrFirstName", e.last_name as "mgrLastName"
       FROM projects p
       LEFT JOIN employees e ON p.manager_id = e.id
       WHERE p.id = $1`,
      [projectIdInt],
    );
    const project = projRes.rows[0];
    if (!project)
      return res.status(404).json({ message: "Project not found." });

    // Fetch members
    const membersRes = await db.query(
      `SELECT e.id as _id, e.id, e.first_name as "firstName", e.last_name as "lastName", e.email, e.designation, e.employee_id as "employeeId"
       FROM project_members pm
       JOIN employees e ON pm.employee_id = e.id
       WHERE pm.project_id = $1`,
      [projectIdInt],
    );

    // Fetch tasks
    const tasksRes = await db.query(
      `SELECT t.id as _id, t.id, t.title, t.description, t.status, t.points, t.start_date as "startDate", t.end_date as "endDate",
              t.progress_report as "progressReport", t.progress_requested as "progressRequested",
              t.extension_requested as "extensionRequested", t.extension_days as "extensionDays", t.extension_reason as "extensionReason",
              t.transfer_requested as "transferRequested", t.transfer_reason as "transferReason",
              e.id as emp_id, e.first_name as "firstName", e.last_name as "lastName"
       FROM tasks t
       LEFT JOIN employees e ON t.assigned_to = e.id
       WHERE t.project_id = $1
       ORDER BY t.created_at DESC`,
      [projectIdInt],
    );

    const taskList = tasksRes.rows.map((row) => ({
      _id: row.id,
      id: row.id,
      title: row.title,
      description: row.description,
      status: row.status,
      points: row.points,
      startDate: row.startDate,
      endDate: row.endDate,
      progressReport: row.progressReport,
      progressRequested: row.progressRequested,
      extensionRequested: row.extensionRequested,
      extensionDays: row.extensionDays,
      extensionReason: row.extensionReason,
      transferRequested: row.transferRequested,
      transferReason: row.transferReason,
      assignedTo: row.emp_id
        ? {
            _id: row.emp_id,
            id: row.emp_id,
            firstName: row.firstName,
            lastName: row.lastName,
          }
        : null,
    }));

    return res.json({
      data: {
        ...project,
        manager: project.mgr_id
          ? {
              _id: project.mgr_id,
              id: project.mgr_id,
              firstName: project.mgrFirstName,
              lastName: project.mgrLastName,
            }
          : null,
        members: membersRes.rows,
        tasks: taskList,
      },
    });
  } catch (err) {
    console.error("getProjectDetails error:", err);
    return res.status(500).json({ message: "Server error." });
  }
}

async function getMyActiveTask(req, res) {
  try {
    // Find employee profile
    const empRes = await db.query(
      "SELECT id FROM employees WHERE user_id = $1",
      [req.user.id],
    );
    const employee = empRes.rows[0];
    if (!employee)
      return res.status(404).json({ message: "Employee profile not found." });

    const taskRes = await db.query(
      `SELECT t.id as _id, t.id, t.title, t.description, t.status, t.points, t.start_date as "startDate", t.end_date as "endDate",
              t.progress_report as "progressReport", t.progress_requested as "progressRequested",
              t.extension_requested as "extensionRequested", t.extension_days as "extensionDays", t.extension_reason as "extensionReason",
              t.transfer_requested as "transferRequested", t.transfer_reason as "transferReason",
              p.name as "projectName", p.start_date as "projectStartDate", p.end_date as "projectEndDate"
       FROM tasks t
       JOIN projects p ON t.project_id = p.id
       WHERE t.assigned_to = $1 AND t.status IN ('Todo', 'In Progress')
       ORDER BY t.created_at DESC
       LIMIT 1`,
      [employee.id],
    );

    return res.json({ data: taskRes.rows[0] || null });
  } catch (err) {
    console.error("getMyActiveTask error:", err);
    return res.status(500).json({ message: "Server error." });
  }
}

module.exports = {
  getAvailableManagers,
  getAvailableEmployees,
  getProjects,
  getProjectDetails,
  getMyActiveTask,
};
