/**
 * Telegram Bot API utilities.
 * Uses fetch directly — no extra dependency needed.
 */

function base() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) throw new Error("TELEGRAM_BOT_TOKEN is not set");
  return `https://api.telegram.org/bot${token}`;
}

/** Send a plain or HTML-formatted message to a chat. */
export async function sendTelegramMessage(
  chatId: number | string,
  text: string,
  opts?: { parseMode?: "HTML" | "Markdown"; disablePreview?: boolean }
): Promise<void> {
  if (!process.env.TELEGRAM_BOT_TOKEN) return;
  await fetch(`${base()}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: opts?.parseMode ?? "HTML",
      disable_web_page_preview: opts?.disablePreview ?? true
    })
  });
}

/** Send a "bot is typing..." indicator. */
export async function sendChatAction(
  chatId: number | string,
  action: "typing" | "upload_photo" = "typing"
): Promise<void> {
  if (!process.env.TELEGRAM_BOT_TOKEN) return;
  await fetch(`${base()}/sendChatAction`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, action })
  });
}

/** Register the webhook URL with Telegram. */
export async function setWebhook(url: string, secret: string): Promise<unknown> {
  const res = await fetch(`${base()}/setWebhook`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      url,
      secret_token: secret,
      allowed_updates: ["message"],
      drop_pending_updates: true
    })
  });
  return res.json();
}

/** Remove the registered webhook. */
export async function deleteWebhook(): Promise<unknown> {
  const res = await fetch(`${base()}/deleteWebhook`, { method: "POST" });
  return res.json();
}

/** Retrieve current webhook status. */
export async function getWebhookInfo(): Promise<unknown> {
  const res = await fetch(`${base()}/getWebhookInfo`);
  return res.json();
}

/** Get basic bot info (@username, id). */
export async function getMe(): Promise<unknown> {
  const res = await fetch(`${base()}/getMe`);
  return res.json();
}

/** Escape special HTML characters for safe Telegram HTML messages. */
export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
