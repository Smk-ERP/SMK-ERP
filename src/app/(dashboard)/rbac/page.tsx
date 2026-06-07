import { getCurrentUser } from "@/lib/auth";
import { RbacClient } from "./rbac.client";

export const dynamic = "force-dynamic";

export default async function RbacPage() {
  const user = await getCurrentUser();
  return <RbacClient currentUserRole={user?.role ?? "SALES_STAFF"} />;
}
