"use server";

import * as z from "zod";
import { getPollExportData } from "@/features/poll/data";
import { getActiveSpaceForUser } from "@/features/space/data";
import { getTranslation } from "@/i18n/server";
import {
  formatDateTime,
  formatDateTimeRange,
  formatNaiveDateTime,
} from "@/lib/datetime/format";
import { getDeviceTimeZone } from "@/lib/datetime/server";
import { AppError } from "@/lib/errors/app-error";
import { authActionClient } from "@/lib/safe-action/server";

function toCsvCell(value: string) {
  // Guard against spreadsheet formula injection before quoting: a cell
  // starting with =, +, - or @ executes when the file opens in Excel.
  const guarded = /^[=+\-@]/.test(value) ? `'${value}` : value;
  return /[",\r\n]/.test(guarded)
    ? `"${guarded.replace(/"/g, '""')}"`
    : guarded;
}

export const exportPollDataAction = authActionClient
  .metadata({ actionName: "export_poll_data" })
  .inputSchema(z.object({ pollId: z.string() }))
  .action(async ({ ctx, parsedInput }) => {
    const space = await getActiveSpaceForUser(ctx.user.id);

    if (!space) {
      throw new AppError({
        code: "NOT_FOUND",
        message: "No active space found",
      });
    }

    const poll = await getPollExportData({
      pollId: parsedInput.pollId,
      spaceId: space.id,
    });

    if (!poll) {
      throw new AppError({
        code: "NOT_FOUND",
        message: "Poll not found",
      });
    }

    const { t, i18n } = await getTranslation();
    const locale = i18n.language;
    const deviceTimeZone = await getDeviceTimeZone();
    const timeZone = deviceTimeZone ?? "UTC";

    // Options on a poll without a time zone are floating local times stored
    // as UTC, so they render as stored; anchored options convert to the
    // viewer's zone like the rest of the admin UI.
    const displayZone = poll.timeZone
      ? (deviceTimeZone ?? poll.timeZone)
      : "UTC";

    const formatOption = (option: { startTime: Date; duration: number }) => {
      if (option.duration === 0) {
        return formatDateTime(option.startTime, {
          preset: "date",
          locale,
          timeZone: displayZone,
        });
      }

      const end = new Date(
        option.startTime.getTime() + option.duration * 60_000,
      );
      return formatDateTimeRange(option.startTime, end, {
        preset: "datetime",
        locale,
        timeZone: displayZone,
      });
    };

    const voteLabels = {
      yes: t("yes", { defaultValue: "Yes" }),
      ifNeedBe: t("ifNeedBe", { defaultValue: "If need be" }),
      no: t("no", { defaultValue: "No" }),
    };

    const header = [
      t("name", { defaultValue: "Name" }),
      t("email", { defaultValue: "Email" }),
      `${t("respondedOn", { defaultValue: "Responded on" })} (${timeZone})`,
      ...poll.options.map(formatOption),
    ];

    const rows = poll.participants.map((participant) => [
      participant.name,
      participant.email ?? "",
      formatNaiveDateTime(participant.createdAt, timeZone),
      ...poll.options.map((option) => {
        const vote = participant.votes.find((v) => v.optionId === option.id);
        return voteLabels[vote?.type ?? "no"];
      }),
    ]);

    const content = [header, ...rows]
      .map((row) => row.map(toCsvCell).join(","))
      .join("\r\n");

    const timestamp = new Date()
      .toISOString()
      .replace(/[-:T]/g, "")
      .slice(0, 12);

    return {
      filename: `${poll.title.replace(/\s+/g, "_")}-${timestamp}.csv`,
      content,
    };
  });
