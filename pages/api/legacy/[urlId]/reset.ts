import { GetPollApiResponse } from "api-client/get-poll";
import { NextApiRequest, NextApiResponse } from "next";
import { exclude, getQueryParam } from "utils/api-utils";
import { resetDates } from "utils/legacy-utils";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<GetPollApiResponse>,
) {
  const urlId = getQueryParam(req, "urlId");

  const poll = await resetDates(urlId);

  if (!poll) {
    return res.status(404);
  }

  return res.json({
    ...exclude(poll, "verificationCode"),
    role: "admin",
    urlId: poll.urlId,
    pollId: poll.urlId,
  });
}
