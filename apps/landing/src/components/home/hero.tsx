import { ChevronRightIcon, GithubIcon } from "@rallly/icons";
import { Button } from "@rallly/ui/button";
import { preventWidows } from "@rallly/utils";
import { m } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useTranslation } from "next-i18next";
import * as React from "react";

import { Trans } from "@/components/trans";
import { linkToApp } from "@/lib/linkToApp";

const Screenshot = () => {
  const [isLoaded, setIsLoaded] = React.useState(false);
  return (
    <>
      <m.div
        transition={{
          delay: 1.5,
          type: "spring",
          duration: 1,
          bounce: 0.4,
        }}
        variants={{
          hidden: { opacity: 0, y: 0, z: 0, rotateY: 45 },
          visible: { opacity: 1, y: -10, z: 0, rotateY: 0 },
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
        <span className="absolute left-1/2 -bottom-12 z-10 inline-block h-3 w-3 origin-right -translate-x-1/2 rounded-full bg-gray-800 ring-1 ring-gray-800 ring-offset-2" />
        <span className="absolute left-1/2 -bottom-12 z-10 inline-block h-3 w-3 origin-right -translate-x-1/2 animate-ping rounded-full bg-gray-800 ring-1 ring-gray-800 ring-offset-2" />
      </m.div>
      <m.div
        transition={{
          delay: 0.5,
          type: "spring",
          duration: 1.5,
          bounce: 0.3,
        }}
        variants={{
          hidden: { opacity: 0, scale: 0.5, rotateX: -90, y: -250 },
          visible: { opacity: 1, scale: 1, rotateX: 0, y: 0 },
        }}
        initial="hidden"
        animate={isLoaded ? "visible" : "hidden"}
        className="shadow-huge mx-auto w-fit overflow-hidden rounded-md border"
      >
        <Image
          src="/static/images/hero-shot.png"
          alt="Screenshot of Rallly Poll"
          width={1280}
          height={946}
          quality={100}
          onLoadingComplete={() => {
            setIsLoaded(true);
          }}
        />
      </m.div>
    </>
  );
};

const Hero = () => {
  const { t } = useTranslation();
  return (
    <m.div
      transition={{
        type: "spring",
        bounce: 0.4,
        duration: 1,
      }}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-8 max-w-full text-center sm:mt-16"
    >
      <m.div className="mb-8">
        <Link
          target="_blank"
          href="https://github.com/lukevella/rallly"
          className="hover:ring-primary hover:text-primary relative inline-flex items-center gap-x-4 rounded-full bg-gray-100 px-4 py-1 text-sm leading-6 text-gray-600 ring-1 ring-gray-900/10"
        >
          <span className="hidden sm:block">
            <Trans i18nKey="home:opensource" defaults="We're Open Source!" />
          </span>
          <span
            className="hidden h-4 w-px bg-gray-900/10 sm:block"
            aria-hidden="true"
          />
          <span className="flex items-center gap-x-1">
            <span className="absolute inset-0" aria-hidden="true" />
            <GithubIcon className="mr-1 h-4 w-4" />
            <Trans
              i18nKey="home:startUsOnGithub"
              defaults="Star us on Github"
            />
            <ChevronRightIcon className="-mr-2 h-4 w-4" aria-hidden="true" />
          </span>
        </Link>
      </m.div>
      <m.h1 className="mb-4 text-4xl font-bold tracking-tight text-gray-800 sm:text-5xl">
        {preventWidows(
          t("home:headline", {
            defaultValue: "Ditch the back-and-forth emails",
          }),
        )}
      </m.h1>
      <p className="text-lg text-gray-500 sm:text-xl">
        {preventWidows(
          t("home:subheading", {
            defaultValue: "Streamline your scheduling process and save time",
          }),
        )}
      </p>
      <div className="my-8 flex flex-col items-center justify-center gap-4">
        <Button
          size="lg"
          className="group rounded-full hover:shadow-md active:shadow-sm"
          variant="primary"
          asChild
        >
          <Link href={linkToApp("/new")}>
            <Trans i18nKey="home:getStarted" defaults="Get started" />
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
    </m.div>
  );
};

export default Hero;
