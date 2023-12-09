import "tailwindcss/tailwind.css";
import "../../style.css";

import languages from "@rallly/languages";
import { Inter } from "next/font/google";
import React from "react";

import { Providers } from "@/app/providers";

import Toaster from "./toaster";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

export async function generateStaticParams() {
  return Object.keys(languages).map((locale) => ({ locale }));
}

export default function Root({
  children,
  params: { locale },
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  return (
    <html lang={locale} className={inter.className}>
      <body className="h-screen overflow-y-scroll">
        <Toaster />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
