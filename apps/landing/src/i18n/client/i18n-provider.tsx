"use client";
import { defaultLocale } from "@rallly/languages";
import type { Resource } from "i18next";
import { createInstance } from "i18next";
import ICU from "i18next-icu";
import React from "react";
import { I18nextProvider, initReactI18next } from "react-i18next";
import { defaultNS, languages } from "../settings";

export function I18nProvider({
  locale,
  resources,
  children,
}: {
  locale?: string;
  resources?: Resource;
  children: React.ReactNode;
}) {
  const [i18n] = React.useState(() => {
    const instance = createInstance({
      supportedLngs: languages,
      fallbackLng: defaultLocale,
      lng: locale,
      fallbackNS: defaultNS,
      defaultNS,
      resources,
    });

    instance.use(initReactI18next).use(ICU).init();

    return instance;
  });

  return (
    <I18nextProvider i18n={i18n} defaultNS={defaultNS}>
      {children}
    </I18nextProvider>
  );
}
