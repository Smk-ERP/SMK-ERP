"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { Select } from "@/components/ui/select";
import { PageHeader } from "@/components/ui/page-header";
import { useI18n } from "@/lib/i18n/context";
import { MENU_PERMISSIONS } from "@/lib/rbac";
import { USER_ROLES, type UserRole } from "@/lib/enums";
import {
  Check, X, ShieldCheck, Users, Plus, Search,
  Eye, Pencil, Trash2, UserCheck, UserX, Loader2, Send
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface UserRow {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  role: string;
  active: boolean;
  language: string;
  createdAt: string;
  telegramChatId: string | null;
}

type ModalMode = "add" | "edit" | "view";

interface ModalState {
  mode: ModalMode;
  user: UserRow | null;
}

// ─── Role colours ─────────────────────────────────────────────────────────────

const ROLE_CLS: Record<string, string> = {
  OWNER:              "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
  ADMIN_MANAGER:      "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300",
  SALES_MANAGER:      "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  SALES_STAFF:        "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300",
  PRODUCTION_MANAGER: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  DESIGNER:           "bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300",
  PRODUCTION_STAFF:   "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
  QC_STAFF:           "bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300",
  INSTALLER:          "bg-lime-100 text-lime-700 dark:bg-lime-900/40 dark:text-lime-300",
  FINANCE:            "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  STOCK:              "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300",
  HR:                 "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300"
};

const LANG_LABEL: Record<string, string> = { lo: "ລາວ", th: "ไทย", en: "EN" };

const MENUS = [
  "dashboard","customers","quotations","calculator","jobs",
  "production","inventory","qc","installation","finance","kpi","settings"
];

// ─── Main component ───────────────────────────────────────────────────────────

export function RbacClient({ currentUserRole }: { currentUserRole: string }) {
  const { t } = useI18n();
  const [tab, setTab] = useState<"users" | "matrix">("users");

  // Users state
  const [users, setUsers]     = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery]     = useState("");

  // Modal state
  const [modal, setModal] = useState<ModalState | null>(null);

  const canManage = ["OWNER", "ADMIN_MANAGER"].includes(currentUserRole);

  // ── Fetch users ──
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/users");
      const j   = await res.json();
      setUsers(j.users ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  // ── Filter ──
  const filtered = users.filter((u) => {
    const q = query.toLowerCase();
    return (
      u.fullName.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.role.toLowerCase().includes(q)
    );
  });

  // ── Delete ──
  async function handleDelete(u: UserRow) {
    if (!confirm(`ລຶບ ${u.fullName}? ການກະທຳນີ້ບໍ່ສາມາດຍ້ອນກັບໄດ້.`)) return;
    const res = await fetch(`/api/users/${u.id}`, { method: "DELETE" });
    const j   = await res.json();
    if (res.ok) {
      await fetchUsers();
    } else {
      alert(j.error ?? "Error");
    }
  }

  return (
    <div>
      <PageHeader
        title="ຈັດການ Users & ສິດ"
        subtitle="ເພີ່ມ, ແກ້ໄຂ, ລຶບ ຜູ້ໃຊ້ ແລະ ກຳນົດ Role"
        breadcrumb={[
          { label: t("nav.dashboard"), href: "/dashboard" },
          { label: "RBAC & Users" }
        ]}
        action={
          canManage && tab === "users" ? (
            <Button onClick={() => setModal({ mode: "add", user: null })}>
              <Plus className="h-4 w-4" /> ເພີ່ມ User
            </Button>
          ) : undefined
        }
      />

      {/* ── Tabs ── */}
      <div className="flex gap-1 mb-4 border-b">
        <TabBtn active={tab === "users"}  onClick={() => setTab("users")}>
          <Users className="h-4 w-4" /> ຜູ້ໃຊ້ທັງໝົດ
          <Badge className="ml-1 text-[10px] px-1.5 py-0 bg-primary/10 text-primary">
            {users.length}
          </Badge>
        </TabBtn>
        <TabBtn active={tab === "matrix"} onClick={() => setTab("matrix")}>
          <ShieldCheck className="h-4 w-4" /> Permission Matrix
        </TabBtn>
      </div>

      {/* ── Users Tab ── */}
      {tab === "users" && (
        <Card>
          <CardHeader className="flex-row items-center justify-between gap-3 flex-wrap">
            <CardTitle>ລາຍຊື່ຜູ້ໃຊ້</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="ຄົ້ນຫາ ຊື່, email, role..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-9 h-9"
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex justify-center py-12 text-muted-foreground">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <THead>
                    <TR>
                      <TH>#</TH>
                      <TH>ຊື່ – ນາມສະກຸນ</TH>
                      <TH>Email</TH>
                      <TH>ເບີໂທ</TH>
                      <TH>Role</TH>
                      <TH className="text-center">ພາສາ</TH>
                      <TH className="text-center">ສະຖານະ</TH>
                      <TH className="text-center">ການປະຕິບັດ</TH>
                    </TR>
                  </THead>
                  <TBody>
                    {filtered.length === 0 ? (
                      <TR>
                        <TD colSpan={8} className="text-center py-8 text-muted-foreground">
                          ບໍ່ພົບຂໍ້ມູນ
                        </TD>
                      </TR>
                    ) : (
                      filtered.map((u, i) => (
                        <TR key={u.id} className={!u.active ? "opacity-50" : ""}>
                          <TD className="text-muted-foreground text-sm">{i + 1}</TD>
                          <TD>
                            <div className="flex items-center gap-2">
                              <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shrink-0">
                                {u.fullName.slice(0, 2).toUpperCase()}
                              </div>
                              <span className="font-medium">{u.fullName}</span>
                            </div>
                          </TD>
                          <TD className="text-sm text-muted-foreground">{u.email}</TD>
                          <TD className="text-sm">{u.phone ?? "—"}</TD>
                          <TD>
                            <Badge className={`text-[11px] ${ROLE_CLS[u.role] ?? ""}`}>
                              {u.role.replace(/_/g, " ")}
                            </Badge>
                          </TD>
                          <TD className="text-center text-sm">
                            {LANG_LABEL[u.language] ?? u.language}
                          </TD>
                          <TD className="text-center">
                            {u.active ? (
                              <Badge className="bg-emerald-100 text-emerald-700 gap-1 text-[11px]">
                                <UserCheck className="h-3 w-3" /> Active
                              </Badge>
                            ) : (
                              <Badge className="bg-slate-100 text-slate-500 gap-1 text-[11px]">
                                <UserX className="h-3 w-3" /> Inactive
                              </Badge>
                            )}
                          </TD>
                          <TD>
                            <div className="flex items-center justify-center gap-1">
                              {/* ເບິ່ງ */}
                              <Button
                                size="icon" variant="ghost" className="h-8 w-8"
                                title="ເບິ່ງລາຍລະອຽດ"
                                onClick={() => setModal({ mode: "view", user: u })}
                              >
                                <Eye className="h-4 w-4 text-cyan-600" />
                              </Button>
                              {/* ແກ້ໄຂ */}
                              {canManage && (
                                <Button
                                  size="icon" variant="ghost" className="h-8 w-8"
                                  title="ແກ້ໄຂ"
                                  onClick={() => setModal({ mode: "edit", user: u })}
                                >
                                  <Pencil className="h-4 w-4 text-amber-600" />
                                </Button>
                              )}
                              {/* ລຶບ */}
                              {canManage && (
                                <Button
                                  size="icon" variant="ghost" className="h-8 w-8"
                                  title="ລຶບ"
                                  onClick={() => handleDelete(u)}
                                >
                                  <Trash2 className="h-4 w-4 text-rose-600" />
                                </Button>
                              )}
                            </div>
                          </TD>
                        </TR>
                      ))
                    )}
                  </TBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Permission Matrix Tab ── */}
      {tab === "matrix" && <PermissionMatrix />}

      {/* ── User Modal ── */}
      {modal && (
        <UserModal
          mode={modal.mode}
          user={modal.user}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); fetchUsers(); }}
        />
      )}
    </div>
  );
}

