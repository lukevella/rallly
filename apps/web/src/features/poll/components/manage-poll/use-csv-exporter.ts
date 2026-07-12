import { useParticipants } from "@/features/poll/components/participants-provider";
import { useOptions, usePoll } from "@/features/poll/components/poll-context";
import { useTranslation } from "@/i18n/client";
import { dayjs } from "@/lib/dayjs";

export const useCsvExporter = () => {
  const { poll } = usePoll();
  const { options } = useOptions();
  const { t } = useTranslation();
  const { participants } = useParticipants();

  return {
    exportToCsv: () => {
      // Excel only recognises a naive "YYYY-MM-DD HH:mm:ss" value (no "T", no
      // offset) as a date, so the timezone lives in the header, not the cell.
      // Use the IANA zone name rather than a fixed offset so the label stays
      // correct for rows on either side of a DST change.
      const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
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
          dayjs(participant.createdAt).format("YYYY-MM-DD HH:mm:ss"),
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
