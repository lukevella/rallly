"use client";

import { PollStatus } from "@rallly/database";
import { Button } from "@rallly/ui/button";
import { useToast } from "@rallly/ui/hooks/use-toast";
import { Icon } from "@rallly/ui/icon";
import {
  BarChart2Icon,
  CalendarIcon,
  Link2Icon,
  User2Icon,
} from "lucide-react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { useCopyToClipboard } from "react-use";

import {
  GridCard,
  GridCardFooter,
  GridCardHeader,
} from "@/components/grid-card";
import { GroupPollIcon } from "@/components/group-poll-icon";
import { Pill, PillList } from "@/components/pill";
import { PollStatusLabel } from "@/components/poll-status";
import { Trans } from "@/components/trans";
import { useLocalizeTime } from "@/utils/dayjs";
import { getRange } from "@/utils/get-range";

export function GroupPollCard({
  status,
  pollId,
  title,
  inviteLink,
  responseCount,
  dateStart,
  dateEnd,
}: {
  pollId: string;
  title: string;
  inviteLink: string;
  responseCount: number;
  dateStart: Date;
  dateEnd: Date;
  status: PollStatus;
}) {
  const localizeTime = useLocalizeTime();

  const { t } = useTranslation("app");
  const [, copy] = useCopyToClipboard();
  const { toast } = useToast();

  return (
    <GridCard key={pollId}>
      <GridCardHeader>
        <div>
          <GroupPollIcon size="xs" />
        </div>
        <h3 className="truncate font-medium">
          <Link className="focus:underline" href={`/poll/${pollId}`}>
            {title}
          </Link>
        </h3>
      </GridCardHeader>
      <PillList>
        <Pill>
          <PollStatusLabel status={status} />
        </Pill>
        <Pill>
          <Icon>
            <CalendarIcon />
          </Icon>
          {getRange(
            localizeTime(dateStart).toDate(),
            localizeTime(dateEnd).toDate(),
          )}
        </Pill>
        <Pill>
          <Icon>
            <User2Icon />
          </Icon>
          <Trans defaults="{count, number}" values={{ count: responseCount }} />
        </Pill>
      </PillList>
      <GridCardFooter>
        <Button
          variant="ghost"
          onClick={() => {
            copy(inviteLink);
            toast({
              title: t("copiedToClipboard", {
                ns: "app",
                defaultValue: "Copied to clipboard",
              }),
            });
          }}
        >
          <Icon>
            <Link2Icon />
          </Icon>
        </Button>
        <Button variant="ghost" asChild>
          <Link href={`/poll/${pollId}`}>
            <Icon>
              <BarChart2Icon />
            </Icon>
          </Link>
        </Button>
      </GridCardFooter>
    </GridCard>
  );
}
