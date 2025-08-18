import type { Namespace } from "i18next";
import { headers } from "next/headers";
import { defaultNS, fallbackLng, headerName } from "@/i18n/settings";
import { i18next } from "./i18next";

export async function getTranslation<Ns extends Namespace>(
  ns: string | string[] = defaultNS,
) {
  const headerList = await headers();
  const lng = headerList.get(headerName);
  if (lng && i18next.resolvedLanguage !== lng) {
    await i18next.changeLanguage(lng);
  }

  if (ns && !i18next.hasLoadedNamespace(ns)) {
    await i18next.loadNamespaces(ns);
  }
  return {
    t: i18next.getFixedT<Ns>(lng ?? fallbackLng),
    i18n: i18next,
  };
}
