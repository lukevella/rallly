import { format } from "date-fns";
import { useTranslation } from "next-i18next";

import { usePoll } from "@/components/poll-context";

export const useCsvExporter = () => {
  const { poll, options } = usePoll();
  const { t } = useTranslation("app");

  return {
    exportToCsv: () => {
      const header = [
        t("participantCount", {
          count: poll.participants.length,
        }),
        ...options.map((decodedOption) => {
          const day = `${decodedOption.dow} ${decodedOption.day} ${decodedOption.month}`;
          return decodedOption.type === "date"
            ? day
            : `${day} ${decodedOption.startTime} - ${decodedOption.endTime}`;
        }),
      ].join(",");
      const rows = poll.participants.map((participant) => {
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
        `${poll.title.replace(/\s/g, "_")}-${format(
          Date.now(),
          "yyyyMMddhhmm",
        )}`,
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    },
  };
};
