# DEPLOYMENT — The Signmaker ERP

วิธี deploy ระบบขึ้น production ด้วย Supabase (DB + Auth + Storage) และ Vercel (Next.js hosting)

---

## 1. สร้าง Supabase Project

1. ไปที่ https://supabase.com → **New project**
2. ตั้ง project name `signmaker-erp`, password (เก็บไว้), region `ap-southeast-1 (Singapore)` หรือใกล้ลาวที่สุด
3. รอประมาณ 2 นาที จนสถานะ Ready

ที่หน้า project, **Settings → Database** จะเห็น:
- `Host` — `db.<project-ref>.supabase.co`
- `Database password` — ที่ตั้งไว้
- `Connection string` (pooled & direct)

---

## 2. ตั้งค่า Supabase Auth

**Authentication → Providers → Email**:
- Enable Email
- (แนะนำ) ปิด "Confirm email" สำหรับ phase แรกที่ทีมยังน้อย
- Site URL: `https://<your-app>.vercel.app` (ทีหลังตั้ง)
- Redirect URLs: เพิ่ม `http://localhost:3000`, `https://<your-app>.vercel.app`

**Authentication → Users → Add user → Create new user**
สำหรับแต่ละ role ที่ seed ไว้:

```
owner@signmaker.la          / demo1234
admin@signmaker.la          / demo1234
salesmgr@signmaker.la       / demo1234
sales1@signmaker.la         / demo1234
prodmgr@signmaker.la        / demo1234
designer@signmaker.la       / demo1234
prod1@signmaker.la          / demo1234
qc@signmaker.la             / demo1234
installer@signmaker.la      / demo1234
finance@signmaker.la        / demo1234
stock@signmaker.la          / demo1234
hr@signmaker.la             / demo1234
```

> Email ต้องตรงกับ seed.ts เพราะระบบ map Supabase user ↔ Prisma `User` row จาก email

---

## 3. สร้าง Storage Bucket

**Storage → New bucket**:
- Name: `signmaker-files`
- Public: **ON** (สำหรับ Phase 1 — file preview ลูกค้า)
  > สามารถเปลี่ยนเป็น signed-URL ภายหลังได้
- File size limit: 10 MB
- Allowed MIME types: `image/*`, `application/pdf`, `application/postscript`

---

## 4. ตั้งค่า ENV

ที่ project root, คัดลอก `.env.example` เป็น `.env`:

```env
# Supabase Settings → Database → Connection string (URI)
# Pooled (port 6543) — สำหรับ app runtime
DATABASE_URL="postgresql://postgres.<ref>:<pwd>@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"

# Direct (port 5432) — สำหรับ migrations
DIRECT_URL="postgresql://postgres:<pwd>@db.<ref>.supabase.co:5432/postgres"

# Supabase Settings → API
NEXT_PUBLIC_SUPABASE_URL="https://<ref>.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="<anon-public-key>"
SUPABASE_SERVICE_ROLE_KEY="<service-role-secret>"   # เก็บเป็น secret บน Vercel — อย่า commit

NEXT_PUBLIC_APP_URL="https://<your-app>.vercel.app"
STORAGE_BUCKET="signmaker-files"
DEFAULT_CURRENCY=LAK
DEFAULT_LANGUAGE=lo
```

---

## 5. Run Prisma Migration

```bash
# Generate Prisma client
npx prisma generate

# สร้าง schema บน Supabase
npx prisma migrate deploy
```

ตรวจ: เปิด Supabase **Table Editor** ต้องเห็น tables ทั้งหมด (User, Customer, Quotation, …)

---

## 6. Seed Database

```bash
npm run db:seed
```

จะสร้าง users, customers, quotations, jobs, materials ตัวอย่างให้

> **เตือน:** seed ลบข้อมูลเดิมทุกครั้ง อย่ารันบน production หลังเริ่มใช้งานจริง

---

## 7. Deploy บน Vercel

