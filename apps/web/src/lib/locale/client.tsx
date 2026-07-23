"use client";
import Cookies from "js-cookie";
import { useParams } from "next/navigation";
import {
  LOCALE_COOKIE_NAME,
  LOCALE_COOKIE_OPTIONS,
} from "@/lib/locale/constants";

export function useLocale() {
  const { locale } = useParams();

  return {
    locale: locale as string,
  };
}

// Set the locale cookie from the client so it lands synchronously, before the
// router refresh reads it. Writing it server-side in the same request as
// better-auth's updateUser would collide with its session cookie and drop it.
export function setLocaleCookie(locale: string) {
  Cookies.set(LOCALE_COOKIE_NAME, locale, LOCALE_COOKIE_OPTIONS);
}
