import type { Namespace } from "i18next";
import { notFound } from "next/navigation";
import { defaultNS, fallbackLng, languages } from "@/i18n/settings";
import { i18next } from "./i18next";

export async function getTranslation<Ns extends Namespace>(
  locale: string = fallbackLng,
  ns: string | string[] = defaultNS,
) {
  // The proxy skips paths containing a dot, so they reach [locale] with the raw
  // path as the locale, e.g. "ads.txt". Rendering those downstream throws a
  // RangeError from Intl, surfacing as a 500 instead of a 404.
  if (!languages.includes(locale)) {
    notFound();
  }

  const lng = locale;
  if (lng && i18next.resolvedLanguage !== lng) {
    await i18next.changeLanguage(lng);
  }

  if (ns && !i18next.hasLoadedNamespace(ns)) {
    await i18next.loadNamespaces(ns);
  }
  return {
    t: i18next.getFixedT<Ns>(lng),
    i18n: i18next,
  };
}
