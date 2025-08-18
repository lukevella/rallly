import Image from "next/image";
import Link from "next/link";
import { Trans } from "react-i18next/TransWithoutContext";
import { getTranslation } from "@/i18n/server";

export default async function LicensingThankYouPage() {
  const { t } = await getTranslation();
  return (
    <main className="relative flex h-dvh flex-col p-4 sm:justify-center sm:p-16">
      <div className="relative z-10 mx-auto w-full max-w-2xl space-y-6">
        <div className="py-4">
          <Link className="inline-block rounded" href="/">
            <Image src="/logo.svg" width={150} height={30} alt="rallly.co" />
          </Link>
        </div>
        <div className="space-y-4">
          <h1 className="font-bold text-2xl tracking-tight">
            <Trans
              t={t}
              i18nKey="licensingThankYouTitle"
              defaults="Thank You for Your Purchase!"
            />
          </h1>
          <p>
            <Trans
              t={t}
              i18nKey="licensingThankYouSubtitle"
              defaults="Your Rallly self-hosted license is confirmed. We're excited to have you on board!"
            />
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="font-semibold text-xl">
            <Trans
              t={t}
              i18nKey="licensingThankYouLicense"
              defaults="Next Steps"
            />
          </h2>
          <p className="text-gray-700 dark:text-gray-300">
            <Trans
              t={t}
              i18nKey="licensingThankYouLicenseEmailed"
              defaults="Your license key has been sent to the email address you provided during checkout. Please check your inbox."
            />
          </p>

          <ul className="list-inside list-disc space-y-1">
            <li>
              <Link
                className="text-link"
                href="https://support.rallly.co/self-hosting/installation/docker"
              >
                <Trans
                  t={t}
                  i18nKey="licensingThankYouNextStepsInstallation"
                  defaults="Installation Guide"
                />
              </Link>
            </li>
            <li>
              <Link
                className="text-link"
                href="https://support.rallly.co/self-hosting/licensing#activating-your-license"
              >
                <Trans
                  t={t}
                  i18nKey="licensingThankYouNextStepsApplyLicense"
                  defaults="How to Apply Your License"
                />
              </Link>
            </li>
          </ul>
        </div>

        <div className="text-muted-foreground">
          <p className="mb-6">
            <Trans
              t={t}
              i18nKey="licensingThankYouSupportPrompt"
              defaults="Need help or have questions? Visit our <0>self-hosted docs</0> or <1>contact us</1>."
              components={[
                <Link
                  key="self-hosted-docs"
                  href="https://support.rallly.co"
                  className="underline"
                />,
                <Link
                  key="contact-us"
                  href="mailto:support@rallly.co"
                  className="underline"
                />,
              ]}
            />
          </p>
          <Link href="/" className="hover:underline">
            <Trans
              t={t}
              i18nKey="licensingThankYouGoHomeLink"
              defaults="Return to Home"
            />
          </Link>
        </div>
      </div>
    </main>
  );
}
