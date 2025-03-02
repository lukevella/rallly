"use client";
import i18next from "i18next";
import ICU from "i18next-icu";
import resourcesToBackend from "i18next-resources-to-backend";
import React from "react";
import { I18nextProvider, initReactI18next } from "react-i18next";
import { useAsync } from "react-use";

import { defaultNS, getOptions } from "../settings";

async function initTranslations(lng: string) {
  const i18n = i18next
    .use(initReactI18next)
    .use(ICU)
    .use(
      resourcesToBackend(
        (language: string, namespace: string) =>
          import(`../../public/locales/${language}/${namespace}.json`),
      ),
    );
  await i18n.init(getOptions(lng));

  return i18n;
}

export function I18nProvider({
  locale,
  children,
}: {
  locale: string;
  children: React.ReactNode;
}) {
  const res = useAsync(async () => {
    return await initTranslations(locale);
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
