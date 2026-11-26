"use client";

import { defaultLocale } from "@rallly/languages";
import {
  LanguageSelectContent,
  LanguageSelect as LanguageSelectRoot,
  LanguageSelectTrigger,
} from "@rallly/ui/language-select";
import { useParams, usePathname, useRouter } from "next/navigation";

export const LanguageSelect = ({ label }: { label: string }) => {
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const params = useParams<{ locale?: string }>();
  const locale = params.locale ?? defaultLocale;
  return (
    <LanguageSelectRoot
      value={locale}
      onValueChange={(newLocale) => {
        // The default locale is served without a prefix, so only strip the
        // current locale when it is actually the first path segment.
        const newPath =
          pathname === `/${locale}` || pathname.startsWith(`/${locale}/`)
            ? pathname.slice(locale.length + 1)
            : pathname;

        router.replace(`/${newLocale}${newPath}`);
      }}
    >
      <LanguageSelectTrigger className="w-full" aria-label={label} />
      <LanguageSelectContent />
    </LanguageSelectRoot>
  );
};
