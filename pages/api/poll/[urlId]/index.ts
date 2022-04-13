import { GetPollApiResponse } from "api-client/get-poll";
import { NextApiResponse } from "next";
import { resetDates } from "utils/legacy-utils";
import { UpdatePollPayload } from "../../../../api-client/update-poll";
import { prisma } from "../../../../db";
import { exclude, withLink } from "../../../../utils/api-utils";

export default withLink(
  async (
    req,
    res: NextApiResponse<
      GetPollApiResponse | { status: number; message: string }
    >,
    link,
  ) => {
    const pollId = link.pollId;

    switch (req.method) {
      case "GET": {
        const poll = await prisma.poll.findUnique({
          where: {
            urlId: pollId,
          },
          include: {
            options: {
              include: {
                votes: true,
              },
            },
            participants: {
              include: {
                votes: true,
              },
              orderBy: [
                {
                  createdAt: "desc",
                },
                { name: "desc" },
              ],
            },
            user: true,
            links: link.role === "admin",
          },
        });

        if (!poll) {
          return res
            .status(404)
            .json({ status: 404, message: "Poll not found" });
        }

        if (
          poll.legacy &&
          // has converted options without timezone
          poll.options.every(({ value }) => value.indexOf("T") === -1)
        ) {
          // We need to reset the dates for polls that lost their timezone data because some users
          // of the old version will end up seeing the wrong dates
          const fixedPoll = await resetDates(poll.urlId);

          if (fixedPoll) {
            return res.json({
              ...exclude(fixedPoll, "verificationCode"),
              role: link.role,
              urlId: link.urlId,
              pollId: poll.urlId,
            });
          }
        }

        return res.json({
          ...exclude(poll, "verificationCode"),
          role: link.role,
          urlId: link.urlId,
          pollId: poll.urlId,
        });
      }
      case "PATCH": {
        if (link.role !== "admin") {
          return res
            .status(401)
            .json({ status: 401, message: "Permission denied" });
        }

        const payload: Partial<UpdatePollPayload> = req.body;
        if (payload.optionsToDelete && payload.optionsToDelete.length > 0) {
          await prisma.option.deleteMany({
            where: {
              pollId,
              id: {
                in: payload.optionsToDelete,
              },
            },
          });
        }
        if (payload.optionsToAdd && payload.optionsToAdd.length > 0) {
          await prisma.option.createMany({
            data: payload.optionsToAdd.map((optionValue) => ({
              value: optionValue,
              pollId,
            })),
          });
        }
        const poll = await prisma.poll.update({
          where: {
            urlId: pollId,
          },
          data: {
            title: payload.title,
            location: payload.location,
            description: payload.description,
            timeZone: payload.timeZone,
            notifications: payload.notifications,
            closed: payload.closed,
          },
          include: {
            options: {
              include: {
                votes: true,
              },
            },
            participants: {
              include: {
                votes: true,
              },
              orderBy: [
                {
                  createdAt: "desc",
                },
                { name: "desc" },
              ],
            },
            user: true,
            links: true,
          },
        });

        if (!poll) {
          return res
            .status(404)
            .json({ status: 404, message: "Poll not found" });
        }

        return res.json({
          ...exclude(poll, "verificationCode"),
          role: link.role,
          urlId: link.urlId,
          pollId: poll.urlId,
        });
      }

      default:
        return res
          .status(405)
          .json({ status: 405, message: "Method not allowed" });
    }
  },
);
