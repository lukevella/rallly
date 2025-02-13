import { absoluteUrl } from "@rallly/utils/absolute-url";

export const sessionConfig = {
  password: process.env.SECRET_PASSWORD ?? "",
  cookieName: "rallly-session",
  cookieOptions: {
    secure: absoluteUrl().startsWith("https://") ?? false,
  },
  ttl: 60 * 60 * 24 * 30, // 30 days
};
