import { Trans } from "react-i18next/TransWithoutContext";

import { EmailLayout } from "../components/email-layout";
import {
  Button,
  Domain,
  Heading,
  Section,
  Text,
} from "../components/styled-components";
import { createEmailTemplate } from "../create-email-template";
import type { EmailContext } from "../types";

interface NewParticipantConfirmationEmailProps {
  title: string;
  editSubmissionUrl: string;
  ctx: EmailContext;
}

const NewParticipantConfirmationEmail = ({
  title,
  editSubmissionUrl,
  ctx,
}: NewParticipantConfirmationEmailProps) => {
  const { domain } = ctx;
  return (
    <EmailLayout
      ctx={ctx}
      preview={ctx.t("newParticipantConfirmation_preview", {
        defaultValue: "To edit your response use the link below",
        ns: "emails",
      })}
    >
      <Heading>
        {ctx.t("newParticipantConfirmation_heading", {
          defaultValue: "Poll Response Confirmation",
          ns: "emails",
        })}
      </Heading>
      <Text>
        <Trans
          {...ctx.i18nProps}
          i18nKey="newParticipantConfirmation_content"
          defaults="Your response to <b>{title}</b> has been submitted."
          components={{
            b: <strong />,
          }}
          values={{ title }}
        />
      </Text>
      <Text>
        <Trans
          {...ctx.i18nProps}
          i18nKey="newParticipantConfirmation_content2"
          defaults="While the poll is still open you can change your response using the link below."
        />
      </Text>
      <Section style={{ marginTop: 32 }}>
        <Button
          id="editSubmissionUrl"
          href={editSubmissionUrl}
          color={ctx.primaryColor}
        >
          <Trans
            {...ctx.i18nProps}
            i18nKey="newParticipantConfirmation_button"
            defaults="Review response on {domain}"
            values={{ domain }}
          />
        </Button>
      </Section>
      <Text light>
        <Trans
          {...ctx.i18nProps}
          i18nKey="newParticipantConfirmation_footnote"
          defaults="You are receiving this email because a response was submitted on <domain />. If this wasn't you, please ignore this email."
          components={{
            domain: <Domain ctx={ctx} />,
          }}
        />
      </Text>
    </EmailLayout>
  );
};

export { NewParticipantConfirmationEmail };

export const sendNewParticipantConfirmationEmail = createEmailTemplate({
  component: NewParticipantConfirmationEmail,
  subject: (props, ctx) =>
    ctx.t("newParticipantConfirmation_subject", {
      defaultValue: "Thanks for responding to {title}",
      title: props.title,
      ns: "emails",
    }),
});
