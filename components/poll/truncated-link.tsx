import * as React from "react";
import Tooltip from "../tooltip";

export const truncatedLink = (href: string, text: string, key: number) => {
  const textWithoutProtocol = text.replace(/^https?:\/\//i, "");
  const beginningOfPath = textWithoutProtocol.indexOf("/");
  let finalText = textWithoutProtocol;
  if (beginningOfPath !== -1) {
    finalText = textWithoutProtocol.substring(0, beginningOfPath + 30);
  }
  if (finalText.length === textWithoutProtocol.length) {
    return (
      <a key={key} href={href}>
        {finalText}
      </a>
    );
  } else {
    finalText += "…";
    return (
      <Tooltip
        key={key}
        content={
          <div className="text-xs font-mono max-w-md break-all">{href}</div>
        }
      >
        <a href={href}>{finalText}</a>
      </Tooltip>
    );
  }
};
