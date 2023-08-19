import type { IncomingMessage, ServerResponse } from "http";
import { getIronSession } from "iron-session/edge";

import { sessionConfig } from "../session-config";

export const getSession = async (
  req: Request | IncomingMessage,
  res: Response | ServerResponse,
) => {
  return getIronSession(req, res, sessionConfig);
};
