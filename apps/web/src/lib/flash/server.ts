import "server-only";

import { cookies } from "next/headers";
import type { FlashKey } from "@/lib/flash/constants";
import { FLASH_MAX_AGE, flashCookieName } from "@/lib/flash/constants";

// Server actions and route handlers only: a server component render cannot
// write cookies.
export async function setFlash(key: FlashKey, value: string) {
  const cookieStore = await cookies();
  cookieStore.set(flashCookieName(key), value, {
    path: "/",
    maxAge: FLASH_MAX_AGE,
    sameSite: "lax",
    httpOnly: false,
    secure: process.env.NEXT_PUBLIC_BASE_URL?.startsWith("https://"),
  });
}
