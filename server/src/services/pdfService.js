// services/pdfService.js
// Simple template renderer (HTML based).

const fs = require("fs");
const path = require("path");

const TEMPLATE_MAP = {
  "Experience Letter": "experienceLetter.html",
  "Salary Certificate": "salaryCertificate.html",
  "Employment Verification": "employmentVerification.html",
  "No Objection Certificate": "nocLetter.html",
};

function getTemplatePath(type) {
  const file = TEMPLATE_MAP[type] || "experienceLetter.html";
  return path.join(__dirname, "..", "templates", file);
}

function replacePlaceholders(template, data) {
  let output = template;
  Object.keys(data).forEach((key) => {
    const value =
      data[key] === undefined || data[key] === null ? "" : String(data[key]);
    const safe = value.replace(/</g, "&lt;").replace(/>/g, "&gt;");
    output = output.replace(new RegExp(`{{\\s*${key}\\s*}}`, "g"), safe);
  });
  return output;
}

function renderDocumentHtml(type, data) {
  const templatePath = getTemplatePath(type);
  const htmlTemplate = fs.readFileSync(templatePath, "utf8");
  return replacePlaceholders(htmlTemplate, data);
}

module.exports = {
  renderDocumentHtml,
};
