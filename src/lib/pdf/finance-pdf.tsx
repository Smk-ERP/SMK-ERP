import React from "react";
import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";
import { ensureFontsRegistered, fontFor } from "./fonts";
import { formatMoney, type CurrencyCode } from "../currency";
import { getDictionary, tr, type Locale } from "../i18n/config";
import { fmtDate } from "../utils";
import type { BrandSnapshot } from "../brand";

ensureFontsRegistered();

export interface FinancePDFItem {
  title: string;
  description?: string | null;
  quantity?: number;
  unit?: string;
  unitPrice?: number;
  lineTotal?: number;
}

export interface FinancePDFData {
  code: string;
  docType: string;             // BILLING_NOTE, INVOICE, RECEIPT, PAYMENT_SLIP, …
  language: Locale;
  currency: CurrencyCode;
  issueDate: string;
  paidAt?: string | null;
  customer?: {
    name?: string | null; companyName?: string | null;
    phone?: string | null; address?: string | null; taxId?: string | null;
  } | null;
  items: FinancePDFItem[];
  quotationCode?: string | null;
  jobCode?: string | null;
  amount: number;
  taxPercent: number;
  taxAmount: number;
  total: number;
  payments: { amount: number; method: string; reference?: string | null; receivedAt: string }[];
  balance: number;
  note?: string | null;
  brand: BrandSnapshot;
  paymentQrDataUrl?: string | null;   // PNG data URL — rendered next to bank info on invoices
}

function makeStyles(fontFamily: string, accent: string) {
  const base = { fontFamily };
  return StyleSheet.create({
    page: { padding: 40, fontSize: 10, fontFamily, color: "#0B1F3A" },
    header: { flexDirection: "row", justifyContent: "space-between", marginBottom: 24, borderBottom: `2 solid ${accent}`, paddingBottom: 12 },
    brand: { flexDirection: "row", gap: 12, alignItems: "flex-start", maxWidth: "60%" },
    logo: { width: 60, height: 60, objectFit: "contain" },
    brandText: { flexDirection: "column" },
    brandName: { ...base, fontSize: 22, fontWeight: 700, color: "#0B1F3A" },
    brandTag: { ...base, fontSize: 9, color: "#475569", marginTop: 2 },
    docTitle: { ...base, fontSize: 18, fontWeight: 700, color: accent, textAlign: "right" },
    docMeta: { ...base, fontSize: 9, color: "#475569", textAlign: "right", marginTop: 4 },
    paidStamp: {
      ...base,
      position: "absolute", top: 200, right: 60,
      borderWidth: 4, borderColor: "#10B981", borderRadius: 8, padding: 8,
      color: "#10B981", fontSize: 36, fontWeight: 700, transform: "rotate(-15deg)"
    },
    twoCol: { flexDirection: "row", justifyContent: "space-between", marginBottom: 16 },
    box: { width: "48%", border: "1 solid #E2E8F0", borderRadius: 4, padding: 10 },
    boxTitle: { ...base, fontSize: 8, color: "#64748B", marginBottom: 4, textTransform: "uppercase" },
    boxValue: { ...base, fontSize: 10 },
    boxValueBold: { ...base, fontSize: 10, fontWeight: 700 },
    table: { marginTop: 8, borderTop: "1 solid #E2E8F0", borderLeft: "1 solid #E2E8F0", borderRight: "1 solid #E2E8F0" },
    th: { flexDirection: "row", backgroundColor: "#F1F5F9", paddingVertical: 6, paddingHorizontal: 8, borderBottom: "1 solid #E2E8F0" },
    tr: { flexDirection: "row", paddingVertical: 6, paddingHorizontal: 8, borderBottom: "1 solid #E2E8F0" },
    th_b: { ...base, fontWeight: 700, fontSize: 9 },
    cellNo: { ...base, width: "5%", fontSize: 9 },
    cellDesc: { ...base, width: "55%", fontSize: 9 },
    cellDescSub: { ...base, fontSize: 8, color: "#64748B" },
    cellQty: { ...base, width: "10%", fontSize: 9, textAlign: "right" },
    cellPrice: { ...base, width: "15%", fontSize: 9, textAlign: "right" },
    cellTotal: { ...base, width: "15%", fontSize: 9, textAlign: "right" },
    totals: { marginTop: 16, alignSelf: "flex-end", width: "45%" },
    totalRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 3 },
    totalLabel: { ...base, color: "#475569" },
    totalValue: { ...base, textAlign: "right" },
    grandRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 6, marginTop: 4, borderTop: "1 solid #0B1F3A" },
    grandLabel: { ...base, fontSize: 11, fontWeight: 700 },
    grandValue: { ...base, fontSize: 11, fontWeight: 700, textAlign: "right", color: accent },
    balanceRow: { flexDirection: "row", justifyContent: "space-between", paddingTop: 6, paddingBottom: 6, marginTop: 4 },
    paymentsBox: { marginTop: 16, border: "1 solid #E2E8F0", borderRadius: 4, padding: 8 },
    paymentsTitle: { ...base, fontSize: 9, color: "#64748B", textTransform: "uppercase", marginBottom: 4 },
    paymentRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 2 },
    paymentText: { ...base, fontSize: 9 },
    bankBox: { marginTop: 12, padding: 8, backgroundColor: "#F8FAFC", borderRadius: 4, flexDirection: "row", gap: 10, alignItems: "flex-start" },
    bankBoxText: { flex: 1 },
    bankTitle: { ...base, fontSize: 8, color: "#64748B", textTransform: "uppercase", marginBottom: 2 },
    bankText: { ...base, fontSize: 9, color: "#334155" },
    bankQrBox: { width: 80, alignItems: "center" },
    bankQrImg: { width: 76, height: 76 },
    bankQrLabel: { ...base, fontSize: 7, color: "#64748B", marginTop: 2, textAlign: "center" },
    note: { ...base, marginTop: 12, fontSize: 9, color: "#334155" },
    signatures: { marginTop: 30, flexDirection: "row", justifyContent: "space-between", flexWrap: "wrap" },
    sigBox: { width: "48%", borderTop: "1 solid #94A3B8", paddingTop: 4, textAlign: "center", marginBottom: 10 },
    sigLabel: { ...base, fontSize: 8, color: "#475569" },
    sigRole: { ...base, fontSize: 7, color: "#94A3B8" },
    footer: { marginTop: 24, fontSize: 8, color: "#64748B", borderTop: "1 solid #E2E8F0", paddingTop: 8, flexDirection: "row", justifyContent: "space-between" },
    footerText: { ...base, fontSize: 8, color: "#64748B" }
  });
}

