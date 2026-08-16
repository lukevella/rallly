"use client";
import { ArrowUpRight } from "lucide-react";
import * as m from "motion/react-m";
import Image from "next/image";
import Link from "next/link";
import type React from "react";

import { Trans } from "@/i18n/client/trans";

const Mention = ({
  logo,
  children,
  delay = 0,
}: React.PropsWithChildren<{
  logo: React.ReactNode;
  delay?: number;
}>) => {
  return (
    <m.div
      transition={{
        delay,
        type: "spring",
        bounce: 0.3,
      }}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="flex flex-col items-start space-y-4 rounded-md"
    >
      <div className="flex items-start justify-between">{logo}</div>
      <p className="grow text-base">{children}</p>
    </m.div>
  );
};

export const MentionedBy = () => {
  return (
    <div>
      <div className="grid gap-8 md:grid-cols-4">
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
            ns="home"
            i18nKey="popsciQuote"
            defaults="“The perfect pick if you want to keep your RSVPs simple.”"
          />
        </Mention>
      </div>
    </div>
  );
};

export const BigTestimonial = () => {
  return (
    <m.div
      transition={{
        duration: 1,
        type: "spring",
        bounce: 0.3,
      }}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: "all" }}
      className="flex flex-col items-start gap-y-8"
    >
      <div className="relative h-[30px] w-[120px]">
        <Image
          src="/static/images/stars-5.svg"
          fill
          style={{ objectFit: "contain" }}
          alt="5 stars"
        />
      </div>
      <div>
        <p className="max-w-xl font-medium text-lg leading-normal">
          <Trans
            ns="home"
            i18nKey="ericQuote"
            defaults="“If your scheduling workflow lives in emails, I strongly encourage you to try and let Rallly simplify your scheduling tasks for a more organized and less stressful workday.”"
          />
        </p>
        <p className="mt-1">
          <Link
            target="_blank"
            className="text-gray-600 text-sm hover:underline"
            href="https://www.trustpilot.com/reviews/645e1d1976733924e89d8203"
          >
            <Trans
              ns="home"
              i18nKey="viaTrustpilot"
              defaults="via Trustpilot"
            />
            <ArrowUpRight className="ml-1 inline size-3" />
          </Link>
        </p>
      </div>
      <div className="flex gap-x-4">
        <Image
          className="rounded-full"
          src="/static/images/eric.png"
          width={48}
          height={48}
          alt="Eric Fletcher"
        />
        <div>
          <div className="font-semibold">Eric Fletcher</div>
          <div className="text-gray-600 text-sm">
            <Trans
              ns="home"
              i18nKey="ericJobTitle"
              defaults="Executive Assistant at MIT"
            />
          </div>
        </div>
      </div>
    </m.div>
  );
};

export const Marketing = ({ children }: React.PropsWithChildren) => {
  return <div className="space-y-12 sm:space-y-24">{children}</div>;
};
