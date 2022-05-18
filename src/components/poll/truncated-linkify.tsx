import * as React from "react";
import ReactLinkify from "react-linkify";

import Tooltip from "../tooltip";

export const truncateLink = (href: string, text: string, key: number) => {
  const textWithoutProtocol = text.replace(/^https?:\/\//i, "");
  const beginningOfPath = textWithoutProtocol.indexOf("/");
  let finalText = textWithoutProtocol;
  if (beginningOfPath !== -1) {
    finalText = textWithoutProtocol.substring(0, beginningOfPath + 15);
  }

  if (finalText.length === textWithoutProtocol.length) {
    return (
      <a key={key} href={href} rel="nofollow noreferrer">
        {finalText}
      </a>
    );
  } else {
    finalText += "…";
    return (
      <Tooltip
        key={key}
        content={
          <div className="max-w-md break-all font-mono text-xs">{href}</div>
        }
      >
        <a href={href} rel="nofollow noreferrer">
          {finalText}
        </a>
      </Tooltip>
    );
  }
};

const TruncatedLinkify: React.VoidFunctionComponent<{
  children?: React.ReactNode;
}> = ({ children }) => {
  return (
    <ReactLinkify componentDecorator={truncateLink}>{children}</ReactLinkify>
  );
};

export default TruncatedLinkify;
