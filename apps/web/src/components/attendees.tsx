import { Badge } from "@rallly/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@rallly/ui/card";
import { Trans } from "react-i18next";

import { useParticipants } from "@/components/participants-provider";
import VoteIcon from "@/components/poll/vote-icon";
import { UserAvatar } from "@/components/user";
import { useUser } from "@/components/user-provider";

export function Attendees({ optionId }: { optionId: string }) {
  const { participants } = useParticipants();
  const { user } = useUser();
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <div className="flex items-center gap-x-2.5">
            <Trans i18nKey="participants" />
            <Badge>{participants.length}</Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="flex flex-wrap gap-2">
          {participants.map((participant) => (
            <li
              key={participant.id}
              className="flex items-center gap-2 rounded-full border bg-gray-100 p-1 text-sm"
            >
              <UserAvatar size="xs" name={participant.name} />
              <span className="text-sm font-medium">{participant.name}</span>
              {user.id === participant.userId ? (
                <Badge>
                  <Trans i18nKey="you" />
                </Badge>
              ) : null}
              <VoteIcon
                type={
                  participant.votes.find((vote) => vote.optionId === optionId)
                    ?.type
                }
              />
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
