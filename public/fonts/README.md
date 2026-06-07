# Lao Font — Phetsarath OT

Place the following files in this folder:

- `PhetsarathOT.woff2`  (primary, preferred)
- `PhetsarathOT.woff`   (fallback for older browsers)
- `PhetsarathOT.ttf`    (fallback + used for PDF embedding)

## Where to get it

Phetsarath OT is a free Unicode Lao font published by the Lao National
Internet Center. Download the official `.ttf` from one of:

- https://laoscript.net/downloads/
- https://www.omniglot.com/fonts/lao.htm

After downloading the TTF, convert to `.woff2` / `.woff` for web (e.g.
using https://everythingfonts.com/ttf-to-woff2 or `fonttools`).

## Why it matters

- The UI applies `font-family: "Phetsarath OT"` whenever `<html lang="lo">`,
  so without this file Lao text falls back to Noto Sans Lao or system Lao
  font (vowel/tone marks may render incorrectly on some platforms).
- The PDF exporter (`src/lib/pdf/quotation-pdf.tsx`) registers
  `PhetsarathOT.ttf` with `@react-pdf/renderer` to render Lao quotations
  with correct Unicode shaping.