export function FinanceDocumentPDF({ data }: { data: FinancePDFData }) {
  const dict = getDictionary(data.language);
  const t = (k: string) => tr(dict, k);
  const family = fontFor(data.language);
  const accent = data.brand.primaryColor || "#06B6D4";
  const styles = makeStyles(family, accent);
  const money = (n: number) => formatMoney(n, data.currency, data.language);
  const isReceipt = data.docType === "RECEIPT";
  const isPaid = !!data.paidAt;

  const brandAddrLine = [data.brand.address, data.brand.city, data.brand.province, data.brand.country]
    .filter(Boolean).join(", ");
  const brandContact = [data.brand.phone, data.brand.email, data.brand.website].filter(Boolean).join("  •  ");
  const sigSlots = data.brand.signatureConfig?.[data.docType] ?? [{ label: "Customer" }, { label: "Authorized" }];

  return (
    <Document title={`${data.docType} ${data.code}`} author={data.brand.companyName}>
      <Page size="A4" style={styles.page} wrap>
        <View style={styles.header}>
          <View style={styles.brand}>
            {data.brand.logoUrl && <Image src={data.brand.logoUrl} style={styles.logo} />}
            <View style={styles.brandText}>
              <Text style={styles.brandName}>{data.brand.companyName}</Text>
              {data.brand.tagline && <Text style={styles.brandTag}>{data.brand.tagline}</Text>}
              {brandAddrLine && <Text style={styles.brandTag}>{brandAddrLine}</Text>}
              {brandContact && <Text style={styles.brandTag}>{brandContact}</Text>}
              {data.brand.taxId && <Text style={styles.brandTag}>Tax ID: {data.brand.taxId}</Text>}
            </View>
          </View>
          <View>
            <Text style={styles.docTitle}>{t(`finance.docTypes.${data.docType}`)}</Text>
            <Text style={styles.docMeta}>{t("finance.code")}: {data.code}</Text>
            <Text style={styles.docMeta}>{t("finance.issueDate")}: {fmtDate(data.issueDate)}</Text>
            {data.quotationCode && <Text style={styles.docMeta}>Ref Quotation: {data.quotationCode}</Text>}
            {data.jobCode && <Text style={styles.docMeta}>Job: {data.jobCode}</Text>}
          </View>
        </View>

        {(isReceipt || isPaid) && <Text style={styles.paidStamp}>PAID</Text>}

        <View style={styles.twoCol}>
          <View style={styles.box}>
            <Text style={styles.boxTitle}>{t("quotation.customer")}</Text>
            {data.customer ? (
              <>
                <Text style={styles.boxValueBold}>{data.customer.name}</Text>
                {data.customer.companyName && <Text style={styles.boxValue}>{data.customer.companyName}</Text>}
                {data.customer.phone && <Text style={styles.boxValue}>{data.customer.phone}</Text>}
                {data.customer.address && <Text style={styles.boxValue}>{data.customer.address}</Text>}
                {data.customer.taxId && <Text style={styles.boxValue}>Tax ID: {data.customer.taxId}</Text>}
              </>
            ) : (
              <Text style={styles.boxValue}>—</Text>
            )}
          </View>
          <View style={styles.box}>
            <Text style={styles.boxTitle}>{t("common.currency")} / {t("finance.type")}</Text>
            <Text style={styles.boxValueBold}>{data.currency}</Text>
            <Text style={styles.boxValue}>{t(`finance.docTypes.${data.docType}`)}</Text>
            {data.paidAt && (
              <>
                <Text style={[styles.boxTitle, { marginTop: 6 }]}>{t("finance.paid")}</Text>
                <Text style={styles.boxValue}>{fmtDate(data.paidAt)}</Text>
              </>
            )}
          </View>
        </View>

        {data.items.length > 0 && (
          <View style={styles.table}>
            <View style={styles.th}>
              <Text style={[styles.cellNo, styles.th_b]}>#</Text>
              <Text style={[styles.cellDesc, styles.th_b]}>{t("quotation.items")}</Text>
              <Text style={[styles.cellQty, styles.th_b]}>Qty</Text>
              <Text style={[styles.cellPrice, styles.th_b]}>Unit</Text>
              <Text style={[styles.cellTotal, styles.th_b]}>{t("common.total")}</Text>
            </View>
            {data.items.map((it, i) => (
              <View key={i} style={styles.tr}>
                <Text style={styles.cellNo}>{i + 1}</Text>
                <View style={styles.cellDesc}>
                  <Text style={{ fontFamily: family }}>{it.title}</Text>
                  {it.description && <Text style={styles.cellDescSub}>{it.description}</Text>}
                </View>
                <Text style={styles.cellQty}>{it.quantity ?? "—"} {it.unit ?? ""}</Text>
                <Text style={styles.cellPrice}>{it.unitPrice != null ? money(it.unitPrice) : "—"}</Text>
                <Text style={styles.cellTotal}>{it.lineTotal != null ? money(it.lineTotal) : "—"}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.totals}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>{t("common.subtotal")}</Text>
            <Text style={styles.totalValue}>{money(data.amount)}</Text>
          </View>
          {data.taxPercent > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>{t("common.tax")} ({data.taxPercent}%)</Text>
              <Text style={styles.totalValue}>{money(data.taxAmount)}</Text>
            </View>
          )}
          <View style={styles.grandRow}>
            <Text style={styles.grandLabel}>{t("common.grandTotal")}</Text>
            <Text style={styles.grandValue}>{money(data.total)}</Text>
          </View>
          {data.payments.length > 0 && (
            <>
              <View style={styles.balanceRow}>
                <Text style={[styles.totalLabel, { fontSize: 10 }]}>Paid</Text>
                <Text style={[styles.totalValue, { color: "#10B981" }]}>
                  − {money(data.total - data.balance)}
                </Text>
              </View>
              <View style={styles.balanceRow}>
                <Text style={[styles.grandLabel, { color: data.balance > 0 ? "#F59E0B" : "#10B981" }]}>{t("finance.balance")}</Text>
                <Text style={[styles.grandValue, { color: data.balance > 0 ? "#F59E0B" : "#10B981" }]}>{money(data.balance)}</Text>
              </View>
            </>
          )}
        </View>

        {data.payments.length > 0 && (
          <View style={styles.paymentsBox}>
            <Text style={styles.paymentsTitle}>{t("finance.payments")}</Text>
            {data.payments.map((p, i) => (
              <View key={i} style={styles.paymentRow}>
                <Text style={styles.paymentText}>{fmtDate(p.receivedAt)} • {p.method}{p.reference ? ` (${p.reference})` : ""}</Text>
                <Text style={styles.paymentText}>{money(p.amount)}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Bank info + payment QR — shown on Invoice / Billing Note when balance > 0 */}
        {data.brand.bankInfo && (data.docType === "INVOICE" || data.docType === "BILLING_NOTE") && data.balance > 0 && (
          <View style={styles.bankBox}>
            <View style={styles.bankBoxText}>
              <Text style={styles.bankTitle}>Payment to</Text>
              <Text style={styles.bankText}>{data.brand.bankInfo}</Text>
              <Text style={[styles.bankText, { marginTop: 4, color: "#64748B" }]}>
                Ref: {data.code}  •  Amount: {money(data.balance)}
              </Text>
            </View>
            {data.paymentQrDataUrl && (
              <View style={styles.bankQrBox}>
                <Image src={data.paymentQrDataUrl} style={styles.bankQrImg} />
                <Text style={styles.bankQrLabel}>Scan to pay</Text>
              </View>
            )}
          </View>
        )}

        {data.note && <Text style={styles.note}>{data.note}</Text>}

        {/* Dynamic signature slots from brand config */}
        <View style={styles.signatures}>
          {sigSlots.map((s, i) => (
            <View key={i} style={styles.sigBox}>
              <Text style={styles.sigLabel}>{s.label}</Text>
              {s.role && <Text style={styles.sigRole}>({s.role.replace(/_/g, " ")})</Text>}
            </View>
          ))}
        </View>

        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>{data.brand.companyName} • {data.code}</Text>
          <Text style={styles.footerText} render={({ pageNumber, totalPages }) => `Page ${pageNumber} / ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}
