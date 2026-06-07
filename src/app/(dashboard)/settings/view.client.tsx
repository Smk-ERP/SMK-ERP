"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { useI18n } from "@/lib/i18n/context";
import { type SignatureConfig } from "@/lib/brand";
import { USER_ROLES } from "@/lib/enums";
import { Building2, Image as ImageIcon, PenLine, Languages, Upload, Trash2, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface BrandFormData {
  companyName: string;
  tagline: string;
  address: string;
  city: string;
  province: string;
  country: string;
  phone: string;
  email: string;
  website: string;
  taxId: string;
  bankInfo: string;
  logoUrl: string | null;
  primaryColor: string;
  signatureConfig: SignatureConfig;
}

const DOC_TYPES = [
  "QUOTATION", "BILLING_NOTE", "INVOICE", "RECEIPT", "PAYMENT_SLIP",
  "MATERIAL_REQUEST", "DELIVERY_NOTE", "INSTALLATION_REPORT"
];

export function SettingsView({ initial }: { initial: BrandFormData }) {
  const { t } = useI18n();
  const router = useRouter();
  const [tab, setTab] = useState<"brand" | "logo" | "sig" | "lang">("brand");
  const [form, setForm] = useState<BrandFormData>(initial);
  const [busy, setBusy] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  function set<K extends keyof BrandFormData>(k: K) {
    return (e: any) => setForm({ ...form, [k]: e.target?.value ?? e });
  }

  function uploadLogo(file: File) {
    if (file.size > 1 * 1024 * 1024) { alert("Logo too large (max 1 MB)"); return; }
    const reader = new FileReader();
    reader.onload = () => setForm({ ...form, logoUrl: reader.result as string });
    reader.readAsDataURL(file);
  }

  function addSlot(doc: string) {
    const cfg = { ...form.signatureConfig };
    cfg[doc] = [...(cfg[doc] ?? []), { label: "Signature", role: undefined }];
    setForm({ ...form, signatureConfig: cfg });
  }
  function removeSlot(doc: string, idx: number) {
    const cfg = { ...form.signatureConfig };
    cfg[doc] = (cfg[doc] ?? []).filter((_, i) => i !== idx);
    setForm({ ...form, signatureConfig: cfg });
  }
  function updateSlot(doc: string, idx: number, patch: Partial<{ label: string; role?: string }>) {
    const cfg = { ...form.signatureConfig };
    cfg[doc] = (cfg[doc] ?? []).map((s, i) => i === idx ? { ...s, ...patch } : s);
    setForm({ ...form, signatureConfig: cfg });
  }

  async function save() {
    setBusy(true); setErr(null);
    try {
      const res = await fetch("/api/settings/brand", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      if (!res.ok) { const j = await res.json(); throw new Error(j.error ?? "Save failed"); }
      setSavedAt(new Date());
      router.refresh();
    } catch (e: any) { setErr(e.message); }
    finally { setBusy(false); }
  }

  return (
    <div>
      <PageHeader
        title={t("nav.settings")}
        subtitle="Company branding & document settings"
        breadcrumb={[{ label: t("nav.dashboard"), href: "/dashboard" }, { label: t("nav.settings") }]}
        action={
          <div className="flex items-center gap-2">
            {savedAt && <span className="text-xs text-emerald-600">✓ Saved</span>}
            <Button onClick={save} disabled={busy} size="lg">{busy ? t("common.loading") : t("common.save")}</Button>
          </div>
        }
      />

      {/* Tabs */}
      <div className="flex gap-1 border-b mb-4 -mt-2 overflow-x-auto">
        <TabBtn icon={<Building2 className="h-4 w-4" />} label="Company info" active={tab === "brand"} onClick={() => setTab("brand")} />
        <TabBtn icon={<ImageIcon className="h-4 w-4" />} label="Logo & branding" active={tab === "logo"} onClick={() => setTab("logo")} />
        <TabBtn icon={<PenLine className="h-4 w-4" />} label="Signature slots" active={tab === "sig"} onClick={() => setTab("sig")} />
        <TabBtn icon={<Languages className="h-4 w-4" />} label="Language" active={tab === "lang"} onClick={() => setTab("lang")} />
      </div>

      {err && <p className="text-rose-600 text-sm mb-3">{err}</p>}

      {/* COMPANY INFO TAB */}
      {tab === "brand" && (
        <Card>
          <CardHeader><CardTitle>Company information</CardTitle></CardHeader>
          <CardContent className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-1.5 sm:col-span-2"><Label>Company name *</Label><Input value={form.companyName} onChange={set("companyName")} /></div>
            <div className="space-y-1.5 sm:col-span-2"><Label>Tagline</Label><Input value={form.tagline} onChange={set("tagline")} placeholder="Signage & Print Production" /></div>
            <div className="space-y-1.5 sm:col-span-2"><Label>Address</Label><Input value={form.address} onChange={set("address")} /></div>
            <div className="space-y-1.5"><Label>City</Label><Input value={form.city} onChange={set("city")} /></div>
            <div className="space-y-1.5"><Label>Province</Label><Input value={form.province} onChange={set("province")} /></div>
            <div className="space-y-1.5"><Label>Country</Label><Input value={form.country} onChange={set("country")} /></div>
            <div className="space-y-1.5"><Label>Tax ID</Label><Input value={form.taxId} onChange={set("taxId")} /></div>
            <div className="space-y-1.5"><Label>Phone</Label><Input value={form.phone} onChange={set("phone")} /></div>
            <div className="space-y-1.5"><Label>Email</Label><Input type="email" value={form.email} onChange={set("email")} /></div>
            <div className="space-y-1.5 sm:col-span-2"><Label>Website</Label><Input value={form.website} onChange={set("website")} placeholder="https://signmaker.la" /></div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Bank info <span className="text-xs text-muted-foreground">(printed on Invoice / Billing Note)</span></Label>
              <Textarea rows={3} value={form.bankInfo} onChange={set("bankInfo")} placeholder="BCEL  •  Acct 010-1234567-8901  •  The Signmaker Co., Ltd." />
            </div>
          </CardContent>
        </Card>
      )}

      {/* LOGO TAB */}
      {tab === "logo" && (
        <div className="grid lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader><CardTitle>Logo</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {form.logoUrl ? (
                <div className="relative inline-block">
                  <img src={form.logoUrl} alt="Logo" className="max-h-48 max-w-full rounded border bg-white p-2" />
                  <Button size="sm" variant="destructive" className="absolute top-2 right-2" onClick={() => setForm({ ...form, logoUrl: null })}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <div
                  className="border-2 border-dashed rounded-lg p-12 text-center cursor-pointer hover:bg-muted/30 transition-colors"
                  onClick={() => fileRef.current?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f) uploadLogo(f); }}
                >
                  <Upload className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm font-medium">Drop a PNG/JPG/SVG or click to upload</p>
                  <p className="text-xs text-muted-foreground mt-1">Max 1 MB • Transparent PNG recommended</p>
                </div>
              )}
              <input
                ref={fileRef} type="file" className="hidden"
                accept="image/png,image/jpeg,image/svg+xml"
                onChange={(e) => e.target.files?.[0] && uploadLogo(e.target.files[0])}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Brand color</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1.5">
                <Label>Primary color (PDF accents, page header)</Label>
                <div className="flex gap-2 items-center">
                  <input type="color" value={form.primaryColor} onChange={set("primaryColor")} className="h-12 w-20 rounded border cursor-pointer" />
                  <Input value={form.primaryColor} onChange={set("primaryColor")} className="font-mono" />
                </div>
              </div>
              <div className="rounded-lg p-4" style={{ backgroundColor: form.primaryColor }}>
                <p className="text-white font-bold">Preview</p>
                <p className="text-white/80 text-xs">This color appears on PDF headers and key UI accents.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* SIGNATURE TAB */}
      {tab === "sig" && (
        <Card>
          <CardHeader>
            <CardTitle>Signature slots per document type</CardTitle>
            <p className="text-xs text-muted-foreground">Define who signs each document. Slots appear in order on the PDF footer.</p>
          </CardHeader>
          <CardContent className="space-y-4">
            {DOC_TYPES.map((doc) => {
              const slots = form.signatureConfig[doc] ?? [];
              return (
                <div key={doc} className="rounded-lg border bg-card p-3">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-sm">
                      {t(`finance.docTypes.${doc}`) !== `finance.docTypes.${doc}` ? t(`finance.docTypes.${doc}`) : doc}
                      <Badge variant="muted" className="ml-2 text-[10px]">{slots.length} slots</Badge>
                    </h4>
                    <Button size="sm" variant="outline" onClick={() => addSlot(doc)}>
                      <Plus className="h-3 w-3" /> Add slot
                    </Button>
                  </div>
                  {slots.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic">No signature blocks for this document</p>
                  ) : (
                    <div className="space-y-2">
                      {slots.map((s, i) => (
                        <div key={i} className="grid grid-cols-12 gap-2 items-end">
                          <div className="col-span-5 space-y-1">
                            <Label className="text-xs">Label</Label>
                            <Input value={s.label} onChange={(e) => updateSlot(doc, i, { label: e.target.value })} placeholder="Customer / Approved by" className="h-9" />
                          </div>
                          <div className="col-span-6 space-y-1">
                            <Label className="text-xs">Suggested role <span className="text-muted-foreground">(optional)</span></Label>
                            <Select value={s.role ?? ""} onChange={(e) => updateSlot(doc, i, { role: e.target.value || undefined })} className="h-9">
                              <option value="">— customer / external —</option>
                              {USER_ROLES.map((r) => <option key={r} value={r}>{r.replace(/_/g, " ")}</option>)}
                            </Select>
                          </div>
                          <div className="col-span-1 flex justify-end">
                            <Button size="icon" variant="ghost" className="h-9 w-9" onClick={() => removeSlot(doc, i)}>
                              <X className="h-4 w-4 text-rose-600" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* LANGUAGE TAB */}
      {tab === "lang" && (
        <Card>
          <CardHeader><CardTitle>{t("common.language")}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <LanguageSwitcher />
            <p className="text-sm text-muted-foreground">
              Your UI language is stored in the browser. PDF language can be overridden per document.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function TabBtn({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-all whitespace-nowrap",
        active
          ? "text-foreground"
          : "text-muted-foreground hover:text-foreground"
      )}
    >
      {icon}
      <span className={active ? "brand-gradient-text font-semibold" : ""}>{label}</span>
      {active && (
        <span
          className="absolute inset-x-2 bottom-0 h-[3px] rounded-full"
          style={{ backgroundImage: "linear-gradient(90deg, #06B6D4 0%, #14B8A6 50%, #0B1F3A 100%)" }}
        />
      )}
    </button>
  );
}
