import db from "../config/db.js";
import { getOrCreateEmployeeForUser } from "./queries/employeeQueries.js";

async function createAsset(req, res) {
  try {
    const { name, serialNumber, category, notes = "" } = req.body;
    if (!name || !serialNumber || !category) {
      return res
        .status(400)
        .json({ message: "Name, serial number, and category are required." });
    }

    const check = await db.query(
      "SELECT id FROM assets WHERE serial_number = $1",
      [serialNumber],
    );
    if (check.rows.length > 0) {
      return res
        .status(409)
        .json({ message: "An asset with this serial number already exists." });
    }

    const result = await db.query(
      `INSERT INTO assets (name, serial_number, category, notes, status)
       VALUES ($1, $2, $3, $4, 'Available')
       RETURNING *`,
      [name, serialNumber, category, notes],
    );

    return res
      .status(201)
      .json({ message: "Asset added successfully.", data: result.rows[0] });
  } catch (err) {
    console.error("createAsset error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

async function getAllAssets(req, res) {
  try {
    const result = await db.query(
      `SELECT a.*, a.serial_number as "serialNumber",
              e.first_name as "firstName", e.last_name as "lastName", e.employee_id as "employeeId"
       FROM assets a
       LEFT JOIN employees e ON a.assigned_to = e.id
       ORDER BY a.created_at DESC`,
    );
    return res.json({ data: result.rows });
  } catch (err) {
    console.error("getAllAssets error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

async function getMyAssets(req, res) {
  try {
    const employee = await getOrCreateEmployeeForUser(req.user);
    const result = await db.query(
      `SELECT id, name, serial_number as "serialNumber", category, assigned_at as "assignedAt", status, notes
       FROM assets 
       WHERE assigned_to = $1 
       ORDER BY assigned_at DESC`,
      [employee.id],
    );
    return res.json({ data: result.rows });
  } catch (err) {
    console.error("getMyAssets error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

async function updateAssetAssignment(req, res) {
  try {
    const { id } = req.params;
    const { assignedTo, status, notes } = req.body; // assignedTo is employee ID (integer or null)

    const assetId = parseInt(id, 10);
    if (isNaN(assetId))
      return res.status(400).json({ message: "Invalid asset id." });

    const check = await db.query("SELECT * FROM assets WHERE id = $1", [
      assetId,
    ]);
    if (check.rows.length === 0) {
      return res.status(404).json({ message: "Asset not found." });
    }

    let queryStr = "UPDATE assets SET ";
    const params = [];

    if (assignedTo !== undefined) {
      params.push(assignedTo ? parseInt(assignedTo, 10) : null);
      queryStr += `assigned_to = $${params.length}, assigned_at = ${assignedTo ? "CURRENT_TIMESTAMP" : "NULL"}, `;
    }

    if (status !== undefined) {
      params.push(status);
      queryStr += `status = $${params.length}, `;
    }

    if (notes !== undefined) {
      params.push(notes);
      queryStr += `notes = $${params.length}, `;
    }

    // Clean up trailing comma
    queryStr = queryStr.slice(0, -2);
    params.push(assetId);
    queryStr += ` WHERE id = $${params.length} RETURNING *`;

    const result = await db.query(queryStr, params);
    return res.json({
      message: "Asset updated successfully.",
      data: result.rows[0],
    });
  } catch (err) {
    console.error("updateAssetAssignment error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

export { createAsset, getAllAssets, getMyAssets, updateAssetAssignment };
export default { createAsset, getAllAssets, getMyAssets, updateAssetAssignment };
