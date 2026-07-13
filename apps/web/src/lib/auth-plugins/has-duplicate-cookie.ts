// Returns true when the raw Cookie header carries the same cookie name more
// than once — the signature of a host-only leftover shadowing the
// domain-scoped cookie. Must inspect the raw header: cookie parsers dedupe
// by name, which is exactly the problem (the browser sends the older
// host-only cookie first, so it wins every parsed read).
export function hasDuplicateCookie(cookieHeader: string, name: string) {
  let count = 0;
  for (const part of cookieHeader.split(";")) {
    const eqIndex = part.indexOf("=");
    if (eqIndex !== -1 && part.slice(0, eqIndex).trim() === name) {
      count++;
      if (count > 1) {
        return true;
      }
    }
  }
  return false;
}
