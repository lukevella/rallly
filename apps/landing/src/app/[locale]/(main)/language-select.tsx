"use client";

import languages, { defaultLocale } from "@rallly/languages";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@rallly/ui/select";
import { useParams, usePathname, useRouter } from "next/navigation";
import { useTranslation } from "@/i18n/client/use-translation";

export const LanguageSelect = () => {
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const { t } = useTranslation();
  const params = useParams<{ locale?: string }>();
  const locale = params.locale ?? defaultLocale;
  return (
    <Select
      items={languages}
      value={locale}
      onValueChange={(newLocale) => {
        if (!newLocale) {
          return;
        }

        // The default locale is served without a prefix, so only strip the
        // current locale when it is actually the first path segment.
        const newPath =
          pathname === `/${locale}` || pathname.startsWith(`/${locale}/`)
            ? pathname.slice(locale.length + 1)
            : pathname;

        router.replace(`/${newLocale}${newPath}`);
      }}
    >
      <SelectTrigger
        className="w-full"
        aria-label={t("language", { defaultValue: "Language" })}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {Object.entries(languages).map(([code, name]) => (
          <SelectItem key={code} value={code}>
            {name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
