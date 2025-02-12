import { randomid } from "@rallly/utils/nanoid";
import CredentialsProvider from "next-auth/providers/credentials";

export const GuestProvider = CredentialsProvider({
  id: "guest",
  name: "Guest",
  credentials: {},
  async authorize() {
    return {
      id: `user-${randomid()}`,
      email: null,
    };
  },
});
