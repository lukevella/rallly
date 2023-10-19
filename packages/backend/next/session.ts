import type { IncomingMessage, ServerResponse } from "http";
import { getIronSession } from "iron-session";
import { withIronSessionApiRoute } from "iron-session/next";
import { NextApiHandler } from "next";

import { sessionConfig } from "../session-config";

export function withSessionRoute(handler: NextApiHandler) {
  return withIronSessionApiRoute(handler, sessionConfig);
}

export const getSession = async (
  req: Request | IncomingMessage,
  res: Response | ServerResponse,
) => {
  return getIronSession(req, res, sessionConfig);
};
