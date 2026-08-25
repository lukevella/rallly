"use cache";

import { buttonVariants, cn } from "@rallly/ui";
import { DownloadIcon } from "lucide-react";
import type { Metadata } from "next";
import { cacheLife } from "next/cache";
import Image from "next/image";
import type * as React from "react";
import { Trans } from "react-i18next/TransWithoutContext";
import {
  Section,
  SectionContent,
  SectionDescription,
  SectionHeading,
  SectionTitle,
} from "@/components/section";
import { getTranslation } from "@/i18n/server";
import { getAlternates } from "@/lib/alternates";

function Fact({
  label,
  children,
}: {
  label: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <dt className="font-medium text-gray-800 text-sm">{label}</dt>
      <dd className="mt-1 text-gray-600 text-sm">{children}</dd>
    </div>
  );
}

function AssetCard({
  name,
  preview,
  previewClassName,
  links,
  dark,
}: {
  name: string;
  preview: React.ReactNode;
  previewClassName?: string;
  links: { label: string; href: string }[];
  dark?: boolean;
}) {
  return (
    <div className="overflow-hidden rounded-lg border">
      <div
        className={cn(
          "flex items-center justify-center",
          dark ? "bg-gray-900" : "bg-white",
          previewClassName ?? "h-32",
        )}
      >
        {preview}
      </div>
      <div className="flex items-center justify-between gap-2 border-t bg-gray-50 px-4 py-3">
        <div className="text-gray-800 text-sm">{name}</div>
        <div className="flex gap-3">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              download
              aria-label={`${name} (${link.label})`}
              className="font-medium text-primary text-sm hover:underline"
            >
              {link.label}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

export default async function Page(props: {
  params: Promise<{ locale: string }>;
}) {
  cacheLife("max");
  const { locale } = await props.params;
  const { t } = await getTranslation(locale, ["home"]);

  const logos = [
    {
      name: t("pressKitLogo", { ns: "home", defaultValue: "Logo" }),
      file: "rallly-logo",
      width: 145,
      height: 27,
      dark: false,
    },
    {
      name: t("pressKitLogoWhite", { ns: "home", defaultValue: "Logo, white" }),
      file: "rallly-logo-white",
      width: 145,
      height: 27,
      dark: true,
    },
    {
      name: t("pressKitLogoBlack", { ns: "home", defaultValue: "Logo, black" }),
      file: "rallly-logo-black",
      width: 145,
      height: 27,
      dark: false,
    },
    {
      name: t("pressKitIcon", { ns: "home", defaultValue: "Icon" }),
      file: "rallly-logo-mark",
      width: 48,
      height: 48,
      dark: false,
    },
    {
      name: t("pressKitIconWhite", { ns: "home", defaultValue: "Icon, white" }),
      file: "rallly-logo-mark-white",
      width: 48,
      height: 48,
      dark: true,
    },
    {
      name: t("pressKitAppIcon", { ns: "home", defaultValue: "App icon" }),
      file: "rallly-app-icon",
      width: 64,
      height: 64,
      dark: false,
    },
  ];

  const screenshots = [
    {
      name: t("pressKitScreenshotCreatePoll", {
        ns: "home",
        defaultValue: "Creating a poll",
      }),
      file: "create-poll",
    },
    {
      name: t("pressKitScreenshotVoting", {
        ns: "home",
        defaultValue: "Voting on a poll",
      }),
      file: "voting",
    },
    {
      name: t("pressKitScreenshotResults", {
        ns: "home",
        defaultValue: "Reviewing results",
      }),
      file: "review-results",
    },
    {
      name: t("pressKitScreenshotFinalize", {
        ns: "home",
        defaultValue: "Finalizing a poll",
      }),
      file: "finalize",
    },
    {
      name: t("pressKitScreenshotCalendarWeek", {
        ns: "home",
        defaultValue: "Calendar week view",
      }),
      file: "calendar-week-view",
    },
    {
      name: t("pressKitScreenshotCalendar", {
        ns: "home",
        defaultValue: "Calendar month view",
      }),
      file: "calendar-month-view",
    },
  ];

  return (
    <div className="divide-y">
      <Section>
        <SectionHeading>
          <h1 className="text-balance font-medium text-3xl text-gray-800 tracking-tight sm:text-5xl">
            <Trans t={t} ns="home" i18nKey="pressKit" defaults="Press kit" />
          </h1>
          <SectionDescription>
            <Trans
              t={t}
              ns="home"
              i18nKey="pressKitDescription"
              defaults="Writing about Rallly? Here you'll find logos, screenshots, and product information that you can use in articles and blog posts."
            />
          </SectionDescription>
        </SectionHeading>
        <div className="mt-8">
          <a
            href="/press/rallly-press-kit.zip"
            download
            className={buttonVariants({ variant: "primary", size: "lg" })}
          >
            <DownloadIcon />
            <Trans
              t={t}
              ns="home"
              i18nKey="pressKitDownloadAll"
              defaults="Download press kit (ZIP)"
            />
          </a>
        </div>
      </Section>
      <Section>
        <SectionHeading>
          <SectionTitle>
            <Trans
              t={t}
              ns="home"
              i18nKey="pressKitAboutTitle"
              defaults="About Rallly"
            />
          </SectionTitle>
        </SectionHeading>
        <SectionContent className="space-y-8">
          <p className="max-w-prose text-pretty text-gray-600 leading-relaxed">
            <Trans
              t={t}
              ns="home"
              i18nKey="pressKitAboutText"
              defaults="Rallly is an open-source meeting scheduling tool that helps groups find the best time to meet, without the back and forth. Organizers create a poll with proposed times and share a link, participants vote on the times that work for them, and the best time wins. Polls can be created and voted on without an account, which makes Rallly a popular choice for scheduling with people outside your organization."
            />
          </p>
          <dl className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <Fact
              label={
                <Trans
                  t={t}
                  ns="home"
                  i18nKey="pressKitFactName"
                  defaults="Name"
                />
              }
            >
              <Trans
                t={t}
                ns="home"
                i18nKey="pressKitFactNameValue"
                defaults="Rallly, spelled with three L's and pronounced like “rally”"
              />
            </Fact>
            <Fact
              label={
                <Trans
                  t={t}
                  ns="home"
                  i18nKey="pressKitFactFounder"
                  defaults="Founder"
                />
              }
            >
              Luke Vella
            </Fact>
            <Fact
              label={
                <Trans
                  t={t}
                  ns="home"
                  i18nKey="pressKitFactWebsite"
                  defaults="Website"
                />
              }
            >
              <a href="https://rallly.co" className="hover:underline">
                rallly.co
              </a>
            </Fact>
            <Fact
              label={
                <Trans
                  t={t}
                  ns="home"
                  i18nKey="pressKitFactSourceCode"
                  defaults="Source code"
                />
              }
            >
              <a
                href="https://github.com/lukevella/rallly"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline"
              >
                github.com/lukevella/rallly
              </a>
            </Fact>
            <Fact
              label={
                <Trans
                  t={t}
                  ns="home"
                  i18nKey="pressKitFactLicense"
                  defaults="License"
                />
              }
            >
              AGPL-3.0
            </Fact>
          </dl>
        </SectionContent>
      </Section>
      <Section>
        <SectionHeading>
          <SectionTitle>
            <Trans
              t={t}
              ns="home"
              i18nKey="pressKitLogosTitle"
              defaults="Logos"
            />
          </SectionTitle>
          <SectionDescription>
            <Trans
              t={t}
              ns="home"
              i18nKey="pressKitLogosDescription"
              defaults="Please use the logo as provided, without changing its colors, proportions, or adding effects."
            />
          </SectionDescription>
        </SectionHeading>
        <SectionContent>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {logos.map((logo) => (
              <AssetCard
                key={logo.file}
                name={logo.name}
                dark={logo.dark}
                preview={
                  <Image
                    src={`/press/logos/${logo.file}.svg`}
                    width={logo.width}
                    height={logo.height}
                    alt={logo.name}
                  />
                }
                links={[
                  { label: "SVG", href: `/press/logos/${logo.file}.svg` },
                  { label: "PNG", href: `/press/logos/${logo.file}.png` },
                ]}
              />
            ))}
          </div>
        </SectionContent>
      </Section>
      <Section>
        <SectionHeading>
          <SectionTitle>
            <Trans
              t={t}
              ns="home"
              i18nKey="pressKitColorTitle"
              defaults="Brand color"
            />
          </SectionTitle>
        </SectionHeading>
        <SectionContent>
          <div className="flex items-center gap-4">
            <div className="size-16 rounded-lg bg-[#4F46E5] ring-1 ring-black/10 ring-inset" />
            <div>
              <div className="font-medium text-gray-800 text-sm">
                <Trans
                  t={t}
                  ns="home"
                  i18nKey="pressKitColorPrimary"
                  defaults="Primary"
                />
              </div>
              <div className="mt-1 font-mono text-gray-600 text-sm">
                #4F46E5
              </div>
            </div>
          </div>
        </SectionContent>
      </Section>
      <Section>
        <SectionHeading>
          <SectionTitle>
            <Trans
              t={t}
              ns="home"
              i18nKey="pressKitScreenshotsTitle"
              defaults="Screenshots"
            />
          </SectionTitle>
          <SectionDescription>
            <Trans
              t={t}
              ns="home"
              i18nKey="pressKitScreenshotsDescription"
              defaults="High-resolution product screenshots that you can use in your coverage."
            />
          </SectionDescription>
        </SectionHeading>
        <SectionContent>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {screenshots.map((screenshot) => (
              <AssetCard
                key={screenshot.file}
                name={screenshot.name}
                previewClassName="aspect-[4/3]"
                preview={
                  <Image
                    src={`/press/screenshots/${screenshot.file}.png`}
                    width={2560}
                    height={1920}
                    alt={screenshot.name}
                    className="size-full object-cover"
                    sizes="(min-width: 640px) 50vw, 100vw"
                  />
                }
                links={[
                  {
                    label: "PNG",
                    href: `/press/screenshots/${screenshot.file}.png`,
                  },
                ]}
              />
            ))}
          </div>
        </SectionContent>
      </Section>
      <Section>
        <SectionHeading>
          <SectionTitle>
            <Trans
              t={t}
              ns="home"
              i18nKey="pressKitContactTitle"
              defaults="Press inquiries"
            />
          </SectionTitle>
          <SectionDescription>
            <Trans
              t={t}
              ns="home"
              i18nKey="pressKitContactDescription"
              defaults="For interview requests or any other questions, email us at <0>support@rallly.co</0>."
              components={[
                <a
                  key="email"
                  className="text-gray-800 underline underline-offset-2 hover:text-gray-600"
                  href="mailto:support@rallly.co"
                />,
              ]}
            />
          </SectionDescription>
        </SectionHeading>
      </Section>
    </div>
  );
}

export async function generateMetadata(props: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  cacheLife("max");
  const { locale } = await props.params;
  const { t } = await getTranslation(locale, "home");
  return {
    alternates: getAlternates({ locale, path: "/press-kit" }),
    title: t("pressKitMetaTitle", {
      ns: "home",
      defaultValue: "Press kit",
    }),
    description: t("pressKitMetaDescription", {
      ns: "home",
      defaultValue:
        "Download Rallly logos, screenshots, and product information for use in articles and blog posts.",
    }),
  };
}
