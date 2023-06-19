import React from "react";

import { Trans } from "@/components/trans";

export const TextSummary = ({
  max = Infinity,
  text,
}: {
  text: string;
  max?: number;
}) => {
  const [isExpanded, setExpanded] = React.useState(false);
  if (text.length <= max) {
    return <p>{text}</p>;
  }
  const summary = text.substring(0, text.lastIndexOf(" ", max)) + "…";
  return (
    <>
      <p className="leading-relaxed text-gray-600">
        {isExpanded ? <>{text}</> : <>{summary}</>}
      </p>
      {isExpanded ? (
        <button
          className="mt-2 border px-1 text-sm font-medium tracking-tight hover:text-gray-800 hover:underline active:text-gray-900"
          onClick={() => setExpanded(false)}
        >
          <Trans defaults="Show less…" i18nKey="showLess" />
        </button>
      ) : (
        <button
          className="mt-2 border px-1 text-sm font-medium tracking-tight hover:text-gray-800 hover:underline active:text-gray-900"
          onClick={() => setExpanded(true)}
        >
          <Trans defaults="Show more…" i18nKey="showMore" />
        </button>
      )}
    </>
  );
};
