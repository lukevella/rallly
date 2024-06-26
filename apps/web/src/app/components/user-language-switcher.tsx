"use client";

import { useRouter } from "next/navigation";

import { LanguageSelect } from "@/components/poll/language-selector";
import { usePreferences } from "@/contexts/preferences";
import { useTranslation } from "@/i18n/client";

export function UserLanguageSwitcher() {
  const { i18n } = useTranslation();
  const { preferences, updatePreferences } = usePreferences();
  const router = useRouter();
  return (
    <LanguageSelect
      value={preferences.locale ?? i18n.language}
      onChange={async (language) => {
        await updatePreferences({ locale: language });
        router.refresh();
      }}
    />
  );
}
