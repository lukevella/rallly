import { IronSessionOptions } from "iron-session";

export const sessionOptions: IronSessionOptions = {
  password: process.env.SECRET_PASSWORD ?? "",
  cookieName: "rallly-session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
  },
  ttl: 60 * 60 * 24 * 30, // 30 days
};
