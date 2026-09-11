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
  /**
   * When false the tentative segment is dropped. A poll that turned the option
   * off after tentative votes were cast still has them, so the segment is kept
   * whenever there are any to show.
   */
  showTentative?: boolean;
}) => {
  const showTentative =
    props.showTentative !== false || props.ifNeedBe.length > 0;

  return (
    <div className="flex h-1.5 grow overflow-hidden rounded-sm bg-muted">
      <Tooltip>
        <TooltipTrigger
          render={
            <div
              className="h-full bg-green-500 opacity-75 hover:opacity-100"
              style={{
                width: `${(props.yes.length / props.total) * 100}%`,
              }}
            />
          }
        />
        <TooltipContent side="bottom">
          <ListNames participantIds={props.yes} />
        </TooltipContent>
      </Tooltip>
      {showTentative ? (
        <Tooltip>
          <TooltipTrigger
            render={
              <div
                className="h-full bg-amber-400 opacity-75 hover:opacity-100"
                style={{
                  width: `${(props.ifNeedBe.length / props.total) * 100}%`,
                }}
              />
            }
          />
          <TooltipContent side="bottom">
            <ListNames participantIds={props.ifNeedBe} />
          </TooltipContent>
        </Tooltip>
      ) : null}
      <Tooltip>
        <TooltipTrigger
          render={
            <div
              className="h-full bg-transparent opacity-75 hover:opacity-100"
              style={{
                width: `${(props.no.length / props.total) * 100}%`,
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
