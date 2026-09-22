import { Bot, InputFile } from "grammy";

const token = process.env.TELEGRAM_BOT_TOKEN;
export const bot = token ? new Bot(token) : null;

/**
 * Send a document directly to the user's Telegram chat
 */
export async function sendDocumentToTelegram(chatId: string, fileBuffer: Buffer, fileName: string, caption?: string) {
  if (!bot) return;
  try {
    const inputFile = new InputFile(fileBuffer, fileName);
    await bot.api.sendDocument(chatId, inputFile, { caption });
  } catch (error) {
    console.error("[TELEGRAM_SEND_DOC_ERROR]", error);
  }
}

/**
 * Send real-time security alerts to the Super Admin's Telegram ID
 */
export async function sendAdminSecurityAlert(title: string, details: string) {
  if (!bot) return;
  const adminChatId = process.env.TELEGRAM_ADMIN_CHAT_ID;
  if (!adminChatId) return;

  const text = `🚨 *SECURITY ALERT: ${title}*\n\n${details}`;
  try {
    await bot.api.sendMessage(adminChatId, text, { parse_mode: "Markdown" });
  } catch (error) {
    console.error("[TELEGRAM_SECURITY_ALERT_ERROR]", error);
  }
}

/**
 * Alerts admins and users upon successful Click/Payme transactions
 */
export async function sendPaymentNotification(chatId: string | null, planName: string, amount: number) {
  if (!bot) return;
  
  const text = `✅ *Payment Successful*\n\nPlan: ${planName}\nAmount: ${amount} UZS\n\nThank you for using DocNova!`;
  
  try {
    if (chatId) {
      // Notify the user if linked
      await bot.api.sendMessage(chatId, text, { parse_mode: "Markdown" });
    }
    
    // Also notify admin
    const adminChatId = process.env.TELEGRAM_ADMIN_CHAT_ID;
    if (adminChatId) {
      await bot.api.sendMessage(adminChatId, `💰 *New Payment Received*\nPlan: ${planName}\nAmount: ${amount} UZS`, { parse_mode: "Markdown" });
    }
  } catch (error) {
    console.error("[TELEGRAM_PAYMENT_NOTIFY_ERROR]", error);
  }
}
