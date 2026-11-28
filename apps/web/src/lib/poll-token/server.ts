import "server-only";

import { cookies } from "next/headers";

// The browser's own credential for one poll: whoever holds it wrote what
// carries it. httpOnly, because no client code reads it and a script that
// could would carry it off. Kept as long as browsers allow.
const POLL_TOKEN_MAX_AGE = 400 * 24 * 60 * 60;

const TOKEN_FORMAT = /^[0-9A-Za-z]{32}$/;

function pollTokenCookieName(pollId: string) {
  return `rallly_poll_token_${pollId}`;
}

/** The token this browser holds for a poll. Null when it holds none. */
export async function getPollToken(pollId: string) {
  const cookieStore = await cookies();
  const token = cookieStore.get(pollTokenCookieName(pollId))?.value;
  return token && TOKEN_FORMAT.test(token) ? token : null;
}

// Server actions and route handlers only: a server component render cannot
// write cookies.
export async function setPollToken(pollId: string, token: string) {
  const cookieStore = await cookies();
  cookieStore.set(pollTokenCookieName(pollId), token, {
    path: "/",
    maxAge: POLL_TOKEN_MAX_AGE,
    sameSite: "lax",
    httpOnly: true,
    secure: process.env.NEXT_PUBLIC_BASE_URL?.startsWith("https://"),
  });
}
