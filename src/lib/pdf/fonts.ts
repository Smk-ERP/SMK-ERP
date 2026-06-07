import { Font } from "@react-pdf/renderer";
import path from "path";
import fs from "fs";

/**
 * Register Unicode fonts for PDF rendering.
 *
 * Priority for Lao (first found wins):
 *   1. Saysettha OT       — official Lao Unicode font, distributed in LA
 *   2. Phetsarath OT      — alternative official font
 *   3. Noto Sans Lao      — shipped fallback (always present)
 *   4. Helvetica          — last resort, Lao text will be tofu
 *
 * Priority for Thai:
 *   1. Sarabun (shipped)
 */

const registered = {
  lao: false as false | "saysettha" | "phetsarath" | "noto",
  thai: false as boolean,
  initialized: false
};

function tryRegister(family: string, src: string): boolean {
  try {
    Font.register({ family, src });
    return true;
  } catch (e) {
    console.warn(`[pdf] failed to register ${family}:`, e);
    return false;
  }
}

function tryRegisterWeighted(family: string, regularPath: string, boldPath?: string): boolean {
  try {
    const fonts: any[] = [{ src: regularPath, fontWeight: "normal" }];
    fonts.push({ src: boldPath && fs.existsSync(boldPath) ? boldPath : regularPath, fontWeight: "bold" });
    Font.register({ family, fonts });
    return true;
  } catch (e) {
    console.warn(`[pdf] failed to register ${family}:`, e);
    return false;
  }
}

export function ensureFontsRegistered() {
  if (registered.initialized) return registered;
  registered.initialized = true;

  const fontsDir = path.join(process.cwd(), "public", "fonts");

  // ─── Lao (preference order: Saysettha → Phetsarath → Noto) ───
  const saysetthaRegular = path.join(fontsDir, "Saysettha-Regular.ttf");
  const saysetthaBold    = path.join(fontsDir, "Saysettha-Bold.ttf");
  const phetsarathPath   = path.join(fontsDir, "PhetsarathOT.ttf");
  const notoLaoPath      = path.join(fontsDir, "NotoSansLao-Regular.ttf");
  const notoLaoBoldPath  = path.join(fontsDir, "NotoSansLao-Bold.ttf");

  if (fs.existsSync(saysetthaRegular)) {
    if (tryRegisterWeighted("SaysetthaOT", saysetthaRegular, saysetthaBold)) {
      registered.lao = "saysettha";
      console.log("[pdf] Lao font: Saysettha OT");
    }
  }
  if (!registered.lao && fs.existsSync(phetsarathPath)) {
    if (tryRegister("PhetsarathOT", phetsarathPath)) {
      registered.lao = "phetsarath";
      console.log("[pdf] Lao font: Phetsarath OT");
    }
  }
  if (!registered.lao && fs.existsSync(notoLaoPath)) {
    if (tryRegisterWeighted("NotoSansLao", notoLaoPath, notoLaoBoldPath)) {
      registered.lao = "noto";
      console.log("[pdf] Lao font: Noto Sans Lao (fallback)");
    }
  }
  if (!registered.lao) {
    console.warn("[pdf] No Lao font available — drop Saysettha-Regular.ttf / PhetsarathOT.ttf / NotoSansLao-Regular.ttf into public/fonts/");
  }

  // ─── Thai ───
  const sarabunPath = path.join(fontsDir, "Sarabun-Regular.ttf");
  const sarabunBoldPath = path.join(fontsDir, "Sarabun-Bold.ttf");
  if (fs.existsSync(sarabunPath)) {
    if (tryRegisterWeighted("Sarabun", sarabunPath, sarabunBoldPath)) {
      registered.thai = true;
    }
  }

  // Disable hyphenation in non-Latin text (Lao/Thai vowels & tone marks must stay attached)
  Font.registerHyphenationCallback((word) => [word]);
  return registered;
}

export function fontFor(lang: string): string {
  const r = ensureFontsRegistered();
  if (lang === "lo") {
    if (r.lao === "saysettha")  return "SaysetthaOT";
    if (r.lao === "phetsarath") return "PhetsarathOT";
    if (r.lao === "noto")       return "NotoSansLao";
    return "Helvetica";
  }
  if (lang === "th" && r.thai) return "Sarabun";
  return "Helvetica";
}
