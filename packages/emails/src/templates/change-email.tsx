import { Section } from "@react-email/components";
import { Trans } from "react-i18next/TransWithoutContext";

import { EmailLayout } from "../components/email-layout";
import {
  Card,
  Domain,
  Heading,
  Link,
  Text,
  trackingWide,
} from "../components/styled-components";
import { createEmailTemplate } from "../create-email-template";
import type { EmailContext } from "../types";

interface ChangeEmailEmailProps {
  code: string;
  ctx: EmailContext;
}

export const ChangeEmailEmail = ({ code, ctx }: ChangeEmailEmailProps) => {
  return (
    <EmailLayout
      ctx={ctx}
      preview={ctx.t("changeEmail_preview", {
        ns: "emails",
        defaultValue: "Your 6-digit code is: {code}",
        code,
      })}
    >
      <Heading>
        {ctx.t("changeEmail_heading", {
          defaultValue: "Verify your new email address",
          ns: "emails",
        })}
      </Heading>
      <Text>
        {ctx.t("changeEmail_text", {
          defaultValue:
            "Please use the following 6-digit verification code to confirm your new email address",
          ns: "emails",
        })}
      </Text>
      <Card style={{ textAlign: "center" }}>
        <Text
          style={{
            ...trackingWide,
            textAlign: "center",
            fontSize: "32px",
            fontWeight: "bold",
          }}
          id="code"
        >
          {code}
        </Text>
        <Text style={{ textAlign: "center" }} light={true}>
          {ctx.t("changeEmail_codeValid", {
            defaultValue: "This code is valid for 15 minutes",
            ns: "emails",
          })}
        </Text>
      </Card>
      <Section>
        <Text light={true}>
          <Trans
            {...ctx.i18nProps}
            i18nKey="changeEmail_content2"
            defaults="You're receiving this email because a request was made to change the email address of an account on <domain />. If this wasn't you contact <a>{supportEmail}</a>."
            values={{ supportEmail: ctx.supportEmail }}
            components={{
              domain: <Domain ctx={ctx} />,
              a: (
                <Link
                  color={ctx.primaryColor}
                  href={`mailto:${ctx.supportEmail}`}
                />
              ),
            }}
          />
        </Text>
      </Section>
    </EmailLayout>
  );
};

export const sendChangeEmailEmail = createEmailTemplate({
  component: ChangeEmailEmail,
  subject: (_props, ctx) =>
    ctx.t("changeEmail_subject", {
      defaultValue: "Verify your new email address",
      ns: "emails",
    }),
});
