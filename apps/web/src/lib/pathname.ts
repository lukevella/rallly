import { headers } from "next/headers";
import type { NextRequest, NextResponse } from "next/server";

const HEADER_NAME = "x-pathname";

export async function getPathname() {
  const headersList = await headers();
  return headersList.get(HEADER_NAME);
}

export function setPathname(req: NextRequest, res: NextResponse) {
  const pathname = req.nextUrl.pathname;
  res.headers.set(HEADER_NAME, pathname);
}
