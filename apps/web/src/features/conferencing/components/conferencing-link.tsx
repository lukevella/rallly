import { buttonVariants } from "@rallly/ui";
import { LinkIcon, PhoneIcon, VideoIcon } from "lucide-react";
import type { Conferencing } from "../schema";

export function ConferencingLink({
  conferencing,
}: {
  conferencing: Conferencing;
}) {
  switch (conferencing.provider) {
    case "phone":
      return (
        <a
          href={
            conferencing.extension
              ? `tel:${conferencing.number},,${conferencing.extension}`
              : `tel:${conferencing.number}`
          }
          rel="noreferrer"
          className={buttonVariants({ variant: "ghost" })}
        >
          <PhoneIcon />
          {conferencing.number}
        </a>
      );
    case "zoom":
      return (
        <a
          href={conferencing.uri}
          target="_blank"
          rel="noreferrer"
          className={buttonVariants({ variant: "ghost" })}
        >
          <VideoIcon />
          Zoom
        </a>
      );
    case "meet":
      return (
        <a
          href={conferencing.uri}
          target="_blank"
          rel="noreferrer"
          className={buttonVariants({ variant: "ghost" })}
        >
          <VideoIcon />
          Google Meet
        </a>
      );
    case "teams":
      return (
        <a
          href={conferencing.uri}
          target="_blank"
          rel="noreferrer"
          className={buttonVariants({ variant: "ghost" })}
        >
          <VideoIcon />
          Microsoft Teams
        </a>
      );
    case "custom":
      return (
        <a
          href={conferencing.uri}
          target="_blank"
          rel="noreferrer"
          className={buttonVariants({ variant: "ghost" })}
        >
          <LinkIcon />
          {conferencing.label}
        </a>
      );
  }
}
