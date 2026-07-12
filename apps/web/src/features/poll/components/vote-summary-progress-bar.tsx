import { Tooltip, TooltipContent, TooltipTrigger } from "@rallly/ui/tooltip";

import { useParticipants } from "@/features/poll/components/participants-provider";

const ListNames = ({ participantIds }: { participantIds: string[] }) => {
  const { participants } = useParticipants();

  const participantNameById = participants.reduce<Record<string, string>>(
    (acc, curr) => {
      acc[curr.id] = curr.name;
      return acc;
    },
    {},
  );
  return (
    <ul>
      {participantIds.map((participantId) => (
        <li key={participantId}>{participantNameById[participantId]}</li>
      ))}
    </ul>
  );
};
export const VoteSummaryProgressBar = (props: {
  total: number;
  yes: string[];
  ifNeedBe: string[];
  no: string[];
}) => {
  const toWidth = (count: number) =>
    props.total > 0 ? `${(count / props.total) * 100}%` : "0%";

  return (
    <div className="flex h-1.5 grow overflow-hidden rounded-sm bg-muted">
      <Tooltip>
        <TooltipTrigger
          render={
            <div
              className="h-full bg-green-500 opacity-75 hover:opacity-100"
              style={{
                width: toWidth(props.yes.length),
              }}
            />
          }
        />
        <TooltipContent side="bottom">
          <ListNames participantIds={props.yes} />
        </TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger
          render={
            <div
              className="h-full bg-amber-400 opacity-75 hover:opacity-100"
              style={{
                width: toWidth(props.ifNeedBe.length),
              }}
            />
          }
        />
        <TooltipContent side="bottom">
          <ListNames participantIds={props.ifNeedBe} />
        </TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger
          render={
            <div
              className="h-full bg-transparent opacity-75 hover:opacity-100"
              style={{
                width: toWidth(props.no.length),
              }}
            />
          }
        />
        <TooltipContent side="bottom">
          <ListNames participantIds={props.no} />
        </TooltipContent>
      </Tooltip>
    </div>
  );
};
