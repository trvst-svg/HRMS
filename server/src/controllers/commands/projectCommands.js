import db from "../../config/db.js";

async function createProject(req, res) {
  try {
    const { name, description = "", managerId, startDate, endDate } = req.body;
    if (!name || !managerId || !startDate || !endDate) {
      return res
        .status(400)
        .json({
          message: "Name, manager, start date, and end date are required.",
        });
    }

    const managerIdInt = parseInt(managerId, 10);
    if (isNaN(managerIdInt))
      return res.status(400).json({ message: "Invalid manager ID." });

    // Validate manager exists
    const empRes = await db.query(
      "SELECT id, user_id FROM employees WHERE id = $1",
      [managerIdInt],
    );
    const managerEmp = empRes.rows[0];
    if (!managerEmp)
      return res
        .status(404)
        .json({ message: "Manager employee profile not found." });

    // Verify manager user role
    const userRes = await db.query("SELECT role FROM users WHERE id = $1", [
      managerEmp.user_id,
    ]);
    if (!["manager", "project_manager"].includes(userRes.rows[0]?.role)) {
      return res
        .status(400)
        .json({ message: "Assigned person is not a manager." });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    if (start >= end) {
      return res
        .status(400)
        .json({ message: "Start date must be before end date." });
    }

    const result = await db.query(
      `INSERT INTO projects (name, description, manager_id, start_date, end_date)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id AS _id, id, name, description, manager_id as "managerId", start_date as "startDate", end_date as "endDate"`,
      [name.trim(), description.trim(), managerIdInt, start, end],
    );
    const project = result.rows[0];

    // Notify manager
    await db.query(
      `INSERT INTO notifications (user_id, title, message, type)
       VALUES ($1, $2, $3, $4)`,
      [
        managerEmp.user_id,
        "New Project Assigned",
        `You have been assigned as the manager of project: ${project.name}`,
        "Info",
      ],
    );

    return res
      .status(201)
      .json({ message: "Project created successfully.", data: project });
  } catch (err) {
    console.error("createProject error:", err);
    return res.status(500).json({ message: "Server error." });
  }
}

async function updateDocumentation(req, res) {
  try {
    const { id } = req.params;
    const { documentation = "" } = req.body;
    const projectIdInt = parseInt(id, 10);
    if (isNaN(projectIdInt))
      return res.status(400).json({ message: "Invalid project ID." });

    // Find project and verify manager ownership
    const projRes = await db.query(
      "SELECT p.*, e.user_id FROM projects p JOIN employees e ON p.manager_id = e.id WHERE p.id = $1",
      [projectIdInt],
    );
    const project = projRes.rows[0];
    if (!project)
      return res.status(404).json({ message: "Project not found." });

    if (req.user.role !== "admin" && project.user_id !== req.user.id) {
      return res
        .status(403)
        .json({
          message:
            "Only the assigned project manager can update documentation.",
        });
    }

    await db.query(
      "UPDATE projects SET documentation = $1, updated_at = NOW() WHERE id = $2",
      [documentation, projectIdInt],
    );
    return res.json({ message: "Project documentation updated successfully." });
  } catch (err) {
    console.error("updateDocumentation error:", err);
    return res.status(500).json({ message: "Server error." });
  }
}

async function assignMembers(req, res) {
  try {
    const { id } = req.params;
    const { employeeIds = [] } = req.body;
    const projectIdInt = parseInt(id, 10);
    if (isNaN(projectIdInt))
      return res.status(400).json({ message: "Invalid project ID." });

    const projRes = await db.query(
      "SELECT p.*, e.user_id FROM projects p JOIN employees e ON p.manager_id = e.id WHERE p.id = $1",
      [projectIdInt],
    );
    const project = projRes.rows[0];
    if (!project)
      return res.status(404).json({ message: "Project not found." });

    if (
      !["admin", "department_head"].includes(req.user.role) &&
      project.user_id !== req.user.id
    ) {
      return res
        .status(403)
        .json({
          message:
            "Only the assigned project manager, department head, or admin can manage members.",
        });
    }

    // Process assignments
    for (const empId of employeeIds) {
      const empIdInt = parseInt(empId, 10);
      if (isNaN(empIdInt)) continue;

      // Check if employee is already assigned to this project
      const memberCheck = await db.query(
        "SELECT id FROM project_members WHERE project_id = $1 AND employee_id = $2",
        [projectIdInt, empIdInt],
      );
      if (memberCheck.rows.length > 0) continue; // Already in this project

      await db.query(
        "INSERT INTO project_members (project_id, employee_id) VALUES ($1, $2)",
        [projectIdInt, empIdInt],
      );

      // Notify employee
      const empRes = await db.query(
        "SELECT user_id FROM employees WHERE id = $1",
        [empIdInt],
      );
      if (empRes.rows[0]) {
        await db.query(
          `INSERT INTO notifications (user_id, title, message, type)
           VALUES ($1, $2, $3, $4)`,
          [
            empRes.rows[0].user_id,
            "Added to Project",
            `You have been added as a member of project: ${project.name}`,
            "Info",
          ],
        );
      }
    }

    return res.json({ message: "Members assigned successfully." });
  } catch (err) {
    console.error("assignMembers error:", err);
    return res.status(500).json({ message: "Server error." });
  }
}

async function createTask(req, res) {
  try {
    const { id } = req.params; // project_id
    const {
      assignedTo,
      title,
      description = "",
      points = 1,
      startDate,
      endDate,
    } = req.body;
    const projectIdInt = parseInt(id, 10);
    const assignedToInt = parseInt(assignedTo, 10);

    if (
      isNaN(projectIdInt) ||
      isNaN(assignedToInt) ||
      !title ||
      !startDate ||
      !endDate
    ) {
      return res
        .status(400)
        .json({
          message: "Title, assignee, start date, and end date are required.",
        });
    }

    // Check project exists and dates validation
    const projRes = await db.query(
      "SELECT p.*, e.user_id FROM projects p JOIN employees e ON p.manager_id = e.id WHERE p.id = $1",
      [projectIdInt],
    );
    const project = projRes.rows[0];
    if (!project)
      return res.status(404).json({ message: "Project not found." });

    if (
      !["admin", "department_head"].includes(req.user.role) &&
      project.user_id !== req.user.id
    ) {
      return res
        .status(403)
        .json({
          message:
            "Only the project manager, department head, or admin can assign tasks.",
        });
    }

    // Check if assignee is member of project
    const memberCheck = await db.query(
      "SELECT id FROM project_members WHERE project_id = $1 AND employee_id = $2",
      [projectIdInt, assignedToInt],
    );
    if (memberCheck.rows.length === 0) {
      return res
        .status(400)
        .json({ message: "Assignee is not a member of this project." });
    }

    // Validate dates vs project timeline
    const taskStart = new Date(startDate);
    const taskEnd = new Date(endDate);
    const projStart = new Date(project.start_date);
    const projEnd = new Date(project.end_date);

    if (taskStart >= taskEnd) {
      return res
        .status(400)
        .json({ message: "Task start date must be before end date." });
    }
    if (taskStart < projStart || taskEnd > projEnd) {
      return res.status(400).json({
        message: `Task timeline must stay within the project duration (${project.start_date.toISOString().split("T")[0]} to ${project.end_date.toISOString().split("T")[0]}).`,
      });
    }

    const taskRes = await db.query(
      `INSERT INTO tasks (project_id, assigned_to, title, description, points, start_date, end_date, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'Todo')
       RETURNING id AS _id, *`,
      [
        projectIdInt,
        assignedToInt,
        title.trim(),
        description.trim(),
        parseInt(points, 10) || 1,
        taskStart,
        taskEnd,
      ],
    );

    // Notify employee
    const empRes = await db.query(
      "SELECT user_id FROM employees WHERE id = $1",
      [assignedToInt],
    );
    if (empRes.rows[0]) {
      await db.query(
        `INSERT INTO notifications (user_id, title, message, type)
         VALUES ($1, $2, $3, $4)`,
        [
          empRes.rows[0].user_id,
          "New Task Assigned",
          `You have been assigned a new task: ${title} (Story Points: ${points})`,
          "Info",
        ],
      );
    }

    return res
      .status(201)
      .json({ message: "Task created successfully.", data: taskRes.rows[0] });
  } catch (err) {
    console.error("createTask error:", err);
    return res.status(500).json({ message: "Server error." });
  }
}

async function requestReport(req, res) {
  try {
    const { id } = req.params; // task_id
    const taskIdInt = parseInt(id, 10);
    if (isNaN(taskIdInt))
      return res.status(400).json({ message: "Invalid task ID." });

    // Validate ownership
    const taskRes = await db.query(
      `SELECT t.*, p.name as proj_name, e.user_id as manager_user_id, a.user_id as assignee_user_id
       FROM tasks t
       JOIN projects p ON t.project_id = p.id
       JOIN employees e ON p.manager_id = e.id
       JOIN employees a ON t.assigned_to = a.id
       WHERE t.id = $1`,
      [taskIdInt],
    );
    const task = taskRes.rows[0];
    if (!task) return res.status(404).json({ message: "Task not found." });

    if (req.user.role !== "admin" && task.manager_user_id !== req.user.id) {
      return res
        .status(403)
        .json({
          message: "Only the project manager can request a progress report.",
        });
    }

    await db.query("UPDATE tasks SET progress_requested = true WHERE id = $1", [
      taskIdInt,
    ]);

    // Notify assignee
    await db.query(
      `INSERT INTO notifications (user_id, title, message, type)
       VALUES ($1, $2, $3, $4)`,
      [
        task.assignee_user_id,
        "Progress Report Requested",
        `Progress report requested for task: ${task.title}`,
        "Warning",
      ],
    );

    return res.json({ message: "Progress report requested successfully." });
  } catch (err) {
    console.error("requestReport error:", err);
    return res.status(500).json({ message: "Server error." });
  }
}

async function submitReport(req, res) {
  try {
    const { id } = req.params;
    const { progressReport = "" } = req.body;
    const taskIdInt = parseInt(id, 10);
    if (isNaN(taskIdInt))
      return res.status(400).json({ message: "Invalid task ID." });

    // Validate task assignee
    const taskRes = await db.query(
      `SELECT t.*, a.user_id as assignee_user_id, m.user_id as manager_user_id
       FROM tasks t
       JOIN employees a ON t.assigned_to = a.id
       JOIN projects p ON t.project_id = p.id
       JOIN employees m ON p.manager_id = m.id
       WHERE t.id = $1`,
      [taskIdInt],
    );
    const task = taskRes.rows[0];
    if (!task) return res.status(404).json({ message: "Task not found." });

    if (task.assignee_user_id !== req.user.id) {
      return res
        .status(403)
        .json({ message: "Only the assigned employee can submit a report." });
    }

    await db.query(
      "UPDATE tasks SET progress_report = $1, progress_requested = false, updated_at = NOW() WHERE id = $2",
      [progressReport.trim(), taskIdInt],
    );

    // Notify manager
    await db.query(
      `INSERT INTO notifications (user_id, title, message, type)
       VALUES ($1, $2, $3, $4)`,
      [
        task.manager_user_id,
        "Progress Report Submitted",
        `Progress report submitted by employee on task: ${task.title}`,
        "Info",
      ],
    );

    return res.json({ message: "Progress report submitted." });
  } catch (err) {
    console.error("submitReport error:", err);
    return res.status(500).json({ message: "Server error." });
  }
}

async function requestExtension(req, res) {
  try {
    const { id } = req.params;
    const { days, reason = "" } = req.body;
    const taskIdInt = parseInt(id, 10);
    const daysInt = parseInt(days, 10);

    if (isNaN(taskIdInt) || isNaN(daysInt) || daysInt <= 0) {
      return res
        .status(400)
        .json({ message: "Extension days must be a positive integer." });
    }

    const taskRes = await db.query(
      `SELECT t.*, a.user_id as assignee_user_id, m.user_id as manager_user_id, p.end_date as proj_end_date
       FROM tasks t
       JOIN employees a ON t.assigned_to = a.id
       JOIN projects p ON t.project_id = p.id
       JOIN employees m ON p.manager_id = m.id
       WHERE t.id = $1`,
      [taskIdInt],
    );
    const task = taskRes.rows[0];
    if (!task) return res.status(404).json({ message: "Task not found." });

    if (task.assignee_user_id !== req.user.id) {
      return res
        .status(403)
        .json({
          message: "Only the assigned employee can request an extension.",
        });
    }

    // Verify extended date won't exceed project timeline limit
    const extendedDate = new Date(task.end_date);
    extendedDate.setDate(extendedDate.getDate() + daysInt);
    const projEnd = new Date(task.proj_end_date);
    if (extendedDate > projEnd) {
      return res
        .status(400)
        .json({
          message: "Extended timeline cannot exceed the project end date.",
        });
    }

    await db.query(
      `UPDATE tasks 
       SET extension_requested = true, extension_days = $1, extension_reason = $2 
       WHERE id = $3`,
      [daysInt, reason.trim(), taskIdInt],
    );

    // Notify manager
    await db.query(
      `INSERT INTO notifications (user_id, title, message, type)
       VALUES ($1, $2, $3, $4)`,
      [
        task.manager_user_id,
        "Task Extension Requested",
        `Extension request for task: ${task.title} (+${daysInt} days)`,
        "Warning",
      ],
    );

    return res.json({ message: "Extension request submitted." });
  } catch (err) {
    console.error("requestExtension error:", err);
    return res.status(500).json({ message: "Server error." });
  }
}

async function reviewExtension(req, res) {
  try {
    const { id } = req.params;
    const { action } = req.body; // 'approve' or 'reject'
    const taskIdInt = parseInt(id, 10);
    if (isNaN(taskIdInt))
      return res.status(400).json({ message: "Invalid task ID." });

    const taskRes = await db.query(
      `SELECT t.*, m.user_id as manager_user_id, a.user_id as assignee_user_id
       FROM tasks t
       JOIN projects p ON t.project_id = p.id
       JOIN employees m ON p.manager_id = m.id
       JOIN employees a ON t.assigned_to = a.id
       WHERE t.id = $1`,
      [taskIdInt],
    );
    const task = taskRes.rows[0];
    if (!task) return res.status(404).json({ message: "Task not found." });

    if (req.user.role !== "admin" && task.manager_user_id !== req.user.id) {
      return res
        .status(403)
        .json({
          message: "Only the project manager can review task extensions.",
        });
    }

    if (!task.extension_requested) {
      return res
        .status(400)
        .json({ message: "No extension request active for this task." });
    }

    if (action === "approve") {
      const newEndDate = new Date(task.end_date);
      newEndDate.setDate(newEndDate.getDate() + task.extension_days);

      await db.query(
        `UPDATE tasks 
         SET end_date = $1, extension_requested = false, extension_days = 0, extension_reason = '' 
         WHERE id = $2`,
        [newEndDate, taskIdInt],
      );

      // Notify employee
      await db.query(
        `INSERT INTO notifications (user_id, title, message, type)
         VALUES ($1, $2, $3, $4)`,
        [
          task.assignee_user_id,
          "Extension Request Approved",
          `Extension request approved for task: ${task.title}`,
          "Success",
        ],
      );
      return res.json({ message: "Extension request approved." });
    } else {
      await db.query(
        `UPDATE tasks 
         SET extension_requested = false, extension_days = 0, extension_reason = '' 
         WHERE id = $1`,
        [taskIdInt],
      );

      // Notify employee
      await db.query(
        `INSERT INTO notifications (user_id, title, message, type)
         VALUES ($1, $2, $3, $4)`,
        [
          task.assignee_user_id,
          "Extension Request Rejected",
          `Extension request rejected for task: ${task.title}`,
          "Danger",
        ],
      );
      return res.json({ message: "Extension request rejected." });
    }
  } catch (err) {
    console.error("reviewExtension error:", err);
    return res.status(500).json({ message: "Server error." });
  }
}

async function requestTransfer(req, res) {
  try {
    const { id } = req.params;
    const { reason = "" } = req.body;
    const taskIdInt = parseInt(id, 10);
    if (isNaN(taskIdInt))
      return res.status(400).json({ message: "Invalid task ID." });

    const taskRes = await db.query(
      `SELECT t.*, a.user_id as assignee_user_id, m.user_id as manager_user_id
       FROM tasks t
       JOIN employees a ON t.assigned_to = a.id
       JOIN projects p ON t.project_id = p.id
       JOIN employees m ON p.manager_id = m.id
       WHERE t.id = $1`,
      [taskIdInt],
    );
    const task = taskRes.rows[0];
    if (!task) return res.status(404).json({ message: "Task not found." });

    if (task.assignee_user_id !== req.user.id) {
      return res
        .status(403)
        .json({
          message: "Only the assigned employee can request a task transfer.",
        });
    }

    await db.query(
      "UPDATE tasks SET transfer_requested = true, transfer_reason = $1 WHERE id = $2",
      [reason.trim(), taskIdInt],
    );

    // Notify manager
    await db.query(
      `INSERT INTO notifications (user_id, title, message, type)
       VALUES ($1, $2, $3, $4)`,
      [
        task.manager_user_id,
        "Task Transfer Requested",
        `Task transfer request submitted for: ${task.title}`,
        "Warning",
      ],
    );

    return res.json({ message: "Transfer request submitted." });
  } catch (err) {
    console.error("requestTransfer error:", err);
    return res.status(500).json({ message: "Server error." });
  }
}

async function reviewTransfer(req, res) {
  try {
    const { id } = req.params;
    const { action } = req.body; // 'approve' or 'reject'
    const taskIdInt = parseInt(id, 10);
    if (isNaN(taskIdInt))
      return res.status(400).json({ message: "Invalid task ID." });

    const taskRes = await db.query(
      `SELECT t.*, m.user_id as manager_user_id, a.user_id as assignee_user_id
       FROM tasks t
       JOIN projects p ON t.project_id = p.id
       JOIN employees m ON p.manager_id = m.id
       JOIN employees a ON t.assigned_to = a.id
       WHERE t.id = $1`,
      [taskIdInt],
    );
    const task = taskRes.rows[0];
    if (!task) return res.status(404).json({ message: "Task not found." });

    if (req.user.role !== "admin" && task.manager_user_id !== req.user.id) {
      return res
        .status(403)
        .json({
          message: "Only the project manager can review task transfers.",
        });
    }

    if (!task.transfer_requested) {
      return res
        .status(400)
        .json({ message: "No transfer request active for this task." });
    }

    if (action === "approve") {
      // Transfer -> Unassign the task so the manager can reassign it
      await db.query(
        `UPDATE tasks 
         SET assigned_to = NULL, transfer_requested = false, transfer_reason = '', status = 'Todo' 
         WHERE id = $1`,
        [taskIdInt],
      );

      // Notify employee
      await db.query(
        `INSERT INTO notifications (user_id, title, message, type)
         VALUES ($1, $2, $3, $4)`,
        [
          task.assignee_user_id,
          "Task Transfer Approved",
          `Task transfer request approved. You are unassigned from: ${task.title}`,
          "Success",
        ],
      );
      return res.json({ message: "Task transfer approved (task unassigned)." });
    } else {
      await db.query(
        "UPDATE tasks SET transfer_requested = false, transfer_reason = '' WHERE id = $1",
        [taskIdInt],
      );

      // Notify employee
      await db.query(
        `INSERT INTO notifications (user_id, title, message, type)
         VALUES ($1, $2, $3, $4)`,
        [
          task.assignee_user_id,
          "Task Transfer Rejected",
          `Task transfer request rejected for: ${task.title}`,
          "Danger",
        ],
      );
      return res.json({ message: "Task transfer request rejected." });
    }
  } catch (err) {
    console.error("reviewTransfer error:", err);
    return res.status(500).json({ message: "Server error." });
  }
}

async function updateTaskStatus(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const taskIdInt = parseInt(id, 10);

    if (isNaN(taskIdInt) || !["Todo", "In Progress", "Done"].includes(status)) {
      return res.status(400).json({ message: "Invalid task status." });
    }

    const taskRes = await db.query(
      `SELECT t.*, a.user_id as assignee_user_id, m.user_id as manager_user_id
       FROM tasks t
       JOIN employees a ON t.assigned_to = a.id
       JOIN projects p ON t.project_id = p.id
       JOIN employees m ON p.manager_id = m.id
       WHERE t.id = $1`,
      [taskIdInt],
    );
    const task = taskRes.rows[0];
    if (!task) return res.status(404).json({ message: "Task not found." });

    if (task.assignee_user_id !== req.user.id) {
      return res
        .status(403)
        .json({
          message: "Only the assigned employee can update their task status.",
        });
    }

    await db.query(
      "UPDATE tasks SET status = $1, updated_at = NOW() WHERE id = $2",
      [status, taskIdInt],
    );

    // If completed, notify manager
    if (status === "Done") {
      await db.query(
        `INSERT INTO notifications (user_id, title, message, type)
         VALUES ($1, $2, $3, $4)`,
        [
          task.manager_user_id,
          "Task Completed",
          `Employee completed the task: ${task.title} (Story Points: ${task.points})`,
          "Success",
        ],
      );
    }

    return res.json({ message: "Task status updated." });
  } catch (err) {
    console.error("updateTaskStatus error:", err);
    return res.status(500).json({ message: "Server error." });
  }
}

export { createProject, updateDocumentation, assignMembers, createTask, requestReport, submitReport, requestExtension, reviewExtension, requestTransfer, reviewTransfer, updateTaskStatus };
export default { createProject, updateDocumentation, assignMembers, createTask, requestReport, submitReport, requestExtension, reviewExtension, requestTransfer, reviewTransfer, updateTaskStatus };
