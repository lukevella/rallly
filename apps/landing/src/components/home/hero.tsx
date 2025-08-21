"use client";
import { usePostHog } from "@rallly/posthog/client";
import { cn } from "@rallly/ui";
import { Badge } from "@rallly/ui/badge";
import { Button } from "@rallly/ui/button";
import { ChevronRightIcon } from "lucide-react";
import * as m from "motion/react-m";
import Image from "next/image";
import Link from "next/link";
import * as React from "react";
import { handwritten } from "@/fonts/handwritten";
import { Trans } from "@/i18n/client/trans";
import { linkToApp } from "@/lib/linkToApp";

const Screenshot = () => {
  const [isLoaded, setIsLoaded] = React.useState(false);

  return (
    <>
      <m.div
        transition={{
          delay: 0.5,
          type: "spring",
          duration: 1,
          bounce: 0.4,
        }}
        variants={{
          hidden: { opacity: 0, y: 0, z: 0 },
          visible: { opacity: 1, y: -10, z: 0 },
        }}
        initial="hidden"
        animate={isLoaded ? "visible" : "hidden"}
        style={{
          backfaceVisibility: "hidden",
        }}
        className="relative z-20 mx-auto w-fit max-w-full rounded-full border bg-gray-800 px-3 py-2 text-gray-50 text-sm subpixel-antialiased shadow-huge"
      >
        <Trans
          ns="home"
          i18nKey="createPageLikeThis"
          defaults="Create a page like this in seconds!"
        />
        <span className="-translate-x-1/2 absolute top-full left-1/2 z-10 h-8 w-px bg-gray-800" />
        <span className="-bottom-12 -translate-x-1/2 absolute left-1/2 z-10 inline-block size-3 origin-right rounded-full bg-gray-800 ring-1 ring-gray-800 ring-offset-2" />
        <span className="-bottom-12 -translate-x-1/2 absolute left-1/2 z-10 inline-block size-3 origin-right animate-ping rounded-full bg-gray-800 ring-1 ring-gray-800 ring-offset-2" />
      </m.div>
      <m.div
        transition={{
          type: "spring",
          duration: 1,
          bounce: 0.3,
        }}
        variants={{
          hidden: { opacity: 0, scale: 0.95, y: 5 },
          visible: { opacity: 1, scale: 1, y: 0 },
        }}
        initial="hidden"
        animate={isLoaded ? "visible" : "hidden"}
        className="mx-auto w-fit overflow-hidden rounded-md border shadow-huge"
      >
        <Image
          src="/static/images/hero-shot.png"
          alt="Screenshot of Rallly Poll"
          width={1440}
          height={1152}
          quality={100}
          onLoad={() => {
            setIsLoaded(true);
          }}
        />
      </m.div>
    </>
  );
};

export const MarketingHero = ({
  title,
  description,
  callToAction,
}: {
  title: string;
  description: string;
  callToAction: React.ReactNode;
}) => {
  const posthog = usePostHog();
  return (
    <article className="max-w-full space-y-12 text-center">
      <header className="sm:p-8">
        <div>
          <Link
            href="/blog/introducing-spaces"
            className="group relative inline-flex items-center gap-x-2 rounded-full border bg-gray-50 py-1 pr-4 pl-1 text-gray-600 text-sm leading-6 hover:bg-white"
          >
            <Badge variant="secondary">
              <Trans ns="home" i18nKey="new" defaults="New" />
            </Badge>
            <span className="flex items-center gap-x-1">
              <Trans
                ns="home"
                i18nKey="spacesBlog"
                defaults="Introducing Spaces"
              />
              <ChevronRightIcon
                className="-mr-1 size-4 transition-transform group-active:translate-x-0.5"
                aria-hidden="true"
              />
            </span>
          </Link>
        </div>
        <h1 className="mt-6 mb-2 text-pretty font-bold text-2xl tracking-tight sm:mb-4 sm:text-5xl">
          {title}
        </h1>
        <h2 className="mx-auto max-w-3xl text-pretty font-normal text-base text-gray-500 sm:text-xl sm:leading-relaxed">
          {description}
        </h2>
        <div className="mt-8 flex flex-col items-center justify-center gap-4">
          <Button
            size="lg"
            className="transition-all hover:shadow-md active:translate-y-1 active:shadow-none"
            variant="primary"
            onClick={() => {
              posthog.capture("landing:hero_button_click");
            }}
            asChild
          >
            <Link href={linkToApp("/new")}>{callToAction}</Link>
          </Button>
          <p
            className={cn(
              "whitespace-nowrap text-center text-gray-600 text-xs",
              handwritten.className,
              "decoration underline decoration-2 decoration-gray-300 underline-offset-8",
            )}
          >
            <Trans
              ns="home"
              i18nKey="hint"
              defaults="It's free! No login required."
            />
          </p>
        </div>
      </header>
      <section>
        <Screenshot />
      </section>
    </article>
  );
};