// ─── Tab button ───────────────────────────────────────────────────────────────

function TabBtn({
  active, onClick, children
}: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
        active
          ? "border-primary text-primary"
          : "border-transparent text-muted-foreground hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

// ─── User Modal ───────────────────────────────────────────────────────────────

const EMPTY_FORM = {
  fullName: "", email: "", phone: "",
  role: "SALES_STAFF" as UserRole,
  language: "lo", active: true,
  telegramChatId: ""
};

function UserModal({
  mode, user, onClose, onSaved
}: {
  mode: ModalMode;
  user: UserRow | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isView = mode === "view";
  const isEdit = mode === "edit";
  const isAdd  = mode === "add";

  const [form, setForm] = useState({
    fullName:       user?.fullName       ?? "",
    email:          user?.email          ?? "",
    phone:          user?.phone          ?? "",
    role:           (user?.role          ?? "SALES_STAFF") as UserRole,
    language:       user?.language       ?? "lo",
    active:         user?.active         ?? true,
    telegramChatId: user?.telegramChatId ?? ""
  });
  const [busy, setBusy] = useState(false);
  const [err,  setErr]  = useState<string | null>(null);

  async function save() {
    setBusy(true); setErr(null);
    try {
      const url    = isAdd ? "/api/users" : `/api/users/${user!.id}`;
      const method = isAdd ? "POST" : "PUT";
      const res    = await fetch(url, {
        method, headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName:       form.fullName,
          email:          form.email,
          phone:          form.phone || null,
          role:           form.role,
          language:       form.language,
          active:         form.active,
          telegramChatId: form.telegramChatId.trim() || null
        })
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error ?? "ບໍ່ສຳເລັດ");
      onSaved();
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  const title = isView ? "ລາຍລະອຽດ User" : isEdit ? "ແກ້ໄຂ User" : "ເພີ່ມ User ໃໝ່";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-background rounded-xl shadow-2xl w-full max-w-md border">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-4 space-y-4">
          {/* Avatar preview */}
          {(isView || isEdit) && user && (
            <div className="flex items-center gap-3 pb-2">
              <div className="h-12 w-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-base font-bold">
                {user.fullName.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="font-semibold">{user.fullName}</div>
                <Badge className={`text-[11px] mt-0.5 ${ROLE_CLS[user.role] ?? ""}`}>
                  {user.role.replace(/_/g, " ")}
                </Badge>
              </div>
            </div>
          )}

          {/* Full Name */}
          <div className="space-y-1.5">
            <Label>ຊື່ – ນາມສະກຸນ *</Label>
            {isView ? (
              <p className="text-sm font-medium">{user?.fullName}</p>
            ) : (
              <Input
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                placeholder="ສົມສັກ ວົງພະຈັນ"
              />
            )}
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <Label>Email *</Label>
            {isView ? (
              <p className="text-sm text-cyan-600">{user?.email}</p>
            ) : (
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="user@signmaker.la"
                disabled={isEdit} // Can't change email after creation
                className={isEdit ? "opacity-60" : ""}
              />
            )}
            {isEdit && (
              <p className="text-[11px] text-muted-foreground">ບໍ່ສາມາດປ່ຽນ email ໄດ້ຫຼັງຈາກສ້າງແລ້ວ</p>
            )}
          </div>

          {/* Phone */}
          <div className="space-y-1.5">
            <Label>ເບີໂທ</Label>
            {isView ? (
              <p className="text-sm">{user?.phone ?? "—"}</p>
            ) : (
              <Input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="020 xxxx xxxx"
              />
            )}
          </div>

          {/* Telegram Chat ID */}
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5">
              <Send className="h-3.5 w-3.5 text-sky-500" />
              Telegram Chat ID
            </Label>
            {isView ? (
              <div className="flex items-center gap-2">
                {user?.telegramChatId ? (
                  <>
                    <code className="text-sm bg-muted px-2 py-0.5 rounded font-mono">
                      {user.telegramChatId}
                    </code>
                    <span className="text-xs text-emerald-600">✓ ເຊື່ອມຕໍ່ແລ້ວ</span>
                  </>
                ) : (
                  <span className="text-sm text-muted-foreground">ຍັງບໍ່ໄດ້ເຊື່ອມຕໍ່</span>
                )}
              </div>
            ) : (
              <>
                <Input
                  value={form.telegramChatId}
                  onChange={(e) => setForm({ ...form, telegramChatId: e.target.value })}
                  placeholder="ເຊັ່ນ: 123456789"
                  className="font-mono"
                />
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  ສ່ງ <code className="bg-muted px-1 rounded">/start</code> ຫາ bot ຂອງທ່ານ ຫຼື
                  ສ່ງ <code className="bg-muted px-1 rounded">/chatid</code> ເພື່ອດຶງ ID
                </p>
              </>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Role */}
            <div className="space-y-1.5">
              <Label>Role *</Label>
              {isView ? (
                <Badge className={`text-[11px] ${ROLE_CLS[user?.role ?? ""] ?? ""}`}>
                  {user?.role?.replace(/_/g, " ")}
                </Badge>
              ) : (
                <Select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value as UserRole })}
                >
                  {USER_ROLES.map((r) => (
                    <option key={r} value={r}>{r.replace(/_/g, " ")}</option>
                  ))}
                </Select>
              )}
            </div>

            {/* Language */}
            <div className="space-y-1.5">
              <Label>ພາສາ</Label>
              {isView ? (
                <p className="text-sm">{LANG_LABEL[user?.language ?? "lo"]}</p>
              ) : (
                <Select
                  value={form.language}
                  onChange={(e) => setForm({ ...form, language: e.target.value })}
                >
                  <option value="lo">ລາວ</option>
                  <option value="th">ไทย</option>
                  <option value="en">English</option>
                </Select>
              )}
            </div>
          </div>

          {/* Active toggle */}
          {!isAdd && (
            <div className="flex items-center justify-between rounded-lg border px-4 py-3">
              <div>
                <p className="text-sm font-medium">ສະຖານະ Account</p>
                <p className="text-xs text-muted-foreground">
                  {isView
                    ? (user?.active ? "ໃຊ້ງານໄດ້" : "ຖືກປິດໃຊ້ງານ")
                    : "ເປີດ/ປິດ ການໃຊ້ງານ"}
                </p>
              </div>
              {isView ? (
                user?.active
                  ? <Badge className="bg-emerald-100 text-emerald-700">Active</Badge>
                  : <Badge className="bg-slate-100 text-slate-500">Inactive</Badge>
              ) : (
                <button
                  type="button"
                  onClick={() => setForm({ ...form, active: !form.active })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    form.active ? "bg-primary" : "bg-slate-300"
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                    form.active ? "translate-x-6" : "translate-x-1"
                  }`} />
                </button>
              )}
            </div>
          )}

          {/* Error */}
          {err && <p className="text-rose-600 text-sm">{err}</p>}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>ປິດ</Button>
          {!isView && (
            <Button onClick={save} disabled={busy || !form.fullName || !form.email}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : isAdd ? "ສ້າງ User" : "ບັນທຶກ"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Permission Matrix ────────────────────────────────────────────────────────

function PermissionMatrix() {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>
            <ShieldCheck className="inline h-5 w-5 mr-2 text-cyan-600" />
            Permission Matrix
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <THead>
                <TR>
                  <TH>Role</TH>
                  {MENUS.map((m) => (
                    <TH key={m} className="text-center capitalize text-xs">{m}</TH>
                  ))}
                </TR>
              </THead>
              <TBody>
                {USER_ROLES.map((role) => {
                  const allowed = MENU_PERMISSIONS[role] ?? [];
                  return (
                    <TR key={role}>
                      <TD>
                        <Badge className={`text-[11px] ${ROLE_CLS[role] ?? ""}`}>
                          {role.replace(/_/g, " ")}
                        </Badge>
                      </TD>
                      {MENUS.map((m) => (
                        <TD key={m} className="text-center">
                          {allowed.includes(m) ? (
                            <Check className="h-4 w-4 text-emerald-600 mx-auto" />
                          ) : (
                            <X className="h-4 w-4 text-rose-300 mx-auto" />
                          )}
                        </TD>
                      ))}
                    </TR>
                  );
                })}
              </TBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Special Action Permissions</CardTitle></CardHeader>
        <CardContent className="space-y-3 text-sm">
          <PermRow what="Approve / Reject Quotation"         roles={["OWNER","ADMIN_MANAGER","SALES_MANAGER"]} />
          <PermRow what="Manage Job (status / delete)"       roles={["OWNER","ADMIN_MANAGER","PRODUCTION_MANAGER","SALES_MANAGER","SALES_STAFF"]} />
          <PermRow what="Approve Material Request"           roles={["OWNER","ADMIN_MANAGER","STOCK","PRODUCTION_MANAGER"]} />
          <PermRow what="Run QC"                             roles={["OWNER","ADMIN_MANAGER","QC_STAFF"]} />
          <PermRow what="Record Payment"                     roles={["OWNER","ADMIN_MANAGER","FINANCE"]} />
          <PermRow what="View Audit Log"                     roles={["OWNER","ADMIN_MANAGER"]} />
          <PermRow what="Manage Users"                       roles={["OWNER","ADMIN_MANAGER"]} />
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        ແກ້ໄຂ Matrix ໄດ້ທີ່{" "}
        <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded">src/lib/rbac.ts</code>
        {" → "}
        <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded">MENU_PERMISSIONS</code>
      </p>
    </div>
  );
}

function PermRow({ what, roles }: { what: string; roles: string[] }) {
  return (
    <div className="flex items-center justify-between border-b last:border-0 pb-2">
      <span className="font-medium">{what}</span>
      <div className="flex flex-wrap gap-1 justify-end">
        {roles.map((r) => (
          <Badge key={r} className={`text-[10px] ${ROLE_CLS[r] ?? ""}`}>
            {r.replace(/_/g, " ")}
          </Badge>
        ))}
      </div>
    </div>
  );
}
