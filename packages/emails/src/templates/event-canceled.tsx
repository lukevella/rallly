import { Column, Row, Section } from "@react-email/components";
import { Trans } from "react-i18next/TransWithoutContext";

import { EmailLayout } from "../components/email-layout";
import { borderColor, Heading, Text } from "../components/styled-components";
import type { EmailContext } from "../types";

export interface EventCanceledEmailProps {
  title: string;
  hostName: string;
  day: string;
  dow: string;
  date: string;
  time: string;
  ctx: EmailContext;
}

const EventCanceledEmail = ({
  title,
  hostName,
  day,
  dow,
  date,
  time,
  ctx,
}: EventCanceledEmailProps) => {
  return (
    <EmailLayout
      ctx={ctx}
      preview={ctx.t("eventCanceledPreview", {
        defaultValue: "Event canceled",
        ns: "emails",
      })}
    >
      <Heading>
        {ctx.t("eventCanceledHeading", {
          defaultValue: "Event canceled",
          ns: "emails",
        })}
      </Heading>
      <Text>
        <Trans
          i18n={ctx.i18n}
          t={ctx.t}
          i18nKey="eventCanceledContent"
          ns="emails"
          defaults="<b>{hostName}</b> has canceled <b>{title}</b> that was scheduled for:"
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
    </EmailLayout>
  );
};

EventCanceledEmail.getSubject = (
  props: EventCanceledEmailProps,
  ctx: EmailContext,
) => {
  return ctx.t("eventCanceledSubject", {
    defaultValue: "Canceled: {title}",
    title: props.title,
    ns: "emails",
  });
};

export { EventCanceledEmail };
