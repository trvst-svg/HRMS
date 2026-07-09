import db from "../../config/db.js";
import { postJobToLinkedIn } from "../../services/linkedInService.js";

// Helper for GPS distance check (Haversine formula)
function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // meters
  const rad = Math.PI / 180;
  const phi1 = lat1 * rad;
  const phi2 = lat2 * rad;
  const dPhi = (lat2 - lat1) * rad;
  const dLambda = (lon2 - lon1) * rad;

  const a =
    Math.sin(dPhi / 2) * Math.sin(dPhi / 2) +
    Math.cos(phi1) *
      Math.cos(phi2) *
      Math.sin(dLambda / 2) *
      Math.sin(dLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // meters
}

// Kathmandu Office HQ coordinates
const OFFICE_LAT = 27.7172;
const OFFICE_LNG = 85.324;
const GEOFENCE_RADIUS_METERS = 200;

async function checkInGps(req, res) {
  try {
    const { latitude, longitude } = req.body;
    if (latitude === undefined || longitude === undefined) {
      return res
        .status(400)
        .json({
          message: "GPS coordinates (latitude, longitude) are required.",
        });
    }

    const latVal = parseFloat(latitude);
    const lngVal = parseFloat(longitude);
    if (isNaN(latVal) || isNaN(lngVal)) {
      return res.status(400).json({ message: "Invalid GPS coordinates." });
    }

    // Distance calculation
    const distance = getDistance(latVal, lngVal, OFFICE_LAT, OFFICE_LNG);
    if (distance > GEOFENCE_RADIUS_METERS) {
      return res.status(400).json({
        message: `Check-in blocked. You must be within ${GEOFENCE_RADIUS_METERS}m of the Kathmandu Office HQ (${OFFICE_LAT}, ${OFFICE_LNG}). Your distance: ${Math.round(distance)}m.`,
      });
    }

    // Find employee profile
    const empRes = await db.query(
      "SELECT id FROM employees WHERE user_id = $1",
      [req.user.id],
    );
    const employee = empRes.rows[0];
    if (!employee)
      return res.status(404).json({ message: "Employee profile not found." });

    const todayStr = new Date().toISOString().split("T")[0];

    // Check if check-in already logged for today
    const exists = await db.query(
      "SELECT id FROM attendance WHERE employee_id = $1 AND date = $2",
      [employee.id, todayStr],
    );
    if (exists.rows.length > 0) {
      return res
        .status(400)
        .json({ message: "You have already checked in for today." });
    }

    await db.query(
      `INSERT INTO attendance (employee_id, date, status, check_in, latitude, longitude, is_geofenced, notes)
       VALUES ($1, $2, 'Present', NOW(), $3, $4, TRUE, 'GPS geofenced check-in')`,
      [employee.id, todayStr, latVal, lngVal],
    );

    return res
      .status(201)
      .json({ message: "Geofenced check-in successful. Logged present!" });
  } catch (err) {
    console.error("checkInGps error:", err);
    return res.status(500).json({ message: "Server error." });
  }
}

async function issueContract(req, res) {
  try {
    const { employeeId, title, content } = req.body;
    if (!employeeId || !title || !content) {
      return res
        .status(400)
        .json({ message: "Employee, title, and content are required." });
    }

    const empIdInt = parseInt(employeeId, 10);
    const empCheck = await db.query(
      "SELECT id, user_id FROM employees WHERE id = $1",
      [empIdInt],
    );
    const employee = empCheck.rows[0];
    if (!employee)
      return res.status(404).json({ message: "Employee not found." });

    const result = await db.query(
      `INSERT INTO contracts (employee_id, title, content, status)
       VALUES ($1, $2, $3, 'unsigned')
       RETURNING id AS _id, *`,
      [empIdInt, title.trim(), content.trim()],
    );

    await db.query(
      `INSERT INTO notifications (user_id, title, message, type)
       VALUES ($1, $2, $3, 'Warning')`,
      [
        employee.user_id,
        "New Contract Issued",
        `A new contract is awaiting your digital signature: ${title}`,
        "Warning",
      ],
    );

    return res
      .status(201)
      .json({ message: "Contract issued successfully.", data: result.rows[0] });
  } catch (err) {
    console.error("issueContract error:", err);
    return res.status(500).json({ message: "Server error." });
  }
}

