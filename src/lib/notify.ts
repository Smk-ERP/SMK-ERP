import { prisma } from "./prisma";
import type { NotificationType } from "./enums";
import { sendTelegramMessage, escapeHtml } from "./telegram";

/**
 * Create one or more notifications. Fire-and-forget — failures should never
 * break the parent transaction (callers wrap in `.catch`).
 *
 * Future: hook into Telegram / WhatsApp webhooks by replacing the body of
 * `dispatch()` below. The DB record remains the source of truth.
 */
export interface NotifyInput {
  userIds: string[];
  type: NotificationType;
  title: string;
  body?: string;
  link?: string;
}

export async function notify(input: NotifyInput): Promise<void> {
  if (!input.userIds.length) return;
  await prisma.notification.createMany({
    data: input.userIds.map((userId) => ({
      userId,
      type: input.type,
      title: input.title,
      body: input.body ?? null,
      link: input.link ?? null,
      read: false
    }))
  });
  await dispatch(input).catch((err) => console.warn("[notify] dispatch failed", err));
}

/** Push to outbound channels (Telegram). Silently skips if env is not configured. */
async function dispatch(input: NotifyInput): Promise<void> {
  if (!process.env.TELEGRAM_BOT_TOKEN) return;

  // Find users in this notification that have a Telegram chat ID linked.
  const users = await prisma.user.findMany({
    where: { id: { in: input.userIds }, telegramChatId: { not: null } },
    select: { telegramChatId: true }
  });
  if (!users.length) return;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const linkLine = input.link ? `\n🔗 <a href="${appUrl}${input.link}">ເປີດໃນ ERP</a>` : "";
  const message =
    `🔔 <b>${escapeHtml(input.title)}</b>` +
    (input.body ? `\n${escapeHtml(input.body)}` : "") +
    linkLine;

  await Promise.allSettled(
    users
      .filter((u): u is { telegramChatId: string } => u.telegramChatId !== null)
      .map((u) => sendTelegramMessage(u.telegramChatId, message))
  );
}

/** Helper: get user ids by role for broadcast-style notifications. */
export async function usersByRoles(roles: string[]): Promise<string[]> {
  const rows = await prisma.user.findMany({
    where: { role: { in: roles }, active: true },
    select: { id: true }
  });
  return rows.map((r) => r.id);
}
