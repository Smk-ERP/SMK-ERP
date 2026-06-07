# Manual Test Checklist — Phase 1

ทดสอบเหล่านี้ทำงานก่อน sign off แต่ละ release ของ Phase 1

> **Pre-requisites:** เริ่มจาก fresh database, รัน `npm run db:seed` เรียบร้อย, มี Phetsarath OT ใน `public/fonts/`

---

## A. Auth & Permissions

- [ ] **Login (demo mode)** — เปิด `/login` กด Sign-in ผ่าน → redirect `/dashboard`
- [ ] **Login (Supabase mode)** — ใส่ `owner@signmaker.la / demo1234` → เข้าได้
- [ ] **Login failure** — ใส่ password ผิด → เห็น error
- [ ] **Logout** — กดปุ่ม Logout ใน sidebar → กลับ `/login`
- [ ] **Auth middleware** — เข้า `/dashboard` โดยไม่ login (Supabase mode) → redirect `/login?redirect=/dashboard`

### Role permission spot-checks
- [ ] **SALES_STAFF** ไม่เห็น Production/Inventory/Finance ใน sidebar (เมนูถูก filter)
- [ ] **STOCK** เห็นเฉพาะ Dashboard + Inventory
- [ ] **POST `/api/quotations/{id}/status` body `{status:"APPROVED"}`** ด้วย SALES_STAFF → 403 Forbidden

---

## B. Customer CRM

- [ ] เปิด `/customers` เห็น 5 ลูกค้า seeded
- [ ] กด **+ New Customer** → กรอกชื่อ/เบอร์ → Save → redirect ไปหน้า detail
- [ ] หน้า detail แสดง Job history + Quotation history (ถ้ามี)
- [ ] **Search** พิมพ์ชื่อ → filter ทำงาน
- [ ] **Filter type** เลือก `FACEBOOK` → เห็นเฉพาะลูกค้า type Facebook

---

## C. Cost Calculator

- [ ] เปิด `/calculator` → เลือก `VINYL` ขนาด `2000×1000` → ราคาแสดงทันที
- [ ] เปลี่ยนประเภทเป็น `LIGHTBOX` → defaults (material/LED/markup) เปลี่ยน
- [ ] เปลี่ยน Markup → 45% → ราคาเพิ่มขึ้น
- [ ] สลับ Pricing mode → MARGIN → ราคาคำนวณใหม่ (สูงกว่า markup เดียวกัน)
- [ ] เปิด **Include install** + ใส่ install cost → ราคาเพิ่ม
- [ ] เปิด VAT 7% → tax แสดง + final price + tax
- [ ] สลับ Channel → WHOLESALE → ราคาลดลง 10%

---

## D. Quotation

- [ ] เปิด `/quotations` เห็น 5 ใบ seeded สถานะหลากหลาย
- [ ] กด **+ New Quotation** เลือกลูกค้า → ใช้ Calculator เพิ่ม 2 รายการ → Save
- [ ] หน้า detail แสดง items, summary, customer
- [ ] **Send** → status เปลี่ยนเป็น SENT
- [ ] **Approve** (login เป็น SALES_MANAGER) → status APPROVED
- [ ] **Reject** ของอีกใบ → ใส่เหตุผล → status REJECTED
- [ ] **Convert to Job** หลัง approve → สร้าง Job + redirect ไป `/jobs/{id}` + quotation status = CONVERTED
- [ ] **Export PDF (LA)** → กดปุ่ม Export PDF ภาษาลาว → PDF เปิดในแท็บใหม่ → ตรวจ:
  - [ ] หัวเอกสาร "The Signmaker" และ tagline ลาวอ่านออก
  - [ ] สระ/วรรณยุกต์ลาวต่อกับตัวอักษรถูกตำแหน่ง (ບ່ ສ່ ໌ ່)
  - [ ] ยอดเงิน LAK format ถูก (₭ + comma)
