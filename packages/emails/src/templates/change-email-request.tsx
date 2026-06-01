import { Section } from "@react-email/components";
import { Trans } from "react-i18next/TransWithoutContext";

import { EmailLayout } from "../components/email-layout";
import { Button, Heading, Text } from "../components/styled-components";
import { createEmailTemplate } from "../create-email-template";
import type { EmailContext } from "../types";

interface ChangeEmailRequestProps {
  ctx: EmailContext;
  verificationUrl: string;
  fromEmail: string;
  toEmail: string;
}

export const ChangeEmailRequest = ({
  ctx,
  verificationUrl,
  fromEmail,
  toEmail,
}: ChangeEmailRequestProps) => {
  return (
    <EmailLayout
      ctx={ctx}
      preview={ctx.t("changeEmailRequest_preview", {
        ns: "emails",
        defaultValue: "Please verify your email address",
      })}
    >
      <Heading>
        {ctx.t("changeEmailRequest_heading", {
          defaultValue: "Verify Your New Email Address",
          ns: "emails",
        })}
      </Heading>
      <Text>
        <Trans
          {...ctx.i18nProps}
          i18nKey="changeEmailRequest_text1"
          defaults="We've received a request to change the email address for your account from <b>{fromEmail}</b> to <b>{toEmail}</b>."
          values={{ fromEmail, toEmail }}
          components={{ b: <b /> }}
        />
      </Text>
      <Text>
        {ctx.t("changeEmailRequest_text2", {
          defaultValue:
            "To complete this change, please click the button below:",
          ns: "emails",
        })}
      </Text>
      <Section>
        <Button href={verificationUrl} color={ctx.primaryColor}>
          {ctx.t("changeEmailRequest_button", {
            ns: "emails",
            defaultValue: "Verify Email Address",
          })}
        </Button>
      </Section>
      <Text light>
        {ctx.t("changeEmailRequest_text3", {
          ns: "emails",
          defaultValue:
            "This link will expire in 10 minutes. If you did not request this change, please contact support.",
        })}
      </Text>
    </EmailLayout>
  );
};

export const sendChangeEmailRequest = createEmailTemplate({
  component: ChangeEmailRequest,
  subject: (_props, ctx) =>
    ctx.t("changeEmailRequest_subject", {
      defaultValue: "Verify your new email address",
      ns: "emails",
    }),
});
