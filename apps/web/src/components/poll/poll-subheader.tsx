import { Icon } from "@rallly/ui/icon";
import dayjs from "dayjs";
import { DotIcon } from "lucide-react";
import { Trans, useTranslation } from "next-i18next";
import * as React from "react";

import { usePoll } from "../poll-context";

const PollSubheader: React.FunctionComponent = () => {
  const { poll } = usePoll();
  const { t } = useTranslation();
  return (
    <div className="flex items-center gap-1 text-sm text-gray-500">
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
      <Icon>
        <DotIcon />
      </Icon>
      <span className="whitespace-nowrap">
        <Trans
          i18nKey="createdTime"
          values={{ relativeTime: dayjs(poll.createdAt).fromNow() }}
        />
      </span>
    </div>
  );
};

export default PollSubheader;
