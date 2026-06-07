import React from "react";
import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";
import { ensureFontsRegistered, fontFor } from "./fonts";
import { getDictionary, tr, type Locale } from "../i18n/config";
import { fmtDate } from "../utils";
import type { BrandSnapshot } from "../brand";

ensureFontsRegistered();

export interface MRPDFData {
  code: string;
  status: string;
  createdAt: string;
  language: Locale;
  job: { code: string; customer: string };
  requester: string;
  note?: string | null;
  items: { code: string; name: string; quantity: number; unit: string }[];
  brand: BrandSnapshot;
}

function makeStyles(fontFamily: string, accent: string) {
  const base = { fontFamily };
  return StyleSheet.create({
    page: { padding: 40, fontSize: 10, fontFamily, color: "#0B1F3A" },
    header: { flexDirection: "row", justifyContent: "space-between", marginBottom: 24, borderBottom: `2 solid ${accent}`, paddingBottom: 12 },
    brand: { flexDirection: "row", gap: 12, alignItems: "flex-start", maxWidth: "60%" },
    logo: { width: 50, height: 50, objectFit: "contain" },
    brandText: { flexDirection: "column" },
    brandName: { ...base, fontSize: 20, fontWeight: 700, color: "#0B1F3A" },
    brandTag: { ...base, fontSize: 9, color: "#475569", marginTop: 2 },
    docTitle: { ...base, fontSize: 16, fontWeight: 700, color: accent, textAlign: "right" },
    docMeta: { ...base, fontSize: 9, color: "#475569", textAlign: "right", marginTop: 4 },
    twoCol: { flexDirection: "row", justifyContent: "space-between", marginBottom: 16 },
    box: { width: "48%", border: "1 solid #E2E8F0", borderRadius: 4, padding: 10 },
    boxTitle: { ...base, fontSize: 8, color: "#64748B", marginBottom: 4, textTransform: "uppercase" },
    boxValue: { ...base, fontSize: 10 },
    boxValueBold: { ...base, fontSize: 10, fontWeight: 700 },
    table: { marginTop: 8, borderTop: "1 solid #E2E8F0", borderLeft: "1 solid #E2E8F0", borderRight: "1 solid #E2E8F0" },
    th: { flexDirection: "row", backgroundColor: "#F1F5F9", paddingVertical: 6, paddingHorizontal: 8, borderBottom: "1 solid #E2E8F0" },
    tr: { flexDirection: "row", paddingVertical: 6, paddingHorizontal: 8, borderBottom: "1 solid #E2E8F0" },
    cellNo: { ...base, width: "8%", fontSize: 9 },
    cellCode: { ...base, width: "20%", fontSize: 9 },
    cellName: { ...base, width: "52%", fontSize: 9 },
    cellQty: { ...base, width: "20%", fontSize: 9, textAlign: "right" },
    th_b: { ...base, fontWeight: 700, fontSize: 9 },
    note: { ...base, marginTop: 12, fontSize: 9, color: "#334155" },
    signatures: { marginTop: 30, flexDirection: "row", justifyContent: "space-between", flexWrap: "wrap" },
    sigBox: { width: "30%", borderTop: "1 solid #94A3B8", paddingTop: 4, textAlign: "center", marginBottom: 10 },
    sigLabel: { ...base, fontSize: 8, color: "#475569" },
    sigRole: { ...base, fontSize: 7, color: "#94A3B8" },
    footer: { marginTop: 24, borderTop: "1 solid #E2E8F0", paddingTop: 8 },
    footerText: { ...base, fontSize: 8, color: "#64748B" }
  });
}

export function MaterialRequestPDF({ data }: { data: MRPDFData }) {
  const dict = getDictionary(data.language);
  const t = (k: string) => tr(dict, k);
  const family = fontFor(data.language);
  const accent = data.brand.primaryColor || "#06B6D4";
  const styles = makeStyles(family, accent);

  const brandAddrLine = [data.brand.address, data.brand.city, data.brand.province, data.brand.country]
    .filter(Boolean).join(", ");
  const brandContact = [data.brand.phone, data.brand.email, data.brand.website].filter(Boolean).join("  •  ");
  const sigSlots = data.brand.signatureConfig?.MATERIAL_REQUEST ?? [
    { label: "Requested by" }, { label: "Approved by" }, { label: "Issued / Received by" }
  ];

  return (
    <Document title={`MR ${data.code}`} author={data.brand.companyName}>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.brand}>
            {data.brand.logoUrl && <Image src={data.brand.logoUrl} style={styles.logo} />}
            <View style={styles.brandText}>
              <Text style={styles.brandName}>{data.brand.companyName}</Text>
              {data.brand.tagline && <Text style={styles.brandTag}>{data.brand.tagline}</Text>}
              {brandAddrLine && <Text style={styles.brandTag}>{brandAddrLine}</Text>}
              {brandContact && <Text style={styles.brandTag}>{brandContact}</Text>}
            </View>
          </View>
          <View>
            <Text style={styles.docTitle}>{t("materialRequest.title")}</Text>
            <Text style={styles.docMeta}>{t("materialRequest.code")}: {data.code}</Text>
            <Text style={styles.docMeta}>{t("common.date")}: {fmtDate(data.createdAt)}</Text>
          </View>
        </View>

        <View style={styles.twoCol}>
          <View style={styles.box}>
            <Text style={styles.boxTitle}>{t("materialRequest.job")}</Text>
            <Text style={styles.boxValueBold}>{data.job.code}</Text>
            <Text style={styles.boxValue}>{data.job.customer}</Text>
          </View>
          <View style={styles.box}>
            <Text style={styles.boxTitle}>{t("materialRequest.requester")}</Text>
            <Text style={styles.boxValueBold}>{data.requester}</Text>
            <Text style={styles.boxTitle}>{t("common.status")}</Text>
            <Text style={styles.boxValue}>{t(`materialRequest.status.${data.status}`)}</Text>
          </View>
        </View>

        <View style={styles.table}>
          <View style={styles.th}>
            <Text style={[styles.cellNo, { fontWeight: 700 }]}>#</Text>
            <Text style={[styles.cellCode, { fontWeight: 700 }]}>{t("inventory.code")}</Text>
            <Text style={[styles.cellName, { fontWeight: 700 }]}>{t("inventory.name")}</Text>
            <Text style={[styles.cellQty, { fontWeight: 700 }]}>Qty</Text>
          </View>
          {data.items.map((it, i) => (
            <View key={i} style={styles.tr}>
              <Text style={styles.cellNo}>{i + 1}</Text>
              <Text style={styles.cellCode}>{it.code}</Text>
              <Text style={styles.cellName}>{it.name}</Text>
              <Text style={styles.cellQty}>{it.quantity} {it.unit}</Text>
            </View>
          ))}
        </View>

        {data.note && <Text style={styles.note}>Note: {data.note}</Text>}

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
        </View>
      </Page>
    </Document>
  );
}
