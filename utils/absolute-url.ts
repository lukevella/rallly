// Source: https://github.com/jakeburden/next-absolute-url/blob/1d96d1d2a2a2308db60ce53a130b5d47aab3ee25/index.ts
import { IncomingMessage } from "http";

function absoluteUrl(
  req?: IncomingMessage,
  localhostAddress = "localhost:3000",
) {
  let host =
    (req?.headers ? req.headers.host : window.location.host) ||
    localhostAddress;
  let protocol = /^localhost(:\d+)?$/.test(host) ? "http:" : "https:";

  if (
    req &&
    req.headers["x-forwarded-host"] &&
    typeof req.headers["x-forwarded-host"] === "string"
  ) {
    host = req.headers["x-forwarded-host"];
  }

  if (
    req &&
    req.headers["x-forwarded-proto"] &&
    typeof req.headers["x-forwarded-proto"] === "string"
  ) {
    protocol = `${req.headers["x-forwarded-proto"]}:`;
  }

  return {
    protocol,
    host,
    origin: protocol + "//" + host,
  };
}

export default absoluteUrl;
