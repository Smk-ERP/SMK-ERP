import React from "react";
import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";
import { ensureFontsRegistered, fontFor } from "./fonts";
import { formatMoney, type CurrencyCode } from "../currency";
import { getDictionary, tr, type Locale } from "../i18n/config";
import { fmtDate } from "../utils";
import type { BrandSnapshot } from "../brand";

ensureFontsRegistered();

export interface QuotationPDFData {
  code: string;
  status: string;
  currency: CurrencyCode;
  language: Locale;
  issueDate: string;
  validUntil?: string | null;
  customer: {
    name: string;
    code: string;
    companyName?: string | null;
    phone?: string | null;
    address?: string | null;
    taxId?: string | null;
  };
  items: {
    title: string;
    description?: string | null;
    quantity: number;
    unit: string;
    unitPrice: number;
    lineTotal: number;
  }[];
  subtotal: number;
  discountAmount: number;
  discountPercent: number;
  taxPercent: number;
  taxAmount: number;
  total: number;
  note?: string | null;
  termsText?: string | null;
  brand: BrandSnapshot;
  paymentQrDataUrl?: string | null;   // PNG data URL for "scan to pay" QR (shown on invoices)
}

function makeStyles(fontFamily: string, accent: string) {
  const baseText = { fontFamily };
  return StyleSheet.create({
    page: { padding: 40, fontSize: 10, fontFamily, color: "#0B1F3A" },
    header: { flexDirection: "row", justifyContent: "space-between", marginBottom: 24, borderBottom: `2 solid ${accent}`, paddingBottom: 12 },
    brand: { flexDirection: "row", gap: 12, alignItems: "flex-start", maxWidth: "60%" },
    logo: { width: 60, height: 60, objectFit: "contain" },
    brandText: { flexDirection: "column" },
    brandName: { ...baseText, fontSize: 22, fontWeight: 700, color: "#0B1F3A" },
    brandTag: { ...baseText, fontSize: 9, color: "#475569", marginTop: 2 },
    docTitle: { ...baseText, fontSize: 18, fontWeight: 700, color: accent, textAlign: "right" },
    docMeta: { ...baseText, fontSize: 9, color: "#475569", textAlign: "right", marginTop: 4 },

    twoCol: { flexDirection: "row", justifyContent: "space-between", marginBottom: 16 },
    box: { width: "48%", border: "1 solid #E2E8F0", borderRadius: 4, padding: 10 },
    boxTitle: { ...baseText, fontSize: 8, color: "#64748B", marginBottom: 4, textTransform: "uppercase" },
    boxValue: { ...baseText, fontSize: 10, color: "#0B1F3A" },
    boxValueBold: { ...baseText, fontSize: 10, color: "#0B1F3A", fontWeight: 700 },

    table: { marginTop: 8, borderTop: "1 solid #E2E8F0", borderLeft: "1 solid #E2E8F0", borderRight: "1 solid #E2E8F0" },
    th: { flexDirection: "row", backgroundColor: "#F1F5F9", paddingVertical: 6, paddingHorizontal: 8, borderBottom: "1 solid #E2E8F0" },
    tr: { flexDirection: "row", paddingVertical: 6, paddingHorizontal: 8, borderBottom: "1 solid #E2E8F0" },
    cellIdx: { ...baseText, width: "5%", fontSize: 9 },
    cellDesc: { ...baseText, width: "55%", fontSize: 9 },
    cellQty: { ...baseText, width: "10%", fontSize: 9, textAlign: "right" },
    cellPrice: { ...baseText, width: "15%", fontSize: 9, textAlign: "right" },
    cellTotal: { ...baseText, width: "15%", fontSize: 9, textAlign: "right" },
    cellDescSub: { ...baseText, fontSize: 8, color: "#64748B" },
    bold: { fontWeight: 700 },

    totals: { marginTop: 16, alignSelf: "flex-end", width: "45%" },
    totalRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 3 },
    totalLabel: { ...baseText, color: "#475569" },
    totalValue: { ...baseText, textAlign: "right" },
    grandRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 6, marginTop: 4, borderTop: "1 solid #0B1F3A" },
    grandLabel: { ...baseText, fontSize: 11, fontWeight: 700 },
    grandValue: { ...baseText, fontSize: 11, fontWeight: 700, textAlign: "right", color: accent },

    note: { ...baseText, marginTop: 12, fontSize: 9, color: "#334155" },
    terms: { ...baseText, marginTop: 6, fontSize: 9, color: "#64748B" },

    // Payment QR + bank-info row shown when invoice
    payment: { marginTop: 16, flexDirection: "row", gap: 12, alignItems: "flex-start", border: `1 solid ${accent}`, borderRadius: 4, padding: 10, backgroundColor: "#F8FAFC" },
    qrBox: { width: 90, alignItems: "center" },
    qrImg: { width: 80, height: 80 },
    qrLabel: { ...baseText, fontSize: 7, color: "#64748B", marginTop: 2, textAlign: "center" },
    bankCol: { flex: 1 },
    bankTitle: { ...baseText, fontSize: 9, fontWeight: 700, color: accent, marginBottom: 4 },
    bankLine: { ...baseText, fontSize: 9, color: "#0B1F3A", lineHeight: 1.4 },

    signatures: { marginTop: 30, flexDirection: "row", justifyContent: "space-between", flexWrap: "wrap" },
    sigBox: { width: "48%", borderTop: "1 solid #94A3B8", paddingTop: 4, textAlign: "center", marginBottom: 10 },
    sigLabel: { ...baseText, fontSize: 8, color: "#475569" },
    sigRole: { ...baseText, fontSize: 7, color: "#94A3B8" },

    footer: { ...baseText, marginTop: 24, fontSize: 8, color: "#64748B", borderTop: "1 solid #E2E8F0", paddingTop: 8, flexDirection: "row", justifyContent: "space-between" }
  });
}

