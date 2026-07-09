import db from "../../config/db.js";

async function createDepartment(req, res) {
  try {
    const { name } = req.body;
    if (!name || !String(name).trim()) {
      return res.status(400).json({ message: "Department name is required." });
    }

    const cleanName = String(name).trim();

    const result = await db.query(
      "INSERT INTO departments (name) VALUES ($1) RETURNING id AS _id, id, name",
      [cleanName],
    );

    return res
      .status(201)
      .json({ message: "Department created", data: result.rows[0] });
  } catch (err) {
    console.error("createDepartment error:", err);
    if (err.code === "23505") {
      return res.status(409).json({ message: "Department already exists." });
    }
    return res.status(500).json({ message: "Server error" });
  }
}

async function deleteDepartment(req, res) {
  try {
    const { id } = req.params;
    const idInt = parseInt(id, 10);
    if (isNaN(idInt)) {
      return res.status(400).json({ message: "Invalid department id" });
    }

    const depResult = await db.query(
      "SELECT name FROM departments WHERE id = $1",
      [idInt],
    );
    const dep = depResult.rows[0];
    if (!dep) return res.status(404).json({ message: "Department not found" });

    const departmentName = String(dep.name || "").trim();

    await db.query("DELETE FROM departments WHERE id = $1", [idInt]);

    if (departmentName) {
      await db.query(
        "UPDATE employees SET department = 'Unassigned', designation = 'Unassigned' WHERE department = $1",
        [departmentName],
      );
    }

    return res.json({ message: "Department deleted" });
  } catch (err) {
    console.error("deleteDepartment error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

export { createDepartment, deleteDepartment };
export default { createDepartment, deleteDepartment };
