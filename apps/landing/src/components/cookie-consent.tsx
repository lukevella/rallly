"use client";
import { useCookieConsent } from "@rallly/posthog/client";
import { Button } from "@rallly/ui/button";
import { Analytics } from "@vercel/analytics/react";
import Link from "next/link";
import { Trans } from "@/i18n/client/trans";
import { useTranslation } from "@/i18n/client/use-translation";

export function CookieConsent() {
  const { t } = useTranslation();
  const { status, accept, reject } = useCookieConsent();

  return (
    <>
      {status === "granted" ? <Analytics /> : null}
      {status === "pending" ? (
        <section
          aria-label={t("cookieConsentLabel", {
            defaultValue: "Cookie consent",
          })}
          className="fixed bottom-4 left-4 z-50 flex max-w-[calc(100vw-2rem)] flex-wrap items-start gap-x-6 gap-y-3 rounded-xl border bg-white p-4 shadow-lg"
        >
          <p className="min-w-0 max-w-prose flex-1 basis-56 text-pretty text-sm">
            <Trans
              i18nKey="cookieConsentIntro"
              defaults="We use cookies to improve your experience."
            />{" "}
            <Trans
              i18nKey="cookieConsentPolicy"
              defaults="Learn more in our <policyLink>cookie policy</policyLink>."
              components={{
                policyLink: (
                  <Link className="underline" href="/cookie-policy" />
                ),
              }}
            />
          </p>
          <div className="flex gap-2">
            <Button onClick={reject}>
              <Trans i18nKey="cookieConsentOptOut" defaults="Opt out" />
            </Button>
            <Button variant="primary" onClick={accept}>
              <Trans i18nKey="cookieConsentAccept" defaults="Accept" />
            </Button>
          </div>
        </section>
      ) : null}
    </>
  );
}
