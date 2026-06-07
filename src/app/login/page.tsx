"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { useI18n } from "@/lib/i18n/context";
import { createSupabaseBrowser } from "@/lib/supabase/client";

function LoginForm() {
  const { t } = useI18n();
  const router = useRouter();
  const search = useSearchParams();
  const [email, setEmail] = useState("owner@signmaker.la");
  const [password, setPassword] = useState("demo1234");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const hasSupabase = !!process.env.NEXT_PUBLIC_SUPABASE_URL;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErr(null);

    if (!hasSupabase) {
      router.push(search.get("redirect") || "/dashboard");
      return;
    }
    try {
      const supabase = createSupabaseBrowser();
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      router.push(search.get("redirect") || "/dashboard");
    } catch (e: any) {
      setErr(e.message ?? "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="email">{t("auth.email")}</Label>
        <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="password">{t("auth.password")}</Label>
        <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
      </div>
      {err && <p className="text-sm text-rose-600">{err}</p>}
      <Button type="submit" size="lg" className="w-full" disabled={loading}>
        {loading ? t("common.loading") : t("auth.loginButton")}
      </Button>
      {!hasSupabase && (
        <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs text-amber-900">
          <strong>Demo mode</strong> — Supabase env not configured. Click sign-in to enter as the seeded Owner user. See DEPLOYMENT.md to wire up real auth.
        </div>
      )}
    </form>
  );
}

function LoginShell({ children }: { children: React.ReactNode }) {
  const { t } = useI18n();
  return (
    <div className="min-h-screen brand-gradient flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="flex justify-end pb-3">
          <LanguageSwitcher />
        </div>
        <Card className="p-8 shadow-xl">
          <div className="flex flex-col items-center pb-6">
            <div className="h-14 w-14 rounded-xl brand-gradient text-white text-2xl font-black flex items-center justify-center mb-3">S</div>
            <h1 className="text-2xl font-bold">{t("brand.name")}</h1>
            <p className="text-sm text-muted-foreground mt-1">{t("auth.loginToContinue")}</p>
          </div>
          {children}
        </Card>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <LoginShell>
      <Suspense fallback={<div className="text-center text-sm text-muted-foreground">…</div>}>
        <LoginForm />
      </Suspense>
    </LoginShell>
  );
}
