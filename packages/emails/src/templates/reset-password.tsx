import { Section } from "@react-email/components";
import { Trans } from "react-i18next/TransWithoutContext";

import { EmailLayout } from "../components/email-layout";
import { Button, Heading, Link, Text } from "../components/styled-components";
import type { EmailContext } from "../types";

interface ResetPasswordEmailProps {
  resetLink: string;
  ctx: EmailContext;
}

export const ResetPasswordEmail = ({
  resetLink,
  ctx,
}: ResetPasswordEmailProps) => {
  return (
    <EmailLayout
      ctx={ctx}
      preview={ctx.t("resetPassword_preview", {
        defaultValue: "Use this link to reset your password.",
        ns: "emails",
      })}
    >
      <Heading>
        {ctx.t("resetPassword_heading", {
          defaultValue: "Reset your password",
          ns: "emails",
        })}
      </Heading>
      <Text>
        {ctx.t("resetPassword_content", {
          defaultValue:
            "We received a request to reset your password. Click the button below to create a new password.",
          ns: "emails",
        })}
      </Text>
      <Section style={{ marginBottom: 32 }}>
        <Button href={resetLink} id="resetLink">
          <Trans
            i18n={ctx.i18n}
            t={ctx.t}
            i18nKey="resetPassword_button"
            defaults="Reset password"
            ns="emails"
          />
        </Button>
      </Section>
      <Text light>
        <Trans
          i18n={ctx.i18n}
          t={ctx.t}
          i18nKey="resetPassword_content2"
          defaults="If you didn't request a password reset, you can ignore this email. Your password will not change unless you create a new one. If this request is suspicious, contact <a>{supportEmail}</a>."
          values={{ supportEmail: ctx.supportEmail }}
          components={{
            a: <Link href={`mailto:${ctx.supportEmail}`} />,
          }}
          ns="emails"
        />
      </Text>
    </EmailLayout>
  );
};

ResetPasswordEmail.getSubject = (
  _props: ResetPasswordEmailProps,
  ctx: EmailContext,
) => {
  return ctx.t("resetPassword_subject", {
    defaultValue: "Reset your password",
    ns: "emails",
  });
};

export default ResetPasswordEmail;
