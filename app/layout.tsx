import type { Metadata } from "next";
import { Open_Sans } from "next/font/google";
import "./globals.css";

/** Primary UI font (sans + mono utilities use the same stack — see globals.css @theme). */
const openSans = Open_Sans({
  variable: "--font-open-sans",
  subsets: ["latin", "latin-ext"],
  weight: "variable",
  display: "swap",
  fallback: ["Helvetica Neue", "Helvetica", "Arial", "sans-serif"],
});

export const metadata: Metadata = {
  title: "WeWok.dtk - Sistem Informasi Perusahaan",
  description: "ERP untuk digital agency dengan multi-entitas, talent pooling, dan payroll BOPP/TOPP",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={`${openSans.variable} h-full antialiased dark`}>
      <body className="min-h-full flex flex-col bg-slate-950 text-slate-100">
        {children}
      </body>
    </html>
  );
}
