import { sealData, unsealData } from "iron-session";

import { sessionConfig } from "./config";

export const decryptToken = async <P extends Record<string, unknown>>(
  token: string,
): Promise<P | null> => {
  const payload = await unsealData(token, {
    password: sessionConfig.password,
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
    password: sessionConfig.password,
    ttl: options?.ttl ?? 60 * 15, // 15 minutes
  });
};
