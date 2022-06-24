import { formatRelative } from "date-fns";
import { Trans, useTranslation } from "next-i18next";
import * as React from "react";

import Badge from "../badge";
import { usePoll } from "../poll-context";
import { usePreferences } from "../preferences/use-preferences";
import Tooltip from "../tooltip";

const PollSubheader: React.VoidFunctionComponent = () => {
  const { poll } = usePoll();
  const { t } = useTranslation("app");
  const { locale } = usePreferences();

  return (
    <div className="text-slate-500/75 lg:text-lg">
      <div className="md:inline">
        <Trans
          i18nKey="createdBy"
          t={t}
          values={{
            name: poll.authorName,
          }}
          components={{
            b: <span />,
          }}
        />
        {poll.legacy && poll.admin ? (
          <Tooltip
            width={400}
            content="This poll was created with an older version of Rallly. Some features might not work."
          >
            <Badge color="amber" className="ml-1">
              Legacy
            </Badge>
          </Tooltip>
        ) : null}
        {poll.demo ? (
          <Tooltip content={<Trans t={t} i18nKey="demoPollNotice" />}>
            <Badge color="blue" className="ml-1">
              Demo
            </Badge>
          </Tooltip>
        ) : null}
      </div>
      <span className="hidden md:inline">&nbsp;&bull;&nbsp;</span>
      <span className="whitespace-nowrap">
        {formatRelative(poll.createdAt, new Date(), {
          locale,
        })}
      </span>
    </div>
  );
};

export default PollSubheader;
