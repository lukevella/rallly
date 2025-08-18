"use client";
import { defaultLocale } from "@rallly/languages";
import { createInstance } from "i18next";
import ICU from "i18next-icu";
import React from "react";
import { I18nextProvider, initReactI18next } from "react-i18next";
import { defaultNS, languages } from "../settings";

export function I18nProvider({
  locale,
  children,
}: {
  locale: string;
  children: React.ReactNode;
}) {
  const [i18n] = React.useState(() => {
    return createInstance({
      supportedLngs: languages,
      fallbackLng: defaultLocale,
      lng: locale,
      fallbackNS: defaultNS,
      defaultNS,
      initImmediate: false,
      // Disable debug in production
      debug: process.env.NODE_ENV === "development",
    })
      .use(initReactI18next)
      .use(ICU);
  });

  return (
    <I18nextProvider i18n={i18n} defaultNS={defaultNS}>
      {children}
    </I18nextProvider>
  );
}
