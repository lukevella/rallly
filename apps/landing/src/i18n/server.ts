import type { Namespace } from "i18next";
import { headers } from "next/headers";
import { defaultNS, headerName } from "@/i18n/settings";
import { i18next } from "./i18next";

export async function getTranslation<Ns extends Namespace>(
  locale: string,
  ns = defaultNS,
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
    t: i18next.getFixedT<Ns>(locale),
    i18n: i18next,
  };
}
