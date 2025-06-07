"use client";

import { SearchInput } from "@/app/components/search-input";
import { useTranslation } from "@/i18n/client";

export function UserSearchInput() {
  const { t } = useTranslation();
  return (
    <SearchInput
      placeholder={t("searchUsers", {
        defaultValue: "Search users...",
      })}
    />
  );
}
