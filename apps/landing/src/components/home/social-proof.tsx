import Image from "next/image";
import { Trans } from "react-i18next/TransWithoutContext";
import { Mention, Mentions } from "@/components/home/mentions";
import { Testimonial } from "@/components/home/testimonial";
import {
  Section,
  SectionContent,
  SectionDescription,
  SectionHeading,
  SectionTitle,
} from "@/components/section";
import { getTranslation } from "@/i18n/server";

// The social proof section, shared by the home page and the SEO landing
// pages. Owns its copy, unlike the rest of the landing components, so every
// page renders the same testimonial and press mentions. Pages aimed at a
// specific audience can pass their own title and description.
export const SocialProof = async ({
  locale,
  title,
  description,
}: {
  locale: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
}) => {
  const { t } = await getTranslation<"home">(locale, "home");
  return (
    <Section>
      <SectionHeading>
        <SectionTitle>
          {title ?? (
            <Trans
              t={t}
              ns="home"
              i18nKey="socialProofTitle"
              defaults="Loved for its simplicity"
            />
          )}
        </SectionTitle>
        <SectionDescription>
          {description ?? (
            <Trans
              t={t}
              ns="home"
              i18nKey="socialProofDescription"
              defaults="Ask anyone who's used it. The fastest way to schedule a group is also the simplest."
            />
          )}
        </SectionDescription>
      </SectionHeading>
      <SectionContent className="space-y-12 sm:space-y-16">
        <Testimonial
          logo={
            <Image
              src="/static/images/mit-logo.svg"
              width={54}
              height={28}
              alt=""
            />
          }
          avatar={
            <Image
              className="rounded-full"
              src="/static/images/eric.png"
              width={48}
              height={48}
              alt=""
            />
          }
          name="Eric Fletcher"
          title={
            <Trans
              t={t}
              ns="home"
              i18nKey="ericJobTitle"
              defaults="Executive Assistant at MIT"
            />
          }
        >
          <Trans
            t={t}
            ns="home"
            i18nKey="ericQuote"
            defaults="“If your scheduling workflow lives in emails, I strongly encourage you to try and let Rallly simplify your scheduling tasks for a more organized and less stressful workday.”"
          />
        </Testimonial>
        <Mentions locale={locale}>
          <Mention
            delay={0.25}
            logo={
              <div className="relative h-8 w-14">
                <Image
                  src="/static/images/pcmag-logo.svg"
                  alt="PCMag"
                  fill
                  style={{ objectFit: "contain" }}
                />
              </div>
            }
          >
            <Trans
              t={t}
              ns="home"
              i18nKey="pcmagQuote"
              defaults="“Set up a scheduling poll in as little time as possible.”"
            />
          </Mention>
          <Mention
            delay={0.5}
            logo={
              <div className="relative h-8 w-24">
                <Image
                  src="/static/images/hubspot-logo.svg"
                  alt="HubSpot"
                  fill
                  style={{ objectFit: "contain" }}
                />
              </div>
            }
          >
            <Trans
              t={t}
              ns="home"
              i18nKey="hubspotQuote"
              defaults="“The simplest choice for availability polling for large groups.”"
            />
          </Mention>
          <Mention
            delay={0.75}
            logo={
              <div className="relative h-8 w-32">
                <Image
                  src="/static/images/goodfirms-logo.svg"
                  alt="Goodfirms"
                  fill
                  style={{ objectFit: "contain" }}
                />
              </div>
            }
          >
            <Trans
              t={t}
              ns="home"
              i18nKey="goodfirmsQuote"
              defaults="“Unique in its simplicity and requires minimum interaction time.”"
            />
          </Mention>
          <Mention
            delay={1}
            logo={
              <div className="relative h-8 w-20">
                <Image
                  src="/static/images/popsci-logo.svg"
                  alt="PopSci"
                  fill
                  style={{ objectFit: "contain" }}
                />
              </div>
            }
          >
            <Trans
              t={t}
              ns="home"
              i18nKey="popsciQuote"
              defaults="“The perfect pick if you want to keep your RSVPs simple.”"
            />
          </Mention>
        </Mentions>
      </SectionContent>
    </Section>
  );
};
