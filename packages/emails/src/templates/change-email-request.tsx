import { Section } from "@react-email/section";
import { Trans } from "react-i18next/TransWithoutContext";

import { EmailLayout } from "../components/email-layout";
import { Button, Heading, Text } from "../components/styled-components";
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
          i18n={ctx.i18n}
          t={ctx.t}
          i18nKey="changeEmailRequest_text1"
          ns="emails"
          defaults="We've received a request to change the email address for your account from <b>{{fromEmail}}</b> to <b>{{toEmail}}</b>."
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
        <Button href={verificationUrl}>
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

ChangeEmailRequest.getSubject = (
  _props: ChangeEmailRequestProps,
  ctx: EmailContext,
) => {
  return ctx.t("changeEmailRequest_subject", {
    defaultValue: "Verify your new email address",
    ns: "emails",
  });
};

export default ChangeEmailRequest;
