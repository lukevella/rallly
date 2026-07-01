"use client";

import { useUser } from "@/components/user-provider";
import { useLocale } from "@/lib/locale/client";
import { getLocaleDefaults } from "@/lib/localization/locales";

export function usePreferredTimeFormat() {
  const { user } = useUser();
  const { locale } = useLocale();
  return user?.timeFormat ?? getLocaleDefaults(locale).timeFormat;
}
