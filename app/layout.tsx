import type { Metadata } from "next";
import { Cormorant_Garamond, Manrope, Noto_Sans_SC } from "next/font/google";
import "@/app/globals.css";
import { SiteChrome } from "@/components/layout/site-chrome";
import { siteInfo } from "@/data/site";

const manrope = Manrope({
  variable: "--font-sans",
  subsets: ["latin"]
});

const cormorant = Cormorant_Garamond({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700"]
});

const notoSansSC = Noto_Sans_SC({
  variable: "--font-cjk",
  subsets: ["latin"]
});

export const metadata: Metadata = {
  metadataBase: new URL(siteInfo.url),
  title: {
    default: `${siteInfo.name} | ${siteInfo.title}`,
    template: `%s | ${siteInfo.name}`
  },
  description: siteInfo.description
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body
        className={`${manrope.variable} ${cormorant.variable} ${notoSansSC.variable} font-[var(--font-sans)] antialiased`}
      >
        <SiteChrome>{children}</SiteChrome>
      </body>
    </html>
  );
}
