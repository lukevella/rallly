// Response tokens are 32 alphanumerics; legacy seals are longer and use `*`,
// `-` and `_`. Anything else in a link is not a token, so it is not stored.
const TOKEN_PATTERN = /^[\w*.~-]{1,512}$/;
// Under the 4 KB a browser keeps per cookie, with room for the attributes.
const MAX_COOKIE_VALUE_LENGTH = 3000;
const SEPARATOR = ",";

/**
 * The cookie that remembers which responses this browser may edit on one
 * poll: the tokens of the responses it submitted and of the emailed links it
 * opened. The name and the path both carry the poll, so a browser sends it
 * only to that poll's page. It is httpOnly, so page scripts never read the
 * tokens; the server checks each one against the database before it trusts
 * it.
 */
export function getVoterCookie(pollId: string) {
  return {
    name: `rallly-voter-${pollId}`,
    options: {
      path: `/invite/${pollId}`,
      httpOnly: true,
      sameSite: "lax" as const,
      secure: process.env.NEXT_PUBLIC_BASE_URL?.startsWith("https://"),
      maxAge: 60 * 60 * 24 * 365,
    },
  };
}

export function isVoterToken(token: string) {
  return TOKEN_PATTERN.test(token);
}

export function parseVoterTokens(value: string | undefined) {
  return value ? value.split(SEPARATOR).filter(isVoterToken) : [];
}

/**
 * The cookie value with `token` added, newest first. The oldest tokens drop
 * out when the value grows past what a browser keeps.
 */
function addVoterToken(value: string | undefined, token: string) {
  const tokens = [
    token,
    ...parseVoterTokens(value).filter((existing) => existing !== token),
  ];
  let serialized = "";
  for (const next of tokens) {
    const candidate = serialized ? `${serialized}${SEPARATOR}${next}` : next;
    if (candidate.length > MAX_COOKIE_VALUE_LENGTH) {
      break;
    }
    serialized = candidate;
  }
  return serialized;
}

/** The voter cookie for the poll, with `token` added to its current value. */
export function getNextVoterCookie(
  pollId: string,
  value: string | undefined,
  token: string,
) {
  const cookie = getVoterCookie(pollId);
  return { ...cookie, value: addVoterToken(value, token) };
}
