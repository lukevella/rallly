import { NextApiHandler } from "next";

export function composeApiHandlers(...fns: NextApiHandler[]): NextApiHandler {
  return async (req, res) => {
    for (const fn of fns) {
      await fn(req, res);
      if (res.writableEnded) {
        return;
      }
    }
  };
}
