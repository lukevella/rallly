"use client";
import { useCookieConsent } from "@rallly/posthog/client";
import { Button } from "@rallly/ui/button";
import { isSelfHosted } from "@/components/environment";
import { Trans, useTranslation } from "@/i18n/client";

export function CookieConsentBanner() {
  const { t } = useTranslation();
  const { status, accept, reject } = useCookieConsent();

  if (status !== "pending") {
    return null;
  }

  return (
    <section
      aria-label={t("cookieConsentLabel", { defaultValue: "Cookie consent" })}
      className="fixed bottom-4 left-4 z-50 max-w-sm rounded-xl border bg-background p-4 shadow-lg"
    >
      <p className="text-sm">
        <Trans
          i18nKey="cookieConsentMessage"
          defaults="We use cookies to improve your experience. You can opt out of certain cookies."
        />
        {isSelfHosted ? null : (
          <>
            {" "}
            <a
              className="underline"
              href="https://rallly.co/cookie-policy"
              target="_blank"
              rel="noreferrer"
            >
              <Trans i18nKey="cookieConsentLearnMore" defaults="Learn more" />
            </a>
          </>
        )}
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
  );
}
