import { Section } from "@react-email/components";
import { Trans } from "react-i18next/TransWithoutContext";

import { EmailLayout } from "../components/email-layout";
import { Button, Card, Signature, Text } from "../components/styled-components";
import type { EmailContext } from "../types";

interface AbandonedCheckoutEmailProps {
  recoveryUrl: string;
  name?: string;
  ctx: EmailContext;
}

export const AbandonedCheckoutEmail = ({
  recoveryUrl,
  name,
  ctx,
}: AbandonedCheckoutEmailProps) => {
  return (
    <EmailLayout
      ctx={ctx}
      poweredBy={false}
      preview={ctx.t("abandoned_checkout_preview", {
        defaultValue: "Upgrade to Rallly Pro to get more features and support.",
        ns: "emails",
      })}
    >
      {name ? (
        <Text>
          <Trans
            t={ctx.t}
            i18n={ctx.i18n}
            i18nKey="abandoned_checkout_name"
            defaults="Hey {{name}},"
            values={{ name }}
            ns="emails"
          />
        </Text>
      ) : (
        <Text>
          <Trans
            t={ctx.t}
            i18n={ctx.i18n}
            i18nKey="abandoned_checkout_noname"
            defaults="Hey there,"
            ns="emails"
          />
        </Text>
      )}
      <Text>
        <Trans
          t={ctx.t}
          i18n={ctx.i18n}
          i18nKey="abandoned_checkout_content"
          defaults="I noticed you were exploring <b>Rallly Pro</b> and wanted to personally reach out. I'd love to hear what features caught your interest and answer any questions you might have."
          ns="emails"
          components={{
            b: <b />,
          }}
        />
      </Text>
      <Text>
        <Trans
          t={ctx.t}
          i18n={ctx.i18n}
          i18nKey="abandoned_checkout_offer"
          defaults="To help you get started, I'd like to offer you <b>20% off your first year</b> with Rallly Pro. Simply use this exclusive code during checkout:"
          ns="emails"
          components={{
            b: <b />,
          }}
        />
      </Text>
      <Card style={{ marginTop: 32, marginBottom: 32 }}>
        <Text
          style={{
            textAlign: "center",
            fontFamily: "monospace",
            fontWeight: "bold",
          }}
        >
          GETPRO1Y20
        </Text>
      </Card>
      <Section>
        <Button href={recoveryUrl} id="recoveryUrl">
          <Trans
            i18n={ctx.i18n}
            t={ctx.t}
            i18nKey="abandoned_checkout_button"
            defaults="Upgrade to Rallly Pro"
            ns="emails"
          />
        </Button>
      </Section>
      <Section>
        <Text>
          <Trans
            i18n={ctx.i18n}
            t={ctx.t}
            i18nKey="abandoned_checkout_support"
            defaults="Have questions or need assistance? Just reply to this email."
            ns="emails"
          />
        </Text>
      </Section>
      <Section>
        <Text>
          <Trans
            i18n={ctx.i18n}
            t={ctx.t}
            i18nKey="abandoned_checkout_signoff"
            defaults="Best regards,"
            ns="emails"
          />
        </Text>
      </Section>
      <Signature />
    </EmailLayout>
  );
};

AbandonedCheckoutEmail.getSubject = (
  props: AbandonedCheckoutEmailProps,
  ctx: EmailContext,
) => {
  return ctx.t("abandoned_checkout_subject", {
    defaultValue: "A special offer for Rallly Pro",
    ns: "emails",
  });
};

export default AbandonedCheckoutEmail;
