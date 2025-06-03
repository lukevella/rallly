"use client";

import { ArrowUpRightIcon } from "lucide-react";

import GithubIcon from "@/assets/github.svg";
import { Trans } from "@/i18n/client/trans";
import { cn } from "@rallly/ui";
import React from "react";

export function OpenSourceBanner() {
  const [visible, setVisible] = React.useState(true);

  React.useEffect(() => {
    function setVisibility() {
      setVisible(window.scrollY < 20);
    }
    window.addEventListener("scroll", setVisibility);
    return () => {
      window.removeEventListener("scroll", setVisibility);
    };
  }, []);

  return (
    <div
      className={cn(
        "fixed top-0 z-50 flex h-11 w-full items-center justify-center gap-4 overflow-hidden rounded-none bg-gray-800 text-gray-100 text-sm transition-transform hover:underline",
        {
          "translate-y-0": visible,
          "-translate-y-full": !visible,
        },
      )}
    >
      <a
        target="_blank"
        rel="noopener noreferrer"
        href="https://github.com/lukevella/rallly"
        className="absolute inset-0 flex items-center justify-center gap-3 px-4"
      >
        <GithubIcon className="size-4" />
        <span className="truncate">
          <Trans i18nKey="openSource" defaults="We're Open Source!" />
        </span>
        <span className="h-4 w-px bg-gray-500" />
        <span className="truncate">
          <Trans i18nKey="starOnGitHub" defaults="Star us on GitHub" />
        </span>
        <ArrowUpRightIcon className="size-4" />
      </a>
    </div>
  );
}
