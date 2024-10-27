"use client";

import { useRouter } from "next/navigation";

import { useTranslation } from "@/app/i18n/client";
import { LanguageSelect } from "@/components/poll/language-selector";
import { usePreferences } from "@/contexts/preferences";

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