- [ ] **Export PDF (TH)** → เปลี่ยน language เป็น TH → PDF ภาษาไทยอ่านได้
- [ ] **Export PDF (EN)** → ภาษาอังกฤษ
- [ ] **Currency switch** สร้างใบใหม่เลือก USD → ราคาแปลงอัตโนมัติ
- [ ] **Margin display** หลังลดราคา 10% → margin actual ใน summary ลดลงถูกต้อง

---

## E. Job

- [ ] เปิด `/jobs` → เห็น job ทุกสถานะ (12 statuses)
- [ ] เปิด job detail (PRODUCTION) → เห็น status history, customer, quotation link
- [ ] **Change status** PRODUCTION → QC ใส่ note → บันทึก → history เพิ่ม entry
- [ ] **Late job** ที่ due date ผ่านไป → ดูใน dashboard "งานล่าช้า" นับถูก
- [ ] **Update meta** (team / dueDate / notes) → Save → refresh ยังคงค่า

---

## F. Dashboard

- [ ] เปิด `/dashboard` หลัง seed → เห็น:
  - [ ] ยอดขายเดือนนี้ (sum ของ quotation APPROVED + CONVERTED)
  - [ ] Pending jobs > 0
  - [ ] Late jobs (job ที่ due date ผ่าน + ยังไม่ COMPLETED)
  - [ ] QC waiting / Install waiting > 0
  - [ ] Revenue / Cost / Gross profit
- [ ] **Pie chart** สถานะงาน แสดงสัดส่วน
- [ ] **Bar chart** ยอดขายตามช่องทาง (FACEBOOK/WALK_IN/...) แสดง

---

## G. i18n & Lao font

- [ ] กดปุ่ม **LA** → text เปลี่ยนเป็นลาว, font เปลี่ยนเป็น Phetsarath OT (เปิด DevTools → Element → ดู `font-family`)
- [ ] กด **TH** → text ไทย, font Sarabun fallback
- [ ] กด **EN** → text English, font system
- [ ] Refresh page → ภาษาที่เลือกค้างอยู่ (localStorage)
- [ ] เปิด `/login` → switcher ยังใช้งาน

### Lao rendering edge cases (ใน Phetsarath OT)
- [ ] `ບໍລິສັດ` แสดงสระ ບ ບໍ ບໍລ ไม่ทับซ้อน
- [ ] `ສ່ວນຫຼຸດ` วรรณยุกต์ ່ อยู่บน ສ ถูกที่
- [ ] `ປ້າຍ` ້ และ ປ ไม่หล่น

---

## H. File Upload (preview-only Phase 1)

- [ ] อัพโหลดไฟล์ลูกค้า (.jpg/.png/.pdf/.ai) ผ่าน Supabase Storage UI หรือผ่าน app
- [ ] **Preview** JPG/PNG/PDF → แสดงในหน้า detail
- [ ] **AI file** → แสดงเป็นไฟล์แนบ + ปุ่ม download

> ⚠ Upload UI ใน app เป็น stretch goal ของ Phase 1 — ถ้ายังไม่มี ใช้ Supabase Storage dashboard ทดสอบไปก่อน

---

## I. API smoke tests

```bash
# List customers
curl http://localhost:3000/api/customers

# Create customer
curl -X POST http://localhost:3000/api/customers \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","type":"WALK_IN","phone":"123"}'

# Create quotation
curl -X POST http://localhost:3000/api/quotations \
  -H "Content-Type: application/json" \
  -d '{"customerId":"<id>","currency":"LAK","language":"lo","items":[{"signType":"VINYL","title":"Test","quantity":1,"unit":"PCS","unitCost":1000,"unitPrice":1500,"markupPercent":30}]}'

# Approve
curl -X POST http://localhost:3000/api/quotations/<id>/status \
  -H "Content-Type: application/json" -d '{"status":"APPROVED"}'

# Convert to job
curl -X POST http://localhost:3000/api/quotations/<id>/convert-to-job

# Get PDF
curl -o test.pdf "http://localhost:3000/api/quotations/<id>/pdf?lang=lo"
```

---

## Sign-off

| Date | Tester | Browser | Pass | Notes |
|---|---|---|---|---|
| | | | ☐ | |
