import Image from "next/image";
import type React from "react";
import { Trans } from "react-i18next/TransWithoutContext";
import { FadeIn } from "@/components/home/fade-in";
import { getTranslation } from "@/i18n/server";

const Mention = ({
  logo,
  delay = 0,
  children,
}: React.PropsWithChildren<{
  logo: React.ReactNode;
  delay?: number;
}>) => {
  return (
    <FadeIn
      delay={delay}
      className="flex h-full flex-col justify-between gap-8"
    >
      <p className="text-xl">{children}</p>
      <div className="self-end">{logo}</div>
    </FadeIn>
  );
};

export async function Mentions({ locale }: { locale: string }) {
  const { t } = await getTranslation(locale, ["home"]);
  return (
    <section className="py-12">
      <div className="grid gap-4 space-y-4 sm:grid-cols-2 sm:gap-6">
        <h2 className="text-balance font-medium text-4xl leading-tight tracking-tight">
          <Trans
            t={t}
            ns="home"
            i18nKey="pressMentionsTitle"
            defaults="Mentions"
          />
        </h2>
        <p className="max-w-prose text-balance text-gray-500 text-lg">
          <Trans
            t={t}
            ns="home"
            i18nKey="pressMentionsDescription"
            defaults="Rallly has been featured in the press for its simplicity and ease of use."
          />
        </p>
      </div>
      <div className="mt-16 grid gap-8 sm:grid-cols-2">
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
      </div>
    </section>
  );
}