export function QuotationPDF({ data }: { data: QuotationPDFData }) {
  const dict = getDictionary(data.language);
  const t = (k: string) => tr(dict, k);
  const family = fontFor(data.language);
  const accent = data.brand.primaryColor || "#06B6D4";
  const styles = makeStyles(family, accent);
  const money = (n: number) => formatMoney(n, data.currency, data.language);

  // ── Document title changes once the quotation is approved / converted ──────
  // DRAFT / SENT / REJECTED / EXPIRED → "Quotation"
  // APPROVED / CONVERTED              → "Invoice" / "ໃບເກັບເງິນ"
  const isBilling = data.status === "APPROVED" || data.status === "CONVERTED";
  const titleByLang = {
    lo: { quotation: "ໃບສະເໜີລາຄາ", invoice: "ໃບເກັບເງິນ" },
    th: { quotation: "ใบเสนอราคา", invoice: "ใบแจ้งหนี้"  },
    en: { quotation: "Quotation",   invoice: "Invoice"     }
  } as const;
  const langKey = (data.language as keyof typeof titleByLang) in titleByLang
    ? (data.language as keyof typeof titleByLang) : "en";
  const docTitleText = isBilling ? titleByLang[langKey].invoice : titleByLang[langKey].quotation;

  // Build full address from brand
  const brandAddrLine = [data.brand.address, data.brand.city, data.brand.province, data.brand.country]
    .filter(Boolean).join(", ");
  const brandContact = [data.brand.phone, data.brand.email, data.brand.website].filter(Boolean).join("  •  ");

  // Signature slots from brand config (with fallback to defaults)
  const sigSlots = data.brand.signatureConfig?.QUOTATION ?? [{ label: "Customer" }, { label: "Authorized signature" }];

  return (
    <Document title={`${docTitleText} ${data.code}`} author={data.brand.companyName}>
      <Page size="A4" style={styles.page} wrap>
        {/* Header */}
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
            <Text style={styles.docTitle}>{docTitleText}</Text>
            <Text style={styles.docMeta}>{t("quotation.code")}: {data.code}</Text>
            <Text style={styles.docMeta}>{t("quotation.issueDate")}: {fmtDate(data.issueDate)}</Text>
            {data.validUntil && <Text style={styles.docMeta}>{t("quotation.validUntil")}: {fmtDate(data.validUntil)}</Text>}
          </View>
        </View>

        {/* Bill to */}
        <View style={styles.twoCol}>
          <View style={styles.box}>
            <Text style={styles.boxTitle}>{t("quotation.customer")}</Text>
            <Text style={styles.boxValueBold}>{data.customer.name}</Text>
            {data.customer.companyName && <Text style={styles.boxValue}>{data.customer.companyName}</Text>}
            {data.customer.phone && <Text style={styles.boxValue}>{data.customer.phone}</Text>}
            {data.customer.address && <Text style={styles.boxValue}>{data.customer.address}</Text>}
            {data.customer.taxId && <Text style={styles.boxValue}>Tax ID: {data.customer.taxId}</Text>}
          </View>
          <View style={styles.box}>
            <Text style={styles.boxTitle}>{t("common.status")}</Text>
            <Text style={styles.boxValueBold}>{t(`quotation.status.${data.status}`)}</Text>
            <Text style={styles.boxTitle}>{t("common.currency")}</Text>
            <Text style={styles.boxValue}>{data.currency}</Text>
          </View>
        </View>

        {/* Items */}
        <View style={styles.table}>
          <View style={styles.th}>
            <Text style={[styles.cellIdx, styles.bold]}>#</Text>
            <Text style={[styles.cellDesc, styles.bold]}>{t("quotation.items")}</Text>
            <Text style={[styles.cellQty, styles.bold]}>Qty</Text>
            <Text style={[styles.cellPrice, styles.bold]}>Unit</Text>
            <Text style={[styles.cellTotal, styles.bold]}>{t("common.total")}</Text>
          </View>
          {data.items.map((it, i) => (
            <View key={i} style={styles.tr}>
              <Text style={styles.cellIdx}>{i + 1}</Text>
              <View style={styles.cellDesc}>
                <Text style={{ fontFamily: family }}>{it.title}</Text>
                {it.description && <Text style={styles.cellDescSub}>{it.description}</Text>}
              </View>
              <Text style={styles.cellQty}>{it.quantity} {it.unit}</Text>
              <Text style={styles.cellPrice}>{money(it.unitPrice)}</Text>
              <Text style={styles.cellTotal}>{money(it.lineTotal)}</Text>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={styles.totals}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>{t("common.subtotal")}</Text>
            <Text style={styles.totalValue}>{money(data.subtotal)}</Text>
          </View>
          {(data.discountAmount > 0 || data.discountPercent > 0) && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>{t("common.discount")} ({data.discountPercent}%)</Text>
              <Text style={styles.totalValue}>− {money(data.discountAmount + data.subtotal * (data.discountPercent / 100))}</Text>
            </View>
          )}
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
        </View>

        {/* Note + Terms — explicit fontFamily prevents react-pdf font inheritance issue */}
        {data.note && <Text style={styles.note}>{data.note}</Text>}
        {data.termsText && <Text style={styles.terms}>{data.termsText}</Text>}

        {/* Payment QR + bank info — only when this is an invoice/billing doc (#7) */}
        {isBilling && (data.paymentQrDataUrl || data.brand.bankInfo) && (
          <View style={styles.payment}>
            {data.paymentQrDataUrl && (
              <View style={styles.qrBox}>
                <Image src={data.paymentQrDataUrl} style={styles.qrImg} />
                <Text style={styles.qrLabel}>Scan to pay</Text>
              </View>
            )}
            <View style={styles.bankCol}>
              <Text style={styles.bankTitle}>
                {langKey === "lo" ? "ຂໍ້ມູນການຊໍາລະເງິນ"
                  : langKey === "th" ? "ข้อมูลการชำระเงิน"
                  : "Payment Information"}
              </Text>
              {data.brand.bankInfo && (
                <Text style={styles.bankLine}>{data.brand.bankInfo}</Text>
              )}
              <Text style={[styles.bankLine, { color: "#64748B", marginTop: 4 }]}>
                Ref: {data.code}  •  Amount: {money(data.total)}
              </Text>
            </View>
          </View>
        )}

        {/* Dynamic signature slots from BrandSetting */}
        <View style={styles.signatures}>
          {sigSlots.map((s, i) => (
            <View key={i} style={styles.sigBox}>
              <Text style={styles.sigLabel}>{s.label}</Text>
              {s.role && <Text style={styles.sigRole}>({s.role.replace(/_/g, " ")})</Text>}
            </View>
          ))}
        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={{ fontFamily: family }}>{data.brand.companyName}  •  {data.code}</Text>
          <Text style={{ fontFamily: family }} render={({ pageNumber, totalPages }) => `Page ${pageNumber} / ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}
