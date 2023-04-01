import { IronSessionOptions, sealData, unsealData } from "iron-session";

export const sessionOptions: IronSessionOptions = {
  password: process.env.SECRET_PASSWORD ?? "",
  cookieName: "rallly-session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
  },
  ttl: 60 * 24 * 30, // 30 days
};

export type RegistrationTokenPayload = {
  name: string;
  email: string;
  code: string;
};

export type LoginTokenPayload = {
  userId: string;
  code: string;
};

export type RegisteredUserSession = {
  isGuest: false;
  id: string;
  name: string;
  email: string;
};

export type GuestUserSession = {
  isGuest: true;
  id: string;
};

export type DisableNotificationsPayload = {
  pollId: string;
  watcherId: number;
};

export type UserSession = GuestUserSession | RegisteredUserSession;

export const decryptToken = async <P extends Record<string, unknown>>(
  token: string,
): Promise<P | null> => {
  const payload = await unsealData(token, {
    password: sessionOptions.password,
  });
  if (Object.keys(payload).length === 0) {
    return null;
  }

  return payload as P;
};

export const createToken = async <T extends Record<string, unknown>>(
  payload: T,
  options?: {
    ttl?: number;
  },
) => {
  return await sealData(payload, {
    password: sessionOptions.password,
    ttl: options?.ttl ?? 60 * 15, // 15 minutes
  });
};
