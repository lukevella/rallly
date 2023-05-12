import React from "react";

import { Trans } from "@/components/trans";

export const TextSummary = (props: { text: string; max: number }) => {
  const [isExpanded, setExpanded] = React.useState(false);
  if (props.text.length <= props.max) {
    return <p>{props.text}</p>;
  }
  const summary =
    props.text.substring(0, props.text.lastIndexOf(" ", props.max)) + "…";
  return (
    <>
      <p className="leading-relaxed text-gray-600">
        {isExpanded ? <>{props.text}</> : <>{summary}</>}{" "}
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
