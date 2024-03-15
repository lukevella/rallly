import type { NextApiRequest, NextApiResponse } from "next";

import { AuthApiRoute } from "@/utils/auth";

export default async function auth(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "HEAD") {
    return res.status(200).end();
  }

  return AuthApiRoute(req, res);
}