1. Push code ขึ้น GitHub
2. ไปที่ https://vercel.com → **New Project** → Import repo
3. Framework Preset: **Next.js** (auto-detected)
4. **Environment Variables** → เพิ่มทุกตัวจาก `.env` ของคุณ
   - `DATABASE_URL`, `DIRECT_URL`
   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (mark **Sensitive**)
   - `NEXT_PUBLIC_APP_URL`, `STORAGE_BUCKET`
   - `DEFAULT_CURRENCY=LAK`, `DEFAULT_LANGUAGE=lo`
5. Build Command: `npm run build` (default)
6. **Deploy**

หลัง deploy:
- กลับไปที่ Supabase **Auth → URL Configuration** เพิ่ม domain Vercel ใน Site URL + Redirect URLs

---

## 8. ตั้งค่า Custom Domain

บน Vercel → Project → Settings → Domains:

1. Add `erp.signmaker.la` (หรือโดเมนของคุณ)
2. ที่ DNS provider:
   - `A` record → `76.76.21.21` (Vercel IP), หรือ
   - `CNAME` record → `cname.vercel-dns.com`
3. รอ SSL cert (Vercel auto-issues Let's Encrypt)
4. กลับไป Supabase Auth → Redirect URLs เพิ่ม `https://erp.signmaker.la`

---

## 9. วิธี Backup Database

**ทางที่ 1 — Supabase auto backup**
- Supabase Pro plan: daily backup 7 days (free plan: ไม่มี)
- Settings → Database → Backups → Restore

**ทางที่ 2 — Manual `pg_dump`**

```bash
# ต้องมี Postgres client ติดตั้งบนเครื่อง
pg_dump "postgresql://postgres:<pwd>@db.<ref>.supabase.co:5432/postgres" \
  --no-owner --no-privileges \
  -F c -f signmaker-erp-$(date +%Y%m%d).dump
```

แนะนำตั้ง cron บน server ฝั่งบริษัท รัน daily แล้ว upload ขึ้น S3/Drive

---

## 10. เปิดให้ทีมทดลองใช้

1. ส่ง URL `https://erp.signmaker.la` + Email/Password ตามตาราง section 2
2. แต่ละคนเข้า `/settings` เลือกภาษา (LA / TH / EN) เก็บใน localStorage
3. แนะนำให้เริ่ม flow:
   - Sales → สร้างลูกค้าใหม่ → สร้างใบเสนอราคาด้วย Calculator → ส่ง → ขอ Sales Manager อนุมัติ → แปลงเป็น Job
   - Production Manager → เปลี่ยน Job status → DESIGN → PRODUCTION → QC
   - QC → (Phase 2 ทำใน next release; Phase 1 ใช้ status change manual)
4. รายงาน bug/feedback ที่ GitHub Issues หรือช่องทางที่ทีมใช้

---

## 11. การ Upgrade

ทุกครั้งที่มี migration ใหม่:

```bash
git pull
npm install
npx prisma migrate deploy
npm run build
# Vercel auto-deploys on git push to main
```

ถ้าเพิ่ม model ใหม่และต้องการ seed ข้อมูลตั้งต้น เขียน migration script แยก (เช่น `prisma/migrations/202xxxxx_xxx/seed.sql`) อย่ารัน `db:seed` บน production

---

## 🆘 Troubleshooting

| อาการ | สาเหตุ | วิธีแก้ |
|---|---|---|
| PDF Lao text เป็นกล่อง | Font ไม่ embed | ใส่ `PhetsarathOT.ttf` ใน `public/fonts/` แล้ว redeploy |
| Login redirect loop | Supabase URL config ผิด | ตั้ง Site URL + Redirect URLs ใน Supabase Auth |
| Prisma connection timeout | ใช้ direct URL กับ serverless | ตั้ง `DATABASE_URL` เป็น pooler (6543) |
| Build fails on Vercel | `prisma generate` ไม่รัน | ตรวจว่ามี `postinstall: prisma generate` ใน package.json |
| `useSupabaseUser` คืน null | Cookie ถูก block | ตั้ง `NEXT_PUBLIC_APP_URL` ให้ตรงกับ domain ที่ใช้จริง |
