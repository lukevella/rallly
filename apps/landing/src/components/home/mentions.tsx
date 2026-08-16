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
      className="flex h-full flex-col justify-between gap-8 rounded-2xl border border-gray-200/60 bg-white p-6"
    >
      <p className="text-base">{children}</p>
      <div className="self-end">{logo}</div>
    </FadeIn>
  );
};

export async function Mentions({ locale }: { locale: string }) {
  const { t } = await getTranslation(locale, ["home"]);
  return (
    <section className="py-8 sm:py-16">
      <div className="grid gap-4 sm:grid-cols-2">
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
