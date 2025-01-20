"use server";

import { cookies } from "next/headers";

export async function setToken(token: string) {
  cookies().set("registration-token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 15 * 60,
  });
}
