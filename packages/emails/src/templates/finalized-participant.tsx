import { Column, Row, Section } from "@react-email/components";
import { Trans } from "react-i18next/TransWithoutContext";

import { EmailLayout } from "../components/email-layout";
import {
  borderColor,
  Button,
  Heading,
  Text,
} from "../components/styled-components";
import type { EmailContext } from "../types";

export interface FinalizeParticipantEmailProps {
  date: string;
  day: string;
  dow: string;
  time: string;
  title: string;
  hostName: string;
  pollUrl: string;
  ctx: EmailContext;
}

const FinalizeParticipantEmail = ({
  title,
  hostName,
  pollUrl,
  day,
  dow,
  date,
  time,
  ctx,
}: FinalizeParticipantEmailProps) => {
  return (
    <EmailLayout
      ctx={ctx}
      preview={ctx.t("finalizeParticipant_preview", {
        defaultValue: "Final date booked!",
        ns: "emails",
      })}
    >
      <Heading>
        {ctx.t("finalizeParticipant_heading", {
          defaultValue: "Final date booked!",
          ns: "emails",
        })}
      </Heading>
      <Text>
        <Trans
          i18n={ctx.i18n}
          t={ctx.t}
          i18nKey="finalizeParticipant_content"
          ns="emails"
          defaults="<b>{{hostName}}</b> has booked <b>{{title}}</b> for the following date:"
          values={{ hostName, title }}
          components={{
            b: <strong />,
          }}
        />
      </Text>
      <Section data-testid="date-section">
        <Row>
          <Column style={{ width: 48 }}>
            <Section
              style={{
                borderRadius: 5,
                margin: 0,
                width: 48,
                height: 48,
                textAlign: "center",
                border: `1px solid ${borderColor}`,
              }}
            >
              <Text
                style={{ margin: "0 0 4px 0", fontSize: 10, lineHeight: 1 }}
              >
                {dow}
              </Text>
              <Text
                style={{
                  fontSize: 20,
                  lineHeight: 1,
                  fontWeight: "bold",
                  margin: 0,
                }}
              >
                {day}
              </Text>
            </Section>
          </Column>
          <Column style={{ paddingLeft: 16 }} align="left">
            <Text style={{ margin: 0, fontWeight: "bold" }}>{date}</Text>
            <Text light={true} style={{ margin: 0 }}>
              {time}
            </Text>
          </Column>
        </Row>
      </Section>
      <Text>
        {ctx.t("finalizeParticipant_content2", {
          defaultValue:
            "Please find attached a calendar invite for this event.",
        })}
      </Text>
      <Section style={{ marginTop: 32 }}>
        <Button href={pollUrl}>View Event</Button>
      </Section>
    </EmailLayout>
  );
};

FinalizeParticipantEmail.getSubject = (
  props: FinalizeParticipantEmailProps,
  ctx: EmailContext,
) => {
  return ctx.t("finalizeParticipant_subject", {
    defaultValue: "Date booked for {{title}}",
    title: props.title,
    ns: "emails",
  });
};

export { FinalizeParticipantEmail };
