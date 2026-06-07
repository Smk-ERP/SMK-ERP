import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";

export async function POST() {
  try {
    if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
      const sb = createSupabaseServer();
      await sb.auth.signOut();
    }
  } catch {}
  return NextResponse.redirect(new URL("/login", process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"));
}
