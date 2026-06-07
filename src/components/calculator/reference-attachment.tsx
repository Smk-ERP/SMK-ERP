"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Paperclip, Link2, FileText, X } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";

export interface ReferenceData {
  url?: string;
  filename?: string;
  fileDataUrl?: string; // base64 data URL for preview / inline storage
  note?: string;
}

export function ReferenceAttachment({
  value,
  onChange
}: {
  value: ReferenceData;
  onChange: (next: ReferenceData) => void;
}) {
  const { t } = useI18n();
  const [busy, setBusy] = useState(false);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) {
      alert("File too large (max 5 MB for inline storage). Upload to Drive/Dropbox and paste link instead.");
      e.target.value = "";
      return;
    }
    setBusy(true);
    const reader = new FileReader();
    reader.onload = () => {
      onChange({ ...value, filename: f.name, fileDataUrl: reader.result as string });
      setBusy(false);
    };
    reader.onerror = () => { setBusy(false); alert("Failed to read file"); };
    reader.readAsDataURL(f);
  }

  function clearFile() {
    onChange({ ...value, filename: undefined, fileDataUrl: undefined });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Paperclip className="h-5 w-5 text-cyan-600" />
          {t("calculator.reference")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1.5">
          <Label className="flex items-center gap-1.5">
            <Link2 className="h-4 w-4" />
            {t("calculator.referenceUrl")}
          </Label>
          <Input
            type="url"
            placeholder="https://drive.google.com/... or any link"
            value={value.url ?? ""}
            onChange={(e) => onChange({ ...value, url: e.target.value })}
          />
        </div>

        <div className="space-y-1.5">
          <Label className="flex items-center gap-1.5">
            <FileText className="h-4 w-4" />
            {t("calculator.referenceFile")}
          </Label>
          {value.filename ? (
            <div className="flex items-center justify-between rounded-lg border bg-cyan-50 px-3 py-2">
              <div className="flex items-center gap-2 text-sm">
                <FileText className="h-4 w-4 text-cyan-700" />
                <span className="font-medium">{value.filename}</span>
                <span className="text-xs text-cyan-700">✓ {t("calculator.attached")}</span>
              </div>
              <Button size="icon" variant="ghost" onClick={clearFile}><X className="h-4 w-4" /></Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Input
                type="file"
                accept="image/*,application/pdf,.ai,.psd,.eps"
                onChange={handleFile}
                disabled={busy}
                className="cursor-pointer file:mr-3 file:rounded file:border-0 file:bg-primary file:text-primary-foreground file:px-3 file:py-1.5 file:text-sm file:font-medium hover:file:bg-primary/90"
              />
            </div>
          )}
          <p className="text-xs text-muted-foreground">
            Max 5 MB. For larger files, upload to Drive/Dropbox and paste the link above.
          </p>
        </div>

        <div className="space-y-1.5">
          <Label>{t("calculator.referenceNote")}</Label>
          <Textarea
            placeholder="Customer brief, reference photo, special instructions..."
            value={value.note ?? ""}
            onChange={(e) => onChange({ ...value, note: e.target.value })}
            rows={3}
          />
        </div>
      </CardContent>
    </Card>
  );
}
