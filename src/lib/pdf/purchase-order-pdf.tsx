import React from "react";
import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";
import { ensureFontsRegistered, fontFor } from "./fonts";
import { formatMoney, type CurrencyCode } from "../currency";
import { getDictionary, tr, type Locale } from "../i18n/config";
import { fmtDate } from "../utils";
import type { BrandSnapshot } from "../brand";

ensureFontsRegistered();

export interface POPDFData {
  code: string;
  status: string;
  language: Locale;
  currency: CurrencyCode;
  issueDate: string;
  expectedDate?: string | null;
  supplier: {
    name: string;
    address?: string | null;
    phone?: string | null;
    email?: string | null;
    taxId?: string | null;
  };
  items: {
    description: string;
    quantity: number;
    unit: string;
    unitPrice: number;
    lineTotal: number;
    note?: string | null;
  }[];
  subtotal: number;
  taxPercent: number;
  taxAmount: number;
  shipping: number;
  total: number;
  note?: string | null;
  termsText?: string | null;
  brand: BrandSnapshot;
}

function makeStyles(family: string, accent: string) {
  const base = { fontFamily: family };
  return StyleSheet.create({
    page: { padding: 40, fontSize: 10, fontFamily: family, color: "#0B1F3A" },
    header: { flexDirection: "row", justifyContent: "space-between", marginBottom: 24, borderBottom: `2 solid ${accent}`, paddingBottom: 12 },
    brand: { flexDirection: "row", gap: 12, alignItems: "flex-start", maxWidth: "60%" },
    logo: { width: 60, height: 60, objectFit: "contain" },
    brandText: { flexDirection: "column" },
    brandName: { ...base, fontSize: 22, fontWeight: 700 },
    brandTag: { ...base, fontSize: 9, color: "#475569", marginTop: 2 },
    docTitle: { ...base, fontSize: 18, fontWeight: 700, color: accent, textAlign: "right" },
    docMeta: { ...base, fontSize: 9, color: "#475569", textAlign: "right", marginTop: 4 },
    twoCol: { flexDirection: "row", justifyContent: "space-between", marginBottom: 16 },
    box: { width: "48%", border: "1 solid #E2E8F0", borderRadius: 4, padding: 10 },
    boxTitle: { ...base, fontSize: 8, color: "#64748B", marginBottom: 4, textTransform: "uppercase" },
    boxValue: { ...base, fontSize: 10 },
    boxValueBold: { ...base, fontSize: 10, fontWeight: 700 },
    table: { marginTop: 8, borderTop: "1 solid #E2E8F0", borderLeft: "1 solid #E2E8F0", borderRight: "1 solid #E2E8F0" },
    th: { flexDirection: "row", backgroundColor: "#F1F5F9", paddingVertical: 6, paddingHorizontal: 8, borderBottom: "1 solid #E2E8F0" },
    tr: { flexDirection: "row", paddingVertical: 6, paddingHorizontal: 8, borderBottom: "1 solid #E2E8F0" },
    cellNo: { ...base, width: "5%", fontSize: 9 },
    cellDesc: { ...base, width: "55%", fontSize: 9 },
    cellQty: { ...base, width: "10%", fontSize: 9, textAlign: "right" },
    cellPrice: { ...base, width: "15%", fontSize: 9, textAlign: "right" },
    cellTotal: { ...base, width: "15%", fontSize: 9, textAlign: "right" },
    th_b: { ...base, fontWeight: 700, fontSize: 9 },
    totals: { marginTop: 16, alignSelf: "flex-end", width: "45%" },
    totalRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 3 },
    totalLabel: { ...base, color: "#475569", fontSize: 9 },
    totalValue: { ...base, textAlign: "right", fontSize: 9 },
    grandRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 6, marginTop: 4, borderTop: "1 solid #0B1F3A" },
    grandLabel: { ...base, fontSize: 11, fontWeight: 700 },
    grandValue: { ...base, fontSize: 11, fontWeight: 700, textAlign: "right", color: accent },
    note: { ...base, marginTop: 12, fontSize: 9, color: "#334155" },
    signatures: { marginTop: 30, flexDirection: "row", justifyContent: "space-between" },
    sigBox: { width: "40%", borderTop: "1 solid #94A3B8", paddingTop: 4, textAlign: "center" },
    sigLabel: { ...base, fontSize: 8, color: "#475569" },
    footer: { marginTop: 24, borderTop: "1 solid #E2E8F0", paddingTop: 8 },
    footerText: { ...base, fontSize: 8, color: "#64748B" }
  });
}

