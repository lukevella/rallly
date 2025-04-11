"use client";

import dayjs from "dayjs";

const formatMap = {
  short: "D MMM YYYY",
};

type Format = keyof typeof formatMap | string;

export function FormattedDate({
  date,
  format,
}: {
  date: Date;
  format: Format;
}) {
  // If format is a key in formatMap, use the predefined format, otherwise use the format string directly
  const formatString =
    format in formatMap ? formatMap[format as keyof typeof formatMap] : format;
  return <>{dayjs(date).format(formatString)}</>;
}
