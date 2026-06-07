import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getCurrentUser } from "@/lib/auth";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `ທ່ານເປັນຜູ້ຊ່ວຍ AI ສຳລັບລະບົບ ERP ຂອງ The Signmaker — ທຸລະກິດຜະລິດປ້າຍ ແລະ ສື່ສິ່ງພິມໃນລາວ.

ທ່ານຊ່ວຍພະນັກງານໃນ:
- ການຂາຍ: ລູກຄ້າ, ໃບສະເໜີລາຄາ, ປ້ອງໂຄງການ
- ການຜະລິດ: ຂັ້ນຕອນວຽກ, QC, ການຕິດຕັ້ງ
- ການເງິນ: ໃບແຈ້ງໜີ້, ການຊຳລະເງິນ
- ສາງ: ວັດຖຸດິບ, ໃບເບີກ, ໃບສັ່ງຊື້
- ຊັບພະຍາກອນມະນຸດ: ຂໍ້ມູນພະນັກງານ, ສິດທິ

ສະຖານະໄດ້ (Job Statuses): NEW, CONFIRMED, DESIGN, WAITING_MATERIAL, PRODUCTION, QC, REWORK, READY_TO_INSTALL, INSTALLING, DELIVERED, COMPLETED, CANCELLED

ສິດທິຂອງບົດບາດ (Roles): OWNER > ADMIN_MANAGER > SALES_MANAGER > SALES_STAFF, PRODUCTION_MANAGER > DESIGNER > PRODUCTION_STAFF > QC_STAFF > INSTALLER, FINANCE, STOCK, HR

ປະເພດປ້າຍ: ອັກສອນໄຟ (ຫຼາຍປະເພດ), ກ່ອງໄຟ, ຕູ້ໄຟ, ໄວນິລ, ສະແຕນເລດ, ຊິງ, ພລາສວູດ, ອະຄຣິລິກ, ນີອອນ, 3D Printing, ງານ Event, ໂຄງໄມ້/ເຫຼັກ

ກົດລະບຽບ:
- ຕອບເປັນພາສາດຽວກັນກັບທີ່ຖາມ (ລາວ/ໄທ/ອັງກິດ)
- ຕອບສັ້ນ ກະທັດຮັດ ຊັດເຈນ
- ຖ້າບໍ່ຮູ້ ໃຫ້ບອກຕາມຄວາມເປັນຈິງ
- ບໍ່ໃຫ້ຂໍ້ມູນທີ່ຜິດ
- ສຸພາບ ເປັນມິດ ພ້ອມຊ່ວຍເຫຼືອ`;

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { messages: { role: "user" | "assistant"; content: string }[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { messages } = body;
  if (!Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: "messages required" }, { status: 400 });
  }

  // Build stream
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const anthropicStream = await client.messages.stream({
          model: "claude-opus-4-7",
          max_tokens: 1024,
          system: [
            {
              type: "text",
              text: SYSTEM_PROMPT,
              cache_control: { type: "ephemeral" }
            }
          ],
          messages: messages.map((m) => ({
            role: m.role,
            content: m.content
          }))
        });

        for await (const event of anthropicStream) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }
      } catch (err: any) {
        const msg = err?.message ?? "AI error";
        controller.enqueue(encoder.encode(`\n\n[ຜິດພາດ: ${msg}]`));
      } finally {
        controller.close();
      }
    }
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Transfer-Encoding": "chunked",
      "X-Content-Type-Options": "nosniff"
    }
  });
}