export function PurchaseOrderPDF({ data }: { data: POPDFData }) {
  const dict = getDictionary(data.language);
  const t = (k: string) => tr(dict, k);
  const family = fontFor(data.language);
  const accent = data.brand.primaryColor || "#06B6D4";
  const styles = makeStyles(family, accent);
  const money = (n: number) => formatMoney(n, data.currency, data.language);

  const brandAddrLine = [data.brand.address, data.brand.city, data.brand.province, data.brand.country].filter(Boolean).join(", ");
  const brandContact = [data.brand.phone, data.brand.email].filter(Boolean).join("  •  ");
  const sigSlots = data.brand.signatureConfig?.PURCHASE_ORDER ?? [
    { label: t("po.approvedBy") }, { label: t("po.supplierAck") }
  ];

  return (
    <Document title={`PO ${data.code}`} author={data.brand.companyName}>
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
            <Text style={styles.docTitle}>{t("po.title")}</Text>
            <Text style={styles.docMeta}>{t("po.code")}: {data.code}</Text>
            <Text style={styles.docMeta}>{t("po.issueDate")}: {fmtDate(data.issueDate)}</Text>
            {data.expectedDate && <Text style={styles.docMeta}>{t("po.expectedDate")}: {fmtDate(data.expectedDate)}</Text>}
            <Text style={styles.docMeta}>{t("common.status")}: {t(`po.status.${data.status}`)}</Text>
          </View>
        </View>

        <View style={styles.twoCol}>
          <View style={styles.box}>
            <Text style={styles.boxTitle}>{t("po.supplier")}</Text>
            <Text style={styles.boxValueBold}>{data.supplier.name}</Text>
            {data.supplier.address && <Text style={styles.boxValue}>{data.supplier.address}</Text>}
            {data.supplier.phone && <Text style={styles.boxValue}>{data.supplier.phone}</Text>}
            {data.supplier.email && <Text style={styles.boxValue}>{data.supplier.email}</Text>}
            {data.supplier.taxId && <Text style={styles.boxValue}>Tax ID: {data.supplier.taxId}</Text>}
          </View>
          <View style={styles.box}>
            <Text style={styles.boxTitle}>{t("common.currency")}</Text>
            <Text style={styles.boxValueBold}>{data.currency}</Text>
            {data.brand.bankInfo && (
              <>
                <Text style={[styles.boxTitle, { marginTop: 6 }]}>{t("po.deliverTo")}</Text>
                <Text style={styles.boxValue}>{data.brand.companyName}</Text>
                {brandAddrLine && <Text style={styles.boxValue}>{brandAddrLine}</Text>}
              </>
            )}
          </View>
        </View>

        <View style={styles.table}>
          <View style={styles.th}>
            <Text style={[styles.cellNo, { fontWeight: 700 }]}>#</Text>
            <Text style={[styles.cellDesc, { fontWeight: 700 }]}>{t("po.itemDesc")}</Text>
            <Text style={[styles.cellQty, { fontWeight: 700 }]}>Qty</Text>
            <Text style={[styles.cellPrice, { fontWeight: 700 }]}>Unit</Text>
            <Text style={[styles.cellTotal, { fontWeight: 700 }]}>{t("common.total")}</Text>
          </View>
          {data.items.map((it, i) => (
            <View key={i} style={styles.tr}>
              <Text style={styles.cellNo}>{i + 1}</Text>
              <View style={styles.cellDesc}>
                <Text>{it.description}</Text>
                {it.note && <Text style={{ fontSize: 8, color: "#64748B" }}>{it.note}</Text>}
              </View>
              <Text style={styles.cellQty}>{it.quantity} {it.unit}</Text>
              <Text style={styles.cellPrice}>{money(it.unitPrice)}</Text>
              <Text style={styles.cellTotal}>{money(it.lineTotal)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.totals}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>{t("common.subtotal")}</Text>
            <Text style={styles.totalValue}>{money(data.subtotal)}</Text>
          </View>
          {data.shipping > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>{t("po.shipping")}</Text>
              <Text style={styles.totalValue}>{money(data.shipping)}</Text>
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

        {data.note && <Text style={styles.note}>{data.note}</Text>}
        {data.termsText && <Text style={[styles.note, { color: "#64748B" }]}>{data.termsText}</Text>}

        <View style={styles.signatures}>
          {sigSlots.map((s, i) => (
            <View key={i} style={styles.sigBox}>
              <Text style={styles.sigLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>{data.brand.companyName} • {data.code}</Text>
        </View>
      </Page>
    </Document>
  );
}
