"use client";
import httpBackend from "i18next-http-backend";
import type React from "react";
import {
  I18nextProvider,
  useTranslation as useTranslationOrg,
} from "react-i18next";
import useAsync from "react-use/lib/useAsync";

import { initI18next } from "./i18n";
import { defaultNS } from "./settings";

export function useTranslation() {
  return useTranslationOrg("app");
}

export function I18nProvider({
  children,
  locale,
}: {
  children: React.ReactNode;
  locale: string;
}) {
  const res = useAsync(async () => {
    return await initI18next({
      lng: locale,
      middleware: (i18n) => {
        i18n.use(httpBackend);
      },
    });
  });

  if (!res.value) {
    return null;
  }

  return (
    <I18nextProvider i18n={res.value.i18n} defaultNS={defaultNS}>
      {children}
    </I18nextProvider>
  );
}
