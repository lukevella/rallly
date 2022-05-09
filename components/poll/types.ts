import { VoteType } from "@prisma/client";

export interface ParticipantForm {
  name: string;
  votes: Array<{
    optionId: string;
    type: VoteType;
  }>;
}

export interface ParticipantFormSubmitted {
  name: string;
  votes: Array<{ optionId: string; type: VoteType }>;
}
export interface PollProps {
  pollId: string;
  highScore: number;
}
