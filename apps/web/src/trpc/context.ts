import type { EmailClient } from "@rallly/emails";

export type TRPCContext = {
  user: {
    id: string;
    isGuest: boolean;
    locale?: string;
    getEmailClient: (locale?: string) => EmailClient;
    image?: string;
  };
  ip?: string;
};
