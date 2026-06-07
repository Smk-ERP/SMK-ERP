"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/ui/page-header";
import { useI18n } from "@/lib/i18n/context";

const TYPES = ["WALK_IN", "RETURNING", "FACEBOOK", "WHATSAPP", "TIKTOK", "REFERRAL", "CORPORATE", "OTHER"];

export default function NewCustomerPage() {
  const { t } = useI18n();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "", type: "WALK_IN", companyName: "", phone: "",
    email: "", whatsapp: "", facebook: "", tiktok: "",
    address: "", city: "", province: "", taxId: "", note: ""
  });

  const set = (k: string) => (e: any) => setForm({ ...form, [k]: e.target.value });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch("/api/customers", { method: "POST", body: JSON.stringify(form), headers: { "Content-Type": "application/json" } });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Save failed");
      router.push(`/customers/${json.customer.id}`);
    } catch (e: any) {
      setErr(e.message);
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit}>
      <PageHeader
        title={t("customer.newCustomer")}
        breadcrumb={[
          { label: t("nav.dashboard"), href: "/dashboard" },
          { label: t("customer.title"), href: "/customers" },
          { label: t("customer.newCustomer") }
        ]}
      />

      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle>{t("customer.name")}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5">
              <Label>{t("customer.name")} *</Label>
              <Input value={form.name} onChange={set("name")} required />
            </div>
            <div className="space-y-1.5">
              <Label>{t("customer.company")}</Label>
              <Input value={form.companyName} onChange={set("companyName")} />
            </div>
            <div className="space-y-1.5">
              <Label>{t("customer.type")}</Label>
              <Select value={form.type} onChange={set("type")}>
                {TYPES.map((tt) => <option key={tt} value={tt}>{t(`customer.types.${tt}`)}</option>)}
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Contact</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5">
              <Label>{t("customer.phone")}</Label>
              <Input value={form.phone} onChange={set("phone")} />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input type="email" value={form.email} onChange={set("email")} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>{t("customer.whatsapp")}</Label><Input value={form.whatsapp} onChange={set("whatsapp")} /></div>
              <div className="space-y-1.5"><Label>{t("customer.facebook")}</Label><Input value={form.facebook} onChange={set("facebook")} /></div>
              <div className="space-y-1.5"><Label>{t("customer.tiktok")}</Label><Input value={form.tiktok} onChange={set("tiktok")} /></div>
              <div className="space-y-1.5"><Label>Tax ID</Label><Input value={form.taxId} onChange={set("taxId")} /></div>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Address & note</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5"><Label>Address</Label><Input value={form.address} onChange={set("address")} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>City</Label><Input value={form.city} onChange={set("city")} /></div>
              <div className="space-y-1.5"><Label>Province</Label><Input value={form.province} onChange={set("province")} /></div>
            </div>
            <div className="space-y-1.5"><Label>Note</Label><Textarea value={form.note} onChange={set("note")} /></div>
          </CardContent>
          <CardFooter className="justify-end gap-2">
            {err && <p className="text-rose-600 text-sm mr-auto">{err}</p>}
            <Button type="button" variant="outline" onClick={() => router.back()}>{t("common.cancel")}</Button>
            <Button type="submit" disabled={loading} size="lg">{loading ? t("common.loading") : t("common.save")}</Button>
          </CardFooter>
        </Card>
      </div>
    </form>
  );
}
