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

export interface FinalizeHostEmailProps {
  date: string;
  day: string;
  dow: string;
  time: string;
  name: string;
  title: string;
  location: string | null;
  pollUrl: string;
  attendees: string[];
  ctx: EmailContext;
}

const FinalizeHostEmail = ({
  title,
  pollUrl,
  day,
  dow,
  date,
  time,
  ctx,
}: FinalizeHostEmailProps) => {
  return (
    <EmailLayout
      ctx={ctx}
      preview={ctx.t("finalizeHost_preview", {
        ns: "emails",
        defaultValue:
          "Final date booked! We've notified participants and sent them calendar invites.",
        title,
      })}
    >
      <Heading>
        {ctx.t("finalizeHost_heading", {
          defaultValue: "Final date booked!",
          ns: "emails",
        })}
      </Heading>
      <Text>
        <Trans
          i18n={ctx.i18n}
          t={ctx.t}
          i18nKey="finalizeHost_content"
          ns="emails"
          values={{ title }}
          components={{
            b: <strong />,
          }}
          defaults="<b>{{title}}</b> has been booked for:"
        />
      </Text>
      <Section>
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
        {ctx.t("finalizeHost_content2", {
          defaultValue:
            "We've notified participants and sent them calendar invites.",
          ns: "emails",
        })}
      </Text>
      <Section style={{ marginTop: 32 }}>
        <Button href={pollUrl}>
          {ctx.t("finalizeHost_button", {
            defaultValue: "View Event",
            ns: "emails",
          })}
        </Button>
      </Section>
    </EmailLayout>
  );
};

FinalizeHostEmail.getSubject = (
  props: FinalizeHostEmailProps,
  ctx: EmailContext,
) => {
  return ctx.t("finalizeHost_subject", {
    defaultValue: "Date booked for {{title}}",
    title: props.title,
    ns: "emails",
  });
};

export { FinalizeHostEmail };
