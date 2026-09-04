"use client";

import Cookies from "js-cookie";
import React from "react";
import type { FlashKey } from "@/lib/flash/constants";
import { FLASH_MAX_AGE, flashCookieName } from "@/lib/flash/constants";

export function setFlash(key: FlashKey, value: string) {
  Cookies.set(flashCookieName(key), value, {
    path: "/",
    sameSite: "lax",
    secure: window.location.protocol === "https:",
    expires: new Date(Date.now() + FLASH_MAX_AGE * 1000),
  });
}

// Resolves to the flash value on the first mount after it was set and clears
// it in the same step, so a reload or a later visit never replays it.
export function useFlash(key: FlashKey) {
  const [value, setValue] = React.useState<string | null>(null);

  React.useEffect(() => {
    const name = flashCookieName(key);
    const flash = Cookies.get(name);
    if (flash === undefined) return;
    Cookies.remove(name, { path: "/" });
    setValue(flash);
  }, [key]);

  return value;
}
