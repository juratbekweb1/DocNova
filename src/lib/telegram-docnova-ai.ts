import { Bot, InlineKeyboard, Keyboard } from "grammy";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";

const botToken = process.env.DOCNOVA_AI_BOT_TOKEN;

/**
 * Dedicated Grammy Bot instance for DocNova AI User Bot (@DocNovaAI_bot)
 */
export const docnovaAiBot = botToken ? new Bot(botToken) : null;

export interface BotWizardState {
  type: "coursework" | "referat" | "bmi" | "presentation" | "essay" | "exam";
  step: "topic" | "subject" | "length" | "slidesCount" | "confirm";
  topic?: string;
  subject?: string;
  length?: string;
  slidesCount?: number;
  language?: "uz" | "ru";
  specialty?: string;
  _ts?: number;
}

/**
 * Session persistence using VerificationToken table to survive serverless cold starts
 */
export async function getBotSession(telegramId: string | number): Promise<BotWizardState | null> {
  try {
    const id = `tg_state_${telegramId}`;
    const record = await prisma.verificationToken.findFirst({
      where: {
        identifier: id,
        expires: { gt: new Date() },
      },
    });

    if (!record) return null;
    const jsonStr = Buffer.from(record.token, "base64").toString("utf-8");
    return JSON.parse(jsonStr) as BotWizardState;
  } catch (err) {
    console.error("[BOT_SESSION_GET_ERR]", err);
    return null;
  }
}

export async function setBotSession(
  telegramId: string | number,
  state: BotWizardState
): Promise<void> {
  try {
    const id = `tg_state_${telegramId}`;
    const token = Buffer.from(JSON.stringify({ ...state, _ts: Date.now() })).toString("base64");
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.verificationToken.deleteMany({
      where: { identifier: id },
    });

    await prisma.verificationToken.create({
      data: {
        identifier: id,
        token,
        expires,
      },
    });
  } catch (err) {
    console.error("[BOT_SESSION_SET_ERR]", err);
  }
}

export async function clearBotSession(telegramId: string | number): Promise<void> {
  try {
    const id = `tg_state_${telegramId}`;
    await prisma.verificationToken.deleteMany({
      where: { identifier: id },
    });
  } catch (err) {
    console.error("[BOT_SESSION_CLEAR_ERR]", err);
  }
}

/**
 * Account linking token generation
 */
export async function createTelegramLinkToken(
  telegramId: string | number,
  username?: string
): Promise<string> {
  const id = `tg_link_${telegramId}`;
  const token = crypto.randomBytes(24).toString("hex");
  const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

  await prisma.verificationToken.deleteMany({
    where: { identifier: id },
  });

  await prisma.verificationToken.create({
    data: {
      identifier: id,
      token,
      expires,
    },
  });

  const rawUrl = process.env.NEXT_PUBLIC_APP_URL || "";
  const baseUrl = rawUrl.includes("localhost") ? "http://localhost:3000" : "https://www.docnova.uz";
  return `${baseUrl}/telegram/connect?token=${token}&tg_id=${telegramId}${username ? `&username=${encodeURIComponent(username)}` : ""}`;
}

/**
 * Get linked DocNova user for a Telegram user ID
 */
export async function getLinkedUser(telegramId: string | number) {
  try {
    return await prisma.user.findUnique({
      where: { telegramId: telegramId.toString() },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        plan: true,
        planId: true,
        aiUsageCount: true,
        dailyAiCount: true,
        subscriptionEndDate: true,
        isTelegramLinked: true,
      },
    });
  } catch (err) {
    console.error("[GET_LINKED_USER_ERR]", err);
    return null;
  }
}

/**
 * Keyboards for DocNova AI Bot
 */
export function getMainReplyKeyboard() {
  return new Keyboard()
    .text("🎓 Talabalar uchun")
    .row()
    .text("💎 Tarif va limitlar")
    .text("👤 Mening akkauntim")
    .row()
    .text("🌐 DocNova sayti")
    .text("❓ Yordam")
    .resized();
}

export function getStudentInlineMenu() {
  return new InlineKeyboard()
    .text("📘 Kurs ishi", "wiz_coursework")
    .text("📑 Referat / Mustaqil ish", "wiz_referat")
    .row()
    .text("🎓 BMI / Diplom ishi", "wiz_bmi")
    .text("📊 Taqdimot (Slaydlar)", "wiz_presentation")
    .row()
    .text("✍️ Insho / Esse", "wiz_essay")
    .text("📝 Imtihon biletlari", "wiz_exam")
    .row()
    .text("❌ Bekor qilish", "wiz_cancel");
}

