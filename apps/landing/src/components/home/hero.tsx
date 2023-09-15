import { ChevronRightIcon } from "@rallly/icons";
import { Badge } from "@rallly/ui/badge";
import { Button } from "@rallly/ui/button";
import { preventWidows } from "@rallly/utils";
import { m } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import * as React from "react";

import { Trans } from "@/components/trans";
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
        className="shadow-huge relative z-20 mx-auto w-fit max-w-full rounded-full border bg-gray-800 px-3 py-1.5 text-sm text-gray-50 subpixel-antialiased"
      >
        <Trans
          i18nKey="home:createPageLikeThis"
          defaults="Create a page like this in seconds!"
        />
        <span className="absolute left-1/2 top-full z-10 h-8 w-px -translate-x-1/2 bg-gray-800" />
        <span className="absolute -bottom-12 left-1/2 z-10 inline-block h-3 w-3 origin-right -translate-x-1/2 rounded-full bg-gray-800 ring-1 ring-gray-800 ring-offset-2" />
        <span className="absolute -bottom-12 left-1/2 z-10 inline-block h-3 w-3 origin-right -translate-x-1/2 animate-ping rounded-full bg-gray-800 ring-1 ring-gray-800 ring-offset-2" />
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
        className="shadow-huge mx-auto w-fit overflow-hidden rounded-md border"
      >
        <Image
          src="/static/images/hero-shot.png"
          alt="Screenshot of Rallly Poll"
          width={1440}
          height={1152}
          quality={100}
          onLoadingComplete={() => {
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
  return (
    <div className="mt-8 max-w-full text-center sm:mt-16">
      <div className="mb-8">
        <Link
          locale="en"
          href="/blog/rallly-3-0-self-hosting"
          className="hover:ring-primary relative inline-flex items-center gap-x-3 rounded-full border bg-gray-100 py-1 pl-1 pr-4 text-sm leading-6 text-gray-600 shadow-sm hover:bg-gray-50 focus:ring-2 focus:ring-gray-300 focus:ring-offset-1"
        >
          <Badge className="bg-green-500">
            <Trans i18nKey="home:new" defaults="New" />
          </Badge>
          <span className="flex items-center gap-x-1">
            <Trans
              i18nKey="home:selfHostingBlog"
              defaults="Rallly 3.0 Self-Hosting"
            />
            <ChevronRightIcon className="-mr-1 h-4 w-4" aria-hidden="true" />
          </span>
        </Link>
      </div>
      <h1 className="mb-4 text-4xl font-bold tracking-tight sm:text-5xl">
        {preventWidows(title)}
      </h1>
      <p className="mx-auto max-w-3xl text-lg text-gray-500 sm:text-xl sm:leading-relaxed">
        {preventWidows(description)}
      </p>
      <div className="my-8 flex flex-col items-center justify-center gap-4">
        <Button
          size="lg"
          className="group rounded-full hover:shadow-md active:shadow-sm"
          variant="primary"
          asChild
        >
          <Link href={linkToApp("/new")}>
            {callToAction}
            <ChevronRightIcon className="-ml-1 h-5 w-5 transition-transform group-active:translate-x-1" />
          </Link>
        </Button>
        <div className="whitespace-nowrap text-center text-sm font-medium text-gray-500">
          <Trans i18nKey="home:hint" defaults="It's free! No login required." />
        </div>
      </div>
      <div className="mt-16">
        <Screenshot />
      </div>
    </div>
  );
};
