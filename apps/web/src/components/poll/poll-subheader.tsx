import dayjs from "dayjs";
import { Trans, useTranslation } from "next-i18next";
import * as React from "react";

import { usePoll } from "../poll-context";

const PollSubheader: React.FunctionComponent = () => {
  const { poll } = usePoll();
  const { t } = useTranslation();
  return (
    <div className="text-gray-500">
      <div className="flex gap-1.5">
        <div>
          <Trans
            i18nKey="createdBy"
            t={t}
            values={{
              name: poll.user?.name ?? t("guest"),
            }}
            components={{
              b: <span />,
            }}
          />
        </div>
        <span>&bull;</span>
        <span className="whitespace-nowrap">
          <Trans
            i18nKey="createdTime"
            values={{ relativeTime: dayjs(poll.createdAt).fromNow() }}
          />
        </span>
      </div>
    </div>
  );
};

export default PollSubheader;
