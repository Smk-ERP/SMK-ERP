# The Signmaker ERP

ระบบ ERP สำหรับธุรกิจร้านป้ายและสื่อสิ่งพิมพ์ **The Signmaker** (ลาว) — สร้างด้วย Next.js 14 App Router + TypeScript + Prisma + Supabase

> **สถานะ:** Phase 1 พร้อมใช้งาน (Auth, Dashboard, Customer, Quotation + Cost Calculator, Job, PDF Export, i18n TH/LA/EN)
> Phase 2 (Inventory, Production, QC, Installation) และ Phase 3 (Finance, KPI, Incentive) อยู่ใน schema แล้ว รอเปิด UI

---

## 📋 ระบบนี้คืออะไร

The Signmaker ERP เป็นเว็บแอปบริหารงานเต็มวงจรสำหรับร้านป้าย:

- รับงาน → ออกใบเสนอราคา → คำนวณต้นทุน → อนุมัติ → ผลิต → QC → ติดตั้ง → เก็บเงิน
- ใช้บนมือถือ แท็บเล็ต คอมพิวเตอร์ และ TV View ฝ่ายผลิต
- รองรับ **3 ภาษา** (ไทย / ลาว / อังกฤษ) สลับได้ทุกหน้า
- เอกสารใบเสนอราคา/Invoice/Receipt export เป็น PDF ที่ embed ฟอนต์ **Phetsarath OT** สำหรับภาษาลาว
- รองรับ **3 สกุลเงิน** (LAK / THB / USD)

---

## 🧱 Tech Stack

| ชั้น | เทคโนโลยี |
|---|---|
| Framework | Next.js 14 (App Router) + TypeScript |
| UI | Tailwind CSS + shadcn/ui (hand-built) + lucide-react |
| Database | PostgreSQL (Supabase) + Prisma ORM |
| Auth | Supabase Auth (มี Demo Mode สำหรับใช้งานโดยไม่ต้องตั้งค่า) |
| Storage | Supabase Storage |
| PDF | `@react-pdf/renderer` (Lao font embed) |
| Charts | Recharts |
| Deployment | Vercel |

---

## 🚀 วิธีติดตั้ง (Local)

ต้องมี: **Node 20+**, **pnpm/npm**, **PostgreSQL** (หรือ Supabase project)

```bash
# 1. ติดตั้ง dependencies
npm install

# 2. คัดลอกไฟล์ env แล้วเติมค่า DATABASE_URL ของคุณ
copy .env.example .env

# 3. รัน Prisma — สร้างตาราง
npx prisma migrate dev --name init

# 4. Seed ข้อมูลตัวอย่าง (users ทุก role, ลูกค้า 5 ราย, ใบเสนอราคา 5 ใบ, job ครบทุกสถานะ, วัสดุ)
npm run db:seed

# 5. ดาวน์โหลดฟอนต์ Phetsarath OT แล้วใส่ใน public/fonts/  (ดู "วิธีเพิ่มฟอนต์")

# 6. รัน dev server
npm run dev
```

เปิด http://localhost:3000

> หากยังไม่ได้ตั้งค่า Supabase Auth ระบบจะเข้า **Demo Mode** อัตโนมัติ — กด Sign in จะเข้าเป็น Owner ที่ seed ไว้

---

## 🔑 วิธี Login User Demo

เปิด `/login`:

| Email | Role |
|---|---|
| `owner@signmaker.la` | OWNER |
| `admin@signmaker.la` | ADMIN_MANAGER |
| `salesmgr@signmaker.la` | SALES_MANAGER |
| `sales1@signmaker.la` | SALES_STAFF |
| `prodmgr@signmaker.la` | PRODUCTION_MANAGER |
| `designer@signmaker.la` | DESIGNER |
| `qc@signmaker.la` | QC_STAFF |
| `installer@signmaker.la` | INSTALLER |
| `finance@signmaker.la` | FINANCE |
| `stock@signmaker.la` | STOCK |
| `hr@signmaker.la` | HR |

