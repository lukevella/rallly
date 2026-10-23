import { useParticipants, usePoll } from "@/features/poll/client";
import { createOptionsContextValue } from "@/features/poll/components/poll-context";
import { useTranslation } from "@/i18n/client";
import { useDateTimeConfig } from "@/lib/datetime/client";
import { instantToWallTime } from "@/lib/datetime/wall-time";
import { dayjs } from "@/lib/dayjs";
import { getBrowserTimeZone } from "@/lib/utils/date-time-utils";

export const useCsvExporter = () => {
  const poll = usePoll();
  const { t } = useTranslation();
  const { participants } = useParticipants();
  const { locale, timeZone: viewerTimeZone, timeFormat } = useDateTimeConfig();

  return {
    exportToCsv: () => {
      const { options } = createOptionsContextValue({
        pollOptions: poll.options,
        pollTimeZone: poll.timeZone,
        locale,
        timeZone: viewerTimeZone,
        timeFormat,
      });
      // Excel only recognises a naive "YYYY-MM-DD HH:mm:ss" value (no "T", no
      // offset) as a date, so the timezone lives in the header, not the cell.
      // Use the IANA zone name rather than a fixed offset so the label stays
      // correct for rows on either side of a DST change.
      const timeZone = getBrowserTimeZone();
      const header = [
        t("name"),
        t("email"),
        `${t("respondedOn", { defaultValue: "Responded on" })} (${timeZone})`,
        ...options.map((decodedOption) => {
          const day = `${decodedOption.dow} ${decodedOption.day} ${decodedOption.month} ${decodedOption.year}`;
          return decodedOption.type === "date"
            ? day
            : `${day} ${decodedOption.startTime} - ${decodedOption.endTime}`;
        }),
      ].join(",");
      const rows = participants.map((participant) => {
        return [
          participant.name,
          participant.email,
          instantToWallTime(new Date(participant.createdAt), timeZone).replace(
            "T",
            " ",
          ),
          ...poll.options.map((option) => {
            const vote = participant.votes.find((vote) => {
              return vote.optionId === option.id;
            });

            switch (vote?.type) {
              case "yes":
                return t("yes");
              case "ifNeedBe":
                return t("ifNeedBe");
              default:
                return t("no");
            }
          }),
        ].join(",");
      });
      const csv = `data:text/csv;charset=utf-8,${[header, ...rows].join(
        "\r\n",
      )}`;

      const encodedCsv = encodeURI(csv);
      const link = document.createElement("a");
      link.setAttribute("href", encodedCsv);
      link.setAttribute(
        "download",
        `${poll.title.replace(/\s/g, "_")}-${dayjs().format(
          "YYYYMMDDHHmm",
        )}.csv`,
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    },
  };
};
