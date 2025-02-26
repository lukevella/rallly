"use client";

import dayjs from "dayjs";

const formatMap = {
  short: "D MMM YYYY",
};

type Format = keyof typeof formatMap;

export function FormattedDate({
  date,
  format,
}: {
  date: Date;
  format: Format;
}) {
  return <>{dayjs(date).format(formatMap[format])}</>;
}
