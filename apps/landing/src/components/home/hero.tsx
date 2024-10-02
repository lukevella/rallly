"use client";
import { cn } from "@rallly/ui";
import { Badge } from "@rallly/ui/badge";
import { Button } from "@rallly/ui/button";
import { motion } from "framer-motion";
import { ChevronRightIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import * as React from "react";

import { Trans } from "@/components/trans";
import { handwritten } from "@/fonts/handwritten";
import { linkToApp } from "@/lib/linkToApp";

const Screenshot = () => {
  const [isLoaded, setIsLoaded] = React.useState(false);

  return (
    <>
      <motion.div
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
        <span className="absolute -bottom-12 left-1/2 z-10 inline-block size-3 origin-right -translate-x-1/2 rounded-full bg-gray-800 ring-1 ring-gray-800 ring-offset-2" />
        <span className="absolute -bottom-12 left-1/2 z-10 inline-block size-3 origin-right -translate-x-1/2 animate-ping rounded-full bg-gray-800 ring-1 ring-gray-800 ring-offset-2" />
      </motion.div>
      <motion.div
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
          onLoad={() => {
            setIsLoaded(true);
          }}
        />
      </motion.div>
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
    <article className="max-w-full space-y-12 text-center">
      <header className="sm:p-6">
        <div>
          <Link
            locale="en"
            href="/blog/rallly-3-0-self-hosting"
            className="hover:ring-primary relative inline-flex items-center gap-x-3 rounded-full border bg-gray-100 py-1 pl-1 pr-4 text-sm leading-6 text-gray-600 hover:bg-gray-50 focus:ring-2 focus:ring-gray-300 focus:ring-offset-1"
          >
            <Badge variant="green">
              <Trans ns="home" i18nKey="new" defaults="New" />
            </Badge>
            <span className="flex items-center gap-x-1">
              <Trans
                i18nKey="home:selfHostingBlog"
                defaults="Rallly 3.0 Self-Hosting"
              />
              <ChevronRightIcon className="-mr-1 size-4" aria-hidden="true" />
            </span>
          </Link>
        </div>
        <h1 className="mb-2 mt-6 text-pretty text-2xl font-bold tracking-tight sm:mb-4 sm:text-5xl">
          {title}
        </h1>
        <h2 className="mx-auto max-w-3xl text-pretty text-lg text-gray-500 sm:text-xl sm:leading-relaxed">
          {description}
        </h2>
        <div className="mt-8 flex flex-col items-center justify-center gap-4">
          <Button
            size="lg"
            className="group rounded-full hover:shadow-md active:shadow-sm"
            variant="primary"
            asChild
          >
            <Link href={linkToApp("/new")}>
              {callToAction}
              <ChevronRightIcon className="-ml-1 size-5 transition-transform group-active:translate-x-1" />
            </Link>
          </Button>
          <p
            className={cn(
              "whitespace-nowrap text-center text-sm text-gray-600",
              handwritten.className,
              "decoration underline decoration-gray-300 decoration-2 underline-offset-8",
              "skew-x-[-10deg]",
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
