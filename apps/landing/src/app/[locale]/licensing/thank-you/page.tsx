import { Trans } from "@/i18n/client/trans";
import Image from "next/image";
import Link from "next/link";

export default function LicensingThankYouPage() {
  return (
    <main className="p-4 sm:p-16 h-dvh flex flex-col sm:justify-center relative">
      <div className="w-full relative z-10 max-w-2xl mx-auto space-y-6">
        <div className="py-4">
          <Link className="inline-block rounded" href="/">
            <Image src="/logo.svg" width={150} height={30} alt="rallly.co" />
          </Link>
        </div>
        <div className="space-y-4">
          <h1 className="text-2xl font-bold tracking-tight">
            <Trans
              i18nKey="licensingThankYouTitle"
              defaults="Thank You for Your Purchase!"
            />
          </h1>
          <p>
            <Trans
              i18nKey="licensingThankYouSubtitle"
              defaults="Your Rallly self-hosted license is confirmed. We're excited to have you on board!"
            />
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold">
            <Trans i18nKey="licensingThankYouLicense" defaults="Next Steps" />
          </h2>
          <p className="text-gray-700 dark:text-gray-300">
            <Trans
              i18nKey="licensingThankYouLicenseEmailed"
              defaults="Your license key has been sent to the email address you provided during checkout. Please check your inbox."
            />
          </p>

          <ul className="space-y-1 list-disc list-inside">
            <li>
              <Link
                className="text-link"
                href="https://support.rallly.co/self-hosted/installation"
              >
                <Trans
                  i18nKey="licensingThankYouNextStepsInstallation"
                  defaults="Installation Guide"
                />
              </Link>
            </li>
            <li>
              <Link
                className="text-link"
                href="https://support.rallly.co/self-hosted/licensing"
              >
                <Trans
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
              i18nKey="licensingThankYouGoHomeLink"
              defaults="Return to Home"
            />
          </Link>
        </div>
      </div>
    </main>
  );
}
