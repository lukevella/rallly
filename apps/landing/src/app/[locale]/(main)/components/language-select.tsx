"use client";

import languages, { supportedLngs } from "@rallly/languages";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@rallly/ui/select";
import { usePathname, useRouter } from "next/navigation";

export const LanguageSelect = ({ language }: { language: string }) => {
  const router = useRouter();
  const pathname = usePathname() ?? "";

  return (
    <Select
      value={language}
      onValueChange={(newLocale) => {
        const isLocalizedPath = supportedLngs.some((lng) =>
          pathname?.startsWith(`/${lng}`),
        );

        const newPath = isLocalizedPath
          ? pathname.replace(new RegExp(`^/${language}`), "")
          : pathname;

        router.replace(`/${newLocale}${newPath}`);
      }}
    >
      <SelectTrigger className="w-full">
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
