import { Trans } from "react-i18next/TransWithoutContext";

import { EmailLayout } from "../components/email-layout";
import { Heading, Link, Text } from "../components/styled-components";
import type { EmailContext } from "../types";

interface LicenseKeyEmailProps {
  licenseKey: string;
  tier: string;
  seats: number;
  ctx: EmailContext;
}

export const LicenseKeyEmail = ({
  licenseKey,
  tier,
  seats,
  ctx,
}: LicenseKeyEmailProps) => {
  return (
    <EmailLayout
      poweredBy={false}
      ctx={ctx}
      preview={ctx.t("license_key_preview", {
        defaultValue: "Your license key has been generated.",
        ns: "emails",
      })}
    >
      <Text>
        <Trans
          t={ctx.t}
          i18n={ctx.i18n}
          ns="emails"
          i18nKey="license_key_content"
          defaults="Your purchase has been confirmed and your license key has been generated."
        />
      </Text>
      <Heading as="h2">
        <Trans
          t={ctx.t}
          i18n={ctx.i18n}
          ns="emails"
          i18nKey="license_key_yourKey"
          defaults="License Details"
        />
      </Heading>
      <table>
        <tr>
          <td style={{ paddingRight: "16px" }}>
            <Trans
              t={ctx.t}
              i18n={ctx.i18n}
              ns="emails"
              i18nKey="license_key_plan"
              defaults="Plan"
            />
          </td>
          <td>{tier}</td>
        </tr>
        <tr>
          <td style={{ paddingRight: "16px" }}>
            <Trans
              t={ctx.t}
              i18n={ctx.i18n}
              ns="emails"
              i18nKey="license_key_seats"
              defaults="Seats"
            />
          </td>
          <td>{seats}</td>
        </tr>
        <tr>
          <td style={{ paddingRight: "16px" }}>
            <Trans
              t={ctx.t}
              i18n={ctx.i18n}
              ns="emails"
              i18nKey="license_key_licenseKey"
              defaults="License Key"
            />
          </td>
          <td
            style={{
              fontFamily: "monospace",
              fontSize: "16px",
              letterSpacing: "0.1em",
            }}
          >
            {licenseKey}
          </td>
        </tr>
      </table>
      <Heading as="h2">
        <Trans
          t={ctx.t}
          ns="emails"
          i18nKey="license_key_nextStepsHeading"
          defaults="Next Steps"
        />
      </Heading>
      <Text>
        <Trans
          t={ctx.t}
          ns="emails"
          i18nKey="license_key_activationSteps"
          defaults={
            "Follow these <a>instructions</a> to activate your license on your Rallly Self-Hosted instance."
          }
          components={{
            a: (
              <Link
                className="text-link"
                href="https://support.rallly.co/self-hosting/licensing#activating-your-license"
              />
            ),
          }}
        />
      </Text>
      <Heading as="h2">
        <Trans
          t={ctx.t}
          ns="emails"
          i18nKey="license_key_questionsHeading"
          defaults="Questions?"
        />
      </Heading>
      <Text>
        <Trans
          t={ctx.t}
          ns="emails"
          i18nKey="license_key_support"
          defaults={
            "Reply to this email or contact us at <a>{supportEmail}</a> if you need help."
          }
          values={{ supportEmail: ctx.supportEmail }}
          components={{
            a: <Link className="text-link" href="mailto:support@rallly.co" />,
          }}
        />
      </Text>
      <Text>
        <Trans
          t={ctx.t}
          ns="emails"
          i18nKey="license_key_signoff"
          defaults="Thank you for choosing Rallly!"
        />
      </Text>
    </EmailLayout>
  );
};

LicenseKeyEmail.getSubject = (
  props: LicenseKeyEmailProps,
  ctx: EmailContext,
) => {
  return ctx.t("license_key_subject", {
    defaultValue: "Your Rallly Self-Hosted {tier} License",
    ns: "emails",
    tier: props.tier,
  });
};

export default LicenseKeyEmail;
