import "tailwindcss/tailwind.css";
import "../../style.css";

import { Toaster } from "@rallly/ui/toaster";
import type { Viewport } from "next";
import { Inter } from "next/font/google";
import React from "react";

import { TimeZoneChangeDetector } from "@/app/[locale]/timezone-change-detector";
import { Providers } from "@/app/providers";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function Root({
  children,
  params: { locale },
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  return (
    <html lang={locale} className={inter.className}>
      <body>
        <Toaster />
        <Providers>
          {children}
          <TimeZoneChangeDetector />
        </Providers>
      </body>
    </html>
  );
}
