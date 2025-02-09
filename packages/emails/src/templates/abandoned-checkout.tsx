import { Section } from "@react-email/components";
import { Trans } from "react-i18next/TransWithoutContext";

import { EmailLayout } from "../components/email-layout";
import { Button, Card, Text } from "../components/styled-components";
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
          defaults="I noticed you were checking out Rallly Pro earlier. I wanted to reach out to see if you had any questions or needed help with anything."
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
          defaults="To help you get started, you can get 20% off your first year. Just use the code below when you check out:"
          ns="emails"
        />
      </Text>
      <Card>
        <Text style={{ textAlign: "center", fontWeight: "bold" }}>
          WELCOME20
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
            defaults="If you have any questions about Rallly Pro or need help with anything at all, just reply to this email. I'm here to help!"
            ns="emails"
          />
        </Text>
      </Section>
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
