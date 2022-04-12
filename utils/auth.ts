import { jwtVerify } from "jose";

export const verifyJwt = async (jwt: string) => {
  return await jwtVerify(jwt, new TextEncoder().encode(process.env.JWT_SECRET));
};
