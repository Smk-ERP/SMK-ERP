"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/badge";
import { useI18n } from "@/lib/i18n/context";
import { fmtDateTime } from "@/lib/utils";
import { Camera, Play, CheckCircle, X, Trash2, PenLine, AlertCircle, Check } from "lucide-react";

interface Inst {
  id: string; status: string;
  scheduledAt: string | null; completedAt: string | null; note: string | null;
  beforePhotos: string[]; afterPhotos: string[];
  signatureUrl: string | null;
  job: { id: string; code: string; customer: string }; owner: string;
}

const STATUS_BADGE: Record<string, string> = {
  SCHEDULED: "SENT", IN_PROGRESS: "INSTALLING", COMPLETED: "COMPLETED", CANCELLED: "CANCELLED"
};

export function InstallationDetail({ inst }: { inst: Inst }) {
  const { t } = useI18n();
  const router = useRouter();
  const [before, setBefore] = useState<string[]>(inst.beforePhotos);
  const [after, setAfter] = useState<string[]>(inst.afterPhotos);
  const [signature, setSignature] = useState<string | null>(inst.signatureUrl);
  const [note, setNote] = useState(inst.note ?? "");
  const [busy, setBusy] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawing = useRef(false);

  function readFile(file: File): Promise<string> {
    return new Promise((res, rej) => {
      const reader = new FileReader();
      reader.onload = () => res(reader.result as string);
      reader.onerror = rej;
      reader.readAsDataURL(file);
    });
  }

  async function handleFiles(which: "before" | "after", e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files) return;
    const arr: string[] = [];
    for (let i = 0; i < files.length && i < 4; i++) {
      const f = files[i];
      if (f.size > 2 * 1024 * 1024) {
        alert(`${f.name} skipped (max 2 MB inline)`);
        continue;
      }
      arr.push(await readFile(f));
    }
    if (which === "before") setBefore((prev) => [...prev, ...arr]);
    else setAfter((prev) => [...prev, ...arr]);
    e.target.value = "";
  }

  // Signature canvas drawing
  function start(e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) {
    drawing.current = true;
    move(e);
  }
  function end() {
    drawing.current = false;
    const c = canvasRef.current;
    if (c) c.getContext("2d")?.beginPath();
  }
  function move(e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) {
    if (!drawing.current) return;
    const c = canvasRef.current; if (!c) return;
    const ctx = c.getContext("2d"); if (!ctx) return;
    const rect = c.getBoundingClientRect();
    let x: number, y: number;
    if ("touches" in e) {
      const tt = e.touches[0]; x = tt.clientX - rect.left; y = tt.clientY - rect.top;
    } else {
      x = e.clientX - rect.left; y = e.clientY - rect.top;
    }
    ctx.lineWidth = 2; ctx.lineCap = "round"; ctx.strokeStyle = "#0B1F3A";
    ctx.lineTo(x, y); ctx.stroke(); ctx.beginPath(); ctx.moveTo(x, y);
  }
  function clearSig() {
    const c = canvasRef.current; if (!c) return;
    const ctx = c.getContext("2d"); if (ctx) ctx.clearRect(0, 0, c.width, c.height);
    setSignature(null);
  }
  function captureSig() {
    const c = canvasRef.current; if (!c) return;
    setSignature(c.toDataURL("image/png"));
  }

  // Requirements gate for COMPLETE
  const hasBefore = before.length > 0;
  const hasAfter = after.length > 0;
  const hasSignature = !!signature;
  const canComplete = hasBefore && hasAfter && hasSignature;

  async function save(nextStatus?: "IN_PROGRESS" | "COMPLETED" | "CANCELLED") {
    if (nextStatus === "COMPLETED" && !canComplete) {
      const missing = [];
      if (!hasBefore) missing.push(t("installation.before"));
      if (!hasAfter) missing.push(t("installation.after"));
      if (!hasSignature) missing.push(t("installation.signature"));
      alert(`⚠ Cannot complete — missing: ${missing.join(", ")}`);
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`/api/installations/${inst.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: nextStatus,
          beforePhotos: before,
          afterPhotos: after,
          signatureUrl: signature,
          note
        })
      });
      if (!res.ok) { const j = await res.json(); alert(j.error ?? "Failed"); return; }
      router.refresh();
    } finally { setBusy(false); }
  }

  return (
    <div>
      <PageHeader
        title={`${t("installation.title")} — ${inst.job.code}`}
        subtitle={inst.job.customer}
        breadcrumb={[
          { label: t("nav.dashboard"), href: "/dashboard" },
          { label: t("installation.title"), href: "/installation" },
          { label: inst.job.code }
        ]}
        action={
          <div className="flex gap-2 items-center flex-wrap">
            <StatusBadge status={STATUS_BADGE[inst.status]} label={t(`installation.status.${inst.status}`)} className="text-sm py-1 px-3" />
            {inst.status === "SCHEDULED" && <Button size="sm" onClick={() => save("IN_PROGRESS")} disabled={busy}><Play className="h-4 w-4" /> Start</Button>}
            {inst.status === "IN_PROGRESS" && (
              <Button
                size="sm"
                variant="brand"
                onClick={() => save("COMPLETED")}
                disabled={busy || !canComplete}
                title={!canComplete ? "Upload before/after photos and capture signature first" : ""}
              >
                <CheckCircle className="h-4 w-4" /> {t("installation.complete")}
              </Button>
            )}
          </div>
        }
      />

      {/* Completion requirements gate */}
      {inst.status !== "COMPLETED" && inst.status !== "CANCELLED" && (
        <Card className={`mb-4 border-l-4 ${canComplete ? "border-l-emerald-500" : "border-l-amber-500"}`}>
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              {canComplete ? (
                <CheckCircle className="h-6 w-6 text-emerald-600 mt-0.5 shrink-0" />
              ) : (
                <AlertCircle className="h-6 w-6 text-amber-600 mt-0.5 shrink-0" />
              )}
              <div className="flex-1">
                <h3 className="font-bold">
                  {canComplete ? "Ready to complete ✓" : "Required before completing"}
                </h3>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Installer must capture all three items before this job can be marked complete.
                </p>
                <div className="mt-3 grid sm:grid-cols-3 gap-2">
                  <Requirement done={hasBefore} label={`${t("installation.before")} (${before.length})`} />
                  <Requirement done={hasAfter} label={`${t("installation.after")} (${after.length})`} />
                  <Requirement done={hasSignature} label={t("installation.signature")} />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid lg:grid-cols-2 gap-4 mb-4">
        <Card>
          <CardHeader><CardTitle><Camera className="inline h-5 w-5 mr-2" />{t("installation.before")} ({before.length})</CardTitle></CardHeader>
          <CardContent>
            <input type="file" accept="image/*" multiple onChange={(e) => handleFiles("before", e)} className="mb-3" />
            <div className="grid grid-cols-3 gap-2">
              {before.map((src, i) => (
                <div key={i} className="relative group">
                  <img src={src} alt="before" className="w-full h-24 object-cover rounded" />
                  <button onClick={() => setBefore((p) => p.filter((_, idx) => idx !== i))} className="absolute top-1 right-1 bg-rose-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100"><Trash2 className="h-3 w-3" /></button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle><Camera className="inline h-5 w-5 mr-2" />{t("installation.after")} ({after.length})</CardTitle></CardHeader>
          <CardContent>
            <input type="file" accept="image/*" multiple onChange={(e) => handleFiles("after", e)} className="mb-3" />
            <div className="grid grid-cols-3 gap-2">
              {after.map((src, i) => (
                <div key={i} className="relative group">
                  <img src={src} alt="after" className="w-full h-24 object-cover rounded" />
                  <button onClick={() => setAfter((p) => p.filter((_, idx) => idx !== i))} className="absolute top-1 right-1 bg-rose-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100"><Trash2 className="h-3 w-3" /></button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-4">
        <CardHeader><CardTitle><PenLine className="inline h-5 w-5 mr-2" />{t("installation.signature")}</CardTitle></CardHeader>
        <CardContent>
          <canvas
            ref={canvasRef}
            width={600}
            height={200}
            className="border-2 border-dashed rounded bg-white w-full touch-none"
            onMouseDown={start} onMouseMove={move} onMouseUp={end} onMouseLeave={end}
            onTouchStart={start} onTouchMove={move} onTouchEnd={end}
          />
          <div className="flex gap-2 mt-2">
            <Button size="sm" variant="outline" onClick={clearSig}><X className="h-4 w-4" /> Clear</Button>
            <Button size="sm" onClick={captureSig}>Capture signature</Button>
            {signature && <span className="text-emerald-600 text-sm self-center">✓ Captured</span>}
          </div>
          {inst.signatureUrl && (
            <div className="mt-3 pt-3 border-t">
              <p className="text-xs text-muted-foreground mb-1">Previously saved:</p>
              <img src={inst.signatureUrl} alt="signature" className="max-h-32 border" />
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Note</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={4} />
          <div className="flex justify-end gap-2 flex-wrap">
            <Button variant="outline" onClick={() => save()} disabled={busy}>{t("common.save")}</Button>
            {inst.status === "IN_PROGRESS" && (
              <Button
                variant="brand"
                onClick={() => save("COMPLETED")}
                disabled={busy || !canComplete}
              >
                <CheckCircle className="h-4 w-4" /> {t("installation.complete")}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Requirement({ done, label }: { done: boolean; label: string }) {
  return (
    <div className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium ${
      done ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-amber-50 border-amber-200 text-amber-800"
    }`}>
      {done ? <Check className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
      <span className="flex-1">{label}</span>
    </div>
  );
}
