import "tailwindcss/tailwind.css";
import "../../style.css";

import { Toaster } from "@rallly/ui/toaster";
import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { SessionProvider } from "next-auth/react";
import React from "react";

import { TimeZoneChangeDetector } from "@/app/[locale]/timezone-change-detector";
import { Providers } from "@/app/providers";
import { auth } from "@/next-auth";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default async function Root({
  children,
  params: { locale },
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const session = await auth();

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

export const metadata: Metadata = {
  title: {
    template: "%s | Rallly",
    default: "Rallly",
  },
};
