import type { Metadata } from "next";
import "./globals.css";
import { I18nProvider } from "@/lib/i18n/context";
import { DEFAULT_LOCALE } from "@/lib/i18n/config";
import { ThemeProvider } from "@/lib/theme";

export const metadata: Metadata = {
  title: "The Signmaker ERP",
  description: "Signage & Print Production ERP (Laos)",
  icons: { icon: "/favicon.ico" }
};

// Inline script — applies theme class BEFORE React hydration to avoid flash.
const themeInitScript = `
  (function(){
    try {
      var t = localStorage.getItem('smk.theme') || 'system';
      var resolved = t === 'system'
        ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
        : t;
      if (resolved === 'dark') document.documentElement.classList.add('dark');
    } catch (e) {}
  })();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang={DEFAULT_LOCALE} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-screen bg-background antialiased">
        <ThemeProvider>
          <I18nProvider initialLocale={DEFAULT_LOCALE}>
            {children}
          </I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
