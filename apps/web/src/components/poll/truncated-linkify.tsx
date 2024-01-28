import { Tooltip, TooltipContent, TooltipTrigger } from "@rallly/ui/tooltip";
import Linkify from "linkify-react";
import Link from "next/link";
import * as React from "react";

export const truncateLink = (href: string, text: string, key: number) => {
  const textWithoutProtocol = text.replace(/^https?:\/\//i, "");
  const beginningOfPath = textWithoutProtocol.indexOf("/");
  let finalText = textWithoutProtocol;
  if (beginningOfPath !== -1) {
    finalText = textWithoutProtocol.substring(0, beginningOfPath + 15);
  }

  if (finalText.length === textWithoutProtocol.length) {
    return (
      <Link
        className="text-link"
        key={key}
        target="_blank"
        href={href}
        rel="nofollow noreferrer"
      >
        {finalText}
      </Link>
    );
  } else {
    finalText += "…";
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Link
            className="text-link"
            target="_blank"
            href={href}
            rel="nofollow noreferrer"
          >
            {finalText}
          </Link>
        </TooltipTrigger>
        <TooltipContent className="max-w-md break-all font-mono text-xs">
          {href}
        </TooltipContent>
      </Tooltip>
    );
  }
};

const TruncatedLinkify = ({ children }: { children: React.ReactNode }) => {
  return (
    <Linkify
      options={{
        render: ({ attributes, content }) => {
          return truncateLink(
            attributes.href,
            content,
            attributes.key as number,
          );
        },
      }}
    >
      {children}
    </Linkify>
  );
};

export default TruncatedLinkify;
