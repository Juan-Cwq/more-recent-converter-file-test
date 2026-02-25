import type { Metadata } from "next";
import { Inter, DM_Serif_Display } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const dmSerif = DM_Serif_Display({
  variable: "--font-dm-serif",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Convert to it! - Universal File Converter",
  description:
    "A truly private file converter powered by WebAssembly. Convert 100+ formats instantly - all processing happens in your browser. No uploads, no servers, no risk.",
  keywords: [
    "file converter",
    "private",
    "secure",
    "WebAssembly",
    "offline",
    "local",
    "browser",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} ${dmSerif.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
