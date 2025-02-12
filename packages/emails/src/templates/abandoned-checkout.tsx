import { Section } from "@react-email/components";
import { Trans } from "react-i18next/TransWithoutContext";

import { EmailLayout } from "../components/email-layout";
import { Button, Card, Signature, Text } from "../components/styled-components";
import type { EmailContext } from "../types";

interface AbandonedCheckoutEmailProps {
  recoveryUrl: string;
  discount: number;
  couponCode: string;
  name?: string;
  ctx: EmailContext;
}

export const AbandonedCheckoutEmail = ({
  recoveryUrl,
  discount,
  couponCode,
  name,
  ctx,
}: AbandonedCheckoutEmailProps) => {
  return (
    <EmailLayout
      ctx={ctx}
      poweredBy={false}
      preview={ctx.t("abandoned_checkout_preview", {
        defaultValue:
          "Exclusive offer: Get {{discount}}% off your first year of Rallly Pro!",
        discount,
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
          defaults="To help you get started, I'd like to offer you <b>{{discount}}% off your first year</b> with Rallly Pro. Simply use this code during checkout:"
          ns="emails"
          values={{
            discount,
          }}
          components={{
            b: <b />,
          }}
        />
      </Text>
      <Section style={{ marginTop: 16, marginBottom: 16 }}>
        <Card>
          <Text
            style={{
              textAlign: "center",
              fontFamily: "monospace",
              fontWeight: "bold",
            }}
          >
            {couponCode}
          </Text>
        </Card>
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
  return (
    "🎉 " +
    ctx.t("abandoned_checkout_subject", {
      defaultValue: "Get {{discount}}% off your first year of Rallly Pro",
      discount: props.discount,
      ns: "emails",
    })
  );
};

export default AbandonedCheckoutEmail;
