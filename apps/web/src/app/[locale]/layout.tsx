import "tailwindcss/tailwind.css";
import "../../style.css";

import { Toaster } from "@rallly/ui/toaster";
import type { Viewport } from "next";
import { Inter } from "next/font/google";
import React from "react";

import { TimeZoneChangeDetector } from "@/app/[locale]/timezone-change-detector";
import { Providers } from "@/app/providers";
import { getServerSession } from "@/auth";
import { SessionProvider } from "@/auth/session-provider";

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

export default async function Root({
  children,
  params: { locale },
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const session = await getServerSession();

  return (
    <html lang={locale} className={inter.className}>
      <body>
        <Toaster />
        <SessionProvider session={session}>
          <Providers>
            {children}
            <TimeZoneChangeDetector />
          </Providers>
        </SessionProvider>
      </body>
    </html>
  );
}
