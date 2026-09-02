import crypto from "node:crypto";

/**
 * HMAC-SHA256 over a payload, base64url encoded. `context` is mixed into the
 * signed input so tokens minted for one purpose never verify for another even
 * though every caller shares the same secret.
 */
export function createSignature({
  context,
  payload,
  secret,
}: {
  context: string;
  payload: string;
  secret: string;
}) {
  return crypto
    .createHmac("sha256", secret)
    .update(`${context}:${payload}`)
    .digest("base64url");
}

export function verifySignature({
  context,
  payload,
  secret,
  signature,
}: {
  context: string;
  payload: string;
  secret: string;
  signature: string;
}) {
  const expected = Buffer.from(createSignature({ context, payload, secret }));
  const actual = Buffer.from(signature);
  return (
    expected.length === actual.length &&
    crypto.timingSafeEqual(expected, actual)
  );
}
