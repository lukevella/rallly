import { Column, Img, Row, Section } from "@react-email/components";

import { createEmailI18n } from "../i18n";
import type { EmailConferencing } from "../types";
import { Link, lightTextColor, Text } from "./styled-components";

const providerIcons: Record<EmailConferencing["provider"], string> = {
  zoom: "zoom.png",
  meet: "google-meet.png",
  teams: "microsoft-teams.png",
  phone: "phone.png",
  custom: "video.png",
};

const providerNames = {
  zoom: "Zoom",
  meet: "Google Meet",
  teams: "Microsoft Teams",
} as const;

// When and where an event happens, one icon row each. Icons are PNGs served
// by the instance because most email clients do not render SVG.
export async function EventDetails({
  date,
  time,
  location,
  conferencing,
  baseUrl,
  locale = "en",
}: {
  date: string;
  time?: string;
  location?: string;
  conferencing?: EmailConferencing;
  baseUrl: string;
  locale?: string;
}) {
  const { t } = await createEmailI18n(locale);

  const conferencingName = (() => {
    if (!conferencing) {
      return null;
    }
    switch (conferencing.provider) {
      case "phone":
        return t("eventConferencingPhone", { defaultValue: "Phone" });
      case "custom":
        return (
          conferencing.label ??
          t("eventConferencingVideoCall", { defaultValue: "Video call" })
        );
      default:
        return providerNames[conferencing.provider];
    }
  })();

  return (
    <>
      <DetailRow iconUrl={`${baseUrl}/images/email/calendar.png`}>
        <Text style={{ margin: 0, fontWeight: 600 }}>{date}</Text>
        <Text light={true} style={{ margin: 0 }}>
          {time ?? t("allDay", { defaultValue: "All day" })}
        </Text>
      </DetailRow>
      {location ? (
        <DetailRow iconUrl={`${baseUrl}/images/email/map-pin.png`}>
          <Text style={{ margin: 0 }}>{location}</Text>
        </DetailRow>
      ) : null}
      {conferencing ? (
        <DetailRow
          iconUrl={`${baseUrl}/images/email/${providerIcons[conferencing.provider]}`}
        >
          <Text style={{ margin: 0, fontWeight: 600 }}>{conferencingName}</Text>
          {conferencing.url ? (
            <Text small={true} style={{ margin: 0 }}>
              <Link
                href={conferencing.url}
                color={lightTextColor}
                style={{
                  textDecoration: "underline",
                  wordBreak: "break-all",
                }}
              >
                {conferencing.url.replace(/^tel:/, "")}
              </Link>
            </Text>
          ) : null}
        </DetailRow>
      ) : null}
    </>
  );
}

function DetailRow({
  iconUrl,
  children,
}: {
  iconUrl: string;
  children: React.ReactNode;
}) {
  return (
    <Section style={{ marginTop: 12 }}>
      <Row>
        <Column style={{ width: 32, verticalAlign: "top" }}>
          <Img
            src={iconUrl}
            width="20"
            height="20"
            alt=""
            style={{ marginTop: 2 }}
          />
        </Column>
        <Column style={{ verticalAlign: "top" }}>{children}</Column>
      </Row>
    </Section>
  );
}
