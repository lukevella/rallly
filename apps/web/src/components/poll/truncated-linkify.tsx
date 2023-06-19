import Link from "next/link";
import * as React from "react";
import ReactLinkify from "react-linkify";

import LegacyTooltip from "../tooltip";

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
        href={href}
        rel="nofollow noreferrer"
      >
        {finalText}
      </Link>
    );
  } else {
    finalText += "…";
    return (
      <LegacyTooltip
        key={key}
        content={
          <div className="max-w-md break-all font-mono text-xs">{href}</div>
        }
      >
        <Link className="text-link" href={href} rel="nofollow noreferrer">
          {finalText}
        </Link>
      </LegacyTooltip>
    );
  }
};

const TruncatedLinkify: React.FunctionComponent<{
  children?: React.ReactNode;
}> = ({ children }) => {
  return (
    <ReactLinkify componentDecorator={truncateLink}>{children}</ReactLinkify>
  );
};

export default TruncatedLinkify;
