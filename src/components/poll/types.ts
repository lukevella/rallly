import { VoteType } from "@prisma/client";

export interface ParticipantForm {
  name: string;
  votes: Array<
    | {
        optionId: string;
        type: VoteType;
      }
    | undefined
  >;
}

export interface ParticipantFormSubmitted {
  name: string;
  votes: Array<{ optionId: string; type: VoteType }>;
}
