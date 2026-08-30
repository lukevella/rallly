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
      className="fixed bottom-4 left-4 z-50 flex max-w-[min(32rem,calc(100vw-2rem))] flex-wrap items-center gap-x-6 gap-y-3 rounded-xl border bg-background p-4 shadow-lg"
    >
      <p className="min-w-0 flex-1 basis-56 text-pretty text-sm">
        <Trans
          i18nKey="cookieConsentIntro"
          defaults="We use cookies to improve your experience."
        />
        {isSelfHosted ? null : (
          <>
            {" "}
            <Trans
              i18nKey="cookieConsentPolicy"
              defaults="Learn more in our <policyLink>cookie policy</policyLink>."
              components={{
                policyLink: (
                  <a
                    className="underline"
                    href="https://rallly.co/cookie-policy"
                    target="_blank"
                    rel="noreferrer"
                  />
                ),
              }}
            />
          </>
        )}
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
  );
}
