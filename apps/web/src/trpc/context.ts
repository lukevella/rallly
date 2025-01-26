import type { EmailClient } from "@rallly/emails";

type User = {
  id: string;
  isGuest: boolean;
  locale?: string;
  getEmailClient: (locale?: string) => EmailClient;
  image?: string;
};

export type TRPCContext = {
  user?: User;
  getEmailClient?: () => Promise<EmailClient>;
  getOrCreateUser?: () => Promise<User>;
  ip?: string;
};
