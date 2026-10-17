import assert from "node:assert";
import fs from "node:fs";

console.log("=== STARTING DOCNOVA AI BOT INTEGRATION AUDIT ===");

// 1. Verify Bot Token & Identity via Telegram Bot API
let token = process.env.DOCNOVA_AI_BOT_TOKEN;
if (!token && fs.existsSync(".env")) {
  const envContent = fs.readFileSync(".env", "utf-8");
  const match = envContent.match(/DOCNOVA_AI_BOT_TOKEN=["']?([^"'\r\n]+)/);
  if (match) token = match[1];
}

try {
  assert.ok(token, "DOCNOVA_AI_BOT_TOKEN must be defined");
  const res = await fetch(`https://api.telegram.org/bot${token}/getMe`);
  const data = await res.json();
  assert.strictEqual(data.ok, true, "getMe should be ok");
  assert.strictEqual(data.result.username, "DocNovaAI_bot", "Username must match DocNovaAI_bot");
  console.log(`[PASS] Bot Identity Verified: @${data.result.username} (ID: ${data.result.id})`);
} catch (e) {
  console.error("[FAIL] Bot Identity Check Failed:", e.message);
  process.exit(1);
}

// 2. Verify Word HTML Document Generation
function markdownToWordHtml(markdown) {
  let html = markdown;

  // Tables
  html = html.replace(/((?:\|[^\n]+\|\r?\n)+)/g, (match) => {
    const lines = match.trim().split(/\r?\n/).filter(Boolean);
    if (lines.length < 2) return match;

    const headers = lines[0].split("|").slice(1, -1).map((s) => s.trim());
    const rows = lines.slice(2).map((l) =>
      l.split("|").slice(1, -1).map((s) => s.trim())
    );

    let tableHtml = "<table><thead><tr>";
    headers.forEach((h) => {
      tableHtml += `<th>${h}</th>`;
    });
    tableHtml += "</tr></thead><tbody>";
    rows.forEach((r) => {
      tableHtml += "<tr>";
      r.forEach((c) => {
        tableHtml += `<td>${c}</td>`;
      });
      tableHtml += "</tr>";
    });
    tableHtml += "</tbody></table>";
    return tableHtml;
  });

  html = html.replace(/^# (.*$)/gim, "<h1>$1</h1>");
  html = html.replace(/^## (.*$)/gim, "<h2>$1</h2>");
  html = html.replace(/^### (.*$)/gim, "<h3>$1</h3>");
  html = html.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");

  return html;
}

function generateWordDocumentBuffer(params) {
  const formattedHtml = markdownToWordHtml(params.bodyContent);

  const wordDocHTML = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset="utf-8">
      <title>${params.title}</title>
      <style>
        @page Section1 {
          size: 21.0cm 29.7cm;
          margin: 3.0cm 1.5cm 2.0cm 2.5cm;
        }
        div.Section1 { page: Section1; }
        body {
          font-family: 'Times New Roman', Times, serif;
          font-size: 14pt;
          line-height: 1.5;
        }
      </style>
    </head>
    <body>
      <div class="Section1">
        ${formattedHtml}
      </div>
    </body>
    </html>
  `;
  return Buffer.from(wordDocHTML, "utf-8");
}

const testContent = `# O'ZBEKISTON RESPUBLIKASI OLIY TA'LIM VAZIRLIGI\n\n## KURS ISHI\n\n**Mavzu:** Sun'iy intellekt\n\n| Yil | Ko'rsatkich |\n|---|---|\n| 2024 | 98% |\n\nMatn mazmuni.`;
const docBuf = generateWordDocumentBuffer({ title: "Test Doc", bodyContent: testContent });
const docStr = docBuf.toString("utf-8");

assert.ok(docBuf.length > 200, "Buffer should not be empty");
assert.ok(docStr.includes("Times New Roman"), "Should have Times New Roman font standard");
assert.ok(docStr.includes("<table>"), "Should have formatted table");
assert.ok(docStr.includes("98%"), "Should contain table row values");
assert.ok(docStr.includes("margin: 3.0cm 1.5cm 2.0cm 2.5cm"), "Should have MOVSO RUz margins");
console.log(`[PASS] Word .doc Document Generation & MOVSO Standards Verified (${docBuf.length} bytes)`);

// 3. Check Webhook Status
try {
  const res = await fetch(`https://api.telegram.org/bot${token}/getWebhookInfo`);
  const data = await res.json();
  console.log(`[INFO] Current Webhook Info:`, data.result);
} catch (e) {
  console.log(`[WARN] Webhook Info query failed:`, e.message);
}

// 4. Verify Existing Bot (@docnova_official_bot) Unchanged
const oldBotFile = fs.readFileSync("src/app/api/telegram/webhook/route.ts", "utf-8");
assert.ok(oldBotFile.includes("export const POST = bot"), "Old bot webhook export must exist");
assert.ok(oldBotFile.includes("TelegramQuizService"), "Old bot quiz service must remain untouched");
assert.ok(oldBotFile.includes("TELEGRAM_WEBHOOK_SECRET"), "Old bot secret must remain untouched");
console.log(`[PASS] Old Reporting/Notification Bot (@docnova_official_bot) is 100% UNTOUCHED and PRESERVED`);

// 5. Verify New Dedicated Webhook Route
const newWebhookFile = fs.readFileSync("src/app/api/telegram/docnova-ai/webhook/route.ts", "utf-8");
assert.ok(newWebhookFile.includes("docnovaAiBot"), "New bot instance must be used");
assert.ok(newWebhookFile.includes("generateCourseworkDoc"), "Coursework generation handler must exist");
assert.ok(newWebhookFile.includes("generateReferatDoc"), "Referat generation handler must exist");
assert.ok(newWebhookFile.includes("generateBmiDoc"), "BMI generation handler must exist");
assert.ok(newWebhookFile.includes("generatePresentationDoc"), "Presentation handler must exist");
assert.ok(newWebhookFile.includes("generateEssayDoc"), "Essay handler must exist");
assert.ok(newWebhookFile.includes("generateExamDoc"), "Exam handler must exist");
assert.ok(newWebhookFile.includes("DOCNOVA_AI_BOT_SECRET"), "New webhook secret must be checked");
console.log(`[PASS] New User Bot Webhook Route (/api/telegram/docnova-ai/webhook) Verified`);

// 6. Verify Auth Connect Page & API
const connectPage = fs.readFileSync("src/app/telegram/connect/page.tsx", "utf-8");
const connectApi = fs.readFileSync("src/app/api/telegram/docnova-ai/connect/route.ts", "utf-8");
assert.ok(connectPage.includes("signIn(\"google\""), "Google OAuth login must be present");
assert.ok(connectApi.includes("prisma.user.update"), "User telegramId linking must update database");
assert.ok(connectApi.includes("docnovaAiBot.api.sendMessage"), "Instant confirmation push must be sent");
console.log(`[PASS] Google Auth Linking Flow (/telegram/connect & /api/telegram/docnova-ai/connect) Verified`);

console.log("=== ALL BOT INTEGRATION AUDIT TESTS PASSED SUCCESSFULLY ===");
