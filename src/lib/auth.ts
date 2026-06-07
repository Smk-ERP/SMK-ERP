import { createSupabaseServer } from "./supabase/server";
import { prisma } from "./prisma";
import type { UserRole } from "./enums";

export interface CurrentUser {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  language: string;
}

// In dev/demo mode (Supabase env not set), fall back to the seeded Owner
// so all the Phase 1 flows are clickable without configuring Supabase first.
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const hasSupabase =
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (hasSupabase) {
    try {
      const supabase = createSupabaseServer();
      const {
        data: { user }
      } = await supabase.auth.getUser();
      if (user) {
        const u = await prisma.user.findFirst({
          where: { OR: [{ supabaseId: user.id }, { email: user.email ?? "" }] }
        });
        if (u) {
          return {
            id: u.id,
            email: u.email,
            fullName: u.fullName,
            role: u.role as UserRole,
            language: u.language
          };
        }
      }
    } catch (err) {
      console.warn("[auth] supabase getUser failed, falling back to demo user", err);
    }
  }

  // Demo fallback
  const demo = await prisma.user
    .findFirst({ where: { role: "OWNER" } })
    .catch(() => null);
  if (!demo) return null;
  return {
    id: demo.id,
    email: demo.email,
    fullName: demo.fullName,
    role: demo.role as UserRole,
    language: demo.language
  };
}

export function isDemoMode(): boolean {
  return !(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}
