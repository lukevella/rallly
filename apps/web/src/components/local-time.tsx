"use client";
import dayjs from "dayjs";

export function LocalTime() {
  return dayjs().format("LT");
}
