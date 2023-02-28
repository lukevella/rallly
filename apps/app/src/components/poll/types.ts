import { VoteType } from "@prisma/client";

export interface ParticipantForm {
  votes: Array<
    | {
        optionId: string;
        type: VoteType;
      }
    | undefined
  >;
}

export interface ParticipantFormSubmitted {
  votes: Array<{ optionId: string; type: VoteType }>;
}
