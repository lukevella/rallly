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
          className="fixed bottom-4 left-4 z-50 max-w-sm rounded-xl border bg-white p-4 shadow-lg"
        >
          <p className="text-sm">
            <Trans
              i18nKey="cookieConsentMessage"
              defaults="We use cookies to improve your experience. You can opt out of certain cookies."
            />{" "}
            <Link className="underline" href="/cookie-policy">
              <Trans i18nKey="cookieConsentLearnMore" defaults="Learn more" />
            </Link>
          </p>
          <div className="mt-4 flex gap-2">
            <Button variant="primary" onClick={accept}>
              <Trans i18nKey="cookieConsentAccept" defaults="Accept" />
            </Button>
            <Button onClick={reject}>
              <Trans i18nKey="cookieConsentReject" defaults="Reject" />
            </Button>
          </div>
        </section>
      ) : null}
    </>
  );
}
