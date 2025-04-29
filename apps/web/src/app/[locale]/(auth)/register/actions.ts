"use server";

import { cookies } from "next/headers";

export async function setToken(token: string) {
  (await cookies()).set("registration-token", token, {
    httpOnly: true,
    secure: process.env.NEXT_PUBLIC_BASE_URL?.startsWith("https://"),
    sameSite: "lax",
    maxAge: 15 * 60,
  });
}
