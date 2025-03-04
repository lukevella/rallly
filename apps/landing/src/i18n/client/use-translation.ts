import type { Namespace } from "i18next";
import { useTranslation as useTranslationOrg } from "react-i18next";

export function useTranslation(ns?: Namespace) {
  return useTranslationOrg(ns);
}