async function signContract(req, res) {
  try {
    const { id } = req.params;
    const { signatureData } = req.body;
    const contractIdInt = parseInt(id, 10);

    if (isNaN(contractIdInt) || !signatureData) {
      return res
        .status(400)
        .json({
          message: "Contract ID and signature drawing/text are required.",
        });
    }

    const contractRes = await db.query(
      `SELECT c.*, e.user_id 
       FROM contracts c 
       JOIN employees e ON c.employee_id = e.id 
       WHERE c.id = $1`,
      [contractIdInt],
    );
    const contract = contractRes.rows[0];
    if (!contract)
      return res.status(404).json({ message: "Contract not found." });

    if (contract.user_id !== req.user.id) {
      return res
        .status(403)
        .json({ message: "You are not authorized to sign this contract." });
    }

    await db.query(
      `UPDATE contracts 
       SET status = 'signed', signature_data = $1, signed_at = NOW(), updated_at = NOW()
       WHERE id = $2`,
      [signatureData.trim(), contractIdInt],
    );

    return res.json({ message: "Contract signed successfully!" });
  } catch (err) {
    console.error("signContract error:", err);
    return res.status(500).json({ message: "Server error." });
  }
}

async function createOkr(req, res) {
  try {
    const { employeeId, objective, keyResults, targetDate } = req.body;
    if (!employeeId || !objective || !keyResults || !targetDate) {
      return res
        .status(400)
        .json({
          message:
            "Employee, objective, key results, and target date are required.",
        });
    }

    const empIdInt = parseInt(employeeId, 10);
    const empCheck = await db.query(
      "SELECT id, user_id FROM employees WHERE id = $1",
      [empIdInt],
    );
    const employee = empCheck.rows[0];
    if (!employee)
      return res.status(404).json({ message: "Employee not found." });

    const result = await db.query(
      `INSERT INTO okrs (employee_id, objective, key_results, target_date, progress)
       VALUES ($1, $2, $3, $4, 0)
       RETURNING id AS _id, *`,
      [empIdInt, objective.trim(), keyResults.trim(), new Date(targetDate)],
    );

    await db.query(
      `INSERT INTO notifications (user_id, title, message, type)
       VALUES ($1, $2, $3, 'Info')`,
      [
        employee.user_id,
        "New OKR Objective Set",
        `A new OKR objective has been assigned: ${objective}`,
        "Info",
      ],
    );

    return res
      .status(201)
      .json({ message: "OKR created successfully.", data: result.rows[0] });
  } catch (err) {
    console.error("createOkr error:", err);
    return res.status(500).json({ message: "Server error." });
  }
}

async function updateOkrProgress(req, res) {
  try {
    const { id } = req.params;
    const { progress, feedback = "" } = req.body;
    const okrIdInt = parseInt(id, 10);
    const progInt = parseInt(progress, 10);

    if (isNaN(okrIdInt) || isNaN(progInt) || progInt < 0 || progInt > 100) {
      return res
        .status(400)
        .json({
          message: "Progress must be a valid integer between 0 and 100.",
        });
    }

    const okrRes = await db.query(
      `SELECT o.*, e.user_id 
       FROM okrs o 
       JOIN employees e ON o.employee_id = e.id 
       WHERE o.id = $1`,
      [okrIdInt],
    );
    const okr = okrRes.rows[0];
    if (!okr) return res.status(404).json({ message: "OKR not found." });

    // Allow employee owner to update progress, or manager/admin to update feedback
    if (req.user.role === "employee" && okr.user_id !== req.user.id) {
      return res
        .status(403)
        .json({ message: "You are not authorized to update this OKR." });
    }

    if (req.user.role === "employee") {
      await db.query(
        `UPDATE okrs 
         SET progress = $1, status = $2, updated_at = NOW()
         WHERE id = $3`,
        [progInt, progInt === 100 ? "completed" : "active", okrIdInt],
      );
    } else {
      // Manager/Admin adds reviews feedback
      await db.query(
        `UPDATE okrs 
         SET feedback = $1, updated_at = NOW()
         WHERE id = $2`,
        [feedback.trim(), okrIdInt],
      );
    }

    return res.json({ message: "OKR updated successfully." });
  } catch (err) {
    console.error("updateOkrProgress error:", err);
    return res.status(500).json({ message: "Server error." });
  }
}

