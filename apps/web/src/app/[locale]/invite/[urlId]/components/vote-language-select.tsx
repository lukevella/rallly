"use client";

import { posthog } from "@rallly/posthog/client";
import {
  LanguageSelect,
  LanguageSelectButton,
  LanguageSelectContent,
} from "@rallly/ui/language-select";
import { useRouter } from "next/navigation";
import React from "react";
import { useTranslation } from "@/i18n/client";
import { setLocaleCookie, useLocale } from "@/lib/locale/client";

/**
 * Switches the page's language for this browser only. A signed-in viewer's
 * account language is left alone: the cookie takes precedence when rendering.
 */
export function VoteLanguageSelect({ pollId }: { pollId: string }) {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const router = useRouter();
  const [, startTransition] = React.useTransition();
  const label = t("language", { defaultValue: "Language" });

  return (
    <LanguageSelect
      value={locale}
      onOpenChange={(open) => {
        if (open) {
          posthog?.capture("poll_vote:language_select_open", {
            poll_id: pollId,
            locale,
          });
        }
      }}
      onValueChange={(nextLocale) => {
        if (nextLocale === locale) {
          return;
        }
        setLocaleCookie(nextLocale);
        posthog?.capture("poll_vote:language_change", {
          poll_id: pollId,
          from: locale,
          to: nextLocale,
        });
        startTransition(() => router.refresh());
      }}
    >
      <LanguageSelectButton label={label} />
      <LanguageSelectContent />
    </LanguageSelect>
  );
}
