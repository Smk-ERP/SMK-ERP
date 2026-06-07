"use client";

import { useEffect, useRef, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/context";
import { fmtDateTime } from "@/lib/utils";
import { Upload, Download, Trash2, FileText, Image as ImageIcon, File as FileIcon, ZoomIn, X } from "lucide-react";

interface Attachment {
  id: string;
  caption: string | null;
  mimeType: string | null;
  sizeBytes: number | null;
  url: string;
  createdAt: string;
}

function humanBytes(n: number | null): string {
  if (!n) return "—";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

function isImage(mime: string | null): boolean {
  return !!mime && mime.startsWith("image/");
}

export function JobAttachments({ jobId }: { jobId: string }) {
  const { t } = useI18n();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [items, setItems] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [zoom, setZoom] = useState<Attachment | null>(null);

  async function refresh() {
    setLoading(true);
    try {
      const res = await fetch(`/api/jobs/${jobId}/attachments`, { cache: "no-store" });
      const j = await res.json();
      setItems(j.attachments ?? []);
    } finally { setLoading(false); }
  }
  useEffect(() => { refresh(); /* eslint-disable-next-line */ }, [jobId]);

  async function upload(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true); setErr(null);
    try {
      const fd = new FormData();
      for (let i = 0; i < files.length; i++) fd.append("files", files[i]);
      const res = await fetch(`/api/jobs/${jobId}/attachments`, { method: "POST", body: fd });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error ?? "Upload failed");
      await refresh();
    } catch (e: any) { setErr(e.message); }
    finally { setUploading(false); if (inputRef.current) inputRef.current.value = ""; }
  }

  async function remove(attId: string) {
    if (!confirm("Delete this attachment?")) return;
    const res = await fetch(`/api/jobs/${jobId}/attachments/${attId}`, { method: "DELETE" });
    if (res.ok) refresh();
  }

  function download(att: Attachment) {
    // Data URL → trigger download via temporary anchor
    const a = document.createElement("a");
    a.href = att.url;
    a.download = att.caption ?? `attachment-${att.id}`;
    a.click();
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle><FileText className="inline h-5 w-5 mr-2 text-cyan-600" />{t("job.attachments")} {items.length > 0 && <span className="text-sm text-muted-foreground">({items.length})</span>}</CardTitle>
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="file"
            multiple
            accept="image/*,application/pdf,.ai,.psd,.eps,.dwg,.zip"
            className="hidden"
            onChange={(e) => upload(e.target.files)}
          />
          <Button size="sm" onClick={() => inputRef.current?.click()} disabled={uploading}>
            <Upload className="h-4 w-4" /> {uploading ? t("common.loading") : t("job.uploadFiles")}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {err && <p className="text-rose-600 text-sm mb-3">{err}</p>}
        {loading ? (
          <p className="text-sm text-muted-foreground py-4 text-center">{t("common.loading")}</p>
        ) : items.length === 0 ? (
          <div
            className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:bg-muted/40 transition-colors"
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); }}
            onDrop={(e) => { e.preventDefault(); upload(e.dataTransfer.files); }}
          >
            <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm font-medium">Drop files here or click to upload</p>
            <p className="text-xs text-muted-foreground mt-1">JPG / PNG / PDF / AI / PSD up to 8 MB each</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {items.map((att) => (
              <div key={att.id} className="rounded-lg border bg-card overflow-hidden group">
                <div className="relative h-32 bg-slate-100">
                  {isImage(att.mimeType) ? (
                    <>
                      <img src={att.url} alt={att.caption ?? ""} className="w-full h-full object-cover" />
                      <button
                        onClick={() => setZoom(att)}
                        className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity text-white"
                      >
                        <ZoomIn className="h-6 w-6" />
                      </button>
                    </>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground">
                      <FileIcon className="h-10 w-10" />
                      <span className="text-xs uppercase mt-1 font-bold">
                        {(att.mimeType ?? "file").split("/")[1]?.split("+")[0] ?? "file"}
                      </span>
                    </div>
                  )}
                </div>
                <div className="p-2 text-xs">
                  <div className="font-medium truncate" title={att.caption ?? ""}>{att.caption ?? "—"}</div>
                  <div className="text-muted-foreground flex items-center justify-between mt-0.5">
                    <span>{humanBytes(att.sizeBytes)}</span>
                    <span className="text-[10px]">{fmtDateTime(att.createdAt).slice(0, 10)}</span>
                  </div>
                  <div className="flex gap-1 mt-2">
                    <Button size="sm" variant="outline" className="flex-1 h-7 px-2" onClick={() => download(att)}>
                      <Download className="h-3 w-3" />
                    </Button>
                    <Button size="sm" variant="ghost" className="h-7 px-2 text-rose-600" onClick={() => remove(att.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* Zoom modal */}
      {zoom && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-6"
          onClick={() => setZoom(null)}
        >
          <button className="absolute top-4 right-4 text-white p-2" onClick={() => setZoom(null)}>
            <X className="h-6 w-6" />
          </button>
          <img src={zoom.url} alt={zoom.caption ?? ""} className="max-w-full max-h-full object-contain rounded" onClick={(e) => e.stopPropagation()} />
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white text-sm bg-black/50 px-3 py-1 rounded">
            {zoom.caption}
          </div>
        </div>
      )}
    </Card>
  );
}
