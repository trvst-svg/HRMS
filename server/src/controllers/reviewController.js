import db from "../config/db.js";
import { getOrCreateEmployeeForUser } from "./queries/employeeQueries.js";

async function createReviewCycle(req, res) {
  try {
    const { employeeId, reviewCycle } = req.body;
    if (!employeeId || !reviewCycle) {
      return res
        .status(400)
        .json({ message: "Employee ID and review cycle are required." });
    }

    const check = await db.query(
      "SELECT id FROM performance_reviews WHERE employee_id = $1 AND review_cycle = $2",
      [parseInt(employeeId, 10), reviewCycle],
    );
    if (check.rows.length > 0) {
      return res
        .status(409)
        .json({
          message:
            "A performance review for this employee and cycle already exists.",
        });
    }

    const result = await db.query(
      `INSERT INTO performance_reviews (employee_id, review_cycle, status)
       VALUES ($1, $2, 'Pending Self')
       RETURNING *`,
      [parseInt(employeeId, 10), reviewCycle],
    );

    return res
      .status(201)
      .json({ message: "Review cycle initialized.", data: result.rows[0] });
  } catch (err) {
    console.error("createReviewCycle error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

async function getMyReviews(req, res) {
  try {
    const employee = await getOrCreateEmployeeForUser(req.user);
    const result = await db.query(
      `SELECT pr.*, pr.review_cycle as "reviewCycle", pr.self_rating as "selfRating", pr.self_feedback as "selfFeedback",
              pr.manager_rating as "managerRating", pr.manager_feedback as "managerFeedback", pr.overall_rating as "overallRating"
       FROM performance_reviews pr
       WHERE pr.employee_id = $1 
       ORDER BY pr.created_at DESC`,
      [employee.id],
    );
    return res.json({ data: result.rows });
  } catch (err) {
    console.error("getMyReviews error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

async function submitSelfAppraisal(req, res) {
  try {
    const { id } = req.params;
    const { selfRating, selfFeedback } = req.body;

    const reviewId = parseInt(id, 10);
    if (isNaN(reviewId))
      return res.status(400).json({ message: "Invalid review id." });

    const employee = await getOrCreateEmployeeForUser(req.user);

    const check = await db.query(
      "SELECT * FROM performance_reviews WHERE id = $1 AND employee_id = $2",
      [reviewId, employee.id],
    );
    if (check.rows.length === 0) {
      return res.status(404).json({ message: "Performance review not found." });
    }

    const result = await db.query(
      `UPDATE performance_reviews 
       SET self_rating = $1, self_feedback = $2, status = 'Pending Manager' 
       WHERE id = $3 AND employee_id = $4
       RETURNING *`,
      [Number(selfRating), selfFeedback, reviewId, employee.id],
    );

    return res.json({
      message: "Self appraisal submitted successfully.",
      data: result.rows[0],
    });
  } catch (err) {
    console.error("submitSelfAppraisal error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

async function submitManagerAppraisal(req, res) {
  try {
    const { id } = req.params;
    const { managerRating, managerFeedback, overallRating } = req.body;

    const reviewId = parseInt(id, 10);
    if (isNaN(reviewId))
      return res.status(400).json({ message: "Invalid review id." });

    const check = await db.query(
      "SELECT * FROM performance_reviews WHERE id = $1",
      [reviewId],
    );
    if (check.rows.length === 0) {
      return res.status(404).json({ message: "Performance review not found." });
    }

    const result = await db.query(
      `UPDATE performance_reviews 
       SET manager_rating = $1, manager_feedback = $2, overall_rating = $3, status = 'Completed' 
       WHERE id = $4
       RETURNING *`,
      [Number(managerRating), managerFeedback, Number(overallRating), reviewId],
    );

    return res.json({
      message: "Manager appraisal submitted successfully.",
      data: result.rows[0],
    });
  } catch (err) {
    console.error("submitManagerAppraisal error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

async function getAllReviews(req, res) {
  try {
    const result = await db.query(
      `SELECT pr.*, pr.review_cycle as "reviewCycle", pr.self_rating as "selfRating", pr.self_feedback as "selfFeedback",
              pr.manager_rating as "managerRating", pr.manager_feedback as "managerFeedback", pr.overall_rating as "overallRating",
              e.first_name as "firstName", e.last_name as "lastName", e.employee_id as "employeeId"
       FROM performance_reviews pr
       JOIN employees e ON pr.employee_id = e.id
       ORDER BY pr.created_at DESC`,
    );
    return res.json({ data: result.rows });
  } catch (err) {
    console.error("getAllReviews error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

export { createReviewCycle, getMyReviews, submitSelfAppraisal, submitManagerAppraisal, getAllReviews };
export default { createReviewCycle, getMyReviews, submitSelfAppraisal, submitManagerAppraisal, getAllReviews };
