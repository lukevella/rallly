"use client";
import { useParams } from "next/navigation";
import React from "react";
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

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const params = useParams<{ locale: string }>();
  const locale = params?.locale ?? defaultNS;

  const res = useAsync(async () => {
    return await initI18next(locale, "app");
  });

  if (!res.value) {
    return null;
  }

  return (
    <I18nextProvider i18n={res.value} defaultNS={defaultNS}>
      {children}
    </I18nextProvider>
  );
}
