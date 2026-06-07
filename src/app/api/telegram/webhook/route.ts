import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/prisma";
import { sendTelegramMessage, sendChatAction } from "@/lib/telegram";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Per-chat conversation history (in-memory, last 10 exchanges = 20 messages).
// Good enough for single-process deployments; replace with Redis for multi-replica.
const histories = new Map<number, { role: "user" | "assistant"; content: string }[]>();
const MAX_HISTORY = 20;

const SYSTEM_PROMPT = `ທ່ານເປັນຜູ້ຊ່ວຍ AI ສຳລັບລະບົບ ERP ຂອງ The Signmaker — ທຸລະກິດຜະລິດປ້າຍ ແລະ ສື່ສິ່ງພິມໃນລາວ.

ທ່ານຕອບຄຳຖາມຜ່ານ Telegram. ຕອບກະທັດຮັດ ບໍ່ເກີນ 3-4 ຂໍ້ ຫຼື 150 ຄຳ. ຫຼີກລ່ຽງ Markdown — ໃຊ້ plain text ເພາະ Telegram ໃຊ້ HTML.

ທ່ານຊ່ວຍໄດ້ໃນ:
- ການຂາຍ: ລູກຄ້າ, ໃບສະເໜີລາຄາ, ໂຄງການ
- ການຜະລິດ: ຂັ້ນຕອນວຽກ, QC, ການຕິດຕັ້ງ
- ການເງິນ: ໃບແຈ້ງໜີ້, ການຊຳລະ
- ສາງ: ວັດຖຸດິບ, ໃບເບີກ, ໃບສັ່ງຊື້
- HR / RBAC: ພະນັກງານ, ສິດທິ

ສະຖານະວຽກ: NEW → CONFIRMED → DESIGN → WAITING_MATERIAL → PRODUCTION → QC → (REWORK) → READY_TO_INSTALL → INSTALLING → DELIVERED → COMPLETED
Roles: OWNER > ADMIN_MANAGER > SALES_MANAGER/SALES_STAFF, PRODUCTION_MANAGER > DESIGNER/PRODUCTION_STAFF/QC_STAFF/INSTALLER, FINANCE, STOCK, HR

ກົດ: ຕອບພາສາດຽວກັນກັບທີ່ຖາມ (ລາວ/ໄທ/ອັງກິດ). ຖ້າບໍ່ຮູ້ ໃຫ້ບອກຕາມຄວາມເປັນຈິງ.`;

interface TelegramUpdate {
  update_id: number;
  message?: {
    message_id: number;
    from?: { id: number; first_name?: string; username?: string };
    chat: { id: number; type: string };
    text?: string;
  };
}

export async function POST(req: NextRequest) {
  // Verify the secret Telegram sends in the header
  const secret = req.headers.get("x-telegram-bot-api-secret-token");
  if (
    process.env.TELEGRAM_WEBHOOK_SECRET &&
    secret !== process.env.TELEGRAM_WEBHOOK_SECRET
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let update: TelegramUpdate;
  try {
    update = await req.json();
  } catch {
    return NextResponse.json({ ok: true }); // ignore malformed
  }

  const msg = update.message;
  if (!msg?.text || !msg.chat) return NextResponse.json({ ok: true });

  const chatId = msg.chat.id;
  const text   = msg.text.trim();

  // ── /start command ──────────────────────────────────────────────────────────
  if (text === "/start" || text.startsWith("/start ")) {
    await sendTelegramMessage(
      chatId,
      `👋 ສະບາຍດີ! ຂ້ອຍເປັນ AI ຜູ້ຊ່ວຍຂອງ The Signmaker ERP.\n\n` +
      `📋 Chat ID ຂອງທ່ານ: <code>${chatId}</code>\n` +
      `ໃສ່ ID ນີ້ໃນໂປຣໄຟລ໌ຂອງທ່ານໃນ ERP ເພື່ອຮັບການແຈ້ງເຕືອນ.\n\n` +
      `ຖາມຫຍັງກ່ຽວກັບລະບົບ ERP ໄດ້ເລີຍ! 🚀`
    );
    return NextResponse.json({ ok: true });
  }

  // ── /chatid command ─────────────────────────────────────────────────────────
  if (text === "/chatid") {
    await sendTelegramMessage(
      chatId,
      `🆔 Chat ID ຂອງທ່ານ: <code>${chatId}</code>\n\nCopy ID ນີ້ ແລ້ວໃສ່ໃນ RBAC → ແກ້ໄຂ User → Telegram Chat ID`
    );
    return NextResponse.json({ ok: true });
  }

  // ── /clear command ──────────────────────────────────────────────────────────
  if (text === "/clear") {
    histories.delete(chatId);
    await sendTelegramMessage(chatId, "🗑️ ລ້າງປະຫວັດການສົນທະນາແລ້ວ");
    return NextResponse.json({ ok: true });
  }

  // ── Resolve ERP user by telegramChatId ──────────────────────────────────────
  const erpUser = await prisma.user.findUnique({
    where: { telegramChatId: String(chatId) },
    select: { fullName: true, role: true, language: true }
  }).catch(() => null);

  // ── Show typing indicator ────────────────────────────────────────────────────
  await sendChatAction(chatId, "typing");

  // ── Build conversation history ───────────────────────────────────────────────
  const history = histories.get(chatId) ?? [];
  history.push({ role: "user", content: text });
  if (history.length > MAX_HISTORY) history.splice(0, history.length - MAX_HISTORY);

  // ── Call Claude ──────────────────────────────────────────────────────────────
  let reply = "";
  try {
    const userCtx = erpUser
      ? `\n\n[ຜູ້ໃຊ້: ${erpUser.fullName}, Role: ${erpUser.role}, ພາສາ: ${erpUser.language}]`
      : "";

    const response = await anthropic.messages.create({
      model: "claude-opus-4-7",
      max_tokens: 512,
      system: [
        {
          type: "text",
          text: SYSTEM_PROMPT + userCtx,
          cache_control: { type: "ephemeral" }
        }
      ],
      messages: history
    });

    reply =
      response.content
        .filter((b) => b.type === "text")
        .map((b) => (b as { type: "text"; text: string }).text)
        .join("") || "ຂໍໂທດ, ບໍ່ສາມາດຕອບໄດ້ໃນຕອນນີ້.";
  } catch (err: any) {
    reply = `⚠️ ຜິດພາດ: ${err?.message ?? "AI error"}`;
  }

  // ── Save assistant reply to history ─────────────────────────────────────────
  history.push({ role: "assistant", content: reply });
  histories.set(chatId, history);

  // ── Send reply ───────────────────────────────────────────────────────────────
  await sendTelegramMessage(chatId, reply, { parseMode: "HTML" });

  return NextResponse.json({ ok: true });
}
