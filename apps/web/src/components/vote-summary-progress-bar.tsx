import { Tooltip, TooltipContent, TooltipTrigger } from "@rallly/ui/tooltip";

import { useParticipants } from "@/components/participants-provider";

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
  return (
    <div className="flex h-1.5 grow overflow-hidden rounded bg-slate-100">
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className="h-full bg-green-500 opacity-75 hover:opacity-100"
            style={{
              width: (props.yes.length / props.total) * 100 + "%",
            }}
          />
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <ListNames participantIds={props.yes} />
        </TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className="h-full bg-amber-400 opacity-75 hover:opacity-100"
            style={{
              width: (props.ifNeedBe.length / props.total) * 100 + "%",
            }}
          />
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <ListNames participantIds={props.ifNeedBe} />
        </TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className="h-full bg-gray-300 opacity-75 hover:opacity-100"
            style={{
              width: (props.no.length / props.total) * 100 + "%",
            }}
          />
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <ListNames participantIds={props.no} />
        </TooltipContent>
      </Tooltip>
    </div>
  );
};