/**
 * Converts Markdown academic content to clean HTML for Microsoft Word export
 */
export function markdownToWordHtml(markdown: string): string {
  let html = markdown;

  // Tables
  html = html.replace(/((?:\|[^\n]+\|\r?\n)+)/g, (match) => {
    const lines = match.trim().split(/\r?\n/).filter(Boolean);
    if (lines.length < 2) return match;

    const headers = lines[0]
      .split("|")
      .slice(1, -1)
      .map((s) => s.trim());
    // skip separator lines like |---|---|
    const rows = lines.slice(2).map((l) =>
      l
        .split("|")
        .slice(1, -1)
        .map((s) => s.trim())
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

  // Headers
  html = html.replace(/^# (.*$)/gim, "<h1>$1</h1>");
  html = html.replace(/^## (.*$)/gim, "<h2>$1</h2>");
  html = html.replace(/^### (.*$)/gim, "<h3>$1</h3>");
  html = html.replace(/^#### (.*$)/gim, "<h4>$1</h4>");

  // Bold & Italic
  html = html.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\*(.*?)\*/g, "<em>$1</em>");

  // Unordered list items
  html = html.replace(
    /^\s*[-*•]\s+(.*$)/gim,
    "<p style='margin-left: 20pt; text-indent: -10pt;'>• $1</p>"
  );

  // Numbered list items
  html = html.replace(
    /^\s*(\d+)\.\s+(.*$)/gim,
    "<p style='margin-left: 20pt; text-indent: -10pt;'>$1. $2</p>"
  );

  // Paragraphs
  const paragraphs = html.split(/\n{2,}/);
  html = paragraphs
    .map((p) => {
      const trimmed = p.trim();
      if (!trimmed) return "";
      if (
        trimmed.startsWith("<h1") ||
        trimmed.startsWith("<h2") ||
        trimmed.startsWith("<h3") ||
        trimmed.startsWith("<table") ||
        trimmed.startsWith("<p")
      ) {
        return trimmed;
      }
      return `<p>${trimmed.replace(/\n/g, "<br>")}</p>`;
    })
    .join("\n");

  return html;
}

/**
 * Builds a complete Word document (.doc) Buffer conforming to MOVSO RUz and GOST standards
 */
export function generateWordDocumentBuffer(params: {
  title: string;
  bodyContent: string;
  workType?: string;
  subject?: string;
  studentName?: string;
  university?: string;
  year?: number;
}): Buffer {
  const formattedHtml = markdownToWordHtml(params.bodyContent);

  const wordDocHTML = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset="utf-8">
      <title>${params.title}</title>
      <!--[if gte mso 9]>
      <xml>
      <w:WordDocument>
      <w:View>Print</w:View>
      <w:Zoom>100</w:Zoom>
      <w:DoNotOptimizeForBrowser/>
      </w:WordDocument>
      </xml>
      <![endif]-->
      <style>
        @page Section1 {
          size: 21.0cm 29.7cm;
          margin: 3.0cm 1.5cm 2.0cm 2.5cm;
          mso-header-margin: 36.0pt;
          mso-footer-margin: 36.0pt;
          mso-paper-source: 0;
        }
        div.Section1 { page: Section1; }
        body {
          font-family: 'Times New Roman', Times, serif;
          font-size: 14pt;
          line-height: 1.5;
          color: #000000;
          text-align: justify;
        }
        h1 {
          font-size: 16pt;
          font-weight: bold;
          text-align: center;
          text-transform: uppercase;
          margin-top: 20pt;
          margin-bottom: 14pt;
        }
        h2 {
          font-size: 14pt;
          font-weight: bold;
          margin-top: 16pt;
          margin-bottom: 8pt;
        }
        h3 {
          font-size: 14pt;
          font-weight: bold;
          margin-top: 12pt;
          margin-bottom: 6pt;
        }
        p {
          text-indent: 1.25cm;
          margin-top: 0;
          margin-bottom: 8pt;
          line-height: 1.5;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 12pt;
          margin-bottom: 12pt;
        }
        th, td {
          border: 1pt solid #000000;
          padding: 6pt;
          font-size: 12pt;
        }
        th {
          background-color: #f1f5f9;
          font-weight: bold;
          text-align: center;
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
