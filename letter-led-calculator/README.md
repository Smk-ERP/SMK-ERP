# Letter LED Sign Price Calculator

A responsive React + Tailwind CSS app to calculate the selling price of LED-lit letters in THB.

## Calculators

1. **Front-lit Letter** — acrylic face lit from inside.
2. **Back-lit Letter** — halo-effect letters with LEDs behind.
3. **Edge-lit Letter** — clear acrylic lit from the edge with LED strips.
4. **Lightbox Letter** — built lightbox-style letters.

## Run

```bash
npm install
npm run dev
```

Open the URL shown in the terminal (default http://localhost:5173).

## Formula

```
Subtotal       = Material + LED + Power Supply + Machine + Labor + Transport
Waste Cost     = Subtotal * Waste% / 100
Overhead Cost  = Subtotal * Overhead% / 100
Total Cost     = Subtotal + Waste Cost + Overhead Cost
Selling Price  = Total Cost / (1 - Profit% / 100)
Gross Profit   = Selling Price - Total Cost
```
