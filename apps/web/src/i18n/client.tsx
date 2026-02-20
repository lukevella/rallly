"use client";

import type { Resource } from "i18next";
import { createInstance } from "i18next";
import ICU from "i18next-icu";
import type React from "react";
import { useMemo } from "react";
import {
  Trans as BaseTrans,
  I18nextProvider,
  useTranslation as useTranslationOrg,
} from "react-i18next";
import { initReactI18next } from "react-i18next/initReactI18next";
import { defaultNS, getOptions } from "./settings";
import type { TxKeyPath } from "./types";

export function useTranslation() {
  return useTranslationOrg("app");
}

export function I18nProvider({
  children,
  locale,
  resources,
}: {
  children: React.ReactNode;
  locale: string;
  resources: Resource;
}) {
  const i18n = useMemo(() => {
    const instance = createInstance().use(initReactI18next).use(ICU);
    instance.init({
      ...getOptions(locale),
      resources,
    });
    return instance;
  }, [locale, resources]);

  return (
    <I18nextProvider i18n={i18n} defaultNS={defaultNS}>
      {children}
    </I18nextProvider>
  );
}

export const Trans = (
  props: React.ComponentProps<typeof BaseTrans> & { i18nKey: TxKeyPath },
) => {
  const { t } = useTranslation();
  return <BaseTrans ns="app" t={t} {...props} />;
};
