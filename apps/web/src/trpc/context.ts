import { EmailClient } from "@rallly/emails";
import type { NextApiRequest, NextApiResponse } from "next";

export type TRPCContext = {
  user: {
    id: string;
    isGuest: boolean;
    locale?: string;
    getEmailClient: (locale?: string) => EmailClient;
  };
  req: NextApiRequest;
  res: NextApiResponse;
};
