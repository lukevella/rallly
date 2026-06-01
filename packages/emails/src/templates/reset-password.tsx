import { Section } from "@react-email/components";
import { Trans } from "react-i18next/TransWithoutContext";

import { EmailLayout } from "../components/email-layout";
import { Button, Heading, Link, Text } from "../components/styled-components";
import { createEmailTemplate } from "../create-email-template";
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
        <Button href={resetLink} id="resetLink" color={ctx.primaryColor}>
          <Trans
            {...ctx.i18nProps}
            i18nKey="resetPassword_button"
            defaults="Reset password"
          />
        </Button>
      </Section>
      <Text light>
        <Trans
          {...ctx.i18nProps}
          i18nKey="resetPassword_content2"
          defaults="If you didn't request a password reset, you can ignore this email. Your password will not change unless you create a new one. If this request is suspicious, contact <a>{supportEmail}</a>."
          values={{ supportEmail: ctx.supportEmail }}
          components={{
            a: (
              <Link
                color={ctx.primaryColor}
                href={`mailto:${ctx.supportEmail}`}
              />
            ),
          }}
        />
      </Text>
    </EmailLayout>
  );
};

export const sendResetPasswordEmail = createEmailTemplate({
  component: ResetPasswordEmail,
  subject: (_props, ctx) =>
    ctx.t("resetPassword_subject", {
      defaultValue: "Reset your password",
      ns: "emails",
    }),
});
