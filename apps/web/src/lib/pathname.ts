import { headers } from "next/headers";

const HEADER_NAME = "x-pathname";

export async function getPathname() {
  const headersList = await headers();
  return headersList.get(HEADER_NAME);
}

export function setPathname(responseHeaders: Headers, pathname: string) {
  responseHeaders.set(HEADER_NAME, pathname);
}
