"use client";

import { LanguageSelect } from "@/components/language-selector";
import { Trans } from "@/i18n/client";
import { setLocaleCookie, useLocale } from "@/lib/locale/client";

export function CreatePollFooter({
  privacyPolicyUrl,
  termsOfUseUrl,
  supportEmail,
}: {
  privacyPolicyUrl?: string;
  termsOfUseUrl?: string;
  supportEmail: string;
}) {
  const { locale } = useLocale();

  return (
    <footer className="mx-auto flex max-w-4xl items-center justify-between gap-x-4 p-3 pb-6">
      <LanguageSelect
        className="h-8 w-auto gap-x-2 text-muted-foreground text-xs"
        value={locale}
        onChange={(language) => {
          setLocaleCookie(language);
          // A soft refresh remounts the page across the route's streaming
          // Suspense boundary, which makes React regenerate the client tree
          // and lose the draft mid-restore. A full reload takes the proven
          // hard refresh restore path instead.
          window.location.reload();
        }}
      />
      <div className="flex items-center gap-x-4 text-muted-foreground text-xs">
        {privacyPolicyUrl ? (
          <a
            href={privacyPolicyUrl}
            target="_blank"
            rel="noreferrer"
            className="hover:text-foreground"
          >
            <Trans i18nKey="privacyPolicy" defaults="Privacy Policy" />
          </a>
        ) : null}
        {termsOfUseUrl ? (
          <a
            href={termsOfUseUrl}
            target="_blank"
            rel="noreferrer"
            className="hover:text-foreground"
          >
            <Trans i18nKey="termsOfUse" defaults="Terms of Use" />
          </a>
        ) : null}
        <a href={`mailto:${supportEmail}`} className="hover:text-foreground">
          <Trans i18nKey="support" defaults="Support" />
        </a>
      </div>
    </footer>
  );
}
