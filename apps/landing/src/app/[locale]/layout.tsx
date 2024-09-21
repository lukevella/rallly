import "tailwindcss/tailwind.css";
import "../../style.css";

import languages from "@rallly/languages";
import { Viewport } from "next";
import { Inter } from "next/font/google";
import React from "react";

import PageLayout from "@/components/layouts/page-layout";
import { I18nProvider } from "@/i18n/client";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

export async function generateStaticParams() {
  return Object.keys(languages).map((locale) => ({ locale }));
}

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
        <I18nProvider>
          <PageLayout>{children}</PageLayout>
        </I18nProvider>
      </body>
    </html>
  );
}