**Demo mode:** ไม่ต้องใส่รหัสผ่าน กด Sign in ผ่านได้ทันที
**Supabase mode:** ต้องสร้าง user เหล่านี้ใน Supabase Auth dashboard ด้วย password `demo1234`

---

## ✅ วิธีทดสอบ Flow หลัก

ดูเช็คลิสต์เต็มใน [tests/CHECKLIST.md](tests/CHECKLIST.md). สรุปขั้นต่ำ:

1. **Login** → เข้า `/dashboard` เห็นยอดขายเดือนนี้, งานรอผลิต, งานล่าช้า, ฯลฯ พร้อมกราฟ
2. **สลับภาษา** → กดปุ่ม TH/LA/EN ขวาบน เห็นข้อความเปลี่ยน + ฟอนต์ลาวเปลี่ยน
3. **สร้างลูกค้า** → `/customers/new` → ดูใน `/customers/{id}`
4. **คำนวณต้นทุน** → `/calculator` เลือกประเภทป้าย ใส่ขนาด ดูราคา + margin
5. **สร้างใบเสนอราคา** → `/quotations/new` ใช้ calculator เพิ่ม item หลายรายการ → บันทึก
6. **ส่ง → อนุมัติ → แปลงเป็น Job** ใน `/quotations/{id}`
7. **Export PDF** ภาษาลาว → ปุ่ม Export PDF เปิด tab ใหม่ ตรวจสระ/วรรณยุกต์ลาวต้องถูกต้อง
8. **เปลี่ยนสถานะ Job** ใน `/jobs/{id}` ใช้ select เปลี่ยน status ดูประวัติ

---

## 🌍 วิธีเพิ่มภาษา

1. คัดลอก `locales/en.json` เป็น `locales/<code>.json` (เช่น `vi.json`)
2. แปลทุก key
3. เพิ่ม `<code>` ใน `src/lib/i18n/config.ts` ที่ array `LOCALES` และ map `LOCALE_LABELS`
4. ถ้าต้องการฟอนต์เฉพาะ เพิ่ม CSS rule ใน `src/app/globals.css`:
   ```css
   html[lang="vi"] body { font-family: var(--font-vi); }
   ```

---

## 🔤 วิธีเพิ่มฟอนต์ (โดยเฉพาะ Phetsarath OT)

1. ดาวน์โหลด **Phetsarath OT** จาก https://laoscript.net (Unicode-compliant)
2. แปลงเป็น `.woff2` และ `.woff` (เครื่องมือออนไลน์: everythingfonts.com)
3. วางไฟล์ใน `public/fonts/`:
   ```
   public/fonts/
     ├── PhetsarathOT.woff2
     ├── PhetsarathOT.woff
     └── PhetsarathOT.ttf   ← จำเป็นสำหรับ PDF
   ```
4. หากเปลี่ยน path/ชื่อ ให้แก้ใน:
   - `src/app/globals.css` (`@font-face` block)
   - `src/lib/pdf/fonts.ts` (PDF embed)

ฟอนต์ภาษาไทย (`Sarabun`) ใช้ system fallback — ถ้าต้องการ embed ลง PDF ให้วาง `Sarabun-Regular.ttf` ใน `public/fonts/`

---

## 🏷 วิธีเพิ่มประเภทป้าย

ประเภทป้ายอยู่ที่ enum `SignType` ใน `prisma/schema.prisma`

1. เพิ่ม enum value ใหม่ เช่น `MAGNET_SIGN`
2. แก้ `src/lib/cost-calculator.ts`:
   - เพิ่มใน type `SignTypeKey`
   - เพิ่ม case ใน `getDefaultsForSignType()` พร้อม default material/profit %
