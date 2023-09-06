export const sessionConfig = {
  password: process.env.SECRET_PASSWORD ?? "",
  cookieName: "rallly-session",
  cookieOptions: {
    secure: process.env.NEXT_PUBLIC_BASE_URL?.startsWith("https://") ?? false,
  },
  ttl: 60 * 60 * 24 * 30, // 30 days
};
