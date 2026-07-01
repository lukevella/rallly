"use client";

import { useUser } from "@/components/user-provider";
import { getLocaleDefaults } from "@/lib/datetime/locales";
import { useLocale } from "@/lib/locale/client";

export function usePreferredTimeFormat() {
  const { user } = useUser();
  const { locale } = useLocale();
  return user?.timeFormat ?? getLocaleDefaults(locale).timeFormat;
}
