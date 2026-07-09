// services/htmlPdfService.js
// Convert HTML string to PDF buffer using Puppeteer.

import puppeteer from "puppeteer";

async function htmlToPdfBuffer(html) {
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    const page = await browser.newPage();
    await page.setContent(String(html || ""), { waitUntil: "networkidle0" });
    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: {
        top: "16mm",
        right: "12mm",
        bottom: "16mm",
        left: "12mm",
      },
    });
    return pdf;
  } finally {
    await browser.close();
  }
}

export { htmlToPdfBuffer };
export default { htmlToPdfBuffer };
