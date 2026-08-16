import { VoteIcon as BaseVoteIcon } from "@rallly/ui/vote-icon";
import type { DemoVote } from "./demo-data";

export const VoteIcon = ({
  vote,
  className,
}: {
  vote: DemoVote;
  className?: string;
}) => <BaseVoteIcon type={vote} className={className} />;
