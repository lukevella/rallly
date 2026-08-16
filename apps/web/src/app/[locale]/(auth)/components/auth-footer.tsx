"use client";

import { useRouter } from "next/navigation";
import { LanguageSelect } from "@/components/language-selector";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { useTranslation } from "@/i18n/client";
import { setLocaleCookie, useLocale } from "@/lib/locale/client";

export function AuthFooter() {
  const { t } = useTranslation();
  const router = useRouter();
  const { locale } = useLocale();

  return (
    // h-50 mirrors the header's 200px logo slot so the vertically centered
    // content sits at the true middle of the page
    <footer className="flex h-50 items-end justify-center gap-x-4">
      <LanguageSelect
        aria-label={t("language", { defaultValue: "Language" })}
        value={locale}
        onChange={(language) => {
          setLocaleCookie(language);
          router.refresh();
        }}
      />
      <ThemeSwitcher />
    </footer>
  );
}
