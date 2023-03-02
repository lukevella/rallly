import { VoteType } from "@rallly/database";

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
