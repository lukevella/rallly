import Trans from "next-translate/Trans";
import * as React from "react";

import { useDayjs } from "../../utils/dayjs";
import Badge from "../badge";
import { usePoll } from "../poll-context";
import Tooltip from "../tooltip";

const PollSubheader: React.VoidFunctionComponent = () => {
  const { poll } = usePoll();
  const { dayjs } = useDayjs();
  return (
    <div className="text-slate-500/75 lg:text-lg">
      <div className="md:inline">
        <Trans
          ns="app"
          i18nKey="createdBy"
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
          <Tooltip content={<Trans i18nKey="demoPollNotice" />}>
            <Badge color="blue" className="ml-1">
              Demo
            </Badge>
          </Tooltip>
        ) : null}
      </div>
      <span className="hidden md:inline">&nbsp;&bull;&nbsp;</span>
      <span className="whitespace-nowrap">
        {dayjs(poll.createdAt).fromNow()}
      </span>
    </div>
  );
};

export default PollSubheader;
