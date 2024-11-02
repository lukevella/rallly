import { userSchema } from "../schema";

export function safeParseGuestUser(serialized: string) {
  try {
    const res = userSchema.safeParse(JSON.parse(serialized));
    if (res.success) {
      return res.data;
    }
  } catch (error) {
    // TODO: Log error
  }
  return null;
}