async function createJobPosting(req, res) {
  try {
    const {
      title,
      description,
      department,
      location = "",
      postToLinkedIn = false,
    } = req.body;
    if (!title || !description || !department) {
      return res
        .status(400)
        .json({
          message: "Job title, description, and department are required.",
        });
    }

    // Sanitize location — it is optional
    const cleanLocation = String(location || "")
      .trim()
      .slice(0, 200);

    const result = await db.query(
      `INSERT INTO job_postings (title, description, department, location, status)
       VALUES ($1, $2, $3, $4, 'open')
       RETURNING id AS _id, *`,
      [title.trim(), description.trim(), department.trim(), cleanLocation],
    );
    const job = result.rows[0];

    // Optionally post to LinkedIn
    let linkedInResult = null;
    if (postToLinkedIn) {
      try {
        linkedInResult = await postJobToLinkedIn({
          title: job.title,
          description: job.description,
          department: job.department,
          location: job.location || "",
        });
      } catch (liErr) {
        console.error("LinkedIn posting failed (non-fatal):", liErr.message);
        linkedInResult = { success: false, error: liErr.message };
      }
    }

    return res.status(201).json({
      message: "Job posting created successfully.",
      data: job,
      ...(postToLinkedIn && { linkedIn: linkedInResult }),
    });
  } catch (err) {
    console.error("createJobPosting error:", err);
    return res.status(500).json({ message: "Server error." });
  }
}

async function applyJob(req, res) {
  try {
    const { id } = req.params; // job_id
    const { name, email, resumeUrl = "" } = req.body;
    const jobIdInt = parseInt(id, 10);

    if (isNaN(jobIdInt) || !name || !email) {
      return res.status(400).json({ message: "Name and email are required." });
    }

    const result = await db.query(
      `INSERT INTO job_applications (job_id, name, email, resume_url, status)
       VALUES ($1, $2, $3, $4, 'Applied')
       RETURNING id AS _id, *`,
      [jobIdInt, name.trim(), email.trim(), resumeUrl.trim()],
    );

    return res
      .status(201)
      .json({
        message: "Job application submitted successfully.",
        data: result.rows[0],
      });
  } catch (err) {
    console.error("applyJob error:", err);
    return res.status(500).json({ message: "Server error." });
  }
}

async function updateApplicationStatus(req, res) {
  try {
    const { id } = req.params; // application_id
    const { status, feedback = "" } = req.body;
    const appIdInt = parseInt(id, 10);

    if (
      isNaN(appIdInt) ||
      ![
        "Applied",
        "Screening",
        "Technical",
        "Offer",
        "Hired",
        "Rejected",
      ].includes(status)
    ) {
      return res.status(400).json({ message: "Invalid application status." });
    }

    await db.query(
      `UPDATE job_applications 
       SET status = $1, feedback = $2, updated_at = NOW() 
       WHERE id = $3`,
      [status, feedback.trim(), appIdInt],
    );

    return res.json({ message: `Application status updated to ${status}.` });
  } catch (err) {
    console.error("updateApplicationStatus error:", err);
    return res.status(500).json({ message: "Server error." });
  }
}

async function assignShift(req, res) {
  try {
    const { employeeId, startTime, endTime, notes = "" } = req.body;
    if (!employeeId || !startTime || !endTime) {
      return res
        .status(400)
        .json({
          message: "Employee, shift start, and shift end are required.",
        });
    }

    const empIdInt = parseInt(employeeId, 10);
    const empCheck = await db.query(
      "SELECT id, user_id FROM employees WHERE id = $1",
      [empIdInt],
    );
    const employee = empCheck.rows[0];
    if (!employee)
      return res.status(404).json({ message: "Employee not found." });

    const start = new Date(startTime);
    const end = new Date(endTime);
    if (start >= end) {
      return res
        .status(400)
        .json({ message: "Shift start time must be before end time." });
    }

    const result = await db.query(
      `INSERT INTO shifts (employee_id, start_time, end_time, notes)
       VALUES ($1, $2, $3, $4)
       RETURNING id AS _id, *`,
      [empIdInt, start, end, notes.trim()],
    );

    // Notify employee
    await db.query(
      `INSERT INTO notifications (user_id, title, message, type)
       VALUES ($1, $2, $3, 'Info')`,
      [
        employee.user_id,
        "New Shift Roster Assigned",
        `You have been assigned a shift on ${start.toLocaleDateString()} from ${start.toLocaleTimeString()} to ${end.toLocaleTimeString()}.`,
        "Info",
      ],
    );

    return res
      .status(201)
      .json({
        message: "Shift roster assigned successfully.",
        data: result.rows[0],
      });
  } catch (err) {
    console.error("assignShift error:", err);
    return res.status(500).json({ message: "Server error." });
  }
}

export { checkInGps, issueContract, signContract, createOkr, updateOkrProgress, createJobPosting, applyJob, updateApplicationStatus, assignShift };
export default { checkInGps, issueContract, signContract, createOkr, updateOkrProgress, createJobPosting, applyJob, updateApplicationStatus, assignShift };
