"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { MessageCircle, X, Send, Bot, User, Loader2, Trash2 } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  streaming?: boolean;
}

const SUGGESTIONS: Record<string, string[]> = {
  lo: [
    "ສະຖານະວຽກມີຫຍັງແດ່?",
    "ປ້າຍປະເພດໃດແພງທີ່ສຸດ?",
    "ວິທີສ້າງໃບສະເໜີລາຄາ?",
    "ສິດທິ OWNER ທຳຫຍັງໄດ້ແດ່?"
  ],
  th: [
    "สถานะงานมีอะไรบ้าง?",
    "ป้ายแบบไหนราคาแพงสุด?",
    "วิธีสร้างใบเสนอราคา?",
    "สิทธิ์ OWNER ทำอะไรได้บ้าง?"
  ],
  en: [
    "What job statuses are there?",
    "Which sign type is most expensive?",
    "How to create a quotation?",
    "What can OWNER role do?"
  ]
};

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

export function ChatWidget({
  userName,
  userRole
}: {
  userName?: string;
  userRole?: string;
}) {
  const { locale } = useI18n();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const suggestions = SUGGESTIONS[locale] ?? SUGGESTIONS.lo;

  // Auto-scroll on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input when panel opens
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || loading) return;

      const userMsg: Message = { id: uid(), role: "user", content: trimmed };
      const assistantId = uid();
      const assistantMsg: Message = {
        id: assistantId,
        role: "assistant",
        content: "",
        streaming: true
      };

      setMessages((prev) => [...prev, userMsg, assistantMsg]);
      setInput("");
      setLoading(true);

      // Build history for API (exclude the blank assistant placeholder)
      const history = [
        ...messages.map((m) => ({ role: m.role, content: m.content })),
        { role: "user" as const, content: trimmed }
      ];

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: history }),
          signal: controller.signal
        });

        if (!res.ok || !res.body) {
          const err = await res.text().catch(() => "Server error");
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId
                ? { ...m, content: `❌ ${err}`, streaming: false }
                : m
            )
          );
          return;
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let accumulated = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          accumulated += decoder.decode(value, { stream: true });
          const snap = accumulated;
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId ? { ...m, content: snap, streaming: true } : m
            )
          );
        }

        // Mark streaming done
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? { ...m, content: accumulated, streaming: false }
              : m
          )
        );
      } catch (err: any) {
        if (err?.name === "AbortError") return;
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? { ...m, content: "❌ ການເຊື່ອມຕໍ່ຜິດພາດ", streaming: false }
              : m
          )
        );
      } finally {
        setLoading(false);
        abortRef.current = null;
      }
    },
    [messages, loading]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const clearChat = () => {
    abortRef.current?.abort();
    setMessages([]);
    setLoading(false);
  };

  const greetLabel =
    locale === "lo"
      ? "ສະບາຍດີ! ຂ້ອຍເປັນຜູ້ຊ່ວຍ AI ສຳລັບ The Signmaker ERP ✨"
      : locale === "th"
      ? "สวัสดีครับ! ฉันเป็น AI ผู้ช่วยสำหรับ The Signmaker ERP ✨"
      : "Hello! I'm the AI assistant for The Signmaker ERP ✨";

  const placeholderLabel =
    locale === "lo"
      ? "ພິມຄຳຖາມ... (Enter ສົ່ງ)"
      : locale === "th"
      ? "พิมพ์คำถาม... (Enter ส่ง)"
      : "Type a question... (Enter to send)";

  const clearLabel =
    locale === "lo" ? "ລ້າງການສົນທະນາ" : locale === "th" ? "ล้างการสนทนา" : "Clear chat";

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full brand-gradient shadow-lg flex items-center justify-center text-white hover:scale-105 active:scale-95 transition-transform"
        aria-label="Chat assistant"
      >
        {open ? (
          <X className="h-6 w-6" />
        ) : (
          <MessageCircle className="h-6 w-6" />
        )}
      </button>

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-[360px] max-w-[calc(100vw-1.5rem)] h-[520px] max-h-[calc(100vh-8rem)] flex flex-col rounded-2xl border border-border bg-background shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="brand-gradient px-4 py-3 flex items-center gap-3 shrink-0">
            <div className="h-9 w-9 rounded-full bg-white/20 flex items-center justify-center shrink-0">
              <Bot className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-white leading-tight">
                {locale === "lo"
                  ? "ຜູ້ຊ່ວຍ AI"
                  : locale === "th"
                  ? "AI ผู้ช่วย"
                  : "AI Assistant"}
              </div>
              <div className="text-[11px] text-white/70 truncate">The Signmaker ERP</div>
            </div>
            {messages.length > 0 && (
              <button
                onClick={clearChat}
                className="p-1.5 rounded-lg hover:bg-white/20 text-white/80 hover:text-white transition-colors"
                title={clearLabel}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 scroll-smooth">
            {/* Greeting */}
            <div className="flex gap-2.5 items-start">
              <div className="h-7 w-7 rounded-full brand-gradient flex items-center justify-center shrink-0 mt-0.5">
                <Bot className="h-4 w-4 text-white" />
              </div>
              <div className="bg-muted rounded-2xl rounded-tl-sm px-3 py-2 text-sm max-w-[85%] leading-relaxed">
                {greetLabel}
              </div>
            </div>

            {/* Suggestion chips — shown when no messages */}
            {messages.length === 0 && (
              <div className="flex flex-wrap gap-2 pl-9">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    onClick={() => sendMessage(s)}
                    className="text-xs px-3 py-1.5 rounded-full border border-border hover:border-primary hover:text-primary hover:bg-primary/5 transition-colors text-left"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            {/* Conversation */}
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2.5 items-start ${
                  msg.role === "user" ? "flex-row-reverse" : ""
                }`}
              >
                {/* Avatar */}
                <div
                  className={`h-7 w-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "brand-gradient text-white"
                  }`}
                >
                  {msg.role === "user" ? (
                    userName ? (
                      userName.slice(0, 2).toUpperCase()
                    ) : (
                      <User className="h-3.5 w-3.5" />
                    )
                  ) : (
                    <Bot className="h-3.5 w-3.5" />
                  )}
                </div>

                {/* Bubble */}
                <div
                  className={`rounded-2xl px-3 py-2 text-sm max-w-[85%] leading-relaxed whitespace-pre-wrap break-words ${
                    msg.role === "user"
                      ? "brand-gradient text-white rounded-tr-sm"
                      : "bg-muted rounded-tl-sm"
                  }`}
                >
                  {msg.content}
                  {msg.streaming && msg.content === "" && (
                    <span className="inline-flex gap-1 items-center">
                      <span className="animate-bounce delay-0 h-1.5 w-1.5 rounded-full bg-current opacity-60" />
                      <span className="animate-bounce delay-150 h-1.5 w-1.5 rounded-full bg-current opacity-60" />
                      <span className="animate-bounce delay-300 h-1.5 w-1.5 rounded-full bg-current opacity-60" />
                    </span>
                  )}
                  {msg.streaming && msg.content !== "" && (
                    <span className="inline-block ml-0.5 w-0.5 h-3.5 bg-current opacity-70 animate-pulse align-middle" />
                  )}
                </div>
              </div>
            ))}

            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="shrink-0 border-t border-border px-3 py-3 flex gap-2 items-end bg-background">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholderLabel}
              rows={1}
              disabled={loading}
              className="flex-1 resize-none rounded-xl border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 max-h-24 overflow-y-auto leading-relaxed"
              style={{ fieldSizing: "content" } as React.CSSProperties}
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || loading}
              className="h-9 w-9 rounded-xl brand-gradient flex items-center justify-center text-white disabled:opacity-40 hover:scale-105 active:scale-95 transition-transform shrink-0"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
