import { getIronSession } from "iron-session/edge";
import { NextRequest, NextResponse } from "next/server";

import { sessionConfig } from "../session-config";

export const getSession = async (req: NextRequest, res: NextResponse) => {
  return getIronSession(req, res, sessionConfig);
};
