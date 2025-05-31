"use client";

import { ArrowUpRightIcon } from "lucide-react";

import GithubIcon from "@/assets/github.svg";
import { Trans } from "@/i18n/client/trans";
import { cn } from "@rallly/ui";
import { useWindowScroll } from "react-use";

export function OpenSourceBanner() {
  const { y } = useWindowScroll();

  return (
    <div
      className={cn(
        "bg-gray-800 transition-all overflow-hidden hover:underline fixed top-0 w-full flex items-center h-10 text-sm rounded-none text-gray-100 justify-center gap-4",
        {
          "h-11": y <= 0,
          "h-0": y > 16,
        },
      )}
    >
      <a
        target="_blank"
        rel="noopener noreferrer"
        href="https://github.com/lukevella/rallly"
        className="flex absolute inset-0 justify-center items-center gap-3 px-4"
      >
        <GithubIcon className="size-4" />
        <span className="truncate">
          <Trans i18nKey="openSource" defaults="We're Open Source!" />
        </span>
        <span className="w-px h-4 bg-gray-500" />
        <span className="truncate">
          <Trans i18nKey="starOnGitHub" defaults="Star us on GitHub" />
        </span>
        <ArrowUpRightIcon className="size-4" />
      </a>
    </div>
  );
}
