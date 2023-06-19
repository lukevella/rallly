import dayjs from "dayjs";
import { useTranslation } from "next-i18next";

import { useOptions, usePoll } from "@/components/poll-context";

import { useParticipants } from "../../participants-provider";

export const useCsvExporter = () => {
  const { poll } = usePoll();
  const { options } = useOptions();
  const { t } = useTranslation();
  const { participants } = useParticipants();

  return {
    exportToCsv: () => {
      const header = [
        t("participantCount", {
          count: participants.length,
        }),
        ...options.map((decodedOption) => {
          const day = `${decodedOption.dow} ${decodedOption.day} ${decodedOption.month}`;
          return decodedOption.type === "date"
            ? day
            : `${day} ${decodedOption.startTime} - ${decodedOption.endTime}`;
        }),
      ].join(",");
      const rows = participants.map((participant) => {
        return [
          participant.name,
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
