import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { setWebhook, deleteWebhook, getWebhookInfo } from "@/lib/telegram";

/** GET /api/telegram/setup — returns current webhook info */
export async function GET(_req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !["OWNER", "ADMIN_MANAGER"].includes(user.role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  if (!process.env.TELEGRAM_BOT_TOKEN)
    return NextResponse.json({ error: "TELEGRAM_BOT_TOKEN not set" }, { status: 400 });

  const info = await getWebhookInfo();
  return NextResponse.json(info);
}

/** POST /api/telegram/setup — register or remove webhook */
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !["OWNER", "ADMIN_MANAGER"].includes(user.role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  if (!process.env.TELEGRAM_BOT_TOKEN)
    return NextResponse.json({ error: "TELEGRAM_BOT_TOKEN not set" }, { status: 400 });

  const { action } = (await req.json().catch(() => ({}))) as { action?: string };

  if (action === "delete") {
    const result = await deleteWebhook();
    return NextResponse.json(result);
  }

  // Register webhook
  const appUrl    = process.env.NEXT_PUBLIC_APP_URL;
  const secret    = process.env.TELEGRAM_WEBHOOK_SECRET;

  if (!appUrl)
    return NextResponse.json({ error: "NEXT_PUBLIC_APP_URL not set" }, { status: 400 });
  if (!secret)
    return NextResponse.json({ error: "TELEGRAM_WEBHOOK_SECRET not set" }, { status: 400 });

  const webhookUrl = `${appUrl}/api/telegram/webhook`;
  const result = await setWebhook(webhookUrl, secret);
  return NextResponse.json({ webhookUrl, result });
}