3. เพิ่มคำแปลใน `locales/{th,lo,en}.json` ใต้ `signTypes.MAGNET_SIGN`
4. รัน `npx prisma migrate dev --name add_magnet_sign`

ระบบเก็บ snapshot ของ cost breakdown ลง `QuotationItem.costBreakdown` (JSON) — ประเภทใหม่ใช้ได้ทันทีโดยไม่ต้องแก้ UI

---

## 📁 Project Structure

```
src/
├── app/
│   ├── (dashboard)/          ← Authenticated layout
│   │   ├── dashboard/
│   │   ├── customers/        ← CRM (Phase 1) ✓
│   │   ├── quotations/       ← Quotation + builder + status flow ✓
│   │   ├── calculator/       ← Cost Calculator ✓
│   │   ├── jobs/             ← Job + status history ✓
│   │   ├── production/       ← Phase 2 placeholder
│   │   ├── inventory/        ← Phase 2 placeholder
│   │   ├── qc/               ← Phase 2 placeholder
│   │   ├── installation/     ← Phase 2 placeholder
│   │   ├── finance/          ← Phase 3 placeholder
│   │   ├── kpi/              ← Phase 3 placeholder
│   │   └── settings/
│   ├── login/                ← Auth ✓
│   └── api/                  ← REST routes
├── components/
│   ├── ui/                   ← shadcn-style primitives
│   ├── layout/               ← sidebar, topbar, lang switcher
│   ├── calculator/           ← Calculator form
│   └── dashboard/            ← KPI cards & charts
├── lib/
│   ├── prisma.ts
│   ├── supabase/             ← server / client / middleware helpers
│   ├── auth.ts               ← getCurrentUser() w/ demo fallback
│   ├── rbac.ts               ← Role permissions
│   ├── cost-calculator.ts    ← Pure cost math
│   ├── currency.ts           ← LAK/THB/USD conversion
│   ├── i18n/                 ← i18n context + config
│   └── pdf/                  ← @react-pdf renderer + Lao font
├── middleware.ts             ← Auth guard
prisma/
├── schema.prisma             ← All Phase 1-3 models
└── seed.ts                   ← Demo data (users, customers, quotations, jobs)
locales/
├── th.json / lo.json / en.json
public/fonts/                 ← Phetsarath OT goes here
```

---

## 🗺 Roadmap

### ✅ Phase 1 (this release)
- Auth (Supabase + demo mode)
- Multi-language UI (TH/LA/EN) with Phetsarath OT
- Multi-currency (LAK/THB/USD)
- Customer CRM
- Cost Calculator (17 sign types)
- Quotation system with line items, markup/margin, status flow
- Quotation → Job conversion
- Job management with status history
- PDF export with Lao font embedding

### 🚧 Phase 2 (next)
- Inventory + BOM stock deduction
- Material Request workflow
- Production Kanban (drag & drop) + TV View + Mobile install view
- QC Checklist + Rework flow
- Installation scheduling + before/after photos + customer signature

### ⏳ Phase 3
- Finance docs (Billing Note / Invoice / Receipt / Payment Slip)
- KPI 70% + KBI 30% scoring + commission tiers (600M–2B LAK)
- Notifications (in-app + Telegram/WhatsApp integration)
- Audit Log UI + advanced RBAC

---

## 📦 Scripts

```bash
npm run dev               # Start dev server
npm run build             # Build for production (runs prisma generate)
npm run start             # Production server
npm run prisma:migrate    # Run pending migrations
npm run prisma:studio     # Open Prisma Studio (DB GUI)
npm run db:seed           # (Re-)seed demo data
```

---

## 📚 Documentation

- [DEPLOYMENT.md](DEPLOYMENT.md) — วิธี deploy บน Supabase + Vercel
- [tests/CHECKLIST.md](tests/CHECKLIST.md) — เช็คลิสต์ทดสอบ flow ทั้งหมด

---

## ⚖ License

Proprietary — © The Signmaker, Lao PDR.
